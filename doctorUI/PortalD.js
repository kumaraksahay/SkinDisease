import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  StatusBar,
  Animated,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debounce from 'lodash.debounce';

const { width } = Dimensions.get('window');

// Updated Color Constants
const COLORS = {
  PRIMARY: '#4A90E2',       // Vibrant Blue
  SECONDARY: '#1E3A8A',     // Deep Navy
  BACKGROUND: '#F9FAFB',    // Soft White
  TEXT_DARK: '#111827',     // Rich Black
  TEXT_MEDIUM: '#6B7280',   // Cool Gray
  TEXT_LIGHT: '#FFFFFF',    // Pure White
  ACCENT_PURPLE: '#A855F7', // Bright Purple
  ACCENT_GREEN: '#34D399',  // Emerald Green
  GRAY: '#E5E7EB',          // Light Gray
  LIGHT_BLUE: '#BFDBFE',    // Pale Blue
  CARD_SHADOW: '#00000029', // Subtle Shadow
  ERROR_RED: '#EF4444',     // Alert Red
};

// Memoized Doctor Card Component
const DoctorCard = React.memo(({ item, onPress, onSetAvailable, renderStars, formatFee, isCurrentDoctor }) => (
  <Animated.View style={[styles.cardContainer, { opacity: 1 }]}>
    <TouchableOpacity style={styles.doctorCard} onPress={() => onPress(item)} activeOpacity= {0.9}>
      <LinearGradient
        colors={[COLORS.LIGHT_BLUE, COLORS.BACKGROUND]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.doctorCardHeader}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.doctorImage} />
          ) : (
            <View style={styles.doctorImagePlaceholder}>
              <FontAwesome5 name="user-md" size={28} color={COLORS.PRIMARY} />
            </View>
          )}
          <View style={styles.doctorHeaderInfo}>
            <Text style={styles.doctorName}>Dr. {item.fullName}</Text>
            {item.specialization && (
              <Text style={styles.specialtyText}>{item.specialization}</Text>
            )}
            {renderStars(item.averageRating)}
          </View>
        </View>
        <View style={styles.doctorDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.address || 'Location not specified'}
            </Text>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detailBox}>
              <MaterialCommunityIcons name="certificate-outline" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.detailBoxText}>
                {item.experienceYears ? `${item.experienceYears} Yrs` : 'N/A'}
              </Text>
            </View>
            <View style={styles.detailBox}>
              <Ionicons name="cash-outline" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.detailBoxText}>
                {formatFee(item.consultationFee)}
              </Text>
            </View>
          </View>
        </View>
        {isCurrentDoctor(item.id) && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.availableButton}
              onPress={() => onSetAvailable(item)}
            >
              <Ionicons name="calendar-outline" size={16} color={COLORS.TEXT_LIGHT} />
              <Text style={styles.buttonText}>Set Available</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
));

