import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

const ForgetPassword = (props) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address to receive the reset link.');
      return;
    }

    setIsLoading(true);
    
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        'Reset Link Sent',
        'We\'ve sent a password reset link to your email. Please check your inbox.',
        [{ text: 'OK', onPress: () => props.navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => props.navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <Image 
            source={{ uri: 'https://your-image-source.com/forgot_password_icon.png' }}
            style={styles.logo}
            defaultSource={require('../src/assets/sche.png')}
          />
          
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="youremail@example.com"
              placeholderTextColor="#a0a0a0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCompleteType="email"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            disabled={isLoading}
            onPress={handleResetPassword}
          >
            <LinearGradient
              colors={['#4d68ff', '#3f51b5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.resetButton, isLoading && styles.disabledButton]}
            >
              <Text style={styles.resetButtonText}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Remembered your password? </Text>
            <TouchableOpacity onPress={() => props.navigation.navigate('Login')}>
              <Text style={styles.linkText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f1f3f9',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3f51b5',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
    paddingLeft: 4,
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2d3748',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resetButton: {
    width: 280,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4d68ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 30,
    alignItems: 'center',
  },
  loginText: {
    color: '#718096',
    fontSize: 15,
  },
  linkText: {
    color: '#4d68ff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default ForgetPassword;