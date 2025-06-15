import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const { width, height } = Dimensions.get('window');
const SPACING = 20;
const AVATAR_SIZE = 160;

const COLORS = {
  PRIMARY: '#2A9D8F',
  SECONDARY: '#264653',
  BACKGROUND: '#F4F1DE',
  TEXT_DARK: '#1D3557',
  TEXT_MEDIUM: '#457B9D',
  TEXT_LIGHT: '#FFFFFF',
  ACCENT_GREEN: '#E9C46A',
  ACCENT_RED: '#E76F51',
  ACCENT_YELLOW: '#E9C46A',
  GRAY: '#D3D3D3',
  CARD_SHADOW: '#0000001A',
  ACCENT_GRAY: '#A9A9A9',
};

const DoctorDetail = ({ route }) => {
  const { doctor } = route.params || {};
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [doctorFees, setDoctorFees] = useState(doctor?.consultationFee || '1000');
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [completedAppointments, setCompletedAppointments] = useState(0);
  const [weeklyAvailability, setWeeklyAvailability] = useState({});
  const [isDoctor, setIsDoctor] = useState(false);
  const navigation = useNavigation();

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [1.2, 1, 0.8],
    extrapolate: 'clamp',
  });

  const fetchDoctorFees = useCallback(async (doctorId) => {
    try {
      const docSnapshot = await firestore().collection('doctors').doc(doctorId).get();
      if (docSnapshot.exists) {
        const doctorData = docSnapshot.data();
        setDoctorFees(doctorData.consultationFee || '1000');
      } else {
        setDoctorFees('1000');
      }
    } catch (error) {
      console.error('Error fetching doctor fees:', error);
      Alert.alert('Error', 'Failed to fetch consultation fees.');
    }
  }, []);

  const fetchFeedback = useCallback(async (doctorId) => {
    try {
      const feedbackSnapshot = await firestore()
        .collection('feedback')
        .where('doctorId', '==', doctorId)
        .get();
      const feedbackData = feedbackSnapshot.docs.map((doc) => doc.data());
      if (feedbackData.length > 0) {
        const totalRating = feedbackData.reduce((sum, item) => sum + item.rating, 0);
        setAverageRating((totalRating / feedbackData.length).toFixed(1));
        setReviewCount(feedbackData.length);
      } else {
        setAverageRating(0);
        setReviewCount(0);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      Alert.alert('Error', 'Failed to fetch feedback.');
    }
  }, []);

  const fetchAppointments = useCallback(async (doctorId) => {
    try {
      const appointmentsSnapshot = await firestore()
        .collection('appointments')
        .where('doctorId', '==', doctorId)
        .where('status', '==', 'Completed')
        .get();
      setCompletedAppointments(appointmentsSnapshot.docs.length);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to fetch appointments.');
    }
  }, []);

  const fetchWeeklyAvailability = useCallback(async (doctorId) => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const availabilitySnapshot = await firestore()
        .collection('doctors')
        .doc(doctorId)
        .collection('availability')
        .where('weekStart', '==', startOfWeek.toDateString())
        .get();

      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      let availabilityData = {};

      daysOfWeek.forEach((day) => {
        availabilityData[day] = { status: 'Not Available', slots: [] };
      });

      if (!availabilitySnapshot.empty) {
        const docData = availabilitySnapshot.docs[0].data();
        daysOfWeek.forEach((day) => {
          availabilityData[day] = {
            status: docData[day]?.status || 'Not Available',
            slots: docData[day]?.slots || [],
          };
        });
      }

      setWeeklyAvailability(availabilityData);
    } catch (error) {
      console.error('Error fetching availability:', error);
      Alert.alert('Error', 'Failed to fetch availability.');
    }
  }, []);

  useEffect(() => {
    const doctorId = doctor?.id || doctor?.uid;
    if (!doctorId) {
      Alert.alert('Error', 'Doctor information is missing.');
      navigation.goBack();
      return;
    }

    const currentUser = auth().currentUser;
    setIsDoctor(currentUser && currentUser.uid === doctorId);

    fetchDoctorFees(doctorId);
    fetchFeedback(doctorId);
    fetchAppointments(doctorId);
    fetchWeeklyAvailability(doctorId);

    const unsubscribeFees = firestore()
      .collection('doctors')
      .doc(doctorId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const doctorData = doc.data();
          setDoctorFees(doctorData.consultationFee || '1000');
        }
      }, (error) => {
        console.error('Fees listener error:', error);
      });

    const unsubscribeAvailability = firestore()
      .collection('doctors')
      .doc(doctorId)
      .collection('availability')
      .onSnapshot(() => fetchWeeklyAvailability(doctorId), (error) => {
        console.error('Availability listener error:', error);
      });

    return () => {
      unsubscribeFees();
      unsubscribeAvailability();
    };
  }, [doctor, fetchDoctorFees, fetchFeedback, fetchAppointments, fetchWeeklyAvailability]);

  const handleSubmitFeedback = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Login Required', 'Please log in to submit feedback.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    if (rating === 0 || feedback.trim() === '') {
      Alert.alert('Error', 'Please provide both rating and feedback.');
      return;
    }

    try {
      await firestore().collection('feedback').add({
        doctorId: doctor.id || doctor.uid,
        rating: Number(rating),
        comment: feedback,
        timestamp: firestore.FieldValue.serverTimestamp(),
        userId: currentUser.uid,
      });

      fetchFeedback(doctor.id || doctor.uid);
      Alert.alert('Success', 'Feedback submitted successfully.');
      setFeedback('');
      setRating(0);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback.');
    }
  };

  const handleBookAppointment = () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Login Required', 'Please log in to book an appointment.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    navigation.navigate('AppointmentScheduler', {
      doctor: { ...doctor, consultationFee: doctorFees, uid: doctor.id || doctor.uid },
    });
  };

  const handleChatNavigation = () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Login Required', 'Please log in to start a chat.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    navigation.navigate('ChatWrite', {
      doctor: { uid: doctor.id || doctor.uid, fullName: doctor.fullName },
      userId: currentUser.uid,
    });
  };

  const cycleAvailability = async (day) => {
    if (!isDoctor) return;

    const currentStatus = weeklyAvailability[day].status;
    const nextStatus =
      currentStatus === 'Available'
        ? 'Not Available'
        : currentStatus === 'Not Available'
        ? 'Closed'
        : 'Available';

    const newAvailability = {
      ...weeklyAvailability,
      [day]: {
        ...weeklyAvailability[day],
        status: nextStatus,
        slots: nextStatus === 'Available' ? weeklyAvailability[day].slots : [],
      },
    };
    setWeeklyAvailability(newAvailability);

    try {
      const doctorId = doctor.id || doctor.uid;
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      await firestore()
        .collection('doctors')
        .doc(doctorId)
        .collection('availability')
        .doc(startOfWeek.toDateString())
        .set({ weekStart: startOfWeek.toDateString(), ...newAvailability }, { merge: true });
    } catch (error) {
      console.error('Error updating availability:', error);
      Alert.alert('Error', 'Failed to update availability.');
    }
  };

  const addSlot = async (day, slotTime) => {
    if (!isDoctor || !slotTime || weeklyAvailability[day].status !== 'Available') return;

    const newSlots = [...weeklyAvailability[day].slots, slotTime];
    const newAvailability = {
      ...weeklyAvailability,
      [day]: { ...weeklyAvailability[day], slots: newSlots },
    };
    setWeeklyAvailability(newAvailability);

    try {
      const doctorId = doctor.id || doctor.uid;
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      await firestore()
        .collection('doctors')
        .doc(doctorId)
        .collection('availability')
        .doc(startOfWeek.toDateString())
        .set({ weekStart: startOfWeek.toDateString(), ...newAvailability }, { merge: true });
    } catch (error) {
      console.error('Error adding slot:', error);
      Alert.alert('Error', 'Failed to add slot.');
    }
  };

  const removeSlot = async (day, slotIndex) => {
    if (!isDoctor || weeklyAvailability[day].status !== 'Available') return;

    const newSlots = weeklyAvailability[day].slots.filter((_, index) => index !== slotIndex);
    const newAvailability = {
      ...weeklyAvailability,
      [day]: { ...weeklyAvailability[day], slots: newSlots },
    };
    setWeeklyAvailability(newAvailability);

    try {
      const doctorId = doctor.id || doctor.uid;
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      await firestore()
        .collection('doctors')
        .doc(doctorId)
        .collection('availability')
        .doc(startOfWeek.toDateString())
        .set({ weekStart: startOfWeek.toDateString(), ...newAvailability }, { merge: true });
    } catch (error) {
      console.error('Error removing slot:', error);
      Alert.alert('Error', 'Failed to remove slot.');
    }
  };

  const renderStars = () => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton}>
          <FontAwesome5
            name="star"
            solid={star <= rating}
            size={28}
            color={star <= rating ? COLORS.ACCENT_YELLOW : COLORS.GRAY}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAverageRatingStars = (avgRating) => (
    <View style={styles.ratingStars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FontAwesome5
          key={star}
          name="star"
          solid={star <= Math.round(avgRating)}
          size={14}
          color={star <= Math.round(avgRating) ? COLORS.ACCENT_YELLOW : COLORS.GRAY}
        />
      ))}
      <Text style={styles.ratingText}>{avgRating}</Text>
    </View>
  );

  const doctorSpecialities = doctor?.specialties || ['Dermatologist'];
  const experienceYears = doctor?.experienceYears || 8;

  if (!doctor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No doctor data provided.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonError}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.TEXT_LIGHT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor Profile</Text>
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart" size={22} color={COLORS.ACCENT_RED} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          />
          <View style={styles.profileImageContainer}>
            <Animated.View style={[styles.imageWrapper, { transform: [{ scale: imageScale }] }]}>
              {doctor?.profilePicture ? (
                <Image source={{ uri: doctor.profilePicture }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <FontAwesome5 name="user-md" size={60} color={COLORS.TEXT_LIGHT} />
                </View>
              )}
            </Animated.View>
            <View style={styles.doctorNameContainer}>
              <Text style={styles.doctorName}>Dr. {doctor?.fullName || 'Unknown'}</Text>
              <View style={styles.specialtyContainer}>
                {doctorSpecialities.map((specialty, index) => (
                  <View key={index} style={styles.specialtyBadge}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.ratingBar}>
                {renderAverageRatingStars(averageRating)}
                <Text style={styles.reviewCount}>({reviewCount} reviews)</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailsRow}>
            <View style={styles.detailCard}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.PRIMARY }]}>
                <FontAwesome5 name="calendar-alt" size={18} color={COLORS.TEXT_LIGHT} />
              </View>
              <Text style={styles.detailLabel}>Experience</Text>
              <Text style={styles.detailValue}>{experienceYears} Years</Text>
            </View>
            <View style={styles.detailCard}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.ACCENT_RED }]}>
                <FontAwesome5 name="user-friends" size={18} color={COLORS.TEXT_LIGHT} />
              </View>
              <Text style={styles.detailLabel}>Patients</Text>
              <Text style={styles.detailValue}>{completedAppointments}</Text>
            </View>
            <View style={styles.detailCard}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.ACCENT_GREEN }]}>
                <MaterialIcons name="attach-money" size={22} color={COLORS.TEXT_LIGHT} />
              </View>
              <Text style={styles.detailLabel}>Fees</Text>
              <Text style={styles.detailValue}>Rs. {doctorFees}</Text>
            </View>
          </View>

          <View style={styles.feesCard}>
            <View style={styles.feesHeader}>
              <Ionicons name="cash-outline" size={22} color={COLORS.PRIMARY} />
              <Text style={styles.feesHeaderTitle}>Consultation Fees</Text>
            </View>
            <View style={styles.feesContent}>
              <View style={styles.feeItem}>
                <Text style={styles.feeLabel}>Standard Consultation</Text>
                <Text style={styles.feeValue}>Rs. {doctorFees}</Text>
              </View>
              <View style={styles.feeItem}>
                <Text style={styles.feeLabel}>Video Consultation</Text>
                <Text style={styles.feeValue}>Rs. {Math.round(parseInt(doctorFees) * 0.8)}</Text>
              </View>
              <View style={styles.feeItem}>
                <Text style={styles.feeLabel}>Follow-up Visit</Text>
                <Text style={styles.feeValue}>Rs. {Math.round(parseInt(doctorFees) * 0.5)}</Text>
              </View>
              <Text style={styles.feesNote}>* Fees may vary based on consultation type</Text>
            </View>
          </View>

          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <FontAwesome5 name="map-marker-alt" size={18} color={COLORS.PRIMARY} />
              <Text style={styles.locationTitle}>Location</Text>
            </View>
            <Text style={styles.locationAddress}>
              {doctor?.address || '123 Medical Center Drive, Healthcare City'}
            </Text>
            <View style={styles.mapPlaceholder}>
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                opacity={0.8}
              />
              <Text style={styles.mapText}>Map View</Text>
              <FontAwesome5 name="map" size={28} color={COLORS.TEXT_LIGHT} />
            </View>
          </View>

          <View style={styles.availabilityCard}>
            <View style={styles.availabilityHeader}>
              <Ionicons name="time-outline" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.availabilityTitle}>Weekly Availability</Text>
            </View>
            <View style={styles.availabilityContent}>
              {Object.keys(weeklyAvailability).map((day) => (
                <View key={day} style={styles.dayRow}>
                  <View style={styles.dayNameContainer}>
                    <Text style={styles.dayName}>{day}</Text>
                    {isDoctor && (
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          weeklyAvailability[day].status === 'Available'
                            ? styles.availableButton
                            : weeklyAvailability[day].status === 'Not Available'
                            ? styles.notAvailableButton
                            : styles.closedButton,
                        ]}
                        onPress={() => cycleAvailability(day)}
                      >
                        <Text style={styles.toggleButtonText}>{weeklyAvailability[day].status}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.timeSlots}>
                    {weeklyAvailability[day].status === 'Available' ? (
                      <>
                        {weeklyAvailability[day].slots.length > 0 ? (
                          weeklyAvailability[day].slots.map((slot, index) => (
                            <View key={index} style={styles.timeSlotContainer}>
                              <Text style={styles.timeText}>{slot}</Text>
                              {isDoctor && (
                                <TouchableOpacity
                                  style={styles.removeSlotButton}
                                  onPress={() => removeSlot(day, index)}
                                >
                                  <Ionicons name="close" size={16} color={COLORS.ACCENT_RED} />
                                </TouchableOpacity>
                              )}
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noSlotsText}>No slots set</Text>
                        )}
                        {isDoctor && (
                          <TextInput
                            style={styles.slotInput}
                            placeholder="Add slot (e.g., 9:00 AM)"
                            placeholderTextColor={COLORS.TEXT_MEDIUM}
                            onSubmitEditing={(e) => addSlot(day, e.nativeEvent.text)}
                          />
                        )}
                      </>
                    ) : (
                      <Text style={styles.noSlotsText}>
                        {weeklyAvailability[day].status === 'Not Available'
                          ? 'Not Available'
                          : 'Closed'}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
              {!isDoctor && (
                <TouchableOpacity
                  style={styles.viewScheduleButton}
                  onPress={handleBookAppointment}
                >
                  <Text style={styles.viewScheduleButtonText}>Book Appointment</Text>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.TEXT_LIGHT} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.ratingSection}>
            <View style={styles.ratingHeaderContainer}>
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ratingHeaderGradient}
              >
                <Text style={styles.ratingLabel}>Rate Your Experience</Text>
              </LinearGradient>
            </View>
            {renderStars()}
            <View style={styles.feedbackContainer}>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Share your experience..."
                placeholderTextColor={COLORS.TEXT_MEDIUM}
                multiline
                numberOfLines={4}
                value={feedback}
                onChangeText={setFeedback}
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFeedback}>
                <LinearGradient
                  colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Submit Feedback</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatButton} onPress={handleChatNavigation}>
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.TEXT_LIGHT} />
        </TouchableOpacity>
        {!isDoctor && (
          <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
            <LinearGradient
              colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookButtonGradient}
            >
              <Text style={styles.bookButtonText}>Book Appointment</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.TEXT_LIGHT} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 80,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: SPACING,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollContainer: {
    paddingBottom: 120,
  },
  heroContainer: {
    height: height * 0.45,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 30,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  profileImageContainer: {
    alignItems: 'center',
  },
  imageWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  profileImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 5,
    borderColor: COLORS.TEXT_LIGHT,
  },
  profilePlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: COLORS.TEXT_LIGHT,
  },
  doctorNameContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  doctorName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  specialtyContainer: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  specialtyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 4,
  },
  specialtyText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 13,
    fontWeight: '500',
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: COLORS.TEXT_LIGHT,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  reviewCount: {
    color: COLORS.TEXT_LIGHT,
    marginLeft: 5,
    fontSize: 12,
  },
  detailsSection: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: SPACING,
    paddingTop: 30,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailCard: {
    width: width * 0.28,
    backgroundColor: COLORS.TEXT_LIGHT,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.TEXT_MEDIUM,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
  },
  feesCard: {
    backgroundColor: COLORS.TEXT_LIGHT,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  feesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  feesHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: COLORS.TEXT_DARK,
  },
  feesContent: {
    padding: 5,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY,
  },
  feeLabel: {
    fontSize: 15,
    color: COLORS.TEXT_MEDIUM,
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  feesNote: {
    fontSize: 12,
    color: COLORS.TEXT_MEDIUM,
    fontStyle: 'italic',
    marginTop: 12,
  },
  locationCard: {
    backgroundColor: COLORS.TEXT_LIGHT,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: COLORS.TEXT_DARK,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.TEXT_MEDIUM,
    lineHeight: 20,
  },
  mapPlaceholder: {
    height: 130,
    marginTop: 15,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapText: {
    color: COLORS.TEXT_LIGHT,
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  availabilityCard: {
    backgroundColor: COLORS.TEXT_LIGHT,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: COLORS.TEXT_DARK,
  },
  availabilityContent: {
    padding: 5,
  },
  dayRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY,
  },
  dayNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  availableButton: {
    backgroundColor: COLORS.ACCENT_GREEN,
  },
  notAvailableButton: {
    backgroundColor: COLORS.ACCENT_RED,
  },
  closedButton: {
    backgroundColor: COLORS.ACCENT_GRAY,
  },
  toggleButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 12,
    fontWeight: '500',
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ACCENT_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
  },
  removeSlotButton: {
    marginLeft: 8,
  },
  slotInput: {
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.GRAY,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: COLORS.TEXT_DARK,
    marginTop: 8,
    backgroundColor: COLORS.BACKGROUND,
  },
  noSlotsText: {
    fontSize: 14,
    color: COLORS.TEXT_MEDIUM,
    fontStyle: 'italic',
  },
  viewScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
  },
  viewScheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    marginRight: 8,
  },
  ratingSection: {
    backgroundColor: COLORS.TEXT_LIGHT,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  ratingHeaderContainer: {
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 20,
  },
  ratingHeaderGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  starButton: {
    padding: 5,
  },
  feedbackContainer: {
    marginTop: 15,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY,
    borderRadius: 12,
    padding: 15,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    color: COLORS.TEXT_DARK,
    backgroundColor: COLORS.BACKGROUND,
  },
  submitButton: {
    marginTop: 15,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.TEXT_LIGHT,
    flexDirection: 'row',
    paddingHorizontal: SPACING,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  bookButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.TEXT_MEDIUM,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonError: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  backButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DoctorDetail;