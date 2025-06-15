import React, { useState, useEffect, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';

const UserChatListScreen = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = auth().currentUser;
  const navigation = useNavigation();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', currentUser.uid)
      .onSnapshot(
        async (snapshot) => {
          const chatData = [];
          const doctorIds = new Set();

          // Collect all doctor IDs
          for (const doc of snapshot.docs) {
            const chatDoc = doc.data();
            const doctorId = chatDoc.participants.find((id) => id !== currentUser.uid);
            if (doctorId) {
              doctorIds.add(doctorId);
              chatData.push({
                id: doc.id,
                doctorId,
                lastMessage: chatDoc.lastMessage || '',
                lastMessageTime: chatDoc.lastMessageTime || null,
                unread: chatDoc.lastSenderId !== currentUser.uid && !chatDoc.read,
              });
            }
          }

          // Fetch all doctors in batches (Firestore 'in' query supports up to 10 IDs)
          const doctorData = {};
          const idArray = Array.from(doctorIds);
          const batches = [];
          for (let i = 0; i < idArray.length; i += 10) {
            batches.push(idArray.slice(i, i + 10));
          }

          try {
            const doctorPromises = batches.map((batch) =>
              firestore()
                .collection('doctors')
                .where(firestore.FieldPath.documentId(), 'in', batch)
                .get()
            );
            const doctorSnapshots = await Promise.all(doctorPromises);

            doctorSnapshots.forEach((snapshot) => {
              snapshot.forEach((doc) => {
                const data = doc.data();
                doctorData[doc.id] = {
                  uid: doc.id,
                  fullName: data.fullName || 'Doctor',
                  profilePicture: data.profilePicture || null,
                };
              });
            });

            // Combine chat data with doctor data
            const finalChatData = chatData
              .filter((chat) => doctorData[chat.doctorId]) // Only include chats with valid doctor data
              .map((chat) => ({
                id: chat.id,
                doctor: doctorData[chat.doctorId],
                lastMessage: chat.lastMessage,
                lastMessageTime: chat.lastMessageTime,
                unread: chat.unread,
              }));

            // Sort chats by lastMessageTime (descending)
            finalChatData.sort((a, b) => {
              const timeA = a.lastMessageTime ? a.lastMessageTime.toDate().getTime() : 0;
              const timeB = b.lastMessageTime ? b.lastMessageTime.toDate().getTime() : 0;
              return timeB - timeA;
            });

            setChats(finalChatData);
            setLoading(false);
          } catch (error) {
            console.error('Error fetching doctor data:', error);
            setLoading(false);
          }
        },
        (error) => {
          console.error('Chat list listener error:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [currentUser]);

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

  const handleChatSelect = (doctor) => {
    navigation.navigate('ChatWrite', {
      doctor: {
        uid: doctor.uid,
        fullName: doctor.fullName,
        profilePicture: doctor.profilePicture,
      },
    });
  };

  const filteredChats = useMemo(() => {
    return chats.filter((chat) =>
      (chat.doctor?.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (chat.lastMessage?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  const renderChatItem = ({ item }) => {
    if (!item.doctor) return null;

    return (
      <TouchableOpacity
        style={[styles.chatItem, item.unread && styles.unreadChatItem]}
        onPress={() => handleChatSelect(item.doctor)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.doctor?.profilePicture ? (
            <Image
              source={{ uri: item.doctor.profilePicture }}
              style={styles.avatarImage}
            />
          ) : (
            <LinearGradient
              colors={['#4568dc', '#b06ab3']}
              style={styles.avatarPlaceholder}
            >
              <Text style={styles.avatarText}>
                {(item.doctor?.fullName || 'D').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          {item.unread && <View style={styles.unreadBadge} />}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.nameTimeContainer}>
            <Text style={styles.doctorName} numberOfLines={1}>
              Dr. {item.doctor?.fullName || 'Doctor'}
            </Text>
            {item.lastMessageTime && (
              <Text
                style={[
                  styles.lastMessageTime,
                  item.unread && styles.unreadMessageTime,
                ]}
              >
                {formatTime(item.lastMessageTime)}
              </Text>
            )}
          </View>

          <Text
            style={[
              styles.messagePreview,
              item.unread && styles.unreadMessagePreview,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#4568dc', '#b06ab3']}
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
          <Ionicons
            name="search"
            size={20}
            color="#4568dc"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#4568dc"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#4568dc" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#e6e6fa', '#f0f0ff']}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="chatbubbles-outline" size={70} color="#4568dc" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Your doctor conversations will appear here
      </Text>
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => navigation.navigate('DoctorDirectory')}
      >
        <Text style={styles.newChatButtonText}>Find Doctors</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4568dc" />
      {renderHeader()}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4568dc" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10} // Render fewer items initially
          maxToRenderPerBatch={10} // Limit batch rendering
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('DoctorDirectory')}
      >
        <LinearGradient
          colors={['#4568dc', '#b06ab3']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#4568dc',
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
    color: '#4568dc',
    marginTop: 12,
    fontWeight: '500',
  },
  listContent: {
    flex : 1,
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
    shadowColor: '#4568dc',
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
    backgroundColor: '#4568dc',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#4568dc',
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
    backgroundColor: '#e6e6fa',
    borderLeftWidth: 4,
    borderLeftColor: '#4568dc',
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
    borderColor: '#e6e6fa',
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
    width: '100%',
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 10,
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
    fontSize: 14,
    color: '#999',
    marginLeft: 5,
    minWidth: 50,
    textAlign: 'right',
  },
  unreadMessageTime: {
    color: '#4568dc',
    fontWeight: '600',
    fontSize: 14,
    minWidth: 50,
    textAlign: 'right',
  },
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    elevation: 8,
    shadowColor: '#4568dc',
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

export default UserChatListScreen;