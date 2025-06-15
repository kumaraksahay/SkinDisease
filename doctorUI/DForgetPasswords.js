import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';

// Color scheme from DLogin
const COLORS = {
  PRIMARY: '#7F56D9',
  SECONDARY: '#9E7BFF',
  TERTIARY: '#5A37B8',
  BACKGROUND: '#FFFFFF',
  TEXT_DARK: '#333',
  TEXT_MEDIUM: '#666',
  TEXT_LIGHT: '#FFFFFF',
  INPUT_BG: '#f6f6f6',
  BORDER: '#e0e0e0',
  SHADOW: '#000',
};

const DForgetPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setIsLoading(true);
    
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        'Success',
        'A password reset link has been sent to your email address.'
      );
      navigation.navigate('DLogin');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={[COLORS.SECONDARY, COLORS.PRIMARY, COLORS.TERTIARY]} 
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.container}>
            {/* Header with back button */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
            </View>

            {/* Content Section */}
            <View style={styles.contentContainer}>
              {/* Logo/Image */}
              <Image 
                source={require('../src/assets/sche.png')} 
                style={styles.image}
                resizeMode="contain"
              />

              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>
                No worries! Enter your email address and we'll send you a reset link.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor={COLORS.TEXT_MEDIUM}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(text) => setEmail(text)}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                onPress={handlePasswordReset}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.TEXT_LIGHT} size="small" />
                ) : (
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('DLogin')}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Adjusted for gradient
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 22,
    color: COLORS.TEXT_LIGHT,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slight overlay for contrast
    borderRadius: 20,
    marginHorizontal: 10,
    marginVertical: 20,
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    backgroundColor: COLORS.INPUT_BG,
    overflow: 'hidden',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    width: '100%',
    height: 55,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  resetButton: {
    width: '100%',
    height: 55,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  resetButtonDisabled: {
    backgroundColor: COLORS.PRIMARY + '80', // Slightly faded when disabled
  },
  resetButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 17,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 15,
  },
  loginLink: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default DForgetPassword;