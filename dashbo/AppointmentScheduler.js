import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Modal,
  TextInput,
  StatusBar,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Updated Color Constants
const COLORS = {
  PRIMARY: '#2A9D8F',      // Teal
  SECONDARY: '#264653',    // Dark Teal
  BACKGROUND: '#F4F1DE',   // Light Cream
  TEXT_DARK: '#1D3557',   // Dark Blue
  TEXT_MEDIUM: '#457B9D', // Medium Blue
  TEXT_LIGHT: '#FFFFFF',  // White
  ACCENT_GREEN: '#E9C46A', // Soft Yellow
  ACCENT_RED: '#E76F51',  // Coral
  GRAY: '#D3D3D3'         // Light Gray
};

// Enhanced Modal Component with Animation
const PatientDetailsModal = ({ isVisible, onClose, onSubmit, userName: initialUserName, userEmail }) => {
  const [userName, setUserName] = useState(initialUserName || '');
  const [age, setAge] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const handleSubmit = () => {
    if (!userName.trim()) {
      Alert.alert('Error', 'Please enter patient name');
      return;
    }
    if (!age.trim() || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }
    if (!mobileNumber.trim() || !/^\d{11}$/.test(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 11-digit mobile number');
      return;
    }

    onSubmit({
      userName,
      userEmail,
      age: Number(age),
      mobileNumber
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={[COLORS.TEXT_LIGHT, COLORS.BACKGROUND]}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Patient Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={28} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color={COLORS.PRIMARY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Patient Name"
              placeholderTextColor={COLORS.TEXT_MEDIUM}
              value={userName}
              onChangeText={setUserName}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="calendar" size={20} color={COLORS.PRIMARY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor={COLORS.TEXT_MEDIUM}
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="call" size={20} color={COLORS.PRIMARY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor={COLORS.TEXT_MEDIUM}
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]} 
              onPress={handleSubmit}
            >
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

// Enhanced Status Popup with Animation
const StatusPopup = ({ visible, message, onClose }) => (
  <Modal
    transparent={true}
    visible={visible}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.statusModalContainer}>
      <View style={styles.statusModalContent}>
        <View style={styles.statusIconContainer}>
          <Ionicons name="alert-circle" size={50} color={COLORS.ACCENT_GREEN} />
        </View>
        <Text style={styles.statusModalText}>{message}</Text>
        <TouchableOpacity 
          style={styles.statusModalButton}
          onPress={onClose}
        >
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            style={styles.gradientStatusButton}
          >
            <Text style={styles.statusModalButtonText}>OK</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

function AppointmentScheduler({ route, navigation }) {
  const { doctor } = route.params;
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [next30Days, setNext30Days] = useState([]);
  const [slotStatuses, setSlotStatuses] = useState({});
  const [isPatientDetailsModalVisible, setPatientDetailsModalVisible] = useState(false);
  const [statusPopupVisible, setStatusPopupVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const generateDateRange = useCallback(() => {
    const days = [];
    let currentDate = new Date();
    for (let i = 0; i < 30; i++) {
      const dayOfWeek = currentDate.toLocaleString('default', { weekday: 'short' });
      const dayOfMonth = currentDate.getDate();
      const monthName = currentDate.toLocaleString('default', { month: 'short' });
      days.push({ 
        dayOfWeek, 
        dayOfMonth,
        monthName,
        fullDate: new Date(currentDate),
        isSelected: i === 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  }, []);

  const fetchFeedbackData = useCallback(async () => {
    try {
      const feedbackSnapshot = await firestore()
        .collection('feedback')
        .where('doctorId', '==', doctor.id)
        .get();

      const feedbackData = feedbackSnapshot.docs.map((doc) => doc.data());
      if (feedbackData.length > 0) {
        const totalRating = feedbackData.reduce((sum, item) => sum + item.rating, 0);
        const avg = (totalRating / feedbackData.length).toFixed(1);
        setAverageRating(avg);
        setReviewCount(feedbackData.length);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  }, [doctor.id]);

  useEffect(() => {
    const fetchUserAndDoctorData = async () => {
      const currentUser = auth().currentUser;
      if (currentUser) {
        try {
          const userDoc = await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setUserName(userData.username || currentUser.email.split('@')[0]);
            setUserEmail(currentUser.email);
            setUserProfileImage(userData.profileImage || null);
          } else {
            setUserName(currentUser.email.split('@')[0]);
            setUserEmail(currentUser.email);
          }

          const doctorDoc = await firestore()
            .collection('doctors')
            .doc(doctor.id)
            .get();
          if (doctorDoc.exists) {
            setProfilePicture(doctorDoc.data().profilePicture || null);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchUserAndDoctorData();
    fetchFeedbackData();
    setNext30Days(generateDateRange());
    setSelectedDate(new Date());
  }, [generateDateRange, fetchFeedbackData]);

  const fetchAvailableSlots = useCallback(async (date) => {
    try {
      const slotsSnapshot = await firestore()
        .collection('doctors')
        .doc(doctor.id)
        .collection('slots')
        .where('date', '==', date.toDateString())
        .get();

      let slots = slotsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const appointmentsSnapshot = await firestore()
        .collection('appointments')
        .where('doctorId', '==', doctor.id)
        .where('date', '==', date.toDateString())
        .get();
      
      const appointments = appointmentsSnapshot.docs.map(doc => doc.data());
      
      const statusMap = {};
      slots.forEach(slot => {
        statusMap[slot.time] = slot.status || 'available';
      });
      
      appointments.forEach(appointment => {
        if (appointment.status === 'Confirmed' || appointment.status === 'Completed') {
          statusMap[appointment.time] = 'booked';
        } else if (appointment.status === 'Pending') {
          statusMap[appointment.time] = 'pending';
        }
      });
      
      setSlotStatuses(statusMap);
      return slots;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  }, [doctor.id]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate).then(slots => setAvailableSlots(slots));
    }
  }, [selectedDate, fetchAvailableSlots]);

  useEffect(() => {
    if (!selectedDate) return;
    
    const appointmentsUnsubscribe = firestore()
      .collection('appointments')
      .where('doctorId', '==', doctor.id)
      .where('date', '==', selectedDate.toDateString())
      .onSnapshot(snapshot => {
        const changes = snapshot.docChanges();
        if (changes.length > 0) {
          fetchAvailableSlots(selectedDate).then(slots => setAvailableSlots(slots));
        }
      });
    
    return () => appointmentsUnsubscribe();
  }, [selectedDate, doctor.id, fetchAvailableSlots]);

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Error', 'Please select a date and time.');
      return;
    }
    
    const currentStatus = slotStatuses[selectedTime];
    if (currentStatus === 'booked') {
      setStatusMessage('This slot has already been booked. Please select another time.');
      setStatusPopupVisible(true);
      return;
    }
    if (currentStatus === 'pending') {
      setStatusMessage('This slot has a pending request. Please select another time.');
      setStatusPopupVisible(true);
      return;
    }
    
    setPatientDetailsModalVisible(true);
  };

  const handlePatientDetailsSubmit = async (details) => {
    setPatientDetailsModalVisible(false);
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to book an appointment.');
        return;
      }
      
      const statusCheck = await firestore()
        .collection('appointments')
        .where('doctorId', '==', doctor.id)
        .where('date', '==', selectedDate.toDateString())
        .where('time', '==', selectedTime)
        .get();
      
      if (!statusCheck.empty) {
        const existingAppointments = statusCheck.docs.map(doc => doc.data());
        const bookedAppointment = existingAppointments.find(apt => 
          apt.status === 'Confirmed' || apt.status === 'Completed');
        
        if (bookedAppointment) {
          setStatusMessage('This slot has just been booked. Please select another time.');
          setStatusPopupVisible(true);
          fetchAvailableSlots(selectedDate);
          return;
        }
        
        const pendingAppointment = existingAppointments.find(apt => apt.status === 'Pending');
        if (pendingAppointment) {
          setStatusMessage('This slot already has a pending request. Please select another time.');
          setStatusPopupVisible(true);
          fetchAvailableSlots(selectedDate);
          return;
        }
      }

      const appointmentData = {
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        userId: currentUser.uid,
        userName: details.userName,
        userEmail: details.userEmail,
        userProfileImage: userProfileImage,
        userAge: details.age,
        userMobile: details.mobileNumber,
        date: selectedDate.toDateString(),
        time: selectedTime,
        status: 'Pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      const appointmentRef = await firestore().collection('appointments').add(appointmentData);
      
      await firestore()
        .collection('doctors')
        .doc(doctor.id)
        .collection('notifications')
        .add({
          type: 'new_appointment',
          appointmentId: appointmentRef.id,
          patientName: details.userName,
          patientEmail: details.userEmail,
          patientProfileImage: userProfileImage,
          patientAge: details.age,
          patientMobile: details.mobileNumber,
          date: selectedDate.toDateString(),
          time: selectedTime,
          status: 'unread',
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      const slotId = `${selectedDate.toDateString()}-${selectedTime}`;
      await firestore()
        .collection('doctors')
        .doc(doctor.id)
        .collection('slots')
        .doc(slotId)
        .set({
          date: selectedDate.toDateString(),
          time: selectedTime,
          status: 'pending',
          appointmentId: appointmentRef.id,
        }, { merge: true });

      Alert.alert('Success', 'Your appointment request has been sent to the doctor.');
      navigation.goBack();
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    }
  };

  const renderStars = (rating) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FontAwesome5
          key={star}
          name="star"
          solid={star <= Math.round(rating)}
          size={14}
          color={star <= Math.round(rating) ? COLORS.ACCENT_GREEN : COLORS.GRAY}
          style={styles.starIcon}
        />
      ))}
    </View>
  );

  const renderSlot = (slot, index) => {
    const slotStatus = slotStatuses[slot.time] || 'available';
    
    let statusIcon;
    if (slotStatus === 'booked') {
      statusIcon = <FontAwesome5 name="calendar-times" size={14} color={COLORS.TEXT_LIGHT} />;
    } else if (slotStatus === 'pending') {
      statusIcon = <FontAwesome5 name="clock" size={14} color={COLORS.TEXT_LIGHT} />;
    } else if (selectedTime === slot.time) {
      statusIcon = <FontAwesome5 name="check-circle" size={14} color={COLORS.TEXT_LIGHT} />;
    }
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.slotButton,
          selectedTime === slot.time && styles.selectedSlot,
          slotStatus === 'booked' && styles.bookedSlot,
          slotStatus === 'pending' && styles.pendingSlot
        ]}
        onPress={() => {
          if (slotStatus === 'booked') {
            setStatusMessage('This slot is already booked. Please select another time.');
            setStatusPopupVisible(true);
          } else if (slotStatus === 'pending') {
            setStatusMessage('This slot has a pending request. Please select another time.');
            setStatusPopupVisible(true);
          } else {
            setSelectedTime(slot.time);
          }
        }}
      >
        <View style={styles.slotContent}>
          {statusIcon && <View style={styles.statusIconContainer}>{statusIcon}</View>}
          <Text style={[
            styles.slotText,
            selectedTime === slot.time && styles.selectedSlotText,
            slotStatus === 'booked' && styles.bookedSlotText,
            slotStatus === 'pending' && styles.pendingSlotText
          ]}>
            {slot.time}
          </Text>
          {slotStatus !== 'available' && (
            <Text style={styles.slotStatusText}>
              ({slotStatus === 'booked' ? 'Booked' : 'Pending'})
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient 
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]} 
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_LIGHT} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.doctorInfoContainer}>
          <View style={styles.doctorImageBox}>
            {profilePicture ? (
              <Image 
                source={{ uri: profilePicture }} 
                style={styles.doctorProfileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="person" size={30} color={COLORS.TEXT_LIGHT} />
              </View>
            )}
          </View>
          <View style={styles.doctorDetailsContainer}>
            <Text style={styles.headerText}>Dr. {doctor.fullName}</Text>
            <Text style={styles.subHeaderText}>{doctor.specialization}</Text>
            <View style={styles.ratingContainer}>
              {renderStars(averageRating)}
              <Text style={styles.ratingText}>
                {averageRating} ({reviewCount} reviews)
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.appointmentLabelContainer}>
        <Text style={styles.appointmentLabel}>Select Date & Time</Text>
      </View>

      <View style={styles.datePickerContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.dateScrollContainer}
          contentContainerStyle={styles.dateScrollContent}
        >
          {next30Days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateBox,
                selectedDate?.toDateString() === day.fullDate.toDateString() && styles.selectedDateBox
              ]}
              onPress={() => {
                setSelectedDate(day.fullDate);
                setSelectedTime('');
              }}
            >
              <Text style={[
                styles.dateBoxDayText,
                selectedDate?.toDateString() === day.fullDate.toDateString() && styles.selectedDateText
              ]}>
                {day.dayOfWeek}
              </Text>
              <Text style={[
                styles.dateBoxNumberText,
                selectedDate?.toDateString() === day.fullDate.toDateString() && styles.selectedDateText
              ]}>
                {day.dayOfMonth}
              </Text>
              <Text style={[
                styles.dateBoxMonthText,
                selectedDate?.toDateString() === day.fullDate.toDateString() && styles.selectedDateText
              ]}>
                {day.monthName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColorBox, { backgroundColor: COLORS.GRAY }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColorBox, { backgroundColor: COLORS.PRIMARY }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColorBox, { backgroundColor: COLORS.ACCENT_GREEN }]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColorBox, { backgroundColor: COLORS.ACCENT_RED }]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
      </View>

      <ScrollView style={styles.mainContainer}>
        {selectedDate && (
          <View style={styles.slotsContainer}>
            <View style={styles.slotSection}>
              <View style={styles.slotSectionTitleContainer}>
                <Ionicons name="sunny" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.slotSectionTitle}>Morning & Afternoon (6 AM - 6 PM)</Text>
              </View>
              <View style={styles.slotsList}>
                {availableSlots
                  .filter(slot => slot.category === 'day')
                  .map((slot, index) => renderSlot(slot, index))}
                {availableSlots.filter(slot => slot.category === 'day').length === 0 && (
                  <View style={styles.noSlotsContainer}>
                    <Ionicons name="calendar-outline" size={40} color={COLORS.TEXT_MEDIUM} />
                    <Text style={styles.noSlotsText}>No morning slots available</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.slotSection}>
              <View style={styles.slotSectionTitleContainer}>
                <Ionicons name="moon" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.slotSectionTitle}>Evening & Night (6 PM - 6 AM)</Text>
              </View>
              <View style={styles.slotsList}>
                {availableSlots
                  .filter(slot => slot.category === 'night')
                  .map((slot, index) => renderSlot(slot, index))}
                {availableSlots.filter(slot => slot.category === 'night').length === 0 && (
                  <View style={styles.noSlotsContainer}>
                    <Ionicons name="calendar-outline" size={40} color={COLORS.TEXT_MEDIUM} />
                    <Text style={styles.noSlotsText}>No evening slots available</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity 
          activeOpacity={0.8}
          style={[
            styles.bookButton,
            (!selectedDate || !selectedTime) && styles.disabledButton
          ]} 
          onPress={handleBookAppointment}
          disabled={!selectedDate || !selectedTime}
        >
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            style={styles.gradientBookButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.bookButtonText}>Book Appointment</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <PatientDetailsModal
        isVisible={isPatientDetailsModalVisible}
        onClose={() => setPatientDetailsModalVisible(false)}
        onSubmit={handlePatientDetailsSubmit}
        userName={userName}
        userEmail={userEmail}
      />
      
      <StatusPopup 
        visible={statusPopupVisible}
        message={statusMessage}
        onClose={() => {
          setStatusPopupVisible(false);
          setSelectedTime('');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  headerContainer: {
    paddingTop: 45,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
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
  doctorInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },
  doctorImageBox: {
    marginRight: 15,
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.TEXT_LIGHT,
    backgroundColor: `${COLORS.PRIMARY}40`,
  },
  doctorProfileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorDetailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 22,
    fontWeight: 'bold',
  },
  subHeaderText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    marginTop: 2,
    opacity: 0.9,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  starContainer: {
    flexDirection: 'row',
    marginRight: 5,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 14,
  },
  appointmentLabelContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  appointmentLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
  },
  datePickerContainer: {
    backgroundColor: COLORS.TEXT_LIGHT,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateScrollContainer: {
    paddingVertical: 10,
  },
  dateScrollContent: {
    paddingHorizontal: 15,
  },
  dateBox: {
    width: 70,
    height: 90,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${COLORS.PRIMARY}20`,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedDateBox: {
    backgroundColor: COLORS.PRIMARY,
  },
  dateBoxDayText: {
    color: COLORS.TEXT_MEDIUM,
    fontSize: 14,
    marginBottom: 5,
  },
  dateBoxNumberText: {
    color: COLORS.TEXT_DARK,
    fontSize: 22,
    fontWeight: 'bold',
  },
  dateBoxMonthText: {
    color: COLORS.TEXT_MEDIUM,
    fontSize: 12,
    marginTop: 2,
  },
  selectedDateText: {
    color: COLORS.TEXT_LIGHT,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.TEXT_LIGHT,
    paddingVertical: 10,
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColorBox: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.TEXT_MEDIUM,
  },
  mainContainer: {
    flex: 1,
    padding: 15,
  },
  slotsContainer: {
    marginBottom: 15,
  },
  slotSection: {
    backgroundColor: COLORS.TEXT_LIGHT,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  slotSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  slotSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: COLORS.TEXT_DARK,
  },
  slotsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  slotButton: {
    backgroundColor: COLORS.GRAY,
    padding: 12,
    margin: 5,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  slotContent: {
    alignItems: 'center',
  },
  statusIconContainer: {
    marginBottom: 5,
  },
  slotText: {
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    textAlign: 'center',
  },
  selectedSlot: {
    backgroundColor: COLORS.PRIMARY,
    borderWidth: 0,
  },
  bookedSlot: {
    backgroundColor: COLORS.ACCENT_RED,
  },
  pendingSlot: {
    backgroundColor: COLORS.ACCENT_GREEN,
  },
  selectedSlotText: {
    color: COLORS.TEXT_LIGHT,
    fontWeight: 'bold',
  },
  bookedSlotText: {
    color: COLORS.TEXT_LIGHT,
  },
  pendingSlotText: {
    color: COLORS.TEXT_LIGHT,
  },
  slotStatusText: {
    fontSize: 10,
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noSlotsContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noSlotsText: {
    color: COLORS.TEXT_MEDIUM,
    marginTop: 10,
    fontSize: 14,
  },
  bookButton: {
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradientBookButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bookButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
  },
  closeButton: {
    padding: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.PRIMARY}20`,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 55,
    borderWidth: 1,
    borderColor: `${COLORS.PRIMARY}40`,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    height: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  cancelButton: {
    backgroundColor: COLORS.GRAY,
  },
  submitButton: {
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
  },
  statusModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statusModalContent: {
    backgroundColor: COLORS.TEXT_LIGHT,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  statusIconContainer: {
    marginBottom: 15,
  },
  statusModalText: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  statusModalButton: {
    width: '70%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 5,
  },
  gradientStatusButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  statusModalButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default AppointmentScheduler;