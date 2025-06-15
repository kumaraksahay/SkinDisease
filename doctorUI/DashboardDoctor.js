import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const DashboardDoctor = () => {
  // State variables
  const [userData, setUserData] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [appointmentCounts, setAppointmentCounts] = useState({
    total: 0,
    completed: 0,
    rejected: 0,
    pending: 0,
    accepted: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Navigation hooks
  const navigation = useNavigation();
  const route = useRoute();

  // Fetch user data, notifications, and appointment stats
  useEffect(() => {
    // Set loading state
    setIsLoading(true);
    
    // Fetch user data from Firestore
    const fetchUserData = async () => {
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const userDoc = await firestore()
            .collection('doctors')
            .doc(currentUser.uid)
            .get();
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    // Fetch unread notifications
    const fetchNotifications = async () => {
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const notificationsSnapshot = await firestore()
            .collection('notifications')
            .where('recipientId', '==', currentUser.uid)
            .where('isRead', '==', false)
            .get();
          
          setNotificationCount(notificationsSnapshot.size);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Fetch appointment statistics
    const fetchAppointmentStats = async () => {
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const appointmentsRef = firestore()
            .collection('appointments')
            .where('doctorId', '==', currentUser.uid);

          const snapshot = await appointmentsRef.get();
          const appointments = snapshot.docs.map(doc => doc.data());

          const counts = appointments.reduce(
            (acc, appointment) => {
              acc.total++;
              if (appointment.status === 'Completed') acc.completed++;
              if (appointment.status === 'Cancelled') acc.rejected++;
              if (appointment.status === 'Pending') acc.pending++;
              if (appointment.status === 'Confirmed') acc.accepted++;
              return acc;
            },
            { total: 0, completed: 0, rejected: 0, pending: 0, accepted: 0 }
          );

          setAppointmentCounts(counts);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching appointment stats:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchUserData();
    fetchNotifications();
    fetchAppointmentStats();

    // Real-time listeners
    const unsubscribeNotifications = firestore()
      .collection('notifications')
      .where('recipientId', '==', auth().currentUser?.uid)
      .where('isRead', '==', false)
      .onSnapshot((snapshot) => {
        setNotificationCount(snapshot.size);
      });

    const unsubscribeAppointments = firestore()
      .collection('appointments')
      .where('doctorId', '==', auth().currentUser?.uid)
      .onSnapshot(fetchAppointmentStats);

    // Refresh on screen focus
    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchNotifications();
      fetchAppointmentStats();
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeNotifications();
      unsubscribeAppointments();
      unsubscribeFocus();
    };
  }, [navigation]);

  // Handle notification press
  const handleNotificationPress = () => {
    if (notificationCount > 0) {
      const clearNotifications = async () => {
        try {
          const currentUser = auth().currentUser;
          if (currentUser) {
            const notificationsSnapshot = await firestore()
              .collection('notifications')
              .where('recipientId', '==', currentUser.uid)
              .where('isRead', '==', false)
              .get();

            const batch = firestore().batch();
            notificationsSnapshot.docs.forEach((doc) => {
              batch.update(doc.ref, { isRead: true });
            });

            await batch.commit();
          }
        } catch (error) {
          console.error('Error clearing notifications:', error);
          Alert.alert('Error', 'Could not clear notifications');
        }

        navigation.navigate('NotificationD');
      };

      clearNotifications();
    } else {
      navigation.navigate('NotificationD');
    }
  };

  // Create chart data for appointment statistics
  const chartData = [
    {
      name: 'Completed',
      count: appointmentCounts.completed,
      color: '#10B981',
      legendFontColor: '#6B7280',
      legendFontSize: 12,
    },
    {
      name: 'Accepted',
      count: appointmentCounts.accepted,
      color: '#3B82F6',
      legendFontColor: '#6B7280',
      legendFontSize: 12,
    },
    {
      name: 'Pending',
      count: appointmentCounts.pending,
      color: '#F59E0B',
      legendFontColor: '#6B7280',
      legendFontSize: 12,
    },
    {
      name: 'Rejected',
      count: appointmentCounts.rejected,
      color: '#EF4444',
      legendFontColor: '#6B7280',
      legendFontSize: 12,
    },
  ];

  // Appointment Statistic Card Component
  const AppointmentStatCard = ({ label, count, color, filter, icon }) => (
    <TouchableOpacity 
      style={styles.statCard}
      onPress={() => navigation.navigate('PatientInformation', { initialFilter: filter })}
    >
      <LinearGradient
        colors={[`${color}20`, `${color}10`]}
        style={styles.statIconContainer}
      >
        <Icon name={icon} size={24} color={color} />
      </LinearGradient>
      <View style={styles.statTextContainer}>
        <Text style={styles.statCount}>{count}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );

  // Dashboard Card Component
  const DashboardCard = ({ title, icon, onPress, colors, description }) => {
    return (
      <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardDescription}>{description}</Text>
            </View>
            <View style={styles.cardIconContainer}>
              <MaterialCommunityIcons name={icon} size={36} color="#ffffff" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Bottom Navigation Items
  const navigationItems = [
    { 
      icon: 'home-outline', 
      activeIcon: 'home',
      text: 'Home', 
      screen: 'DashboardDoctor',
      activeColor: '#10B981',
      gradientColors: ['#10B981', '#34D399'],
    },
    { 
      icon: 'chatbubble-outline', 
      activeIcon: 'chatbubble',
      text: 'Chats', 
      screen: 'PatientChatListScreen',
      activeColor: '#3B82F6',
      gradientColors: ['#3B82F6', '#60A5FA'],
    },
    { 
      icon: 'person-outline', 
      activeIcon: 'person',
      text: 'Profile', 
      screen: 'ProfileDetailScreen',
      activeColor: '#8B5CF6',
      gradientColors: ['#8B5CF6', '#A78BFA'],
    },
    { 
      icon: 'settings-outline', 
      activeIcon: 'settings',
      text: 'Settings', 
      screen: 'DoctorSetting',
      activeColor: '#F59E0B',
      gradientColors: ['#F59E0B', '#FBBF24'],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#06B6D4" barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#06B6D4', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Profile and greeting section */}
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.profileContainer}
              onPress={() => navigation.navigate('ProfileDetailScreen')}
            >
              {userData?.profilePicture ? (
                <Image 
                  source={{ uri: userData.profilePicture }} 
                  style={styles.profileImage} 
                />
              ) : (
                <LinearGradient
                  colors={['#F3F4F6', '#D1D5DB']}
                  style={styles.profileFallback}
                >
                  <Icon name="person" size={24} color="#1F2937" />
                </LinearGradient>
              )}
              
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>Welcome back</Text>
                <Text style={styles.doctorName}>
                  Dr. {userData?.fullName || 'Doctor'}
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* Notification Icon */}
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={handleNotificationPress}
            >
              <LinearGradient
                colors={['#F3F4F6', '#D1D5DB']}
                style={styles.notificationIconContainer}
              >
                <Icon name="notifications-outline" size={20} color="#1F2937" />
              </LinearGradient>
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Header subtitle */}
          <Text style={styles.headerSubtitle}>
            Your Gateway to Patient Care
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Overview */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <AppointmentStatCard 
              label="Total" 
              count={appointmentCounts.total} 
              color="#6B7280" 
              filter="All"
              icon="calendar"
            />
            <AppointmentStatCard 
              label="Completed" 
              count={appointmentCounts.completed} 
              color="#10B981" 
              filter="Completed"
              icon="checkmark-circle"
            />
            <AppointmentStatCard 
              label="Pending" 
              count={appointmentCounts.pending} 
              color="#F59E0B" 
              filter="Pending"
              icon="time"
            />
            <AppointmentStatCard 
              label="Cancelled" 
              count={appointmentCounts.rejected} 
              color="#EF4444" 
              filter="Rejected"
              icon="close-circle"
            />
          </View>
        </View>

        {/* Appointment Chart */}
        {!isLoading && appointmentCounts.total > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Appointment Summary</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.dashboardGrid}>
            <DashboardCard 
              title="Schedule Time"
              description="Set your availability"
              icon="clock-time-four"
              colors={['#8B5CF6', '#A78BFA']}
              onPress={() => navigation.navigate('ScheduleTime')}
            />
            <DashboardCard 
              title="Doctor Portal"
              description="Access medical records"
              icon="doctor"
              colors={['#10B981', '#34D399']}
              onPress={() => navigation.navigate('PortalD')}
            />
            <DashboardCard 
              title="Feedback"
              description="Review patient ratings"
              icon="comment-text"
              colors={['#F59E0B', '#FBBF24']}
              onPress={() => navigation.navigate('FeedbackScreen')}
            />
            <DashboardCard 
              title="Patient Info"
              description="View patient details"
              icon="account-group"
              colors={['#3B82F6', '#60A5FA']}
              onPress={() => navigation.navigate('PatientInformation')}
            />
            <DashboardCard 
              title="Prescription"
              description="Create new prescription"
              icon="prescription"
              colors={[ '#06B6D4', '#22D3EE']}
              onPress={() => navigation.navigate('PrescriptionForm')}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigationContainer}>
        <View style={styles.bottomNavigation}>
          {navigationItems.map((item, index) => {
            const isActive = route.name === item.screen;
            return (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.bottomNavItem,
                  isActive && styles.bottomNavItemActive,
                ]}
                onPress={() => navigation.navigate(item.screen)}
              >
                <LinearGradient
                  colors={isActive ? item.gradientColors : ['#F3F4F6', '#D1D5DB']}
                  style={styles.bottomNavIconContainer}
                >
                  <Icon 
                    name={isActive ? item.activeIcon : item.icon} 
                    size={24} 
                    color={isActive ? '#FFFFFF' : '#6B7280'}
                  />
                </LinearGradient>
                <Text 
                  style={[
                    styles.bottomNavText,
                    isActive && { color: item.activeColor, fontWeight: '600' },
                  ]}
                >
                  {item.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  greetingContainer: {
    marginLeft: 12,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 60,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  chartContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: '48%',
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    height: 140,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cardIconContainer: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  bottomNavigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  bottomNavItemActive: {
    transform: [{ scale: 1.05 }],
  },
  bottomNavIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomNavText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default DashboardDoctor;