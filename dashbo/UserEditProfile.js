import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const UserEditProfile = ({ route, navigation }) => {
  const { userData } = route.params;
  const [username, setUsername] = useState(userData?.username || '');
  const [mobile, setMobile] = useState(userData?.mobile || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateProfile = async () => {
    try {
      setIsEditing(true);
      const currentUser = auth().currentUser;

      // Update Firestore document
      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .update({
          username,
          mobile,
        });

      // Update email in Firebase Authentication if changed
      if (email !== currentUser.email) {
        await currentUser.updateEmail(email);
      }

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully', [
        { 
          text: 'OK', 
          onPress: () => navigation.goBack() 
        }
      ]);
    } catch (error) {
      setIsEditing(false);
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Could not update profile');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8e2de2', '#4a00e0']}
        style={styles.headerBackground}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
        
        <View style={styles.profileImageContainer}>
          <Image 
            source={{ uri: userData?.photoURL || 'https://via.placeholder.com/150' }} 
            style={styles.profileImage} 
          />
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.formCard}>
            <View style={styles.formField}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#8e2de2" />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#A0A0A0"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#8e2de2" />
                <TextInput
                  style={styles.input}
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#A0A0A0"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#8e2de2" />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  placeholderTextColor="#A0A0A0"
                  editable={false}
                />
              </View>
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.updateButton} 
            onPress={handleUpdateProfile}
            disabled={isEditing}
          >
            {isEditing ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="refresh" size={24} color="#fff" style={styles.spinner} />
                <Text style={styles.updateButtonText}>Updating...</Text>
              </View>
            ) : (
              <Text style={styles.updateButtonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerBackground: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 80,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    marginLeft: 15,
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginTop: 20,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8e2de2',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: -50,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  formField: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#eee',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    marginLeft: 5,
  },
  updateButton: {
    backgroundColor: '#8e2de2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#8e2de2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 10,
    transform: [{ rotate: '0deg' }],
  },
});

export default UserEditProfile;