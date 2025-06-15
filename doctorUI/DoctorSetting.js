import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Image,
  Platform,
  StatusBar,
  Animated,
  RefreshControl,
  ActivityIndicator, // Added this import
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const DoctorSetting = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [availabilityStatus, setAvailabilityStatus] = useState(true);

  // Enhanced animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [Platform.OS === 'ios' ? 230 : 210, Platform.OS === 'ios' ? 130 : 110],
    extrapolate: 'clamp',
  });

  const imageSize = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [100, 60],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const headerTextOpacity = scrollY.interpolate({
    inputRange: [30, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const fetchUserData = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        setUser(currentUser);
        const doctorDoc = await firestore()
          .collection('doctors')
          .doc(currentUser.uid)
          .get();
        
        if (doctorDoc.exists) {
          setDoctorProfile(doctorDoc.data());
          setAvailabilityStatus(doctorDoc.data().isAvailable || false);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Unable to fetch user profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      return () => {};
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      if (Platform.OS === 'android') {
        await GoogleSignin.signOut();
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'DLogin' }],
      });
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('Logout Error', 'Unable to log out. Please try again.');
    }
  };

  const toggleAvailability = async (newStatus) => {
    setAvailabilityStatus(newStatus);
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await firestore()
          .collection('doctors')
          .doc(currentUser.uid)
          .update({
            isAvailable: newStatus
          });
        
        Alert.alert(
          'Status Updated', 
          `You are now ${newStatus ? 'available' : 'unavailable'} for new appointments.`
        );
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      setAvailabilityStatus(!newStatus); // Revert on error
      Alert.alert('Error', 'Unable to update availability status');
    }
  };

  const getProfileImage = () => {
    if (doctorProfile?.profilePicture) {
      return { uri: doctorProfile.profilePicture };
    }
    
    if (user?.photoURL) {
      return { uri: user.photoURL };
    }
    
    const fullName = doctorProfile?.fullName || user?.displayName || 'Dr';
    const initials = fullName
      .split(' ')
      .map(word => word[0].toUpperCase())
      .slice(0, 2)
      .join('');
    
    return initials;
  };

  const SettingsMenuItem = ({ 
    title, 
    onPress, 
    iconName = "md-help-circle", 
    iconColor = "#6366F1", 
    rightContent,
    description,
    badge
  }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
        <View style={styles.menuTextContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.menuItemText}>{title}</Text>
            {badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
          {description && (
            <Text style={styles.menuItemDescription}>{description}</Text>
          )}
        </View>
      </View>
      {rightContent || (
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      )}
    </TouchableOpacity>
  );

  const SwitchMenuItem = ({ 
    title,
    description,
    iconName,
    iconColor,
    value,
    onValueChange
  }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuItemText}>{title}</Text>
          {description && (
            <Text style={styles.menuItemDescription}>{description}</Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#CBD5E1", true: "#818CF8" }}
        thumbColor={value ? "#6366F1" : "#F1F5F9"}
        ios_backgroundColor="#CBD5E1"
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      
      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
        <LinearGradient
          colors={['#6366F1', '#818CF8']}
          style={styles.gradientHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={{ opacity: headerTextOpacity, alignItems: 'center' }}>
            <Animated.View style={{ height: imageSize, width: imageSize }}>
              {typeof getProfileImage() === 'object' ? (
                <Animated.Image 
                  source={getProfileImage()}
                  style={[styles.profileImage, { height: imageSize, width: imageSize, borderRadius: 50 }]}
                />
              ) : (
                <Animated.View style={[styles.initialsContainer, { height: imageSize, width: imageSize, borderRadius: 50 }]}>
                  <Text style={styles.initialsText}>{getProfileImage()}</Text>
                </Animated.View>
              )}
            </Animated.View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {doctorProfile?.fullName || user?.displayName || 'Dr. Name'}
              </Text>
              <Text style={styles.profileSpecialty}>
                {doctorProfile?.specialty || 'Specialist'}
              </Text>
              <Text style={styles.profileEmail}>
                {user?.email || 'doctor@example.com'}
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } }}],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
        <View style={styles.contentContainer}>
          <View style={styles.statusCard}>
            <View style={styles.statusCardContent}>
              <View style={styles.statusIconContainer}>
                <Ionicons 
                  name={availabilityStatus ? "checkmark-circle" : "time-outline"} 
                  size={28} 
                  color={availabilityStatus ? "#10B981" : "#F59E0B"} 
                />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>
                  {availabilityStatus ? "You're Available" : "You're Unavailable"}
                </Text>
                <Text style={styles.statusDescription}>
                  {availabilityStatus 
                    ? "Patients can book appointments with you" 
                    : "You won't receive new appointment requests"}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[
                styles.statusButton, 
                { backgroundColor: availabilityStatus ? "#FFEDD5" : "#DCFCE7" }
              ]}
              onPress={() => toggleAvailability(!availabilityStatus)}
            >
              <Text style={[
                styles.statusButtonText, 
                { color: availabilityStatus ? "#F59E0B" : "#10B981" }
              ]}>
                {availabilityStatus ? "Go Unavailable" : "Go Available"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <SettingsMenuItem
              title="Edit Profile"
              description="Update your personal information"
              iconName="person-outline"
              iconColor="#3B82F6"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <SettingsMenuItem
              title="Professional Information"
              description="Manage specialty and qualifications"
              iconName="medical-outline"
              iconColor="#8B5CF6"
              onPress={() => navigation.navigate('ProfessionalInfo')}
            />
            <SettingsMenuItem
              title="Change Password"
              description="Manage your account security"
              iconName="lock-closed-outline"
              iconColor="#6366F1"
              onPress={() => navigation.navigate('DForgetPassword')}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <SwitchMenuItem
              title="Notifications"
              description="Manage your alert settings"
              iconName="notifications-outline"
              iconColor="#F59E0B"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
            <SwitchMenuItem
              title="Dark Mode"
              description="Switch between light and dark theme"
              iconName="moon-outline"
              iconColor="#6366F1"
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
            />
            <SettingsMenuItem
              title="Appointment Settings"
              description="Configure appointment availability"
              iconName="calendar-outline"
              iconColor="#10B981"
              onPress={() => navigation.navigate('AppointmentSettings')}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <SettingsMenuItem
              title="Help Center"
              description="Get help with using the app"
              iconName="help-circle-outline"
              iconColor="#0EA5E9"
              onPress={() => navigation.navigate('HelpScreen')}
            />
            <SettingsMenuItem
              title="Contact Support"
              description="Reach out to our support team"
              iconName="chatbubble-ellipses-outline"
              iconColor="#8B5CF6"
              onPress={() => navigation.navigate('ContactScreen')}
              badge="New"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <SettingsMenuItem
              title="Privacy Policy"
              description="Read our privacy policy"
              iconName="shield-outline"
              iconColor="#64748B"
              onPress={() => navigation.navigate('PrivacyScreen')}
            />
            <SettingsMenuItem
              title="Terms of Service"
              description="View our terms of service"
              iconName="document-text-outline"
              iconColor="#64748B"
              onPress={() => navigation.navigate('TermScreen')}
            />
          </View>

          <TouchableOpacity 
            style={styles.logoutButton} 
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to log out?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: handleLogout }
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="white" style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Version 1.0.2</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  gradientHeader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  profileImage: {
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  initialsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  initialsText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 12,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  profileSpecialty: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: Platform.OS === 'ios' ? 230 : 210,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  statusCard: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 16,
    marginBottom: 24,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  statusButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    height: 54,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5.62,
    elevation: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 20,
  },
});

export default DoctorSetting;