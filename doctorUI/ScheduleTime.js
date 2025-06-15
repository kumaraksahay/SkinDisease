import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Platform,
  TextInput,
  Modal,
  Dimensions,
  StatusBar,
  Image,
  RefreshControl,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const COLORS = {
  PRIMARY: '#4361EE',
  SECONDARY: '#3A0CA3',
  TERTIARY: '#7209B7',
  BACKGROUND: '#F8F9FA',
  CARD: '#FFFFFF',
  TEXT_DARK: '#1E293B',
  TEXT_MEDIUM: '#64748B',
  TEXT_LIGHT: '#FFFFFF',
  ACCENT_GREEN: '#10B981',
  ACCENT_RED: '#EF4444',
  ACCENT_YELLOW: '#F59E0B',
  GRAY_LIGHT: '#E2E8F0',
  GRAY: '#94A3B8',
  SHADOW: '#00000020',
};

const ScheduleTime = ({ route, navigation }) => {
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('Specialist');
  const [profilePicture, setProfilePicture] = useState(null);
  const [daySlots, setDaySlots] = useState([]);
  const [nightSlots, setNightSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [next30Days, setNext30Days] = useState([]);
  const [newSlotTime, setNewSlotTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fees, setFees] = useState('');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);
  const [activeTab, setActiveTab] = useState('day');
  const [averageRating, setAverageRating] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [cache, setCache] = useState({
    doctorData: { name: '', specialty: 'Specialist', profilePicture: null, fees: '' },
    slots: { day: [], night: [] },
    appointments: [],
    feedback: { averageRating: 0, count: 0 },
  });
  const initialFetchDone = useRef(false);
  const currentUser = auth().currentUser;

  // Load cached data
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem('scheduleTimeCache');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          setCache(parsedCache);
          setDoctorName(parsedCache.doctorData.name || '');
          setDoctorSpecialty(parsedCache.doctorData.specialty || 'Specialist');
          setProfilePicture(parsedCache.doctorData.profilePicture || null);
          setFees(parsedCache.doctorData.fees || '');
          setDaySlots(parsedCache.slots.day || []);
          setNightSlots(parsedCache.slots.night || []);
          setAppointments(parsedCache.appointments || []);
          setAverageRating(parsedCache.feedback.averageRating || 0);
          setFeedbackCount(parsedCache.feedback.count || 0);
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCachedData();
  }, []);

  // Save cache
  const saveCache = async (newCache) => {
    try {
      await AsyncStorage.setItem('scheduleTimeCache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  };

  const generateDateRange = useCallback(() => {
    const days = [];
    let currentDate = new Date();
    for (let i = 0; i < 30; i++) {
      const dayOfWeek = currentDate.toLocaleString('default', { weekday: 'short' });
      const dayOfMonth = currentDate.getDate();
      const month = currentDate.toLocaleString('default', { month: 'short' });
      days.push({
        dayOfWeek,
        dayOfMonth,
        month,
        fullDate: new Date(currentDate),
        isSelected: i === 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  }, []);

  const fetchDoctorData = useCallback(async () => {
    if (!currentUser) return '';
    try {
      let doctorData = {};
      if (route.params?.doctor) {
        doctorData = route.params.doctor;
      } else {
        const docSnapshot = await firestore()
          .collection('doctors')
          .doc(currentUser.uid)
          .get();
        if (docSnapshot.exists) {
          doctorData = docSnapshot.data();
        }
      }

      const name = doctorData.fullName || currentUser.displayName || currentUser.email;
      const specialty = doctorData.specialization || doctorData.specialty || 'Specialist';
      const profilePic = doctorData.profilePicture || null;
      const consultationFee = doctorData.consultationFee || doctorData.fees || '';

      const feedbackSnapshot = await firestore()
        .collection('feedback')
        .where('doctorId', '==', currentUser.uid)
        .get();

      const feedbackData = feedbackSnapshot.docs.map((doc) => doc.data());
      const feedbackCount = feedbackData.length;
      const averageRating = feedbackData.length > 0
        ? (feedbackData.reduce((sum, item) => sum + item.rating, 0) / feedbackData.length).toFixed(1)
        : 0;

      const newDoctorData = { name, specialty, profilePicture: profilePic, fees: consultationFee };
      setDoctorName(name);
      setDoctorSpecialty(specialty);
      setProfilePicture(profilePic);
      setFees(consultationFee);
      setFeedbackCount(feedbackCount);
      setAverageRating(averageRating);

      return newDoctorData;
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      Alert.alert('Error', 'Failed to fetch doctor information.');
      return {};
    }
  }, [currentUser?.uid, route.params]);

  const saveFees = async () => {
    if (!currentUser) return;
    try {
      await firestore()
        .collection('doctors')
        .doc(currentUser.uid)
        .update({
          consultationFee: fees,
        });
      setCache((prev) => {
        const newCache = {
          ...prev,
          doctorData: { ...prev.doctorData, fees },
        };
        saveCache(newCache);
        return newCache;
      });
      Alert.alert('Success', 'Fees updated successfully.');
    } catch (error) {
      console.error('Error saving fees:', error);
      Alert.alert('Error', 'Failed to save fees.');
    }
  };

  const fetchSlotsAndAppointments = useCallback(async (isRefresh = false) => {
    if (!currentUser || !selectedDate) return;
    try {
      if (isRefresh) setRefreshing(true);
      else if (!cache.slots.day.length && !cache.slots.night.length) setLoading(true);

      const slotsSnapshot = await firestore()
        .collection('doctors')
        .doc(currentUser.uid)
        .collection('slots')
        .where('date', '==', selectedDate.toDateString())
        .get();

      const appointmentsSnapshot = await firestore()
        .collection('appointments')
        .where('doctorId', '==', currentUser.uid)
        .where('date', '==', selectedDate.toDateString())
        .get();

      const fetchedAppointments = appointmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const fetchedDaySlots = [];
      const fetchedNightSlots = [];

      slotsSnapshot.forEach((doc) => {
        const slotData = { ...doc.data(), id: doc.id };
        const relatedAppointment = fetchedAppointments.find(
          (appt) => appt.time === slotData.time && appt.date === slotData.date
        );
        slotData.status = relatedAppointment
          ? relatedAppointment.status === 'Confirmed'
            ? 'Booked'
            : relatedAppointment.status
          : 'Available';

        if (slotData.category === 'day') {
          fetchedDaySlots.push(slotData);
        } else {
          fetchedNightSlots.push(slotData);
        }
      });

      setDaySlots(fetchedDaySlots);
      setNightSlots(fetchedNightSlots);
      setAppointments(fetchedAppointments);

      setCache((prev) => {
        const newCache = {
          ...prev,
          slots: { day: fetchedDaySlots, night: fetchedNightSlots },
          appointments: fetchedAppointments,
        };
        saveCache(newCache);
        return newCache;
      });
    } catch (error) {
      console.error('Error fetching slots and appointments:', error);
      Alert.alert('Error', 'Failed to fetch slots or appointments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.uid, selectedDate, cache.slots]);

  const formatTimeString = (hour, minute, isAM) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute < 10 ? `0${minute}` : minute;
    const period = isAM ? 'AM' : 'PM';
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const handleTimeSelection = () => {
    const formattedTime = formatTimeString(selectedHour, selectedMinute, isAM);
    setNewSlotTime(formattedTime);
    setTimePickerVisible(false);
  };

  const categorizeSlot = (time) => {
    const [hours, period] = time.split(' ');
    const [hour] = hours.split(':');
    const hourNum = parseInt(hour);
    if (period === 'AM' && hourNum === 12) return 'night';
    if (period === 'PM' && hourNum === 12) return 'day';
    return (period === 'AM' && hourNum >= 6) || (period === 'PM' && hourNum < 6) ? 'day' : 'night';
  };

  const addRecurringSlots = async (user, newSlot, selectedDate) => {
    const batch = firestore().batch();
    const startDate = new Date(selectedDate);
    const selectedDayOfWeek = startDate.toLocaleString('default', { weekday: 'long' });

    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const currentDayOfWeek = currentDate.toLocaleString('default', { weekday: 'long' });
      if (currentDayOfWeek === selectedDayOfWeek) {
        const slotRef = firestore()
          .collection('doctors')
          .doc(user.uid)
          .collection('slots')
          .doc(`${currentDate.toDateString()}-${newSlot.time}`);
        batch.set(slotRef, {
          date: currentDate.toDateString(),
          time: newSlot.time,
          category: newSlot.category,
          status: 'Available',
        });
      }
    }
    await batch.commit();
  };

  const handleAddSlot = async () => {
    if (!newSlotTime) {
      Alert.alert('Error', 'Please select a time.');
      return;
    }
    try {
      if (currentUser) {
        const category = categorizeSlot(newSlotTime);
        const newSlot = {
          date: selectedDate.toDateString(),
          time: newSlotTime,
          category,
          status: 'Available',
        };
        await addRecurringSlots(currentUser, newSlot, selectedDate);
        await fetchSlotsAndAppointments();
        setNewSlotTime('');
        Alert.alert('Success', 'Slot added successfully for all matching days.');
      }
    } catch (error) {
      console.error('Error adding slot:', error);
      Alert.alert('Error', 'Failed to add slot: ' + error.message);
    }
  };

  const handleDeleteSlot = async (slotToDelete, slotType) => {
    if (slotToDelete.status === 'Pending' || slotToDelete.status === 'Booked') {
      Alert.alert(
        'Cannot Delete',
        `This slot is ${slotToDelete.status.toLowerCase()} and cannot be deleted.`
      );
      return;
    }

    try {
      if (currentUser) {
        const slotRef = firestore()
          .collection('doctors')
          .doc(currentUser.uid)
          .collection('slots')
          .doc(slotToDelete.id);
        await slotRef.delete();
        if (slotType === 'day') {
          setDaySlots((prev) => prev.filter((slot) => slot.id !== slotToDelete.id));
        } else {
          setNightSlots((prev) => prev.filter((slot) => slot.id !== slotToDelete.id));
        }
        setCache((prev) => {
          const newCache = {
            ...prev,
            slots: {
              day: slotType === 'day' ? prev.slots.day.filter((slot) => slot.id !== slotToDelete.id) : prev.slots.day,
              night: slotType === 'night' ? prev.slots.night.filter((slot) => slot.id !== slotToDelete.id) : prev.slots.night,
            },
          };
          saveCache(newCache);
          return newCache;
        });
        Alert.alert('Success', 'Slot deleted successfully.');
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      Alert.alert('Error', 'Failed to delete slot.');
    }
  };

  // Initial data fetch
  useEffect(() => {
    setNext30Days(generateDateRange());
    if (!initialFetchDone.current && currentUser) {
      initialFetchDone.current = true;
      Promise.all([fetchDoctorData(), fetchSlotsAndAppointments()]).then(([doctorData]) => {
        setCache((prev) => {
          const newCache = {
            ...prev,
            doctorData,
            feedback: { averageRating, count: feedbackCount },
          };
          saveCache(newCache);
          return newCache;
        });
      });
    }

    if (currentUser && selectedDate) {
      const slotsListener = firestore()
        .collection('doctors')
        .doc(currentUser.uid)
        .collection('slots')
        .where('date', '==', selectedDate.toDateString())
        .onSnapshot(() => fetchSlotsAndAppointments(), (error) => {
          console.error('Error in slots listener:', error);
        });

      const appointmentsListener = firestore()
        .collection('appointments')
        .where('doctorId', '==', currentUser.uid)
        .where('date', '==', selectedDate.toDateString())
        .onSnapshot(() => fetchSlotsAndAppointments(), (error) => {
          console.error('Error in appointments listener:', error);
        });

      return () => {
        slotsListener();
        appointmentsListener();
      };
    }
  }, [currentUser?.uid, selectedDate, generateDateRange, fetchDoctorData, fetchSlotsAndAppointments, averageRating, feedbackCount]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    if (!refreshing) {
      setRefreshing(true);
      Promise.all([fetchDoctorData(), fetchSlotsAndAppointments(true)]).then(([doctorData]) => {
        setCache((prev) => {
          const newCache = {
            ...prev,
            doctorData,
            feedback: { averageRating, count: feedbackCount },
          };
          saveCache(newCache);
          return newCache;
        });
      });
    }
  }, [refreshing, fetchDoctorData, fetchSlotsAndAppointments, averageRating, feedbackCount]);

  const renderStars = (rating) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FontAwesome5
          key={star}
          name="star"
          solid={star <= Math.round(rating)}
          size={14}
          color={star <= Math.round(rating) ? COLORS.ACCENT_YELLOW : COLORS.GRAY}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );

  const renderHeader = () => (
    <LinearGradient
      colors={[COLORS.PRIMARY, COLORS.SECONDARY, COLORS.TERTIARY]}
      style={styles.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_LIGHT} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Appointment Slots</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={onRefresh}>
              <Ionicons name="refresh" size={24} color={COLORS.TEXT_LIGHT} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.doctorInfoCard}>
          <View style={styles.doctorImageContainer}>
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={styles.doctorImage}
              />
            ) : (
              <View style={styles.doctorImagePlaceholder}>
                <Text style={styles.doctorInitials}>
                  {doctorName ? doctorName.charAt(0).toUpperCase() : 'D'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>Dr. {doctorName}</Text>
            <Text style={styles.doctorSpecialty}>{doctorSpecialty}</Text>
            <View style={styles.ratingContainer}>
              {renderStars(averageRating)}
              <Text style={styles.ratingText}>{averageRating} ({feedbackCount})</Text>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  const renderDateSelector = () => (
    <View style={styles.dateSelectorContainer}>
      <Text style={styles.sectionTitle}>Select Date</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateScrollContainer}
      >
        {next30Days.map((day, index) => {
          const isSelected = selectedDate.toDateString() === day.fullDate.toDateString();
          return (
            <TouchableOpacity
              key={index}
              style={[styles.dateBox, isSelected && styles.selectedDateBox]}
              onPress={() => setSelectedDate(day.fullDate)}
            >
              <Text style={[styles.dateBoxWeekday, isSelected && styles.selectedDateText]}>
                {day.dayOfWeek}
              </Text>
              <Text style={[styles.dateBoxDay, isSelected && styles.selectedDateText]}>
                {day.dayOfMonth}
              </Text>
              <Text style={[styles.dateBoxMonth, isSelected && styles.selectedDateText]}>
                {day.month}
              </Text>
              {isSelected && <View style={styles.selectedDateIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderFeesSection = () => (
    <View style={styles.feesContainer}>
      <View style={styles.feesHeader}>
        <Ionicons name="cash-outline" size={22} color={COLORS.PRIMARY} />
        <Text style={styles.feesLabel}>Consultation Fees</Text>
      </View>
      <View style={styles.feesInputContainer}>
        <TextInput
          style={styles.feesInput}
          placeholder="Enter fees (e.g., $50)"
          value={fees}
          onChangeText={setFees}
          keyboardType="numeric"
          placeholderTextColor={COLORS.GRAY}
        />
        <TouchableOpacity style={styles.saveFeesButton} onPress={saveFees}>
          <Text style={styles.saveFeesButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSlotInput = () => (
    <View style={styles.slotInputContainer}>
      <View style={styles.slotInputHeader}>
        <Ionicons name="time-outline" size={22} color={COLORS.PRIMARY} />
        <Text style={styles.slotInputLabel}>Add New Time Slot</Text>
      </View>
      <View style={styles.slotInputControls}>
        <TouchableOpacity
          style={styles.timePickerButton}
          onPress={() => setTimePickerVisible(true)}
        >
          <Ionicons name="time" size={20} color={COLORS.TEXT_MEDIUM} />
          <Text style={styles.timePickerText}>
            {newSlotTime || 'Select time'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addSlotButton, !newSlotTime && styles.addSlotButtonDisabled]}
          onPress={handleAddSlot}
          disabled={!newSlotTime}
        >
          <Ionicons name="add" size={20} color={COLORS.TEXT_LIGHT} />
          <Text style={styles.addSlotButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTimePicker = () => (
    <Modal visible={timePickerVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.timePickerContainer}>
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            style={styles.timePickerHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.timePickerTitle}>Set Appointment Time</Text>
          </LinearGradient>

          <View style={styles.timePickerContent}>
            <View style={styles.timePickerRow}>
              <View style={styles.timePickerColumnLabel}>
                <Text style={styles.timePickerLabel}>Hour</Text>
              </View>
              <View style={styles.timePickerColumnLabel}>
                <Text style={styles.timePickerLabel}>Minute</Text>
              </View>
              <View style={styles.timePickerColumnLabel}>
                <Text style={styles.timePickerLabel}>Period</Text>
              </View>
            </View>

            <View style={styles.timePickerSelectors}>
              <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i).map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeItem,
                      (isAM && selectedHour === (hour === 12 ? 0 : hour)) ||
                      (!isAM && selectedHour === (hour === 12 ? 12 : hour + 12)) ?
                        styles.selectedTimeItem : null
                    ]}
                    onPress={() => {
                      if (hour === 12) {
                        setSelectedHour(isAM ? 0 : 12);
                      } else {
                        setSelectedHour(isAM ? hour : hour + 12);
                      }
                    }}
                  >
                    <Text style={[
                      styles.timeItemText,
                      (isAM && selectedHour === (hour === 12 ? 0 : hour)) ||
                      (!isAM && selectedHour === (hour === 12 ? 12 : hour + 12)) ?
                        styles.selectedTimeItemText : null
                    ]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timeItem,
                      selectedMinute === minute && styles.selectedTimeItem
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text style={[
                      styles.timeItemText,
                      selectedMinute === minute && styles.selectedTimeItemText
                    ]}>
                      {minute < 10 ? `0${minute}` : minute}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.amPmColumn}>
                <TouchableOpacity
                  style={[styles.amPmItem, isAM && styles.selectedAmPmItem]}
                  onPress={() => setIsAM(true)}
                >
                  <Text style={[styles.timeItemText, isAM && styles.selectedTimeItemText]}>
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.amPmItem, !isAM && styles.selectedAmPmItem]}
                  onPress={() => setIsAM(false)}
                >
                  <Text style={[styles.timeItemText, !isAM && styles.selectedTimeItemText]}>
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.timePickerButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setTimePickerVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleTimeSelection}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSlotTabs = () => (
    <View style={styles.slotTabsContainer}>
      <TouchableOpacity
        style={[styles.slotTab, activeTab === 'day' && styles.activeSlotTab]}
        onPress={() => setActiveTab('day')}
      >
        <Ionicons
          name="sunny"
          size={18}
          color={activeTab === 'day' ? COLORS.PRIMARY : COLORS.GRAY}
        />
        <Text style={[styles.slotTabText, activeTab === 'day' && styles.activeSlotTabText]}>
          Day Slots
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.slotTab, activeTab === 'night' && styles.activeSlotTab]}
        onPress={() => setActiveTab('night')}
      >
        <Ionicons
          name="moon"
          size={18}
          color={activeTab === 'night' ? COLORS.PRIMARY : COLORS.GRAY}
        />
        <Text style={[styles.slotTabText, activeTab === 'night' && styles.activeSlotTabText]}>
          Night Slots
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSlots = () => {
    const slots = activeTab === 'day' ? daySlots : nightSlots;
    const timeRange = activeTab === 'day' ? '6 AM - 6 PM' : '6 PM - 6 AM';

    return (
      <View style={styles.slotsContainer}>
        <View style={styles.slotsHeader}>
          <Text style={styles.slotsTitle}>
            {activeTab === 'day' ? 'Day Time Slots' : 'Night Time Slots'}
          </Text>
          <Text style={styles.slotsSubtitle}>{timeRange}</Text>
        </View>

        {slots.length === 0 ? (
          <View style={styles.emptySlotContainer}>
            <Ionicons
              name={activeTab === 'day' ? 'sunny-outline' : 'moon-outline'}
              size={50}
              color={COLORS.GRAY}
            />
            <Text style={styles.emptySlotText}>No {activeTab} slots available</Text>
            <Text style={styles.emptySlotSubtext}>
              Add slots above to make yourself available
            </Text>
          </View>
        ) : (
          <View style={styles.slotsGrid}>
            {slots.map((slot, index) => {
              const slotStatus = slot.status;
              let gradientColors;
              let statusTextColor;

              switch (slotStatus) {
                case 'Booked':
                  gradientColors = [COLORS.ACCENT_RED, '#DC2626'];
                  statusTextColor = COLORS.TEXT_LIGHT;
                  break;
                case 'Pending':
                  gradientColors = [COLORS.ACCENT_YELLOW, '#D97706'];
                  statusTextColor = COLORS.TEXT_LIGHT;
                  break;
                case 'Available':
                default:
                  gradientColors = ['#F8FAFC', '#F1F5F9'];
                  statusTextColor = COLORS.PRIMARY;
                  break;
              }

              return (
                <View key={index} style={styles.slotBoxContainer}>
                  <LinearGradient
                    colors={gradientColors}
                    style={styles.slotBox}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[
                      styles.slotBoxTime,
                      slotStatus !== 'Available' && styles.acceptedSlotText
                    ]}>
                      {slot.time}
                    </Text>
                    <Text style={[
                      styles.slotBoxStatus,
                      { color: statusTextColor }
                    ]}>
                      {slotStatus}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.deleteSlotIcon,
                        slotStatus !== 'Available' && styles.acceptedDeleteIcon
                      ]}
                      onPress={() => handleDeleteSlot(slot, activeTab)}
                    >
                      <Ionicons
                        name="trash"
                        size={16}
                        color={slotStatus === 'Available' ? COLORS.ACCENT_RED : COLORS.TEXT_LIGHT}
                      />
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderSaveButton = () => (
    <TouchableOpacity
      style={styles.saveButton}
      onPress={() => Alert.alert(
        'All Slots Saved',
        'Your slot configuration has been saved successfully.'
      )}
    >
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        style={styles.saveButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="save" size={20} color={COLORS.TEXT_LIGHT} />
        <Text style={styles.saveButtonText}>Save All Slots</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      {renderHeader()}

      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.PRIMARY} />
        }
      >
        {loading && !cache.doctorData.name ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {renderDateSelector()}
            {renderFeesSection()}
            {renderSlotInput()}
            {renderSlotTabs()}
            {renderSlots()}
          </>
        )}
      </ScrollView>

      {renderSaveButton()}
      {renderTimePicker()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContainer: {
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  headerLeft: {
    width: 50,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 50,
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 18,
    fontWeight: '600',
  },
  doctorInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 1,
  },
  doctorImageContainer: {
    marginRight: 15,
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.TEXT_LIGHT,
  },
  doctorImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.TEXT_LIGHT,
  },
  doctorInitials: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  doctorSpecialty: {
    color: COLORS.TEXT_LIGHT,
    opacity: 0.8,
    fontSize: 14,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: COLORS.TEXT_LIGHT,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  dateSelectorContainer: {
    marginTop: 10,
    backgroundColor: COLORS.CARD,
    borderRadius: 15,
    padding: 16,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 16,
  },
  dateScrollContainer: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  dateBox: {
    width: 60,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.GRAY_LIGHT,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  selectedDateBox: {
    backgroundColor: COLORS.PRIMARY,
  },
  dateBoxWeekday: {
    fontSize: 12,
    color: COLORS.TEXT_MEDIUM,
    marginBottom: 4,
  },
  dateBoxDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginBottom: 2,
  },
  dateBoxMonth: {
    fontSize: 12,
    color: COLORS.TEXT_MEDIUM,
  },
  selectedDateText: {
    color: COLORS.TEXT_LIGHT,
  },
  selectedDateIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
  },
  feesContainer: {
    backgroundColor: COLORS.CARD,
    borderRadius: 15,
    padding: 16,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  feesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginLeft: 8,
  },
  feesInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feesInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    marginRight: 12,
  },
  saveFeesButton: {
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveFeesButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  slotInputContainer: {
    backgroundColor: COLORS.CARD,
    borderRadius: 15,
    padding: 16,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  slotInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginLeft: 8,
  },
  slotInputControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePickerButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  timePickerText: {
    fontSize: 16,
    color: COLORS.TEXT_MEDIUM,
    marginLeft: 8,
  },
  addSlotButton: {
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSlotButtonDisabled: {
    backgroundColor: COLORS.GRAY,
  },
  addSlotButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  slotTabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.CARD,
    borderRadius: 15,
    padding: 6,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  slotTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeSlotTab: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  slotTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_MEDIUM,
    marginLeft: 6,
  },
  activeSlotTabText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  slotsContainer: {
    backgroundColor: COLORS.CARD,
    borderRadius: 15,
    padding: 16,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  slotsHeader: {
    marginBottom: 16,
  },
  slotsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  slotsSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_MEDIUM,
  },
  emptySlotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptySlotText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySlotSubtext: {
    fontSize: 14,
    color: COLORS.TEXT_MEDIUM,
    textAlign: 'center',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotBoxContainer: {
    width: '30%',
    marginBottom: 12,
  },
  slotBox: {
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 80,
  },
  slotBoxTime: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  slotBoxStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  acceptedSlotText: {
    color: COLORS.TEXT_LIGHT,
  },
  deleteSlotIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptedDeleteIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    padding: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timePickerContainer: {
    width: width * 0.85,
    backgroundColor: COLORS.CARD,
    borderRadius: 20,
    overflow: 'hidden',
  },
  timePickerHeader: {
    padding: 16,
    alignItems: 'center',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
  timePickerContent: {
    padding: 16,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timePickerColumnLabel: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_MEDIUM,
  },
  timePickerSelectors: {
    flexDirection: 'row',
    height: 200,
  },
  timeColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  timeItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedTimeItem: {
    backgroundColor: COLORS.PRIMARY,
  },
  timeItemText: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  selectedTimeItemText: {
    color: COLORS.TEXT_LIGHT,
    fontWeight: '600',
  },
  amPmColumn: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingHorizontal: 4,
  },
  amPmItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  selectedAmPmItem: {
    backgroundColor: COLORS.PRIMARY,
  },
  timePickerButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: COLORS.GRAY_LIGHT,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_MEDIUM,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 0.5,
    borderLeftColor: COLORS.GRAY_LIGHT,
  },
  confirmButtonText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
});

export default ScheduleTime;