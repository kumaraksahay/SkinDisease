import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@react-native-community/blur';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Modern color palette
const COLORS = {
  primary: '#3B82F6',
  background: '#F3F4F6',
  text: '#1F2937',
  textLight: '#6B7280',
  white: '#FFFFFF',
  border: '#E5E7EB'
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) return;

        const notificationsRef = firestore()
          .collection('doctors')
          .doc(currentUser.uid)
          .collection('notifications')
          .orderBy('createdAt', 'desc')
          .limit(50);

        const unsubscribe = notificationsRef.onSnapshot((snapshot) => {
          const fetchedNotifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().createdAt?.toDate()
          }));

          setNotifications(fetchedNotifications);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Notification fetch error:', error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const renderNotificationIcon = (type) => {
    const icons = {
      'new_appointment': 'calendar-outline',
      'appointment_confirmed': 'checkmark-circle',
      'appointment_cancelled': 'close-circle',
      'reminder': 'notifications',
      'default': 'notifications-outline'
    };
    return icons[type] || icons['default'];
  };

  const renderNotificationMessage = (notification) => {
    switch(notification.type) {
      case 'new_appointment':
        return `New appointment request from ${notification.patientName}`;
      case 'appointment_confirmed':
        return `Appointment confirmed with ${notification.patientName}`;
      case 'appointment_cancelled':
        return `Appointment with ${notification.patientName} was cancelled`;
      default:
        return notification.message || 'New notification';
    }
  };

  const clearAllNotifications = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    try {
      const notificationsRef = firestore()
        .collection('doctors')
        .doc(currentUser.uid)
        .collection('notifications');

      await notificationsRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          doc.ref.delete();
        });
      });

      setNotifications([]);
      Alert.alert('Notifications Cleared', 'All notifications have been cleared.');
    } catch (error) {
      console.error('Error clearing notifications: ', error);
      Alert.alert('Error', 'Failed to clear notifications.');
    }
  };

  const renderNotificationItem = ({ item }) => {
    const notificationIcon = renderNotificationIcon(item.type);
    const notificationMessage = renderNotificationMessage(item);

    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        layout={Layout.springify()}
        style={styles.notificationItemContainer}
      >
        <TouchableOpacity 
          style={styles.notificationItem}
          onPress={() => {
            navigation.navigate('PatientInformation', { 
              appointmentId: item.appointmentId 
            });
          }}
        >
          <View style={styles.notificationIconWrapper}>
            <Ionicons 
              name={notificationIcon} 
              size={24} 
              color={COLORS.primary} 
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notificationMessage}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimeAgo(item.timestamp)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={COLORS.background} 
      />
      
      {Platform.OS === 'ios' && (
        <BlurView
          style={styles.blurHeader}
          blurType="light"
          blurAmount={20}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={COLORS.text} 
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
        </BlurView>
      )}

      {Platform.OS === 'android' && (
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={COLORS.text} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="notifications-off-outline" 
            size={80} 
            color={COLORS.textLight} 
          />
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
        />
      )}

      {/* Clear All Button at the bottom */}
      <TouchableOpacity
        style={styles.clearButtonContainer}
        onPress={clearAllNotifications}
      >
        <Text style={styles.clearButtonText}>Clear All</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 70,
    marginTop:20// Add padding to prevent overlapping with the button
  },
  blurHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: "#6A5ACD",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textLight,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: 18,
    marginTop: 15,
  },
  notificationsList: {
    paddingTop: Platform.OS === 'ios' ? 100 : 20,
    paddingBottom: 20,
  },
  notificationItemContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 5,
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  separator: {
    height: 0,  // Removed separator as we have card-like design
  },
  clearButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor:"#6A5ACD",
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    marginHorizontal: 20,
  },
  clearButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationsScreen;
