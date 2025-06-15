import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaskedView from '@react-native-masked-view/masked-view';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const [animationComplete, setAnimationComplete] = useState(false);

  // Animation values for main component
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;

  // Animation value for 3D rotation and zoom
  const anim3D = useRef(new Animated.Value(0)).current;

  // Animation value for scan effect
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main component animations
    Animated.parallel([
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimationComplete(true);
    });

    // 3D rotation and zoom animation for doct.png
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim3D, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(anim3D, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scan effect animation
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();

    return () => {
      anim3D.stopAnimation();
      scanAnim.stopAnimation();
    };
  }, []);

  const createButtonAnimation = () => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    };

    return { scaleAnim, handlePressIn, handlePressOut };
  };

  const patientButton = createButtonAnimation();
  const doctorButton = createButtonAnimation();

  const renderWaveBackground = () => {
    const rotateX = anim3D.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['0deg', '10deg', '-10deg'], // Tilt up/down for 3D effect
    });

    const rotateY = anim3D.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['0deg', '-15deg', '15deg'], // Tilt left/right
    });

    const scale = anim3D.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.3, 1], // Zoom in and out
    });

    const opacity = anim3D.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 1, 0.8], // Subtle fade for depth
    });

    return (
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['rgba(108, 99, 255, 0.1)', 'rgba(54, 177, 191, 0.1)']}
          style={styles.backgroundGradient}
        />
        <Animated.Image
          source={require('../src/assets/doct.png')}
          style={[
            styles.backgroundWave,
            {
              transform: [{ rotateX }, { rotateY }, { scale }],
              opacity: Animated.multiply(fadeAnim, opacity),
            },
          ]}
          resizeMode="contain"
        />
      </View>
    );
  };

  const renderFloatingShapes = () => (
    <View style={styles.shapesContainer}>
      <Animated.View
        style={[styles.floatingShape, styles.shape1, { opacity: fadeAnim }]}
      />
      <Animated.View
        style={[styles.floatingShape, styles.shape2, { opacity: fadeAnim }]}
      />
    </View>
  );

  const renderButton = (title, onPress, style, iconName, buttonAnimations) => (
    <Animated.View
      style={[
        styles.buttonContainer,
        {
          transform: [
            { scale: buttonAnimations.scaleAnim },
            { translateY: translateYAnim },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={buttonAnimations.handlePressIn}
        onPressOut={buttonAnimations.handlePressOut}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={style.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <View style={styles.buttonInner}>
            <View style={styles.iconContainer}>
              <Icon name={iconName} size={26} color="#ffffff" />
            </View>
            <Text style={styles.buttonText}>{title}</Text>
            <Icon
              name="chevron-forward"
              size={22}
              color="rgba(255,255,255,0.8)"
              style={styles.arrowIcon}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderScanEffect = () => {
    if (!animationComplete) return null;

    const scanInterpolate = scanAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-(width * 0.45), width * 0.45],
    });

    return (
      <View style={styles.scanEffectContainer}>
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [{ translateY: scanInterpolate }],
            },
          ]}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      {renderWaveBackground()}
      {renderFloatingShapes()}
      <View style={styles.contentContainer}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../src/assets/skin.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          {renderScanEffect()}
        </Animated.View>
        <MaskedView
          style={styles.titleContainer}
          maskElement={<Text style={styles.title}>SkinScan</Text>}
        >
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleGradient}
          />
        </MaskedView>
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          AI-Powered Skin Analysis
        </Animated.Text>
        <View style={styles.buttonsContainer}>
          {renderButton(
            'Patient Login',
            () => navigation.navigate('Login'),
            { gradientColors: ['#3B82F6', '#22D3EE'] },
            'person-outline',
            patientButton
          )}
          {renderButton(
            'Doctor Login',
            () => navigation.navigate('DLogin'),
            { gradientColors: ['#8B5CF6', '#EC4899'] },
            'medical-outline',
            doctorButton
          )}
        </View>
        <Animated.View
          style={[
            styles.footer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          <Text style={styles.footerText}>Analyze • Diagnose • Care</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backgroundContainer: {
    position: 'absolute',
    height: height,
    width: width,
  },
  backgroundGradient: {
    position: 'absolute',
    height: height,
    width: width,
    opacity: 0.3,
  },
  backgroundWave: {
    width: width * 0.3, // Adjusted for visibility
    height: height * 0.2,
    position: 'absolute',
    bottom: height * 0.15, // Fixed near bottom-center
    left: width * 0.35, // Centered horizontally
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  shapesContainer: {
    position: 'absolute',
    height: height,
    width: width,
    zIndex: 0,
  },
  floatingShape: {
    position: 'absolute',
    borderRadius: 120,
  },
  shape1: {
    width: 160,
    height: 160,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    top: 20,
    right: 20,
  },
  shape2: {
    width: 140,
    height: 140,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    bottom: height * 0.2,
    left: 30,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    zIndex: 2,
  },
  logoContainer: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    marginBottom: 32,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
  },
  scanEffectContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: width * 0.25,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(59, 130, 246, 0.4)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  titleContainer: {
    height: 50,
    marginBottom: 12,
  },
  titleGradient: {
    flex: 1,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: 'black',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4B5563',
    marginBottom: 48,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '90%',
    marginBottom: 16,
  },
  gradientButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  arrowIcon: {
    marginLeft: 'auto',
  },
  footer: {
    marginTop: 'auto',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});

export default HomeScreen;