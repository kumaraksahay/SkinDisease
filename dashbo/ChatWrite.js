import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { BlurView } from '@react-native-community/blur';
import { useNavigation, useRoute } from '@react-navigation/native';
import debounce from 'lodash.debounce';

const { width, height } = Dimensions.get('window');

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [doctorData, setDoctorData] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [chatApproved, setChatApproved] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [chatData, setChatData] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [isDoctorOnline, setIsDoctorOnline] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [firstSenderId, setFirstSenderId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const animation = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const route = useRoute();

  const { doctor } = route.params || {};
  const doctorId = doctor?.uid || doctor?.id;
  const currentUser = auth().currentUser;
  const chatId = currentUser && doctorId ? [currentUser.uid, doctorId].sort().join('_') : null;

  // Debounced scroll function (kept for potential future use)
  const scrollToTop = useCallback(
    debounce(() => {
      if (flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    }, 100),
    [messages.length]
  );

  useEffect(() => {
    if (!doctorId || !currentUser) {
      setLoading(false);
      Alert.alert('Error', 'Invalid doctor or user authentication.');
      return;
    }

    const fetchDoctorProfile = async () => {
      try {
        const doctorDoc = await firestore().collection('doctors').doc(doctorId).get();
        if (doctorDoc.exists) {
          setDoctorData(doctorDoc.data());
        }
      } catch (error) {
        console.error('Error fetching doctor data:', error);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchDoctorProfile();
    fetchUserProfile();

    const doctorStatusUnsubscribe = firestore()
      .collection('doctors')
      .doc(doctorId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          setIsDoctorOnline(doc.data()?.isOnline || false);
        }
      });

    const chatUnsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          setChatData(data);
          setChatApproved(data.approved === true);
          setIsBlocked(data.isBlocked === true);
          setMessageCount(data.patientMessageCount || 0);
          setFirstSenderId(data.firstSenderId || null);
        } else {
          setChatApproved(false);
          setIsBlocked(false);
          setMessageCount(0);
          setFirstSenderId(null);
        }
      });

    const messagesUnsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc') // Fetch messages in descending order (latest first)
      .onSnapshot(
        (snapshot) => {
          const messageList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            status: doc.data().status || (doc.data().senderId === currentUser.uid ? 'sent' : 'received'),
          }));
          setMessages(messageList);
          setLoading(false);
          // No scroll needed; inverted FlatList shows latest message at top
        },
        (error) => {
          console.error('Messages listener error:', error);
          setLoading(false);
          Alert.alert('Error', 'Failed to load messages.');
        }
      );

    const updateDoctorMessagesReadStatus = async () => {
      try {
        const chatDoc = await firestore().collection('chats').doc(chatId).get();
        if (chatDoc.exists) {
          const chatData = chatDoc.data();
          if (chatData.lastSenderId === doctorId) {
            await firestore().collection('chats').doc(chatId).update({
              read: true,
            });
          }
        }

        const messagesRef = firestore()
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .where('senderId', '==', doctorId)
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

    updateDoctorMessagesReadStatus();

    return () => {
      doctorStatusUnsubscribe();
      chatUnsubscribe();
      messagesUnsubscribe();
      scrollToTop.cancel();
    };
  }, [chatId, doctorId, currentUser, scrollToTop]);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: showActions ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showActions, animation]);

  const uploadImageToStorage = async (file) => {
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
    if (isBlocked) {
      Alert.alert('Blocked', 'You cannot send images as you have been blocked by the doctor.');
      return;
    }

    const isDoctorFirstSender = firstSenderId === doctorId;
    if (!isDoctorFirstSender && !chatApproved && messageCount >= 2) {
      Alert.alert(
        'Message Limit Reached',
        'You can send only 2 messages (including images) until the doctor approves your conversation request.',
        [{ text: 'OK' }]
      );
      return;
    }

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

      const uploadedFile = await uploadImageToStorage(file);
      if (uploadedFile) {
        await sendImageMessage(uploadedFile);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const sendImageMessage = async (file) => {
    if (!file || !currentUser || !doctorId || sending || isBlocked) {
      return;
    }

    setSending(true);
    try {
      const messageData = {
        senderId: currentUser.uid,
        receiverId: doctorId,
        senderType: 'patient',
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false,
        status: isDoctorOnline ? 'delivered' : 'sent',
        fileUrl: file.url,
        fileName: file.fileName,
        fileType: 'image',
      };

      await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add(messageData);

      const newCount = messageCount + 1;
      setMessageCount(newCount);

      const chatUpdateData = {
        participants: [currentUser.uid, doctorId],
        lastMessage: 'Sent an image',
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
        lastSenderId: currentUser.uid,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        patientMessageCount: newCount,
        approved: chatData?.approved || false,
        isBlocked: chatData?.isBlocked || false,
        read: false,
      };

      if (!firstSenderId) {
        chatUpdateData.firstSenderId = currentUser.uid;
      }

      await firestore()
        .collection('chats')
        .doc(chatId)
        .set(chatUpdateData, { merge: true });

      if (!chatData?.approved && firstSenderId !== doctorId && newCount === 2) {
        Alert.alert(
          'Message Limit Reached',
          "You've sent 2 messages (including images). You can send more after the doctor approves your conversation request.",
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error sending image message:', error);
      Alert.alert('Error', 'Failed to send image message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !doctorId || sending || isBlocked) {
      if (isBlocked) {
        Alert.alert('Blocked', 'You cannot send messages as you have been blocked by the doctor.');
      }
      return;
    }

    const isDoctorFirstSender = firstSenderId === doctorId;
    if (!isDoctorFirstSender && !chatApproved && messageCount >= 2) {
      Alert.alert(
        'Message Limit Reached',
        'You can send only 2 messages (including images) until the doctor approves your conversation request.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSending(true);
    try {
      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        receiverId: doctorId,
        senderType: 'patient',
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false,
        status: isDoctorOnline ? 'delivered' : 'sent',
      };

      await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add(messageData);

      const newCount = messageCount + 1;
      setMessageCount(newCount);

      const chatUpdateData = {
        participants: [currentUser.uid, doctorId],
        lastMessage: newMessage.trim(),
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
        lastSenderId: currentUser.uid,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        patientMessageCount: newCount,
        approved: chatData?.approved || false,
        isBlocked: chatData?.isBlocked || false,
        read: false,
      };

      if (!firstSenderId) {
        chatUpdateData.firstSenderId = currentUser.uid;
      }

      await firestore()
        .collection('chats')
        .doc(chatId)
        .set(chatUpdateData, { merge: true });

      setNewMessage('');
      if (!isDoctorFirstSender && !chatApproved && newCount === 2) {
        Alert.alert(
          'Message Limit Reached',
          "You've sent 2 messages (including images). You can send more after the doctor approves your conversation request.",
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message.');
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
              setShowActions(false);
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message.');
            }
          },
        },
      ]
    );
  };

  const toggleMessageActions = (messageId) => {
    if (selectedMessageId === messageId) {
      setSelectedMessageId(null);
      setShowActions(false);
    } else {
      setSelectedMessageId(messageId);
      setShowActions(true);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return '';
    }
    try {
      const date = timestamp.toDate();
      if (isNaN(date.getTime())) {
        return '';
      }
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return '';
    }
    try {
      const date = timestamp.toDate();
      if (isNaN(date.getTime())) {
        return '';
      }
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const renderMessageStatus = (status) => {
    if (status === 'sent') {
      return <Ionicons name="checkmark" size={14} color="rgba(255, 255, 255, 0.7)" />;
    } else if (status === 'delivered') {
      return (
        <View style={styles.tickContainer}>
          <Ionicons name="checkmark-done" size={14} color="rgba(255, 255, 255, 0.7)" />
        </View>
      );
    } else if (status === 'read') {
      return (
        <View style={styles.tickContainer}>
          <Ionicons name="checkmark-done" size={14} color="#4CAF50" />
        </View>
      );
    }
    return null;
  };

  const shouldShowDate = (item, index) => {
    if (index === messages.length - 1) return true; // Last message in descending order
    const currentMessageDate = item.timestamp ? formatDate(item.timestamp) : '';
    const nextMessageDate = messages[index + 1]?.timestamp
      ? formatDate(messages[index + 1].timestamp)
      : '';
    return currentMessageDate !== nextMessageDate;
  };

  const renderDateSeparator = (date) => (
    <View style={styles.dateSeparator}>
      <View style={styles.dateLine} />
      <Text style={styles.dateText}>{date}</Text>
      <View style={styles.dateLine} />
    </View>
  );

  const renderMessage = ({ item, index }) => {
    if (item.isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    const isCurrentUser = item.senderId === currentUser?.uid;
    const isSelected = selectedMessageId === item.id;
    const showDateHeader = shouldShowDate(item, index);
    const isImage = item.fileType === 'image';

    return (
      <>
        {showDateHeader && item.timestamp && renderDateSeparator(formatDate(item.timestamp))}
        <TouchableOpacity
          onLongPress={() => toggleMessageActions(item.id)}
          activeOpacity={0.9}
          style={[
            styles.messageContainer,
            isCurrentUser ? styles.sentMessageContainer : styles.receivedMessageContainer,
          ]}
        >
          <View style={styles.avatarContainer}>
            {isCurrentUser ? (
              userProfile?.profilePicture ? (
                <Image
                  source={{ uri: userProfile.profilePicture }}
                  style={styles.smallAvatar}
                />
              ) : (
                <View style={styles.smallAvatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(userProfile?.username || 'U')[0].toUpperCase()}
                  </Text>
                </View>
              )
            ) : (
              doctorData?.profilePicture ? (
                <Image
                  source={{ uri: doctorData.profilePicture }}
                  style={styles.smallAvatar}
                />
              ) : (
                <View style={styles.smallAvatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(doctorData?.fullName || doctor?.fullName || 'D')[0].toUpperCase()}
                  </Text>
                </View>
              )
            )}
          </View>
          <View
            style={[
              styles.messageBubble,
              isCurrentUser ? styles.sentMessageBubble : styles.receivedMessageBubble,
              isSelected && styles.selectedMessageBubble,
              isImage && styles.imageMessageBubble,
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
                  isCurrentUser ? styles.sentMessageText : styles.receivedMessageText,
                ]}
              >
                {item.text}
              </Text>
            )}
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  isCurrentUser ? styles.sentMessageTime : styles.receivedMessageTime,
                ]}
              >
                {item.timestamp ? formatTime(item.timestamp) : ''}
              </Text>
              {isCurrentUser && renderMessageStatus(item.status)}
            </View>
          </View>
          {isSelected && (
            <Animated.View
              style={[
                styles.messageActions,
                {
                  opacity: animation,
                  transform: [{ scale: animation }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  deleteMessage(item.id);
                }}
              >
                <Ionicons name="trash" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setSelectedMessageId(null);
                  setShowActions(false);
                }}
              >
                <Ionicons name="copy" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setSelectedMessageId(null);
                  setShowActions(false);
                }}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </TouchableOpacity>
      </>
    );
  };

  const renderMessageLimitBanner = () => {
    if (isBlocked) {
      return (
        <LinearGradient
          colors={['#FF5252', '#FF1744']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.limitBanner}
        >
          <Ionicons name="lock-closed" size={18} color="#fff" />
          <Text style={styles.limitText}>You have been blocked by the doctor</Text>
        </LinearGradient>
      );
    } else if (firstSenderId !== doctorId && !chatApproved && messageCount >= 2) {
      return (
        <LinearGradient
          colors={['#FF9800', '#F57C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.limitBanner}
        >
          <Ionicons name="time" size={18} color="#fff" />
          <Text style={styles.limitText}>Waiting for doctor's approval to continue</Text>
        </LinearGradient>
      );
    } else if (firstSenderId !== doctorId && !chatApproved && messageCount === 1) {
      return (
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.limitBanner}
        >
          <Ionicons name="information-circle" size={18} color="#fff" />
          <Text style={styles.limitText}>You can send 1 more message or image before approval is needed</Text>
        </LinearGradient>
      );
    } else if (firstSenderId !== doctorId && !chatApproved && messageCount === 0) {
      return (
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.limitBanner}
        >
          <Ionicons name="information-circle" size={18} color="#fff" />
          <Text style={styles.limitText}>You can send 2 messages or images before approval is needed</Text>
        </LinearGradient>
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

  if (loading) {
    return (
      <LinearGradient colors={['#6A11CB', '#2575FC']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading your conversation...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6A11CB" />
      <LinearGradient
        colors={['#6A11CB', '#2575FC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.doctorInfoContainer}>
            <View style={styles.profileImageContainer}>
              {doctorData?.profilePicture ? (
                <Image source={{ uri: doctorData.profilePicture }} style={styles.profileImage} />
              ) : (
                <LinearGradient
                  colors={['#8E2DE2', '#4A00E0']}
                  style={styles.profilePlaceholder}
                >
                  <Text style={styles.profileInitial}>
                    {(doctorData?.fullName || doctor?.fullName || 'D')[0].toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
              <View
                style={[
                  styles.onlineIndicator,
                  { backgroundColor: isDoctorOnline ? '#4CAF50' : '#757575' },
                ]}
              />
            </View>
            <View style={styles.doctorTextInfo}>
              <Text style={styles.doctorName}>
                Dr. {doctorData?.fullName || doctor?.fullName || 'Doctor'}
              </Text>
              <Text style={styles.statusText}>{isDoctorOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionIconButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      {renderMessageLimitBanner()}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <LinearGradient colors={['#f5f5f5', '#e8e8e8']} style={styles.chatContainer}>
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={['#6A11CB', '#2575FC']}
                style={styles.emptyIconContainer}
              >
                <Ionicons name="chatbubble-ellipses" size={40} color="#fff" />
              </LinearGradient>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.startChatText}>
                Start your conversation with Dr. {doctorData?.fullName || doctor?.fullName || 'Doctor'}
              </Text>
              <TouchableOpacity
                style={styles.startConversationButton}
                onPress={() => inputRef.current?.focus()}
              >
                <Text style={styles.startConversationText}>Start Conversation</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              inverted={true} // Show latest message at top
              getItemLayout={(data, index) => ({
                length: 150,
                offset: 150 * index,
                index,
              })}
            />
          )}
        </LinearGradient>
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={pickImage}
              disabled={uploading || isBlocked || (firstSenderId !== doctorId && !chatApproved && messageCount >= 2)}
            >
              <Ionicons
                name="image"
                size={24}
                color={
                  uploading || isBlocked || (firstSenderId !== doctorId && !chatApproved && messageCount >= 2)
                    ? '#ccc'
                    : '#6A11CB'
                }
              />
            </TouchableOpacity>
            <View style={styles.textInputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={
                  isBlocked
                    ? 'You are blocked by the doctor'
                    : firstSenderId !== doctorId && !chatApproved && messageCount >= 2
                    ? "Waiting for doctor's approval..."
                    : 'Type a message...'
                }
                placeholderTextColor="#999"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxHeight={100}
                editable={isBlocked ? false : firstSenderId === doctorId || chatApproved || messageCount < 2}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || (firstSenderId !== doctorId && !chatApproved && messageCount >= 2) || isBlocked)
                  ? styles.sendButtonDisabled
                  : styles.sendButtonEnabled,
              ]}
              onPress={sendMessage}
              disabled={
                !newMessage.trim() || sending || (firstSenderId !== doctorId && !chatApproved && messageCount >= 2) || isBlocked
              }
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      {renderFullScreenImage()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  doctorInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  doctorTextInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 8,
  },
  limitBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  startChatText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  startConversationButton: {
    backgroundColor: '#6A11CB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startConversationText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  messagesList: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  sentMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    marginLeft: 50,
  },
  receivedMessageContainer: {
    alignSelf: 'flex-start',
    marginRight: 50,
  },
  avatarContainer: {
    width: 30,
    height: 30,
    marginHorizontal: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  smallAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  smallAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6A11CB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  systemMessageContainer: {
    alignSelf: 'center',
    marginVertical: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    maxWidth: '85%',
  },
  systemMessageText: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    minWidth: 80,
    position: 'relative',
    maxWidth: '100%',
  },
  sentMessageBubble: {
    backgroundColor: '#6A11CB',
    borderTopRightRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  receivedMessageBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedMessageBubble: {
    borderWidth: 1,
    borderColor: '#2575FC',
  },
  imageMessageBubble: {
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
    marginTop: 4,
  },
  messageTime: {
    fontSize: 9,
    paddingRight: 10,
  },
  sentMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedMessageTime: {
    color: '#999',
  },
  tickContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageActions: {
    position: 'absolute',
    top: -45,
    right: 0,
    backgroundColor: '#6A11CB',
    borderRadius: 20,
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 120,
  },
  input: {
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    padding: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonEnabled: {
    backgroundColor: '#6A11CB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  sendButtonDisabled: {
    backgroundColor: '#bbb',
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

export default ChatScreen;