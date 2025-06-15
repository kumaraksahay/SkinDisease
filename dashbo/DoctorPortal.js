
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const COLORS = {
  PRIMARY: '#2A9D8F',
  SECONDARY: '#264653',
  BACKGROUND: '#F4F1DE',
  TEXT_DARK: '#1D3557',
  TEXT_MEDIUM: '#457B9D',
  TEXT_LIGHT: '#FFFFFF',
  ACCENT_GREEN: '#E9C46A',
  ACCENT_RED: '#E76F51',
  GRAY: '#D3D3D3',
  LIGHT_PURPLE: '#A8DADC',
  CARD_SHADOW: '#0000001A',
};

function DoctorPortal({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [doctorsData, setDoctorsData] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const cacheRef = useRef({ doctors: null, timestamp: null });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const fetchDoctors = useCallback(async (isRefresh = false) => {
    const now = Date.now();
    if (!isRefresh && cacheRef.current.doctors && now - cacheRef.current.timestamp < 5 * 60 * 1000) {
      setDoctorsData(cacheRef.current.doctors);
      setFilteredDoctors(cacheRef.current.doctors);
      setInitialLoad(false);
      setRefreshing(false);
      return;
    }

    try {
      setRefreshing(true);
      let query = firestore().collection('doctors').limit(10);
      if (lastDoc && !isRefresh) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      if (snapshot.empty) {
        setRefreshing(false);
        setInitialLoad(false);
        return;
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      const doctorIds = snapshot.docs.map((doc) => doc.id);
      const doctorsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Batch fetch feedback
      const feedbackPromises = [];
      for (let i = 0; i < doctorIds.length; i += 10) {
        const batchIds = doctorIds.slice(i, i + 10);
        feedbackPromises.push(
          firestore()
            .collection('feedback')
            .where('doctorId', 'in', batchIds)
            .get()
        );
      }

      const feedbackSnapshots = await Promise.all(feedbackPromises);
      const feedbackData = {};
      feedbackSnapshots.forEach((snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!feedbackData[data.doctorId]) {
            feedbackData[data.doctorId] = [];
          }
          feedbackData[data.doctorId].push(data);
        });
      });

      const enrichedDoctors = doctorsList.map((doctor) => {
        const feedback = feedbackData[doctor.id] || [];
        let averageRating = '0.0';
        if (feedback.length > 0) {
          const totalRating = feedback.reduce((sum, item) => sum + (item.rating || 0), 0);
          averageRating = (totalRating / feedback.length).toFixed(1);
        } else {
          averageRating = (Math.random() * (5 - 4) + 4).toFixed(1);
        }

        return {
          ...doctor,
          averageRating,
          consultationFee: doctor.consultationFee || 'N/A',
        };
      });

      const newDoctors = isRefresh ? enrichedDoctors : [...doctorsData, ...enrichedDoctors];
      setDoctorsData(newDoctors);
      setFilteredDoctors(newDoctors);
      cacheRef.current = { doctors: newDoctors, timestamp: now };
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setRefreshing(false);
      setInitialLoad(false);
    }
  }, [doctorsData, lastDoc]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!initialLoad) {
        fetchDoctors(true); // Refresh on focus
      }
    });
    return unsubscribe;
  }, [navigation, fetchDoctors, initialLoad]);

  const handleRefresh = () => {
    setLastDoc(null);
    fetchDoctors(true);
  };

  const handleLoadMore = () => {
    if (!refreshing && lastDoc) {
      fetchDoctors();
    }
  };

  const handleDoctorPress = (doctor) => {
    navigation.navigate('DoctorDetail', { doctor });
  };

  const handleBookingPress = (doctor) => {
    navigation.navigate('AppointmentScheduler', { doctor });
  };

  const handleManageSlots = (doctor) => {
    navigation.navigate('ScheduleTime', { doctor });
  };

  const handleSearch = (text) => {
    setSearchText(text);
    filterDoctors(text);
  };

  const filterDoctors = useCallback(
    (text) => {
      let filtered = doctorsData;
      if (text.trim() !== '') {
        filtered = filtered.filter(
          (doctor) =>
            doctor.fullName?.toLowerCase().includes(text.toLowerCase()) ||
            doctor.address?.toLowerCase().includes(text.toLowerCase()) ||
            (doctor.specialization && doctor.specialization.toLowerCase().includes(text.toLowerCase()))
        );
      }
      setFilteredDoctors(filtered);
    },
    [doctorsData]
  );

  const filteredDoctorsMemo = useMemo(() => filteredDoctors, [filteredDoctors]);

  const isCurrentDoctor = (doctorId) => {
    const currentUser = auth().currentUser;
    return currentUser && currentUser.uid === doctorId;
  };

  const formatFee = (fee) => {
    return fee && fee !== 'N/A' ? `Rs.${fee}` : 'N/A';
  };

  const renderStars = (rating) => {
    const numericRating = parseFloat(rating) || 0;
    const stars = [];
    const fullStars = Math.floor(numericRating);
    const halfStar = numericRating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FontAwesome5 key={i} name="star" size={14} color={COLORS.ACCENT_GREEN} style={{ marginRight: 3 }} />);
      } else if (i === fullStars && halfStar) {
        stars.push(<FontAwesome5 key={i} name="star-half-alt" size={14} color={COLORS.ACCENT_GREEN} style={{ marginRight: 3 }} />);
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
            <Text style={styles.welcomeText}>All Doctors</Text>
            <Text style={styles.welcomeSubtext}>Explore all available specialists</Text>
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
      <Animated.FlatList
        data={filteredDoctorsMemo}
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
          <Animated.View
            style={[
              styles.cardContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity style={styles.doctorCard} onPress={() => handleDoctorPress(item)} activeOpacity={0.9}>
              <LinearGradient
                colors={[COLORS.LIGHT_PURPLE, COLORS.BACKGROUND]}
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
                    {item.specialization && <Text style={styles.specialtyText}>{item.specialization}</Text>}
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
                      <Text style={styles.detailBoxText}>{formatFee(item.consultationFee)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionButtonsContainer}>
                  {isCurrentDoctor(item.id) ? (
                    <TouchableOpacity style={styles.manageSlotsButton} onPress={() => handleManageSlots(item)}>
                      <Ionicons name="calendar-outline" size={16} color={COLORS.TEXT_LIGHT} />
                      <Text style={styles.buttonText}>Manage Slots</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.bookAppointmentButton} onPress={() => handleBookingPress(item)}>
                      <Ionicons name="calendar-outline" size={16} color={COLORS.TEXT_LIGHT} />
                      <Text style={styles.buttonText}>Book Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
        ListEmptyComponent={
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Image
              source={require('../src/assets/doctor.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>{searchText ? 'No Matches Found' : 'No Doctors Available'}</Text>
            <Text style={styles.emptyText}>
              {searchText ? 'Try adjusting your search' : 'Check back soon or refresh!'}
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Ionicons name="refresh" size={16} color={COLORS.TEXT_LIGHT} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </Animated.View>
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
    letterSpacing: 0.5,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.TEXT_LIGHT,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80,
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 6,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  doctorCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
  },
  doctorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.TEXT_LIGHT,
  },
  doctorImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.LIGHT_PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.TEXT_LIGHT,
  },
  doctorHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 2,
  },
  specialtyText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.TEXT_MEDIUM,
    marginLeft: 4,
    fontWeight: '500',
  },
  doctorDetails: {
    marginTop: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.TEXT_MEDIUM,
    marginLeft: 8,
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
    backgroundColor: COLORS.LIGHT_PURPLE,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  detailBoxText: {
    fontSize: 12,
    color: COLORS.TEXT_DARK,
    marginLeft: 6,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    marginTop: 12,
  },
  bookAppointmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    borderRadius: 10,
  },
  manageSlotsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SECONDARY,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: COLORS.TEXT_LIGHT,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_MEDIUM,
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 4,
  },
  refreshButtonText: {
    color: COLORS.TEXT_LIGHT,
    marginLeft: 6,
    fontWeight: '600',
  },
});

export default DoctorPortal;