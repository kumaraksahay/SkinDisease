import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export default function Login(props) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  // Original backend logic
  const handleLogin = async () => {
    try {
      if (!emailOrUsername || !password) {
        Alert.alert('Oops!', 'Please enter both email/username and password.');
        return;
      }

      setIsLoading(true);

      let userEmail = emailOrUsername;
      if (!emailOrUsername.includes('@')) {
        const usernameQuery = await firestore()
          .collection('users')
          .where('username', '==', emailOrUsername)
          .get();

        if (!usernameQuery.empty) {
          userEmail = usernameQuery.docs[0].data().email;
        } else {
          throw new Error('User not found');
        }
      }

      const userCredential = await auth().signInWithEmailAndPassword(userEmail, password);
      const currentUser = userCredential.user;

      if (!currentUser.emailVerified) {
        await currentUser.sendEmailVerification();
        await auth().signOut();
        Alert.alert(
          'Verification Required',
          'Please verify your email to continue. A new verification link has been sent.',
          [{ text: 'OK', style: 'default' }]
        );
        setIsLoading(false);
        return;
      }

      const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
      if (userDoc.exists) {
        setIsLoading(false);
        Alert.alert(
          'Welcome!',
          `Hello, ${userDoc.data().username || 'User'}!`,
          [{ text: 'Continue', onPress: () => navigation.navigate('Dashboard') }]
        );
      } else {
        throw new Error('User data not found');
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F5FF" />
      <LinearGradient colors={['#F9F5FF', '#F0E6FF']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Image
              source={require('../src/assets/doct.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Skin Scan</Text>
            <Text style={styles.subtitle}>Your personal skin health assistant</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>

            <View style={styles.inputContainer}>
              <Icon name="email" size={22} color="#9C6ADE" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email or Username"
                value={emailOrUsername}
                onChangeText={setEmailOrUsername}
                placeholderTextColor="#9C6ADE80"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email or Username Input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={22} color="#9C6ADE" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#9C6ADE80"
                secureTextEntry={!showPassword}
                accessibilityLabel="Password Input"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel="Toggle Password Visibility"
              >
                <Icon name={showPassword ? 'visibility-off' : 'visibility'} size={20} color="#9C6ADE" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgetPassword')}
              accessibilityLabel="Forgot Password Link"
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#9C6ADE', '#7E3CBD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Image source={require('../src/assets/google.png')} style={styles.socialIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Image source={require('../src/assets/xlog.png')} style={styles.socialIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Image source={require('../src/assets/facebook.png')} style={styles.socialIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity
                onPress={() => props.navigation.navigate('Signup')}
                accessibilityLabel="Sign Up Link"
              >
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Icon name="security" size={28} color="#9C6ADE" />
              <Text style={styles.featureText}>Secure Encryption</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="privacy-tip" size={28} color="#9C6ADE" />
              <Text style={styles.featureText}>Privacy Protected</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="support-agent" size={28} color="#9C6ADE" />
              <Text style={styles.featureText}>24/7 Support</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F5FF',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#7E3CBD',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9C6ADE',
    fontWeight: '500',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginVertical: 20,
    shadowColor: '#9C6ADE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7E3CBD',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F9F5FF',
    borderRadius: 14,
    marginVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E8D9FF',
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    color: '#7E3CBD',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  forgotText: {
    color: '#9C6ADE',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8D9FF',
  },
  dividerText: {
    color: '#9C6ADE',
    paddingHorizontal: 16,
    fontWeight: '600',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F9F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8D9FF',
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666666',
    fontSize: 16,
  },
  footerLink: {
    color: '#7E3CBD',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    color: '#7E3CBD',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});