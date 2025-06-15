import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';

// Color scheme from DLogin
const COLORS = {
  PRIMARY: '#7F56D9',         // Purple (used in buttons, links, and icons)
  SECONDARY: '#9E7BFF',       // Light purple (gradient start)
  TERTIARY: '#5A37B8',        // Darker purple (gradient end)
  BACKGROUND: '#FFFFFF',      // White (form container background)
  TEXT_DARK: '#333',          // Dark gray (title)
  TEXT_MEDIUM: '#666',        // Medium gray (subtitle)
  TEXT_LIGHT: '#FFFFFF',      // White (button text)
  INPUT_BG: '#f6f6f6',        // Light gray (input background)
  BORDER: '#e0e0e0',          // Light border color (inputs)
  SHADOW: '#000',             // Black (shadow color)
};

const DoctorRegister = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    age: '',
    address: '',
    experienceYears: '',
    degree: '',
    password: '',
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [isAgreed, setIsAgreed] = useState(false);

  const buttonScale = new Animated.Value(1);

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleImageUpload = (setImageCallback, label) => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: false }, (response) => {
      if (response.didCancel) {
        Alert.alert(`${label} Upload Cancelled`);
      } else if (response.errorCode) {
        Alert.alert('Error', `An error occurred while selecting the ${label.toLowerCase()}.`);
      } else {
        setImageCallback(response.assets[0].uri);
      }
    });
  };

  const handleSubmit = async () => {
    if (!isAgreed) {
      Alert.alert('Error', 'You must agree to the Terms and Conditions to proceed.');
      return;
    }

    if (!formData.fullName || !formData.email || !formData.password || !formData.age) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(formData.email, formData.password);
      const user = userCredential.user;

      await firestore().collection('doctors').doc(user.uid).set({
        fullName: formData.fullName,
        email: formData.email,
        age: formData.age,
        address: formData.address,
        experienceYears: formData.experienceYears,
        degree: formData.degree,
        profilePicture: profilePicture || '',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 100,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 100,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Alert.alert('Success', 'Doctor registered successfully!');
        navigation.navigate('DLogin');
      });
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <LinearGradient colors={[COLORS.SECONDARY, COLORS.PRIMARY, COLORS.TERTIARY]} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Doctor Registration</Text>

        <View style={styles.profileContainer}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Icon name="user-md" size={60} color={COLORS.TEXT_LIGHT} />
              <Text style={styles.profilePlaceholderText}>Profile Picture</Text>
            </View>
          )}
          <TouchableOpacity style={styles.uploadButton} onPress={() => handleImageUpload(setProfilePicture, 'Profile Picture')}>
            <Text style={styles.uploadButtonText}>{profilePicture ? 'Change Picture' : 'Upload Profile Picture'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter your full name" 
          placeholderTextColor={COLORS.TEXT_MEDIUM}
          value={formData.fullName} 
          onChangeText={(text) => handleInputChange('fullName', text)} 
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter your email" 
          placeholderTextColor={COLORS.TEXT_MEDIUM}
          keyboardType="email-address" 
          value={formData.email} 
          onChangeText={(text) => handleInputChange('email', text)} 
        />

        <Text style={styles.label}>Password</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter password" 
          placeholderTextColor={COLORS.TEXT_MEDIUM}
          secureTextEntry 
          value={formData.password} 
          onChangeText={(text) => handleInputChange('password', text)} 
        />

        <Text style={styles.label}>Age</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter your age" 
          placeholderTextColor={COLORS.TEXT_MEDIUM}
          keyboardType="numeric" 
          value={formData.age} 
          onChangeText={(text) => handleInputChange('age', text)} 
        />

        <Text style={styles.label}>Address</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Enter your address" 
          placeholderTextColor={COLORS.TEXT_MEDIUM}
          multiline 
          numberOfLines={3} 
          value={formData.address} 
          onChangeText={(text) => handleInputChange('address', text)} 
        />

        <Text style={styles.label}>Experience Years</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter years of experience" 
          placeholderTextColor={COLORS.TEXT_MEDIUM}
          keyboardType="numeric" 
          value={formData.experienceYears} 
          onChangeText={(text) => handleInputChange('experienceYears', text)} 
        />

        <Text style={styles.label}>Degree</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter your degree" 
          placeholderTextColor={COLORS.TEXT_MEDIUM}
          value={formData.degree} 
          onChangeText={(text) => handleInputChange('degree', text)} 
        />

        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsAgreed(!isAgreed)}>
          <View style={[styles.checkbox, isAgreed && styles.checkboxChecked]} />
          <Text style={styles.checkboxLabel}>I agree to the Terms and Conditions</Text>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Registration</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: { 
    flex: 1 
  },
  container: { 
    flexGrow: 1, 
    padding: 20, 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: COLORS.TEXT_DARK, 
    textAlign: 'center',
    marginBottom: 20
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  profilePlaceholderText: {
    color: COLORS.TEXT_LIGHT,
    marginTop: 5,
    fontSize: 12
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10
  },
  uploadButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 5
  },
  uploadButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 14
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.TEXT_LIGHT, 
    alignSelf: 'flex-start',
    marginTop: 5,
    marginBottom: 5
  },
  input: { 
    borderWidth: 1, 
    borderColor: COLORS.BORDER,
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 15, 
    backgroundColor: COLORS.INPUT_BG, 
    width: '100%',
    fontSize: 16,
    color: COLORS.TEXT_DARK
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  checkboxContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 25,
    alignSelf: 'flex-start'
  },
  checkbox: { 
    width: 20, 
    height: 20, 
    borderWidth: 1,
    borderColor: COLORS.TEXT_LIGHT, 
    borderRadius: 4, 
    marginRight: 10 
  },
  checkboxChecked: { 
    backgroundColor: COLORS.PRIMARY 
  },
  checkboxLabel: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 14
  },
  submitButton: { 
    backgroundColor: COLORS.PRIMARY, 
    padding: 16, 
    borderRadius: 10, 
    alignItems: 'center', 
    width: '100%' 
  },
  submitButtonText: { 
    color: COLORS.TEXT_LIGHT, 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});

export default DoctorRegister; 