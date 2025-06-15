import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const DoctorChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPatientData, setSelectedPatientData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const currentUser = auth().currentUser;
  const flatListRef = useRef(null);
  const messagesListRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Subscribe to chats where doctor is a participant
    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', currentUser.uid)
      .onSnapshot(
        async (snapshot) => {
          const chatData = [];

          for (const doc of snapshot.docs) {
            const chatDoc = doc.data();

            // Find patient ID (the other participant)
            const patientId = chatDoc.participants.find(id => id !== currentUser.uid);

            if (patientId) {
              try {
                // Get patient info
                const patientDoc = await firestore().collection('users').doc(patientId).get();

                if (patientDoc.exists) {
                  const patient = patientDoc.data();
                  chatData.push({
                    id: doc.id,
                    patient: {
                      id: patientId,
                      username: patient.username || '',
                      fullName: patient.fullName || '',
                      profilePicture: patient.profilePicture || null,
                    },
                    lastMessage: chatDoc.lastMessage || '',
                    lastMessageTime: chatDoc.lastMessageTime || null,
                    unread: chatDoc.lastSenderId !== currentUser.uid && !chatDoc.read,
                  });
                } else {
                  console.warn(`Patient document not found for ID: ${patientId}`);
                }
              } catch (error) {
                console.error('Error fetching patient data:', error);
              }
            } else {
              console.warn(`No patient ID found in chat: ${doc.id}`);
            }
          }

          // Sort chats client-side by lastMessageTime (descending)
          chatData.sort((a, b) => {
            const timeA = a.lastMessageTime ? a.lastMessageTime.toDate().getTime() : 0;
            const timeB = b.lastMessageTime ? b.lastMessageTime.toDate().getTime() : 0;
            return timeB - timeA; // Descending order
          });

          setChats(chatData);
          setLoading(false);

          // Auto-select first chat if none selected and chats exist
          if (!selectedPatientId && chatData.length > 0) {
            setSelectedPatientId(chatData[0].patient.id);
            setSelectedPatientData(chatData[0].patient);
          }
        },
        (error) => {
          console.error('Chat list listener error:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedPatientId || !currentUser) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);

    // Generate chat ID using sorted user IDs to ensure consistency
    const chatId = [currentUser.uid, selectedPatientId].sort().join('_');

    // Subscribe to messages in real-time
    const unsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot(
        (snapshot) => {
          const messageList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(messageList);
          setLoadingMessages(false);

          // Mark messages as read
          markMessagesAsRead(chatId);

          // Scroll to bottom when new messages come in
          if (messageList.length > 0 && messagesListRef.current) {
            setTimeout(() => {
              messagesListRef.current.scrollToEnd({ animated: true });
            }, 200);
          }
        },
        (error) => {
          console.error('Messages listener error:', error);
          setLoadingMessages(false);
        }
      );

    return () => unsubscribe();
  }, [selectedPatientId, currentUser]);

  const markMessagesAsRead = async (chatId) => {
    if (!currentUser || !selectedPatientId) return;

    try {
      // Update the chat metadata to mark as read if last sender was the patient
      const chatDoc = await firestore().collection('chats').doc(chatId).get();
      if (chatDoc.exists) {
        const chatData = chatDoc.data();
        if (chatData.lastSenderId === selectedPatientId) {
          await firestore().collection('chats').doc(chatId).update({
            read: true,
          });
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedPatientId || sending) {
      return;
    }

    setSending(true);

    // Generate chat ID using sorted user IDs to ensure consistency
    const chatId = [currentUser.uid, selectedPatientId].sort().join('_');

    try {
      // Create the message object
      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        receiverId: selectedPatientId,
        senderType: 'doctor',
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false,
      };

      // Add message to the chat
      await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add(messageData);

      // Update the chat metadata
      await firestore()
        .collection('chats')
        .doc(chatId)
        .set(
          {
            participants: [currentUser.uid, selectedPatientId],
            lastMessage: newMessage.trim(),
            lastMessageTime: firestore.FieldValue.serverTimestamp(),
            lastSenderId: currentUser.uid,
            updatedAt: firestore.FieldValue.serverTimestamp(),
            read: false,
          },
          { merge: true }
        );

      // Clear the input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp.toDate());
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderChatItem = ({ item }) => {
    if (!item.patient) {
      console.warn(`Chat item missing patient data: ${item.id}`);
      return null;
    }

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          selectedPatientId === item.patient.id && styles.selectedChatItem,
          item.unread && styles.unreadChatItem,
        ]}
        onPress={() => {
          setSelectedPatientId(item.patient.id);
          setSelectedPatientData(item.patient);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.patient?.profilePicture ? (
            <Image
              source={{ uri: item.patient.profilePicture }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(item.patient?.username || item.patient?.fullName || 'P')
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
          )}
          {item.unread && <View style={styles.unreadBadge} />}
        </View>

        <View style={styles.chatInfo}>
          <Text style={styles.patientName} numberOfLines={1}>
            {item.patient?.username || item.patient?.fullName || 'Patient'}
          </Text>

          <View style={styles.lastMessageContainer}>
            <Text
              style={[
                styles.messagePreview,
                item.unread && styles.unreadMessagePreview,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage || 'No messages yet'}
            </Text>

            {item.lastMessageTime && (
              <Text style={styles.lastMessageTime}>
                {formatTime(item.lastMessageTime)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }) => {
    const isDoctor = item.senderId === currentUser?.uid;

    return (
      <View
        style={[
          styles.messageContainer,
          isDoctor ? styles.sentMessageContainer : styles.receivedMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isDoctor ? styles.sentMessageBubble : styles.receivedMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isDoctor ? styles.sentMessageText : styles.receivedMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isDoctor ? styles.sentMessageTime : styles.receivedMessageTime,
            ]}
          >
            {item.timestamp ? formatTime(item.timestamp) : ''}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={70} color="#ccc" />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Your patient conversations will appear here
      </Text>
    </View>
  );

  const renderEmptyMessages = () => (
    <View style={styles.emptyMessagesContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={60} color="#ccc" />
      <Text style={styles.emptyMessagesTitle}>No messages yet</Text>
      <Text style={styles.emptyMessagesSubtitle}>
        Start a conversation with this patient
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7F56D9" />

      {/* Header */}
      <LinearGradient
        colors={['#7F56D9', '#9E7BFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Patient Messages</Text>
      </LinearGradient>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7F56D9" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <View style={styles.mainContainer}>
          {/* Chat List Section */}
          <View style={styles.chatListSection}>
            <FlatList
              ref={flatListRef}
              data={chats}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyList}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Chat Messages Section */}
          <View style={styles.chatMessagesSection}>
            {selectedPatientId && selectedPatientData ? (
              <>
                {/* Patient Info Header */}
                <View style={styles.patientInfoHeader}>
                  <View style={styles.selectedPatientInfo}>
                    {selectedPatientData?.profilePicture ? (
                      <Image
                        source={{ uri: selectedPatientData.profilePicture }}
                        style={styles.selectedPatientImage}
                      />
                    ) : (
                      <View style={styles.selectedPatientPlaceholder}>
                        <Text style={styles.selectedPatientInitial}>
                          {(selectedPatientData?.username ||
                            selectedPatientData?.fullName ||
                            'P')
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.selectedPatientTextInfo}>
                      <Text style={styles.selectedPatientName}>
                        {selectedPatientData?.username ||
                          selectedPatientData?.fullName ||
                          'Patient'}
                      </Text>
                      <View style={styles.patientStatusContainer}>
                        <View style={styles.onlineIndicator} />
                        <Text style={styles.patientStatusText}>Online</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Messages List */}
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={styles.messagesContainer}
                  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                  {loadingMessages ? (
                    <View style={styles.loadingMessagesContainer}>
                      <ActivityIndicator size="small" color="#7F56D9" />
                      <Text style={styles.loadingMessagesText}>
                        Loading messages...
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
                      onContentSizeChange={() =>
                        messagesListRef.current?.scrollToEnd({ animated: false })
                      }
                    />
                  )}

                  {/* Message Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Write a message..."
                      placeholderTextColor="#999"
                      value={newMessage}
                      onChangeText={setNewMessage}
                      multiline
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        !newMessage.trim() && styles.sendButtonDisabled,
                      ]}
                      onPress={sendMessage}
                      disabled={!newMessage.trim() || sending}
                    >
                      {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="send" size={22} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                </KeyboardAvoidingView>
              </>
            ) : (
              <View style={styles.noPatientSelectedContainer}>
                <Ionicons name="chatbubbles-outline" size={80} color="#ddd" />
                <Text style={styles.noPatientSelectedText}>
                  Select a patient to start chatting
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  chatListSection: {
    width: '35%',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    backgroundColor: '#fff',
  },
  chatMessagesSection: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    flexGrow: 1,
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    marginHorizontal: 40,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedChatItem: {
    backgroundColor: '#E9EEFF',
    borderLeftWidth: 4,
    borderLeftColor: '#7F56D9',
  },
  unreadChatItem: {
    backgroundColor: '#f0f4ff',
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatarImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  avatarPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#E9EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4D8EB',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7F56D9',
  },
  unreadBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ff4757',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messagePreview: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  unreadMessagePreview: {
    fontWeight: 'bold',
    color: '#333',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  noPatientSelectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  noPatientSelectedText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
  },
  patientInfoHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedPatientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedPatientImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  selectedPatientPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E9EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4D8EB',
    marginRight: 12,
  },
  selectedPatientInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7F56D9',
  },
  selectedPatientTextInfo: {
    flex: 1,
  },
  selectedPatientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  patientStatusText: {
    fontSize: 12,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMessagesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyMessagesSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  messagesList: {
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  sentMessageContainer: {
    alignSelf: 'flex-end',
  },
  receivedMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    minWidth: 80,
  },
  sentMessageBubble: {
    backgroundColor: '#7F56D9',
    borderTopRightRadius: 4,
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
  messageText: {
    fontSize: 16,
  },
  sentMessageText: {
    color: '#fff',
  },
  receivedMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  sentMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  receivedMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    color: '#333',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#7F56D9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#b6b6b6',
  },
});

export default DoctorChatList;