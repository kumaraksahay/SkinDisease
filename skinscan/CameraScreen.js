import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
  SafeAreaView,
  Platform,
  Modal,
  ScrollView,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

export default function SkinDiseaseScreen({ navigation }) {
  const [skinImage, setSkinImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bgColorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setSkinImage(null);
      setIsScanning(false);
      setScanComplete(false);
      setDownloadProgress(0);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
    ]).start();
    startPulseAnimation();

    return () => {
      pulseAnim.stopAnimation();
    };
  }, []);

  useEffect(() => {
    Animated.timing(bgColorAnim, {
      toValue: isScanning || scanComplete ? 1 : 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [isScanning, scanComplete]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  };

  const startRotateAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true })
    ).start();
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          ...(Platform.Version >= 33 ? [PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] : []),
        ]);
        return (
          (granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED ||
            (Platform.Version >= 33 && granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] === PermissionsAndroid.RESULTS.GRANTED)) &&
          granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const startScanAnimation = (uri) => {
    setIsScanning(true);
    setScanComplete(false);
    setDownloadProgress(0);

    scanLineAnim.setValue(0);
    progressAnim.setValue(0);
    startRotateAnimation();

    Animated.sequence([
      Animated.timing(scanLineAnim, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]).start(() => {
      setIsScanning(false);
      setScanComplete(true);
      rotateAnim.stopAnimation();

      setTimeout(() => {
        setSkinImage(null);
        setScanComplete(false);
        setDownloadProgress(0);
      }, 800);
    });

    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2.5;
      });
    }, 80);

    return () => clearInterval(progressInterval);
  };

  const handleImageSelection = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        alert('Storage permissions are required to select an image. Please enable them in settings.');
        return;
      }

      const options = {
        mediaType: 'photo',
        quality: 1,
        allowsEditing: true,
      };

      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
          return;
        }
        if (response.errorCode) {
          alert(`Image Picker Error: ${response.errorMessage || 'An error occurred'}`);
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const selectedImage = response.assets[0].uri;
          setSkinImage(selectedImage);
          startScanAnimation(selectedImage);
        } else {
          alert('No image selected');
        }
      });
    } catch (error) {
      console.error('Image selection error:', error);
      alert('An error occurred while selecting the image');
    }
  };

  const handleRemoveImage = () => {
    setSkinImage(null);
    setIsScanning(false);
    setScanComplete(false);
    setDownloadProgress(0);
    rotateAnim.stopAnimation();
    scanLineAnim.stopAnimation();
    progressAnim.stopAnimation();
  };

  const scanLineTransform = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, width * 0.85] });
  const rotateInterpolate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const backgroundColors = bgColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F9FAFE', '#E8EDFF'],
  });

  const renderInfoModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient 
              colors={['#4338CA', '#312E81']} 
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Guide to Perfect Skin Images</Text>
              <TouchableOpacity 
                onPress={() => setInfoModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.tipContainer}>
                <View style={styles.tipHeader}>
                  <MaterialCommunityIcons name="camera" size={24} color="#4338CA" />
                  <Text style={styles.tipTitle}>Focus on Affected Areas</Text>
                </View>
                <View style={styles.tipCardContainer}>
                  <View style={styles.tipCard}>
                    <MaterialCommunityIcons name="bandage" size={36} color="#4338CA" />
                    <Text style={styles.tipCardTitle}>Lesions</Text>
                    <Text style={styles.tipCardText}>Capture clear images of skin lesions or moles</Text>
                  </View>
                  <View style={styles.tipCard}>
                    <MaterialCommunityIcons name="alert-circle" size={36} color="#4338CA" />
                    <Text style={styles.tipCardTitle}>Rashes</Text>
                    <Text style={styles.tipCardText}>Include images of rashes or red areas</Text>
                  </View>
                </View>
                <View style={styles.tipCardContainer}>
                  <View style={styles.tipCard}>
                    <MaterialCommunityIcons name="magnify" size={36} color="#4338CA" />
                    <Text style={styles.tipCardTitle}>Close-Up</Text>
                    <Text style={styles.tipCardText}>Take close-up shots of affected skin</Text>
                  </View>
                  <View style={styles.tipCard}>
                    <MaterialCommunityIcons name="body" size={36} color="#4338CA" />
                    <Text style={styles.tipCardTitle}>Full Area</Text>
                    <Text style={styles.tipCardText}>Show the entire affected region</Text>
                  </View>
                </View>
              </View>

              <View style={styles.tipContainer}>
                <View style={styles.tipHeader}>
                  <MaterialCommunityIcons name="white-balance-sunny" size={24} color="#4338CA" />
                  <Text style={styles.tipTitle}>Optimal Lighting</Text>
                </View>
                <Text style={styles.tipText}>
                  • Use bright, natural light for clarity{'\n'}
                  • Avoid harsh shadows on the skin{'\n'}
                  • Prevent overexposure from direct sunlight{'\n'}
                  • Ensure even lighting for indoor shots
                </Text>
              </View>

              <View style={styles.tipContainer}>
                <View style={styles.tipHeader}>
                  <MaterialCommunityIcons name="image" size={24} color="#4338CA" />
                  <Text style={styles.tipTitle}>Image Selection Tips</Text>
                </View>
                <Text style={styles.tipText}>
                  • Choose sharp, focused images{'\n'}
                  • Focus on the affected skin area{'\n'}
                  • Capture multiple angles if possible{'\n'}
                  • Include a size reference (e.g., a coin){'\n'}
                  • Ensure the image is not blurry
                </Text>
              </View>

              <View style={styles.tipContainer}>
                <View style={styles.tipHeader}>
                  <MaterialCommunityIcons name="check-circle" size={24} color="#4338CA" />
                  <Text style={styles.tipTitle}>Best Practices</Text>
                </View>
                <Text style={styles.tipText}>
                  • Avoid images with debris or clothing{'\n'}
                  • Use a plain, neutral background{'\n'}
                  • Ensure the affected area fills the frame{'\n'}
                  • Capture unique skin characteristics{'\n'}
                  • For small lesions, use close-up images
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.gotItButton}
              onPress={() => setInfoModalVisible(false)}
            >
              <LinearGradient
                colors={['#4338CA', '#312E81']}
                style={styles.gotItButtonGradient}
              >
                <Text style={styles.gotItButtonText}>Got It!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {renderInfoModal()}
      <Animated.View style={[styles.gradientContainer, { backgroundColor: backgroundColors }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.replace('DashboardScreen')}
              >
                <LinearGradient
                  colors={['#4338CA', '#312E81']}
                  style={styles.backButtonGradient}
                >
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>SkinScan AI</Text>
                <Text style={styles.subtitle}>Advanced skin analysis in seconds</Text>
              </View>
              <TouchableOpacity 
                style={styles.infoButton} 
                onPress={() => setInfoModalVisible(true)}
              >
                <LinearGradient
                  colors={['#4338CA', '#312E81']}
                  style={styles.infoButtonGradient}
                >
                  <MaterialCommunityIcons name="information" size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.imageContainerWrapper}>
              <View style={styles.imageContainer}>
                {skinImage ? (
                  <View style={styles.scanContainer}>
                    <Image source={{ uri: skinImage }} style={styles.image} />
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={handleRemoveImage}
                      disabled={isScanning || scanComplete}
                    >
                      <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        style={styles.removeButtonGradient}
                      >
                        <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                    {isScanning && (
                      <>
                        <View style={styles.scanOverlay} />
                        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTransform }] }]} />
                        <View style={styles.scanEffectContainer}>
                          <MaterialCommunityIcons name="pulse" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                          <Text style={styles.scanningText}>ANALYZING</Text>
                        </View>
                      </>
                    )}
                    {scanComplete && (
                      <View style={styles.completeOverlay}>
                        <MaterialCommunityIcons name="check-circle" size={64} color="#FFFFFF" />
                        <Text style={styles.completeText}>Analysis Complete</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <LinearGradient
                      colors={['#4338CA', '#312E81']}
                      style={styles.placeholderGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <MaterialCommunityIcons name="camera" size={72} color="#FFFFFF" />
                      </Animated.View>
                      <Text style={styles.placeholderText}>Tap to Capture Skin Photo</Text>
                      <Text style={styles.placeholderSubtext}>Powered by AI technology</Text>
                    </LinearGradient>
                  </View>
                )}
              </View>
            </View>

            {(isScanning || scanComplete) && (
              <View style={styles.progressContainer}>
                <View style={styles.progressInfo}>
                  <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                    <MaterialCommunityIcons
                      name="loading"
                      size={24}
                      color="#4338CA"
                      style={styles.loadingIcon}
                    />
                  </Animated.View>
                  <Text style={styles.progressText}>
                    {scanComplete ? 'Complete' : `Analysis ${Math.round(downloadProgress)}%`}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                {!scanComplete && (
                  <Text style={styles.analyzeHint}>
                    {isScanning ? 'Processing image...' : 'Ready for analysis'}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.scanButton, (isScanning || scanComplete) && styles.scanButtonDisabled]}
              onPress={handleImageSelection}
              disabled={isScanning || scanComplete}
            >
              <LinearGradient
                colors={
                  isScanning || scanComplete
                    ? ['rgba(67, 56, 202, 0.3)', 'rgba(49, 46, 129, 0.3)']
                    : ['#4338CA', '#312E81']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <MaterialCommunityIcons
                  name={isScanning || scanComplete ? 'progress-clock' : 'camera-plus'}
                  size={24}
                  color="#FFFFFF"
                  style={styles.scanIcon}
                />
                <Text style={styles.scanText}>
                  {isScanning || scanComplete ? 'Processing...' : 'Upload Skin Photo'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {!(isScanning || scanComplete || skinImage) && (
              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <MaterialCommunityIcons name="shield-check" size={22} color="#4338CA" />
                  </View>
                  <Text style={styles.featureText}>Private & Secure Analysis</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <MaterialCommunityIcons name="brain" size={22} color="#4338CA" />
                  </View>
                  <Text style={styles.featureText}>Accurate Skin Condition Detection</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <MaterialCommunityIcons name="doctor" size={22} color="#4338CA" />
                  </View>
                  <Text style={styles.featureText}>Medically Informed AI</Text>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#F9FAFE',
  },
  gradientContainer: { 
    flex: 1, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  backButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 50,
    height: 50,
    elevation: 5,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  backButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  infoButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 50,
    height: 50,
    elevation: 5,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  infoButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#312E81',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  imageContainerWrapper: {
    borderRadius: 28,
    marginVertical: 16,
    elevation: 10,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  imageContainer: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(67, 56, 202, 0.2)',
  },
  scanContainer: { 
    flex: 1, 
    position: 'relative',
  },
  image: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 16,
    overflow: 'hidden',
    width: 32,
    height: 32,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  removeButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(67, 56, 202, 0.9)',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  scanEffectContainer: {
    position: 'absolute',
    top: 24,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(67, 56, 202, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  scanningText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  completeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(67, 56, 202, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  placeholderContainer: { 
    flex: 1, 
    borderRadius: 28, 
    overflow: 'hidden',
  },
  placeholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    marginTop: 18,
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  placeholderSubtext: {
    marginTop: 10,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  progressContainer: { 
    width: width * 0.9, 
    marginTop: 20, 
    marginBottom: 12,
  },
  progressInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 14,
  },
  loadingIcon: { 
    marginRight: 12,
  },
  progressText: {
    color: '#312E81',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4338CA',
    borderRadius: 4,
  },
  analyzeHint: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  scanButton: {
    width: width * 0.9,
    height: 60,
    borderRadius: 18,
    marginTop: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scanButtonDisabled: {
    opacity: 0.8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanIcon: {
    marginRight: 12,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  featuresContainer: {
    width: width * 0.9,
    marginTop: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(67, 56, 202, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(67, 56, 202, 0.2)',
  },
  featureText: {
    fontSize: 16,
    color: '#4B5563',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: height * 0.8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    maxHeight: height * 0.55,
  },
  tipContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#312E81',
    marginLeft: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  tipText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  tipCardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tipCard: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tipCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#312E81',
    marginTop: 10,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  tipCardText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  gotItButton: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  gotItButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gotItButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});