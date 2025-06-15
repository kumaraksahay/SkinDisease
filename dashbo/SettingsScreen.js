import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// Theme Context
const ThemeContext = createContext();

// Light and Dark Themes
const THEMES = {
  light: {
    primaryGradientStart: '#6B48FF',
    primaryGradientEnd: '#00DDEB',
    secondaryGradientStart: '#FF6B6B',
    secondaryGradientEnd: '#FF8E53',
    background: '#F5F7FA',
    cardBackground: '#FFFFFF',
    textPrimary: '#2D3436',
    textSecondary: '#636E72',
    accent: '#00DDEB',
    destructive: '#FF4757',
    success: '#2ECC71',
    iconBackground: '#E8F1FF',
    destructiveBackground: '#FFF1F0',
    statusBar: 'dark-content',
  },
  dark: {
    primaryGradientStart: '#4B3A99', // Darker purple
    primaryGradientEnd: '#008B99',   // Darker cyan
    secondaryGradientStart: '#B34747',
    secondaryGradientEnd: '#B3653D',
    background: '#1A1A1A',          // Dark gray
    cardBackground: '#2C2C2C',      // Darker gray
    textPrimary: '#E0E0E0',         // Light gray
    textSecondary: '#A0A0A0',       // Medium gray
    accent: '#00B8C4',
    destructive: '#FF6B6B',
    success: '#27AE60',
    iconBackground: '#3A3A3A',
    destructiveBackground: '#4A2A2A',
    statusBar: 'light-content',
  },
};

const SettingsScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load theme preference from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setDarkModeEnabled(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
    fetchUserData();
  }, []);

  // Save theme preference to AsyncStorage
  const toggleDarkMode = async (value) => {
    setDarkModeEnabled(value);
    try {
      await AsyncStorage.setItem('theme', value ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        const userDoc = await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          setUserData({
            ...userData,
            email: currentUser.email,
          });

          if (userData.profilePicture) {
            setProfileImage(userData.profilePicture);
            await AsyncStorage.setItem('profileImageUri', userData.profilePicture);
          } else {
            const localImageUri = await AsyncStorage.getItem('profileImageUri');
            if (localImageUri) {
              setProfileImage(localImageUri);
            }
          }
        } else {
          console.warn('User document not found');
        }
      } else {
        console.warn('No authenticated user');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    }
  };

  // Theme value for context
  const theme = darkModeEnabled ? THEMES.dark : THEMES.light;

  // Navigation and other handlers remain the same
  const handleProfileImageClick = () => {
    navigation.navigate('Profile');
  };

  const handleUpdateProfile = () => {
    navigation.navigate('UserEditProfile', { userData });
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await auth().signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to log out');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = auth().currentUser;
              await firestore()
                .collection('users')
                .doc(currentUser.uid)
                .delete();
              await currentUser.delete();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const renderSettingItem = (icon, title, onPress, rightComponent = null, type = 'default') => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        type === 'destructive' && styles.destructiveItem(theme),
      ]}
      onPress={onPress}
    >
      <View style={styles.settingItemLeft}>
        <View
          style={[
            styles.iconContainer(theme),
            type === 'destructive' && styles.destructiveIconContainer(theme),
          ]}
        >
          <Icon
            name={icon}
            size={18}
            color={type === 'destructive' ? theme.destructive : theme.accent}
          />
        </View>
        <Text
          style={[
            styles.settingTitle(theme),
            type === 'destructive' && styles.destructiveText(theme),
          ]}
        >
          {title}
        </Text>
      </View>
      {rightComponent || (
        <Icon
          name="chevron-right"
          size={16}
          color={type === 'destructive' ? theme.destructive : theme.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer(theme)}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={theme}>
      <SafeAreaView style={styles.container(theme)}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primaryGradientStart} />

        <LinearGradient
          colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerContainer}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Settings</Text>
            <View style={{ width: 20 }} />
          </View>

          <View style={styles.profileContainer}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={handleProfileImageClick}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <LinearGradient
                  colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
                  style={styles.profileIconPlaceholder}
                >
                  <Text style={styles.profileInitial}>
                    {(userData?.username || 'U').charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userData?.username || 'User'}
              </Text>
              <Text style={styles.profileEmail}>
                {userData?.email || 'No email'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.settingsScrollView(theme)} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle(theme)}>ACCOUNT</Text>
            <View style={styles.cardContainer(theme)}>
              {renderSettingItem('user-edit', 'Update Profile', handleUpdateProfile)}
              {renderSettingItem('lock', 'Change Password', handleChangePassword)}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle(theme)}>PREFERENCES</Text>
            <View style={styles.cardContainer(theme)}>
              {renderSettingItem(
                'bell',
                'Notifications',
                () => setNotificationsEnabled(!notificationsEnabled),
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#DFE6E9', true: theme.success }}
                  thumbColor={notificationsEnabled ? theme.accent : '#FFFFFF'}
                  ios_backgroundColor="#DFE6E9"
                />
              )}
              {renderSettingItem(
                'moon',
                'Dark Mode',
                () => toggleDarkMode(!darkModeEnabled),
                <Switch
                  value={darkModeEnabled}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: '#DFE6E9', true: theme.success }}
                  thumbColor={darkModeEnabled ? theme.accent : '#FFFFFF'}
                  ios_backgroundColor="#DFE6E9"
                  style={{
                    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
                  }}
                />
              )}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle(theme)}>SUPPORT</Text>
            <View style={styles.cardContainer(theme)}>
              {renderSettingItem('question-circle', 'Help & Support', () => navigation.navigate('Support'))}
              {renderSettingItem('info-circle', 'About App', () => navigation.navigate('About'))}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle(theme)}>ACCOUNT MANAGEMENT</Text>
            <View style={styles.cardContainer(theme)}>
              {renderSettingItem('sign-out-alt', 'Logout', handleLogout)}
              {renderSettingItem('trash', 'Delete Account', handleDeleteAccount, null, 'destructive')}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.versionText(theme)}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemeContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    backgroundColor: theme.background,
  }),
  loadingContainer: (theme) => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  }),
  headerContainer: {
    paddingTop: 40,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    backgroundColor: THEMES.light.primaryGradientStart, // Fallback
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileIconPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)', // Fixed: Valid rgba value
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  settingsScrollView: (theme) => ({
    flex: 1,
    backgroundColor: theme.background,
  }),
  sectionContainer: {
    marginBottom: 20,
    marginTop: 16,
  },
  sectionTitle: (theme) => ({
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    marginHorizontal: 16,
    marginBottom: 10,
    letterSpacing: 0.8,
  }),
  cardContainer: (theme) => ({
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  }),
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: (theme) => ({
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.iconBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  }),
  destructiveIconContainer: (theme) => ({
    backgroundColor: theme.destructiveBackground,
  }),
  settingTitle: (theme) => ({
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '500',
  }),
  destructiveItem: (theme) => ({
    borderBottomWidth: 0,
  }),
  destructiveText: (theme) => ({
    color: theme.destructive,
    fontWeight: '500',
  }),
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  versionText: (theme) => ({
    fontSize: 13,
    color: theme.textSecondary,
  }),
});

export default SettingsScreen;