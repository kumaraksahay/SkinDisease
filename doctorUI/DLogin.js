import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Animated,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';

// Configuration and Utility Functions
const configureGoogleSignIn = async () => {
  try {
    await GoogleSignin.configure({
      webClientId: '153052758568-2c2gq1emvmtt8uubo8bkck88f90r2v2i.apps.googleusercontent.com',
      offlineAccess: true,
    });
  } catch (error) {
    console.error('Google Sign-In Configuration Error:', error);
  }
};

const DLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigation = useNavigation();

  // Animation References
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Animation Setup
  useEffect(() => {
    configureGoogleSignIn();
    
    // Fade and Scale Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Login Handlers
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // Check for admin credentials
    if (email.toLowerCase() === 'akshay123@gmail.com' && password === 'Akshay') {
      try {
        await auth().signInWithEmailAndPassword(email, password);
        Alert.alert('Success', 'Logged in as Admin!');
        navigation.navigate('AdminDashboard');
      } catch (error) {
        console.error(error);
        Alert.alert('Login Error', 'Admin login failed. Please check your credentials.');
      }
      return;
    }

    // Handle doctor login
    try {
      await auth().signInWithEmailAndPassword(email, password);
      Alert.alert('Success', 'Logged in as Doctor!');
      navigation.navigate('DashboardDoctor');
    } catch (error) {
      console.error(error);
      let errorMessage = 'Login Failed';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'This is not a registered doctor email';
          break;
        case 'auth/user-not-found':
          errorMessage = 'This is not a registered doctor';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Password incorrect';
          break;
        default:
          errorMessage = error.message;
      }
      
      Alert.alert('Login Error', errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      // For Google Sign-In, assume doctor role
      Alert.alert('Success', 'Logged in with Google as Doctor!');
      navigation.navigate('DashboardDoctor');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Sign-In Cancelled', 'You cancelled the sign-in process');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Sign-In In Progress', 'Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Google Play Services', 'Google Play services is not available');
      } else {
        Alert.alert('Google Sign-In Failed', error.message);
      }
    }
  };

  return (
    <LinearGradient 
      colors={['#9E7BFF', '#7F56D9', '#5A37B8']} 
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.formContainer, 
          { 
            opacity: fadeAnim,
            transform: [
              { 
                scale: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                }) 
              }
            ]
          }
        ]}
      >
        <Animatable.View 
          animation="fadeInDown" 
          duration={1000} 
          style={styles.headerContainer}
        >
          <Image 
            source={require('../src/assets/doctor.png')} 
            style={styles.logoIcon} 
          />
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </Animatable.View>

        {/* Email Input with Animation */}
        <Animatable.View animation="fadeInLeft" duration={1200}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#a8a8a8"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Animatable.View>

        {/* Password Input with Animation */}
        <Animatable.View animation="fadeInRight" duration={1200}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#a8a8a8"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.eyeIconContainer}
            >
              <Image
                style={styles.eyeIcon}
                source={
                  passwordVisible
                    ? require('../src/assets/eye-open.png')
                    : require('../src/assets/pngegg.png')
                }
              />
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Forgot Password */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('DForgetPassword')}
          style={styles.forgotPasswordContainer}
        >
          <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
        </TouchableOpacity> 

        {/* Login Button with Animation */}
        <Animatable.View animation="pulse" iterationCount={1}>
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleLogin}
          >
            <Text style={styles.submitButtonText}>Login</Text>
          </TouchableOpacity>
        </Animatable.View>

        {/* Divider */}
        <View style={styles.orContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* Google Sign-In Button */}
        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleGoogleSignIn}
        >
          <Image
            style={styles.googleIcon}
            source={require('../src/assets/google.png')}
          />
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            Don't have an account?{' '}
            <Text
              style={styles.registerLink}
              onPress={() => navigation.navigate('DoctorRegister')}
            >
              Register here
            </Text>
          </Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoIcon: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  input: {
    height: 50,
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIconContainer: {
    paddingHorizontal: 15,
  },
  eyeIcon: {
    width: 24,
    height: 24,
    tintColor: '#7F56D9',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  forgotPasswordLink: {
    color: '#7F56D9',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#7F56D9',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  orText: {
    marginHorizontal: 10,
    color: '#7F56D9',
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#333',
  },
  registerContainer: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    color: '#7F56D9',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default DLogin;