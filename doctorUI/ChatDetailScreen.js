import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  SafeAreaView,
  Alert,
  Animated,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { BlurView } from '@react-native-community/blur';
import debounce from 'lodash.debounce';

const { width, height } = Dimensions.get('window');

const ChatDetailScreen = ({ route, navigation }) => {
  const { userId, userName, profilePicture: patientProfilePicture } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatData, setChatData] = useState(null);
  const [approving, setApproving] = useState(false);
  const [isPatientOnline, setIsPatientOnline] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [doctorProfilePicture, setDoctorProfilePicture] = useState(null);
  const [firstSenderId, setFirstSenderId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const currentUser = auth().currentUser;
  const messagesListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const chatId = currentUser && userId ? [currentUser.uid, userId].sort().join('_') : null;

  // Debounced scroll function (optional, kept for potential future use)
  const scrollToTop = useCallback(
    debounce(() => {
      if (messagesListRef.current && messages.length > 0) {
        messagesListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    }, 100),
    [messages.length]
  );

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const doctorDoc = await firestore().collection('doctors').doc(currentUser.uid).get();
        if (doctorDoc.exists) {
          setDoctorProfilePicture(doctorDoc.data().profilePicture || null);
        }
      } catch (error) {
        console.error('Error fetching doctor profile:', error);
      }
    };

    if (currentUser) {
      fetchDoctorProfile();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!userId || !currentUser) {
      Alert.alert('Error', 'Invalid user or doctor authentication.');
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    const userStatusUnsubscribe = firestore()
      .collection('users')
      .doc(userId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          setIsPatientOnline(doc.data()?.isOnline || false);
        }
      });

    const chatUnsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          setChatData(data);
          setIsBlocked(data.isBlocked === true);
          setFirstSenderId(data.firstSenderId || null);
        } else {
          setChatData({
            participants: [currentUser.uid, userId],
            approved: false,
            isBlocked: false,
            patientMessageCount: 0,
            firstSenderId: null,
          });
        }
      });

    const messagesUnsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc') // Changed to 'desc' to get latest messages first
      .onSnapshot(
        (snapshot) => {
          const messageList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            status: doc.data().status || (doc.data().senderId === currentUser.uid ? 'sent' : 'received'),
          }));
          setMessages(messageList); // Messages are now in descending order (latest first)
          setLoadingMessages(false);

          markMessagesAsRead(chatId);

          // No need to scroll, as inverted FlatList places latest message at top
        },
        (error) => {
          console.error('Messages listener error:', error);
          setLoadingMessages(false);
          Alert.alert('Error', 'Failed to load messages.');
        }
      );

    return () => {
      userStatusUnsubscribe();
      chatUnsubscribe();
      messagesUnsubscribe();
      scrollToTop.cancel();
    };
  }, [userId, currentUser, chatId, scrollToTop]);

  useEffect(() => {
    if (showOptions) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showOptions, fadeAnim]);

  const markMessagesAsRead = async (chatId) => {
    if (!currentUser || !userId) return;

    try {
      const chatDoc = await firestore().collection('chats').doc(chatId).get();
      if (chatDoc.exists) {
        const chatData = chatDoc.data();
        if (chatData.lastSenderId === userId) {
          await firestore().collection('chats').doc(chatId).update({
            read: true,
          });
        }
      }

      const messagesRef = firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .where('senderId', '==', userId)
        .where('status', '!=', 'read');

      const snapshot = await messagesRef.get();
      if (snapshot.empty) return;

      const batch = firestore().batch();
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { status: 'read' });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      if (error.code === 'firestore/failed-precondition') {
        console.warn('Missing Firestore index. Create it in Firebase Console.');
      }
    }
  };

  const approveChat = async () => {
    if (!chatId || approving) return;

    setApproving(true);
    try {
      await firestore().collection('chats').doc(chatId).update({
        approved: true,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add({
          text: "Your conversation request has been approved. You can now send unlimited messages.",
          senderId: 'system',
          timestamp: firestore.FieldValue.serverTimestamp(),
          isSystemMessage: true,
        });

      Alert.alert('Approved', 'Chat request has been approved successfully.');
    } catch (error) {
      console.error('Error approving chat:', error);
      Alert.alert('Error', 'Failed to approve chat request. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  const handleBlockUnblock = async () => {
    const action = isBlocked ? 'unblock' : 'block';
    Alert.alert(
      `${isBlocked ? 'Unblock' : 'Block'} Patient`,
      `Are you sure you want to ${action} this patient?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlocked ? 'Unblock' : 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection('chats')
                .doc(chatId)
                .update({
                  isBlocked: !isBlocked,
                  updatedAt: firestore.FieldValue.serverTimestamp(),
                });
              Alert.alert('Success', `Patient ${isBlocked ? 'unblocked' : 'blocked'}.`);
            } catch (error) {
              console.error(`Error ${action}ing patient:`, error);
              Alert.alert('Error', `Failed to ${action} patient.`);
            }
          },
        },
      ]
    );
  };

  const uploadFileToStorage = async (file) => {
    if (!file || !file.uri) return null;

    setUploading(true);
    try {
      const fileName = `${currentUser.uid}_${Date.now()}_${file.fileName || 'image.jpg'}`;
      const storageRef = storage().ref(`chat_files/${chatId}/${fileName}`);
      const task = storageRef.putFile(file.uri);

      await task;
      const downloadURL = await storageRef.getDownloadURL();

      return {
        url: downloadURL,
        fileName: file.fileName || fileName,
        fileType: 'image',
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    try {
      const response = await launchImageLibrary(options);

      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', `Failed to pick image: ${response.errorMessage}`);
        return;
      }

      const asset = response.assets[0];
      if (asset.fileSize > 10 * 1024 * 1024) {
        Alert.alert('Error', 'Image size exceeds 10MB.');
        return;
      }

      const file = {
        uri: asset.uri,
        fileName: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      };

      const uploadedFile = await uploadFileToStorage(file);
      if (uploadedFile) {
        await sendFileMessage(uploadedFile, 'image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const sendFileMessage = async (file, fileType) => {
    if (!file || !currentUser || !userId || sending) return;

    setSending(true);
    try {
      const messageData = {
        senderId: currentUser.uid,
        receiverId: userId,
        senderType: 'doctor',
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false,
        status: isPatientOnline ? 'delivered' : 'sent',
        fileUrl: file.url,
        fileName: file.fileName,
        fileType: fileType,
      };

      const messageRef = await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add(messageData);

      const chatUpdateData = {
        participants: [currentUser.uid, userId],
        lastMessage: `Sent an image`,
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
        lastSenderId: currentUser.uid,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        read: false,
        approved: chatData?.approved || false,
        isBlocked: chatData?.isBlocked || false,
        patientMessageCount: chatData?.patientMessageCount || 0,
      };

      if (!chatData?.firstSenderId) {
        chatUpdateData.firstSenderId = currentUser.uid;
      }

      await firestore()
        .collection('chats')
        .doc(chatId)
        .set(chatUpdateData, { merge: true });

      if (isPatientOnline) {
        await firestore()
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .doc(messageRef.id)
          .update({ status: 'delivered' });
      }

      // No need to scroll, as new message appears at top
    } catch (error) {
      console.error('Error sending image message:', error);
      Alert.alert('Error', 'Failed to send image message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !userId || sending) {
      return;
    }

    setSending(true);
    try {
      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        receiverId: userId,
        senderType: 'doctor',
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false,
        status: isPatientOnline ? 'delivered' : 'sent',
      };

      const messageRef = await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add(messageData);

      const chatUpdateData = {
        participants: [currentUser.uid, userId],
        lastMessage: newMessage.trim(),
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
        lastSenderId: currentUser.uid,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        read: false,
        approved: chatData?.approved || false,
        isBlocked: chatData?.isBlocked || false,
        patientMessageCount: chatData?.patientMessageCount || 0,
      };

      if (!chatData?.firstSenderId) {
        chatUpdateData.firstSenderId = currentUser.uid;
      }

      await firestore()
        .collection('chats')
        .doc(chatId)
        .set(chatUpdateData, { merge: true });

      if (isPatientOnline) {
        await firestore()
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .doc(messageRef.id)
          .update({ status: 'delivered' });
      }

      setNewMessage('');

      // No need to scroll, as new message appears at top
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection('chats')
                .doc(chatId)
                .collection('messages')
                .doc(messageId)
                .delete();
              setSelectedMessageId(null);
              setShowOptions(false);
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message.');
            }
          },
        },
      ]
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return '';
    try {
      const date = timestamp.toDate();
      if (isNaN(date.getTime())) return '';
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return '';
    try {
      const date = timestamp.toDate();
      if (isNaN(date.getTime())) return '';
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).split('/').join('/');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const renderMessageStatus = (status) => {
    if (status === 'sent') {
      return <Ionicons name="checkmark" size={16} color="rgba(255, 255, 255, 0.8)" />;
    } else if (status === 'delivered') {
      return (
        <View style={styles.tickContainer}>
          <Ionicons name="checkmark" size={16} color="rgba(255, 255, 255, 0.8)" />
          <Ionicons name="checkmark" size={16} color="rgba(255, 255, 255, 0.8)" style={styles.secondTick} />
        </View>
      );
    } else if (status === 'read') {
      return (
        <View style={styles.tickContainer}>
          <Ionicons name="checkmark" size={16} color="#64D2FF" />
          <Ionicons name="checkmark" size={16} color="#64D2FF" style={styles.secondTick} />
        </View>
      );
    }
    return null;
  };

  const renderMessage = ({ item, index }) => {
    if (item.isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    const isDoctor = item.senderId === currentUser?.uid;
    const isSelected = selectedMessageId === item.id;
    const showDate =
      index === messages.length - 1 || // Check if it's the last message in descending order
      (messages[index + 1]?.timestamp &&
        item.timestamp &&
        new Date(messages[index + 1]?.timestamp.toDate()).toDateString() !==
          new Date(item.timestamp.toDate()).toDateString());

    const isImage = item.fileType === 'image';

    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{item.timestamp ? formatDate(item.timestamp) : ''}</Text>
          </View>
        )}
        <TouchableOpacity
          onLongPress={() => {
            setSelectedMessageId(item.id);
            setShowOptions(true);
          }}
          activeOpacity={0.8}
          style={[
            styles.messageContainer,
            isDoctor ? styles.sentMessageContainer : styles.receivedMessageContainer,
          ]}
        >
          {!isDoctor && (
            <View style={styles.avatarContainer}>
              {patientProfilePicture ? (
                <Image source={{ uri: patientProfilePicture }} style={styles.messageAvatar} />
              ) : (
                <View style={styles.messageAvatarPlaceholder}>
                  <Text style={styles.messageAvatarText}>{(userName || '?').charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isDoctor ? styles.sentMessageBubble : styles.receivedMessageBubble,
              isSelected && styles.selectedMessageBubble,
              isImage && styles.fileMessageBubble,
            ]}
          >
            {isImage && item.fileUrl && (
              <TouchableOpacity onPress={() => setSelectedImage(item.fileUrl)}>
                <Image
                  source={{ uri: item.fileUrl }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            {item.text && (
              <Text
                style={[
                  styles.messageText,
                  isDoctor ? styles.sentMessageText : styles.receivedMessageText,
                ]}
              >
                {item.text}
              </Text>
            )}
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  isDoctor ? styles.sentMessageTime : styles.receivedMessageTime,
                ]}
              >
                {item.timestamp ? formatTime(item.timestamp) : ''}
              </Text>
              {isDoctor && renderMessageStatus(item.status)}
            </View>
          </View>
          {isDoctor && (
            <View style={styles.avatarContainer}>
              {doctorProfilePicture ? (
                <Image source={{ uri: doctorProfilePicture }} style={styles.messageAvatar} />
              ) : (
                <View style={styles.doctorAvatarPlaceholder}>
                  <Text style={styles.doctorAvatarText}>Dr</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </>
    );
  };

  const renderEmptyMessages = () => (
    <View style={styles.emptyMessagesContainer}>
      <View style={styles.emptyIllustration}>
        <Ionicons name="chatbubble-ellipses-outline" size={80} color="#6342E8" />
        <View style={styles.emptyCircle1} />
        <View style={styles.emptyCircle2} />
      </View>
      <Text style={styles.emptyMessagesTitle}>Start a conversation</Text>
      <Text style={styles.emptyMessagesSubtitle}>
        Send your first message to {userName || 'this patient'}
      </Text>
    </View>
  );

  const renderApprovalBanner = () => {
    if (
      firstSenderId === userId &&
      chatData?.patientMessageCount >= 2 &&
      !chatData?.approved
    ) {
      return (
        <View style={styles.approvalBannerContainer}>
          <View style={styles.approvalBanner}>
            <Ionicons name="alert-circle" size={22} color="#fff" />
            <Text style={styles.approvalText}>
              This patient has reached the message limit.
            </Text>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={approveChat}
              disabled={approving}
            >
              {approving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.approveButtonText}>Approve</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return null;
  };

  const renderFullScreenImage = () => {
    if (!selectedImage) return null;

    return (
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.fullScreenImageContainer}>
          <BlurView
            style={styles.fullScreenImageBackdrop}
            blurType="dark"
            blurAmount={10}
          />
          <TouchableOpacity
            style={styles.fullScreenImageBackButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6342E8" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.selectedPatientInfo}>
            {patientProfilePicture ? (
              <Image
                source={{ uri: patientProfilePicture }}
                style={styles.selectedPatientImage}
              />
            ) : (
              <View style={styles.selectedPatientPlaceholder}>
                <Text style={styles.selectedPatientInitial}>
                  {(userName || 'P').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.selectedPatientTextInfo}>
              <Text style={styles.selectedPatientName}>
                {userName || 'Patient'}
              </Text>
              <View style={styles.patientStatusContainer}>
                <View
                  style={[
                    styles.onlineIndicator,
                    { backgroundColor: isPatientOnline ? '#4AFF91' : '#FF5252' },
                  ]}
                />
                <Text style={styles.patientStatusText}>
                  {isPatientOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: isBlocked ? '#4AFF91' : '#FF5252' }]}
              onPress={handleBlockUnblock}
            >
              <Ionicons
                name={isBlocked ? 'lock-open' : 'lock-closed'}
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {renderApprovalBanner()}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.messagesContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
      >
        {loadingMessages ? (
          <View style={styles.loadingMessagesContainer}>
            <ActivityIndicator size="large" color="#6342E8" />
            <Text style={styles.loadingMessagesText}>
              Loading conversation...
            </Text>
          </View>
        ) : messages.length === 0 ? (
          renderEmptyMessages()
        ) : (
          <FlatList
            ref={messagesListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            inverted={true} // Invert the FlatList to show latest message at top
            getItemLayout={(data, index) => ({
              length: 150, // Increased to account for images (200px) and text (~100px)
              offset: 150 * index,
              index,
            })}
          />
        )}

        {showOptions && (
          <Animated.View
            style={[styles.messageOptionsContainer, { opacity: fadeAnim }]}
          >
            <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
              <View style={styles.optionsBackdrop} />
            </TouchableWithoutFeedback>
            <View style={styles.messageOptionsContent}>
              <TouchableOpacity
                style={styles.messageOption}
                onPress={() => {
                  if (selectedMessageId) deleteMessage(selectedMessageId);
                }}
              >
                <Ionicons name="trash-outline" size={24} color="#FF5252" />
                <Text style={styles.messageOptionText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageOption}
                onPress={() => {
                  setShowOptions(false);
                  setSelectedMessageId(null);
                }}
              >
                <Ionicons name="copy-outline" size={24} color="#6342E8" />
                <Text style={styles.messageOptionText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageOption}
                onPress={() => {
                  setShowOptions(false);
                  setSelectedMessageId(null);
                }}
              >
                <Ionicons name="share-outline" size={24} color="#6342E8" />
                <Text style={styles.messageOptionText}>Forward</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelOption}
                onPress={() => {
                  setShowOptions(false);
                  setSelectedMessageId(null);
                }}
              >
                <Text style={styles.cancelOptionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons
              name="image"
              size={24}
              color={uploading ? '#ccc' : '#6342E8'}
            />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type your message here..."
              placeholderTextColor="#999"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxHeight={100}
              editable={!uploading}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || uploading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending || uploading}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {renderFullScreenImage()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#6342E8',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 10,
    shadowColor: '#6342E8',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
    marginRight: 8,
  },
  selectedPatientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedPatientImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  selectedPatientPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E9EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 12,
  },
  selectedPatientInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6342E8',
  },
  selectedPatientTextInfo: {
    flex: 1,
  },
  selectedPatientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  patientStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  patientStatusText: {
    fontSize: 12,
    color: '#E9EEFF',
    minWidth: 50,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  approvalBannerContainer: {
    backgroundColor: '#6342E8',
    padding: 12,
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#6342E8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  approvalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  approvalText: {
    color: '#fff',
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  approveButton: {
    backgroundColor: '#4AFF91',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginLeft: 10,
    elevation: 2,
  },
  approveButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  loadingMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMessagesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    position: 'relative',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(99, 66, 232, 0.1)',
  },
  emptyCircle2: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(99, 66, 232, 0.15)',
  },
  emptyMessagesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyMessagesSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  messagesList: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 100, // Increased to ensure input is not obscured
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    backgroundColor: 'rgba(99, 66, 232, 0.1)',
    color: '#6342E8',
    fontSize: 13,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    overflow: 'hidden',
    fontWeight: '500',
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    marginHorizontal: 6,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E9EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4D8EB',
  },
  messageAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6342E8',
  },
  doctorAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6342E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  sentMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
  },
  receivedMessageContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  systemMessageContainer: {
    alignSelf: 'center',
    marginVertical: 16,
    padding: 10,
    backgroundColor: 'rgba(99, 66, 232, 0.1)',
    borderRadius: 16,
    maxWidth: '85%',
  },
  systemMessageText: {
    color: '#6342E8',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  messageBubble: {
    padding: 14,
    borderRadius: 22,
    minWidth: 80,
    maxWidth: '100%',
  },
  sentMessageBubble: {
    backgroundColor: '#6342E8',
    borderBottomRightRadius: 4,
    elevation: 2,
    shadowColor: '#6342E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  receivedMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedMessageBubble: {
    borderWidth: 2,
    borderColor: '#64D2FF',
  },
  fileMessageBubble: {
    padding: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  sentMessageText: {
    color: '#fff',
  },
  receivedMessageText: {
    color: '#333',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  messageTime: {
    fontSize: 12,
    marginRight: 4,
    width: 50,
    textAlign: 'right',
  },
  sentMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  receivedMessageTime: {
    color: '#999',
  },
  tickContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondTick: {
    marginLeft: -8,
  },
  messageOptionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  optionsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  messageOptionsContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  messageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  messageOptionText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#333',
    fontWeight: '500',
  },
  cancelOption: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 10,
  },
  cancelOptionText: {
    fontSize: 16,
    color: '#FF5252',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#6342E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    color: '#333',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#6342E8',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#6342E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullScreenImageBackButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
});

export default ChatDetailScreen;