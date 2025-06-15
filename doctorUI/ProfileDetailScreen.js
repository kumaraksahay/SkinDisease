import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Beautiful color palette for medical/doctor app
const COLORS = {
  primary: '#4A56E2', // Deep indigo
  secondary: '#FF6B6B', // Soft coral
  tertiary: '#45CFD0', // Turquoise
  gradient: ['#4A56E2', '#45CFD0'], // Indigo to turquoise gradient
  accent: '#FF6B6B', // Coral accent
  white: '#FFFFFF',
  text: '#2D3748', // Dark blue-gray
  lightText: '#718096', // Medium gray
  cardBg: 'rgba(255, 255, 255, 0.85)',
  divider: 'rgba(113, 128, 150, 0.2)',
  overlay: 'rgba(45, 55, 72, 0.05)',
  shadow: '#2D3748',
};

const DoctorProfile = ({ navigation }) => {
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cache, setCache] = useState({ doctorData: null });
  const isMounted = useRef(false);
  const initialFetchDone = useRef(false);
  const currentUser = auth().currentUser;

  // Load cached data
  useEffect(() => {
    isMounted.current = true;
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem('doctorProfileCache');
        if (cached && isMounted.current) {
          const parsedCache = JSON.parse(cached);
          setCache(parsedCache);
          if (parsedCache.doctorData) {
            setDoctorData(parsedCache.doctorData);
          }
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    loadCachedData();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Save cache
  const saveCache = async (newCache) => {
    try {
      await AsyncStorage.setItem('doctorProfileCache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  };

  const fetchDoctorData = useCallback(
    async (isRefresh = false) => {
      if (!currentUser || !isMounted.current) return;
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (!cache.doctorData) {
          setLoading(true);
        }

        const doctorDoc = await firestore().collection('doctors').doc(currentUser.uid).get();
        if (!isMounted.current) return;

        let newDoctorData = null;
        if (doctorDoc.exists) {
          newDoctorData = {
            ...doctorDoc.data(),
            email: currentUser.email || 'Not provided',
          };
          setDoctorData(newDoctorData);
        } else {
          Alert.alert('Error', 'Doctor data not found.');
        }

        setCache((prev) => {
          const newCache = { ...prev, doctorData: newDoctorData };
          saveCache(newCache);
          return newCache;
        });
      } catch (error) {
        console.error('Fetch error:', error);
        if (isMounted.current) {
          Alert.alert('Error', 'Failed to fetch doctor data.');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [currentUser?.uid, cache.doctorData]
  );

  useEffect(() => {
    if (!currentUser || initialFetchDone.current) return;

    if (cache.doctorData) {
      setDoctorData(cache.doctorData);
      setLoading(false);
      initialFetchDone.current = true;
    } else {
      initialFetchDone.current = true;
      fetchDoctorData();
    }

    const unsubscribeFirestore = firestore()
      .collection('doctors')
      .doc(currentUser.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists && isMounted.current) {
            const newDoctorData = {
              ...doc.data(),
              email: currentUser.email || 'Not provided',
            };
            setDoctorData(newDoctorData);
            setCache((prev) => {
              const newCache = { ...prev, doctorData: newDoctorData };
              saveCache(newCache);
              return newCache;
            });
          }
        },
        (error) => {
          console.error('Error in doctor listener:', error);
        }
      );

    const unsubscribeNavigation = navigation.addListener('focus', () => {
      if (cache.doctorData && isMounted.current) {
        setDoctorData(cache.doctorData);
        setLoading(false);
      } else if (isMounted.current) {
        fetchDoctorData();
      }
    });

    return () => {
      unsubscribeFirestore();
      unsubscribeNavigation();
    };
  }, [currentUser?.uid, fetchDoctorData, cache.doctorData, navigation]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    if (!refreshing) {
      fetchDoctorData(true);
    }
  }, [refreshing, fetchDoctorData]);

  const renderDetailItem = (icon, label, value) => {
    return (
      <View style={styles.detailItem}>
        <LinearGradient
          colors={COLORS.gradient}
          style={styles.detailIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name={icon} size={22} color={COLORS.white} />
        </LinearGradient>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
        </View>
      </View>
    );
  };

  if (loading && !cache.doctorData) {
    return (
      <LinearGradient colors={COLORS.gradient} style={styles.gradientContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!doctorData) {
    return (
      <LinearGradient colors={COLORS.gradient} style={styles.gradientContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <SafeAreaView style={styles.centerContainer}>
          <Icon name="error-outline" size={60} color={COLORS.white} />
          <Text style={styles.noDataText}>No Profile Data Found</Text>
          <TouchableOpacity
            style={styles.createProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.createProfileButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.gradient} style={styles.gradientContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.title}>My Profile</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Icon name="refresh" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              {doctorData.profilePicture ? (
                <Image source={{ uri: doctorData.profilePicture }} style={styles.profileImage} />
              ) : (
                <LinearGradient
                  colors={COLORS.gradient}
                  style={styles.profilePlaceholder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="person" size={60} color={COLORS.white} />
                </LinearGradient>
              )}
              <View style={styles.badgeContainer}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E8E']}
                  style={styles.verifiedBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="verified" size={18} color={COLORS.white} />
                </LinearGradient>
              </View>
            </View>

            <View style={styles.nameContainer}>
              <Text style={styles.doctorName}>{doctorData.fullName || 'Doctor'}</Text>
              {doctorData.degree && (
                <Text style={styles.doctorDegree}>{doctorData.degree}</Text>
              )}
            </View>

            {doctorData.specialization && (
              <LinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                style={styles.specializationContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.specializationText}>{doctorData.specialization}</Text>
              </LinearGradient>
            )}

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['rgba(74, 86, 226, 0.2)', 'rgba(74, 86, 226, 0.1)']}
                  style={styles.statBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="star" size={20} color={COLORS.primary} style={styles.statIcon} />
                  <Text style={styles.statValue}>{doctorData.experienceYears || '0'}</Text>
                  <Text style={styles.statLabel}>Years Exp.</Text>
                </LinearGradient>
              </View>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['rgba(69, 207, 208, 0.2)', 'rgba(69, 207, 208, 0.1)']}
                  style={styles.statBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="translate" size={20} color={COLORS.tertiary} style={styles.statIcon} />
                  <Text style={styles.statValue}>{doctorData.languages || 'English'}</Text>
                  <Text style={styles.statLabel}>Languages</Text>
                </LinearGradient>
              </View>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['rgba(255, 107, 107, 0.2)', 'rgba(255, 107, 107, 0.1)']}
                  style={styles.statBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="payment" size={20} color={COLORS.accent} style={styles.statIcon} />
                  <Text style={styles.statValue}>Rs.{doctorData.consultationFee || '0'}</Text>
                  <Text style={styles.statLabel}>Consultation</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="person-outline" size={22} color={COLORS.white} />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            <View style={styles.detailsCard}>
              {renderDetailItem('mail', 'Email', doctorData.email)}
              {renderDetailItem('cake', 'Age', doctorData.age)}
              {renderDetailItem('location-on', 'Address', doctorData.address)}
              {renderDetailItem('work', 'Experience', `${doctorData.experienceYears || '0'} years`)}
              {renderDetailItem('school', 'Qualification', doctorData.degree)}
              {doctorData.languages && renderDetailItem('language', 'Languages', doctorData.languages)}
              {doctorData.consultationFee &&
                renderDetailItem('attach-money', 'Consultation Fee', `Rs.${doctorData.consultationFee}`)}
            </View>
          </View>

          {/* Bottom Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#45CFD0', '#4ADEDE']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="share" size={20} color={COLORS.white} />
                <Text style={styles.buttonText}>Share Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="edit" size={20} color={COLORS.white} />
                <Text style={styles.buttonText}>Edit Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  profileImageContainer: {
    position: 'relative',
    borderRadius: 75,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 15,
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  profilePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 0,
    right: 5,
  },
  verifiedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  doctorName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  doctorDegree: {
    fontSize: 16,
    color: COLORS.lightText,
    marginTop: 4,
  },
  specializationContainer: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 20,
  },
  specializationText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  statItem: {
    flex: 1,
    marginHorizontal: 5,
  },
  statBg: {
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    height: 100,
    justifyContent: 'center',
  },
  statIcon: {
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightText,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 8,
  },
  detailsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  detailIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    height: 50,
    marginHorizontal: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: 15,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 18,
    marginTop: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  createProfileButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  createProfileButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DoctorProfile;