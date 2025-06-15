import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

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
          setUserData(userData);
          setProfileImage(userData.profilePicture || null);
        } else {
          console.warn('User document not found');
        }
      } else {
        console.warn('No authenticated user');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
      Alert.alert('Error', 'Could not fetch user profile');
    }
  };

  const handleImageUpload = async () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.7,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        return;
      } else if (response.errorCode) {
        Alert.alert('Error', 'Image upload failed');
        return;
      }

      const source = response.assets[0];
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      try {
        const storagePath = `profile_pictures/${currentUser.uid}_${Date.now()}`;
        const reference = storage().ref(storagePath);
        await reference.putFile(source.uri);
        const downloadURL = await reference.getDownloadURL();

        await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .update({
            profilePicture: downloadURL,
          });

        setProfileImage(downloadURL);
        Alert.alert('Success', 'Profile image updated');
      } catch (error) {
        console.error('Image upload error:', error);
        Alert.alert('Error', 'Failed to upload image');
      }
    });
  };

  const handleEditProfile = () => {
    if (userData) {
      navigation.navigate('UserEditProfile', { userData });
    } else {
      Alert.alert('Error', 'User data not available');
    }
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Could not log out');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#8A2BE2', '#6A5ACD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.emptySpace} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileImageSection}>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={handleImageUpload}
            activeOpacity={0.8}
          >
            {profileImage ? (
              <Image 
                source={{ uri: profileImage }} 
                style={styles.profileImage} 
              />
            ) : (
              <LinearGradient
                colors={['#8A2BE2', '#6A5ACD']}
                style={styles.profileImagePlaceholder}
              >
                <Text style={styles.profileInitial}>
                  {(userData?.username || 'U').charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={18} color="white" />
            </View>
          </TouchableOpacity>

          <Text style={styles.nameText}>
            {userData?.username || 'User'}
          </Text>
          <Text style={styles.memberSinceText}>
            Member since {new Date().getFullYear()}
          </Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={22} color="#8A2BE2" />
            <Text style={styles.cardHeaderText}>Personal Information</Text>
          </View>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="mail-outline" size={22} color="#8A2BE2" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailText}>
                  {userData?.email || 'No email added'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="call-outline" size={22} color="#8A2BE2" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailText}>
                  {userData?.mobile || 'No phone number added'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={22} color="#8A2BE2" />
            <Text style={styles.cardHeaderText}>Settings & Preferences</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Edit Profile</Text>
              <Text style={styles.settingSubtext}>Update your personal information</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#8A2BE2" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.editButton} 
          onPress={handleEditProfile}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8A2BE2', '#6A5ACD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.editButtonGradient}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButtonBottom} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF4444', '#CC3333']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutButtonGradient}
          >
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  emptySpace: {
    width: 38, // Match back button size for balance
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileImageSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  profileInitial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8A2BE2',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberSinceText: {
    fontSize: 14,
    color: '#777',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  detailsContainer: {
    paddingHorizontal: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#777',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtext: {
    fontSize: 14,
    color: '#777',
  },
  editButton: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  editButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButtonBottom: {
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;