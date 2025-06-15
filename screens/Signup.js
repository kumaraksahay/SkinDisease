import React, { useState, useEffect } from 'react';   
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import LinearGradient from 'react-native-linear-gradient';
import Background from './Background';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get('window');

const Signup = (props) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignup = async () => {
    if (!isAgreed) {
      Alert.alert('Terms Required', 'You must agree to the Terms and Conditions to proceed.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }
    
    if (!username || !email || !password || !mobile) {
      Alert.alert('Missing Information', 'Please fill out all fields to continue.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create user with Firebase Authentication
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Send verification email
      await user.sendEmailVerification();

      // Add user data to Firestore with username
      await firestore().collection('users').doc(user.uid).set({
        username: username,
        mobile: mobile,
        email: email,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      setIsLoading(false);
      Alert.alert(
        'Account Created!', 
        'Your account has been created successfully. Please check your email for verification.',
        [{ text: 'Go to Login', onPress: () => props.navigation.navigate('Login') }]
      );
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#5a189a" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Background>
          <Animated.View 
            style={[
              styles.headerContainer,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="account-plus" size={50} color="#fff" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}]
              }
            ]}
          >
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <FontAwesome5 name="user" size={18} color="#6a1b9a" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <FontAwesome5 name="mobile-alt" size={18} color="#6a1b9a" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                placeholderTextColor="#999"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="email-outline" size={18} color="#6a1b9a" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="lock-outline" size={18} color="#6a1b9a" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="lock-check-outline" size={18} color="#6a1b9a" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsAgreed(!isAgreed)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isAgreed && styles.checkboxChecked]}>
                {isAgreed && (
                  <Ionicons name="checkmark" size={15} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>I agree to the Terms and Conditions</Text>
            </TouchableOpacity>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>By signing up, you agree to our{' '}</Text>
              <TouchableOpacity>
                <Text style={styles.linkText}>Terms & Conditions</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>and{' '}</Text>
              <TouchableOpacity>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.registerButtonContainer, isLoading && styles.disabledButton]}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#7b2cbf', '#6a1b9a', '#5a189a']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.registerButton}
              >
                {isLoading ? (
                  <Text style={styles.registerButtonText}>Creating account...</Text>
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome5 name="google" size={20} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome5 name="facebook" size={20} color="#4267B2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome5 name="apple" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => props.navigation.navigate('Login')}>
                <Text style={styles.loginLinkText}>Login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Background>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  formContainer: {
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 55,
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  iconContainer: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 15,
    color: '#333',
    fontSize: 16,
  },
  eyeButton: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 15,
    marginTop: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#6a1b9a',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6a1b9a',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#555',
  },
  termsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  termsText: {
    color: '#777',
    fontSize: 13,
  },
  linkText: {
    color: '#6a1b9a',
    fontSize: 13,
    fontWeight: '600',
  },
  registerButtonContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#6a1b9a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  registerButton: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 15,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  dividerText: {
    paddingHorizontal: 15,
    color: '#888',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  socialButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  loginText: {
    color: '#777',
    fontSize: 14,
  },
  loginLinkText: {
    color: '#6a1b9a',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Signup;