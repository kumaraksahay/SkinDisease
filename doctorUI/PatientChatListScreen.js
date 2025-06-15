import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TextInput,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { BlurView } from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debounce from 'lodash.debounce';

// Memoized Chat Item Component to prevent unnecessary re-renders
const ChatItem = React.memo(({ item, onSelect, isUnread, formatTime }) => {
  if (!item.patient) return null;

  return (
    <TouchableOpacity
      style={[styles.chatItem, isUnread && styles.unreadChatItem]}
      onPress={() => onSelect(item.patient)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.patient?.profilePicture ? (
          <Image source={{ uri: item.patient.profilePicture }} style={styles.avatarImage} />
        ) : (
          <LinearGradient colors={['#9E7BFF', '#7F56D9']} style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(item.patient?.username || item.patient?.fullName || 'P').charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
        {isUnread && <View style={styles.unreadBadge} />}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.nameTimeContainer}>
          <Text style={styles.patientName} numberOfLines={1}>
            {item.patient?.fullName || item.patient?.username || 'Patient'}
          </Text>
          {item.lastMessageTime && (
            <Text
              style={[styles.lastMessageTime, isUnread && styles.unreadMessageTime]}
            >
              {formatTime(item.lastMessageTime)}
            </Text>
          )}
        </View>

        <Text
          style={[styles.messagePreview, isUnread && styles.unreadMessagePreview]}
          numberOfLines={1}
        >
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const PatientChatListScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientCache, setPatientCache] = useState({});
  const currentUser = auth().currentUser;

  // Format timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate();
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Load cached patient data from AsyncStorage
  useEffect(() => {
    const loadCachedPatients = async () => {
      try {
        const cached = await AsyncStorage.getItem('patientCache');
        if (cached) {
          setPatientCache(JSON.parse(cached));
        }
      } catch (error) {
        console.error('Error loading patient cache:', error);
      }
    };
    loadCachedPatients();
  }, []);

  // Save patient cache to AsyncStorage
  const savePatientCache = async (newCache) => {
    try {
      await AsyncStorage.setItem('patientCache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving patient cache:', error);
    }
  };

  // Fetch patient data in batch
  const fetchPatients = async (patientIds) => {
    const newCache = { ...patientCache };
    const uncachedIds = patientIds.filter((id) => !patientCache[id]);

    if (uncachedIds.length === 0) return patientCache;

    try {
      // Split into chunks of 10 due to Firestore 'in' query limit
      const chunks = [];
      for (let i = 0; i < uncachedIds.length; i += 10) {
        chunks.push(uncachedIds.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const patientQuery = await firestore()
          .collection('users')
          .where(firestore.FieldPath.documentId(), 'in', chunk)
          .get();

        patientQuery.forEach((doc) => {
          if (doc.exists) {
            newCache[doc.id] = doc.data();
          }
        });
      }

      setPatientCache(newCache);
      savePatientCache(newCache);
      return newCache;
    } catch (error) {
      console.error('Error fetching patients:', error);
      return patientCache;
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Subscribe to chats
    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', currentUser.uid)
      .onSnapshot(
        async (snapshot) => {
          const chatData = [];
          const patientIds = new Set();

          // Collect chat data and patient IDs
          snapshot.forEach((doc) => {
            const chatDoc = doc.data();
            const patientId = chatDoc.participants.find((id) => id !== currentUser.uid);
            if (patientId) {
              patientIds.add(patientId);
              chatData.push({
                id: doc.id,
                patientId,
                lastMessage: chatDoc.lastMessage || '',
                lastMessageTime: chatDoc.lastMessageTime || null,
                lastSenderId: chatDoc.lastSenderId,
                read: chatDoc.read,
              });
            }
          });

          // Fetch patient data in batch
          const patients = await fetchPatients([...patientIds]);

          // Map chat data with patient info
          const enrichedChats = chatData
            .map((chat) => {
              const patient = patients[chat.patientId];
              if (!patient) return null;
              return {
                id: chat.id,
                patient: {
                  id: chat.patientId,
                  username: patient.username || '',
                  fullName: patient.fullName || '',
                  profilePicture: patient.profilePicture || null,
                },
                lastMessage: chat.lastMessage,
                lastMessageTime: chat.lastMessageTime,
                unread: chat.lastSenderId !== currentUser.uid && !chat.read,
              };
            })
            .filter(Boolean);

          // Sort chats by lastMessageTime
          enrichedChats.sort((a, b) => {
            const timeA = a.lastMessageTime ? a.lastMessageTime.toDate().getTime() : 0;
            const timeB = b.lastMessageTime ? b.lastMessageTime.toDate().getTime() : 0;
            return timeB - timeA;
          });

          setChats(enrichedChats);
          setLoading(false);
        },
        (error) => {
          console.error('Chat list listener error:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [currentUser, patientCache]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((query) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  // Handle chat selection with immediate feedback
  const handleChatSelect = useCallback(
    (patient) => {
      // Navigate immediately
      navigation.navigate('ChatDetailScreen', {
        userId: patient.id,
        userName: patient.fullName || patient.username || 'Patient',
        profilePicture: patient.profilePicture,
      });
    },
    [navigation]
  );

  // Filtered chats with memoization
  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    return chats.filter(
      (chat) =>
        (chat.patient?.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (chat.patient?.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (chat.lastMessage?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#7F56D9', '#9E7BFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9E7BFF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#9E7BFF"
            onChangeText={debouncedSearch}
            defaultValue={searchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9E7BFF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#E9EEFF', '#F0F4FF']}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="chatbubbles-outline" size={70} color="#7F56D9" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Your patient conversations will appear here
      </Text>
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => navigation.navigate('PatientDirectory')}
      >
        <Text style={styles.newChatButtonText}>Find Patients</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7F56D9" />
      {renderHeader()}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7F56D9" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={({ item }) => (
            <ChatItem
              item={item}
              onSelect={handleChatSelect}
              isUnread={item.unread}
              formatTime={formatTime} // Pass formatTime as a prop
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PatientDirectory')}
      >
        <LinearGradient colors={['#7F56D9', '#9E7BFF']} style={styles.fabGradient}>
          <Ionicons name="add" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  headerContainer: {
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#7F56D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#333',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7F56D9',
    marginTop: 12,
    fontWeight: '500',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
    marginTop: 80,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#7F56D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 40,
    marginBottom: 30,
  },
  newChatButton: {
    backgroundColor: '#7F56D9',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#7F56D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  unreadChatItem: {
    backgroundColor: '#F0F4FF',
    borderLeftWidth: 4,
    borderLeftColor: '#7F56D9',
  },
  avatarContainer: {
    marginRight: 14,
    position: 'relative',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E9EEFF',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  unreadBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF4757',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  messagePreview: {
    fontSize: 14,
    color: '#777',
    lineHeight: 20,
  },
  unreadMessagePreview: {
    color: '#333',
    fontWeight: '600',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
    width: 50,
    textAlign: 'right',
  },
  unreadMessageTime: {
    color: '#7F56D9',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    elevation: 8,
    shadowColor: '#7F56D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PatientChatListScreen;