const DoctorPortal = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [doctorsData, setDoctorsData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [cache, setCache] = useState({ doctors: [] });
  const [isFetching, setIsFetching] = useState(false);
  const [lastSnapshotHash, setLastSnapshotHash] = useState('');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Set current user ID
  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
  }, []);

  // Load cached data
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem('doctorsCache');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          setCache(parsedCache);
          setDoctorsData(parsedCache.doctors || []);
          setInitialLoad(false);
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      }
    };
    loadCachedData();
  }, []);

  // Save cache to AsyncStorage
  const saveCache = async (newCache) => {
    try {
      await AsyncStorage.setItem('doctorsCache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  };

  // Fetch doctors and feedback
  const fetchDoctors = useCallback(async () => {
    if (isFetching) return;
    setIsFetching(true);

    try {
      setRefreshing(true);
      const newCache = { ...cache };

      // Fetch all doctors
      const doctorSnapshot = await firestore().collection('doctors').get();
      const doctorIds = doctorSnapshot.docs.map((doc) => doc.id);
      const doctorsList = doctorSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        consultationFee: doc.data().consultationFee || 'N/A',
      }));

      // Batch fetch feedback for all doctors
      let feedbackData = [];
      if (doctorIds.length > 0) {
        const chunks = [];
        for (let i = 0; i < doctorIds.length; i += 10) {
          chunks.push(doctorIds.slice(i, i + 10));
        }

        for (const chunk of chunks) {
          const feedbackSnapshot = await firestore()
            .collection('feedback')
            .where('doctorId', 'in', chunk)
            .get();
          feedbackData = [
            ...feedbackData,
            ...feedbackSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          ];
        }
      }

      // Calculate average ratings
      const doctorsWithRatings = doctorsList.map((doctor) => {
        const doctorFeedback = feedbackData.filter((fb) => fb.doctorId === doctor.id);
        let averageRating = '0.0';
        if (doctorFeedback.length > 0) {
          const totalRating = doctorFeedback.reduce((sum, item) => sum + (item.rating || 0), 0);
          averageRating = (totalRating / doctorFeedback.length).toFixed(1);
        } else {
          averageRating = (Math.random() * (5 - 4) + 4).toFixed(1); // Random fallback
        }
        return { ...doctor, averageRating };
      });

      // Only update state if data has changed
      const currentDataString = JSON.stringify(doctorsData);
      const newDataString = JSON.stringify(doctorsWithRatings);
      if (currentDataString !== newDataString) {
        newCache.doctors = doctorsWithRatings;
        setDoctorsData(doctorsWithRatings);
        setCache(newCache);
        saveCache(newCache);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setRefreshing(false);
      setInitialLoad(false);
      setIsFetching(false);
    }
  }, [cache, isFetching, doctorsData]);

  // Firestore subscription with debounced updates
  useEffect(() => {
    if (initialLoad) {
      fetchDoctors();
    }

    const debouncedFetch = debounce((snapshot) => {
      // Create a hash of the snapshot to detect changes
      const snapshotHash = snapshot.docs
        .map((doc) => `${doc.id}:${JSON.stringify(doc.data())}`)
        .sort()
        .join('|');
      if (snapshotHash !== lastSnapshotHash) {
        setLastSnapshotHash(snapshotHash);
        fetchDoctors();
      }
    }, 1500);

    const unsubscribe = firestore()
      .collection('doctors')
      .onSnapshot(
        (snapshot) => debouncedFetch(snapshot),
        (error) => console.error('Doctors listener error:', error)
      );

    return () => {
      debouncedFetch.cancel();
      unsubscribe();
    };
  }, [fetchDoctors, initialLoad, lastSnapshotHash]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((text) => {
      setSearchText(text);
    }, 300),
    []
  );

  // Handle search input
  const handleSearch = (text) => {
    debouncedSearch(text);
  };

  // Memoized filtered doctors
  const filteredDoctors = useMemo(() => {
    if (!searchText.trim()) return doctorsData;
    return doctorsData.filter((doctor) =>
      (
        doctor.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        doctor.address?.toLowerCase().includes(searchText.toLowerCase()) ||
        (doctor.specialization && doctor.specialization.toLowerCase().includes(searchText.toLowerCase()))
      )
    );
  }, [doctorsData, searchText]);

  // Handlers
  const handleRefresh = useCallback(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleDoctorPress = useCallback(
    (doctor) => {
      navigation.navigate('DoctorView', { doctor });
    },
    [navigation]
  );

  const handleSetAvailable = useCallback(
    (doctor) => {
      navigation.navigate('ScheduleTime', { doctor });
    },
    [navigation]
  );

  const isCurrentDoctor = useCallback((doctorId) => currentUserId === doctorId, [currentUserId]);

  const formatFee = useCallback((fee) => (fee && fee !== 'N/A' ? `Rs.${fee}` : 'N/A'), []);

  // Memoized renderStars function
  const renderStars = useMemo(() => {
    return (rating) => {
      const numericRating = parseFloat(rating) || 0;
      const stars = [];
      const fullStars = Math.floor(numericRating);
      const halfStar = numericRating - fullStars >= 0.5;

      for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
          stars.push(<FontAwesome5 key={i} name="star" size={14} color={COLORS.ACCENT_GREEN} style={{ marginRight: 3 }} solid />);
        } else if (i === fullStars && halfStar) {
          stars.push(<FontAwesome5 key={i} name="star-half-alt" size={14} color={COLORS.ACCENT_GREEN} style={{ marginRight: 3 }} solid />);
        } else {
          stars.push(<FontAwesome5 key={i} name="star" size={14} color={COLORS.GRAY} style={{ marginRight: 3 }} />);
        }
      }

      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {stars}
          <Text style={styles.ratingText}>{numericRating.toFixed(1)}</Text>
        </View>
      );
    };
  }, []);

  // Loading state
  if (initialLoad && !doctorsData.length) {
    return (
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        style={styles.loadingContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color={COLORS.TEXT_LIGHT} />
        <Text style={styles.loadingText}>Loading Doctors...</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.TEXT_LIGHT} />
          </TouchableOpacity>
          <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
            <Text style={styles.welcomeText}>Find a Doctor</Text>
            <Text style={styles.welcomeSubtext}>Connect with top specialists</Text>
          </Animated.View>
        </View>
        <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
          <Ionicons name="search" size={20} color={COLORS.TEXT_MEDIUM} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors or specialties..."
            placeholderTextColor={COLORS.TEXT_MEDIUM}
            value={searchText}
            onChangeText={handleSearch}
          />
        </Animated.View>
      </LinearGradient>
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.PRIMARY}
            colors={[COLORS.PRIMARY]}
          />
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <DoctorCard
            item={item}
            onPress={handleDoctorPress}
            onSetAvailable={handleSetAvailable}
            renderStars={renderStars}
            formatFee={formatFee}
            isCurrentDoctor={isCurrentDoctor}
          />
        )}
        ListEmptyComponent={
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Image
              source={require('../src/assets/doctor.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>
              {searchText ? 'No Matches Found' : 'No Doctors Available'}
            </Text>
            <Text style={styles.emptyText}>
              {searchText ? 'Try adjusting your search' : 'Check back soon or refresh!'}
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Ionicons name="refresh" size={16} color={COLORS.TEXT_LIGHT} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </Animated.View>
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 15,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.TEXT_LIGHT,
    letterSpacing: 0.3,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.TEXT_LIGHT,
    borderRadius: 15,
    padding: 12,
    marginHorizontal: 20,
    alignItems: 'center',
    elevation: 6,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 20,
    elevation: 8,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  doctorCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  doctorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: COLORS.TEXT_LIGHT,
  },
  doctorImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.LIGHT_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.TEXT_LIGHT,
  },
  doctorHeaderInfo: {
    flex: 1,
    marginLeft: 15,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 15,
    color: COLORS.ACCENT_PURPLE,
    fontWeight: '600',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 13,
    color: COLORS.TEXT_MEDIUM,
    marginLeft: 6,
    fontWeight: '600',
  },
  doctorDetails: {
    marginTop: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: COLORS.TEXT_MEDIUM,
    marginLeft: 10,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.LIGHT_BLUE,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginRight: 10,
  },
  detailBoxText: {
    fontSize: 13,
    color: COLORS.TEXT_DARK,
    marginLeft: 8,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    marginTop: 15,
  },
  availableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ACCENT_GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: COLORS.TEXT_LIGHT,
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    padding: 30,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: 25,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_MEDIUM,
    marginBottom: 25,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    elevation: 6,
  },
  refreshButtonText: {
    color: COLORS.TEXT_LIGHT,
    marginLeft: 8,
    fontWeight: '700',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 18,
    marginTop: 12,
    fontWeight: '600',
  },
});

export default DoctorPortal;