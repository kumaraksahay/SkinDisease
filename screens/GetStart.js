import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar,
  Animated,
  Easing 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Camera, Shield, Heart, Microscope, Star, UserCheck } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const GetStart = () => {
  const navigation = useNavigation();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('Home');
  };

  const features = [
    { icon: Shield, color: '#28A745', text: 'Advanced Detection' },
    { icon: Heart, color: '#FF4E4E', text: 'Health Tracking' },
    { icon: Star, color: '#FFD700', text: 'Smart Analysis' },
    { icon: UserCheck, color: '#4A6CF7', text: 'Expert Support' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#4A6CF7', '#7A40F2', '#9333EA']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View 
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Camera color="#FFFFFF" size={40} />
              <Microscope color="#28A745" size={35} style={styles.overlayIcon} />
            </View>
          </View>
          <Text style={styles.appTitle}>SkinScan</Text>
          <Text style={styles.appTagline}>AI-Powered Skin Analysis</Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.welcomeTitle}>Welcome to SkinScan</Text>
          <Text style={styles.welcomeSubtitle}>
            Your Comprehensive Skin Health Companion
          </Text>

          <View style={styles.featureGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                  style={styles.featureGradient}
                >
                  <feature.icon color={feature.color} size={28} />
                  <Text style={styles.featureText}>{feature.text}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2ECC71', '#28A745']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  overlayIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  appTagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    letterSpacing: 1,
  },
  contentContainer: {
    width: width * 0.9,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  featureItem: {
    width: '48%',
    marginBottom: 15,
  },
  featureGradient: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featureText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  getStartedButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default GetStart;