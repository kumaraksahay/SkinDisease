import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const ChatScreen = () => {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hey there!', sender: 'other', time: '10:30 AM' },
    { id: '2', text: 'Hi! How are you?', sender: 'me', time: '10:31 AM' },
    { id: '3', text: 'I\'m good, thanks for asking. What about you?', sender: 'other', time: '10:32 AM' },
    { id: '4', text: 'Doing well! Just working on some React Native projects.', sender: 'me', time: '10:33 AM' },
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef(null);

  const handleSend = () => {
    if (newMessage.trim() === '') return;
    
    const newMsg = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    // Scroll to bottom when keyboard appears
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.sender === 'me' ? styles.myMessage : styles.otherMessage
    ]}>
      {item.sender === 'other' && (
        <Image 
          source={require('../src/assets/doct.png')} 
          style={styles.avatar} 
        />
      )}
      <View style={[
        styles.messageContent,
        item.sender === 'me' ? styles.myMessageContent : styles.otherMessageContent
      ]}>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.messageTime}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={80}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../src/assets/doct.png')} 
            style={styles.headerAvatar} 
          />
          <View>
            <Text style={styles.headerName}>Dr. Abdul Rehman</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Icon name="call" size={24} color="#5B7BFE" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon name="videocam" size={24} color="#5B7BFE" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachmentButton}>
          <Icon name="attach" size={24} color="#6E7FAA" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#6E7FAA"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={handleSend}
          disabled={newMessage.trim() === ''}
        >
          <Icon 
            name="send" 
            size={24} 
            color={newMessage.trim() === '' ? "#CCCCCC" : "#5B7BFE"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1F2A47',
  },
  headerStatus: {
    fontSize: 12,
    color: '#4CD964',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 20,
  },
  messagesContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 15,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageContent: {
    padding: 12,
    borderRadius: 16,
    shadowColor: '#6E7FAA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myMessageContent: {
    backgroundColor: '#5B7BFE',
    borderBottomRightRadius: 2,
  },
  otherMessageContent: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F2A47',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: '#E6E6E6',
  },
  otherMessageTime: {
    color: '#6E7FAA',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  attachmentButton: {
    padding: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#F5F5F7',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    fontSize: 16,
    color: '#1F2A47',
  },
  sendButton: {
    padding: 10,
  },
});

export default ChatScreen;