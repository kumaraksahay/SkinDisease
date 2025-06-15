import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Image,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

const PatientInformation = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointmentCounts, setAppointmentCounts] = useState({
    completed: 0,
    rejected: 0,
    pending: 0,
    accepted: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [cache, setCache] = useState({ appointments: [], counts: { completed: 0, rejected: 0, pending: 0, accepted: 0 } });
  const initialFetchDone = useRef(false);
  const currentUser = auth().currentUser;

  // Load cached data from AsyncStorage
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem('appointmentsCache');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          setCache(parsedCache);
          setAppointments(parsedCache.appointments || []);
          setFilteredAppointments(parsedCache.appointments || []);
          setAppointmentCounts(parsedCache.counts || { completed: 0, rejected: 0, pending: 0, accepted: 0 });
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCachedData();
  }, []);

  // Save cache to AsyncStorage
  const saveCache = async (newCache) => {
    try {
      await AsyncStorage.setItem('appointmentsCache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  };

  // Fetch appointments
  const fetchAppointments = useCallback(async (isRefresh = false) => {
    if (!currentUser) {
      Alert.alert('Error', 'Doctor not authenticated. Please log in.');
      navigation.navigate('DLogin');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const appointmentsRef = firestore()
        .collection('appointments')
        .where('doctorId', '==', currentUser.uid);

      const unsubscribe = appointmentsRef.onSnapshot(async (snapshot) => {
        const fetchedAppointmentsPromises = snapshot.docs.map(async (doc) => {
          const appointmentData = doc.data();
          let profilePicture = null;

          try {
            const userDoc = await firestore()
              .collection('users')
              .doc(appointmentData.userId)
              .get();
            if (userDoc.exists) {
              profilePicture = userDoc.data().profilePicture || null;
            } else {
              console.warn(`User document not found for userId: ${appointmentData.userId}`);
            }
          } catch (error) {
            console.error(`Error fetching user data for userId: ${appointmentData.userId}`, error);
          }

          return {
            id: doc.id,
            ...appointmentData,
            userEmail: appointmentData.userEmail || 'Not provided',
            profilePicture,
          };
        });

        const fetchedAppointments = await Promise.all(fetchedAppointmentsPromises);

        const counts = fetchedAppointments.reduce(
          (acc, appointment) => {
            if (appointment.status === 'Completed') acc.completed++;
            if (appointment.status === 'Cancelled') acc.rejected++;
            if (appointment.status === 'Pending') acc.pending++;
            if (appointment.status === 'Confirmed') acc.accepted++;
            return acc;
          },
          { completed: 0, rejected: 0, pending: 0, accepted: 0 }
        );

        const sortedAppointments = fetchedAppointments.sort((a, b) => {
          const receivedTimeA = new Date(a.receivedTime || a.createdAt || 0);
          const receivedTimeB = new Date(b.receivedTime || b.createdAt || 0);
          return receivedTimeB - receivedTimeA;
        });

        const newCache = {
          appointments: sortedAppointments,
          counts,
        };

        setAppointments(sortedAppointments);
        setAppointmentCounts(counts);
        filterAppointments(selectedFilter, sortedAppointments);
        setCache(newCache);
        await saveCache(newCache);
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error('Snapshot error:', error);
        Alert.alert('Error', 'Failed to fetch appointments in real-time.');
        setLoading(false);
        setRefreshing(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Could not fetch appointments: ' + error.message);
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.uid, selectedFilter]);

  // Initial fetch
  useEffect(() => {
    if (!initialFetchDone.current && currentUser) {
      initialFetchDone.current = true;
      fetchAppointments();
    }

    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (!user) {
        Alert.alert('Error', 'Doctor not authenticated. Please log in.');
        navigation.navigate('DLogin');
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid, fetchAppointments, navigation]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    if (!refreshing) {
      fetchAppointments(true);
    }
  }, [fetchAppointments, refreshing]);

  const filterAppointments = (status, allAppointments = appointments) => {
    setSelectedFilter(status);
    if (status === 'All') {
      setFilteredAppointments(allAppointments);
    } else {
      const filtered = allAppointments.filter(
        (appointment) =>
          appointment.status ===
          (status === 'Accepted'
            ? 'Confirmed'
            : status === 'Rejected'
            ? 'Cancelled'
            : status)
      );
      setFilteredAppointments(filtered);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await firestore()
        .collection('appointments')
        .doc(appointmentId)
        .update({
          status: newStatus,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      Alert.alert('Success', `Appointment status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Could not update appointment status: ' + error.message);
    }
  };

  const handleDeleteAppointment = async (appointmentId, status) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('appointments').doc(appointmentId).delete();
              Alert.alert('Success', 'Appointment deleted successfully');
              handleCloseModal();
            } catch (error) {
              console.error('Error deleting appointment:', error);
              Alert.alert('Error', 'Could not delete appointment: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleOpenPatientDetails = (appointment) => {
    setSelectedPatient(appointment);
    setModalVisible(true);
  };

  const handleOpenChat = (appointment) => {
    if (!appointment.userId) {
      console.error('No userId found for appointment:', appointment.id);
      Alert.alert('Error', 'Cannot open chat: Patient ID is missing.');
      return;
    }
    navigation.navigate('ChatDetailScreen', {
      userId: appointment.userId,
      userName: appointment.userName || 'Patient',
      profilePicture: appointment.profilePicture,
    });
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPatient(null);
  };

  const formatTime = (timeString) => {
    return timeString || '';
  };

  const renderAppointmentCard = (appointment) => {
    const statusColors = {
      Pending: '#FFC107',
      Confirmed: '#4CAF50',
      Completed: '#2196F3',
      Cancelled: '#F44336',
    };

    const statusBgColors = {
      Pending: '#FFF8E1',
      Confirmed: '#E8F5E9',
      Completed: '#E3F2FD',
      Cancelled: '#FFEBEE',
    };

    const formattedTime = formatTime(appointment.time);

    return (
      <View key={appointment.id} style={styles.appointmentCard}>
        <LinearGradient colors={['#FFFFFF', '#F8F9FA']} style={styles.cardGradient}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              {appointment.profilePicture ? (
                <Image
                  source={{ uri: appointment.profilePicture }}
                  style={styles.profileImage}
                  onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                />
              ) : (
                <LinearGradient
                  colors={['#8A2BE2', '#6A5ACD']}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {(appointment.userName || 'P').charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.patientHeaderInfo}>
              <Text style={styles.patientName}>{appointment.userName}</Text>
              <Text style={styles.patientEmail}>{appointment.userEmail}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: statusBgColors[appointment.status] || '#EEEEEE',
                    borderColor: statusColors[appointment.status] || '#9E9E9E',
                    borderWidth: 1,
                  },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: statusColors[appointment.status] }]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: statusColors[appointment.status] || '#757575' },
                  ]}
                >
                  {appointment.status}
                </Text>
              </View>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.messageIcon}
                onPress={() => handleOpenChat(appointment)}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#6A11CB" />
              </TouchableOpacity>
              {(appointment.status === 'Confirmed' || appointment.status === 'Completed') && (
                <TouchableOpacity
                  style={styles.deleteIcon}
                  onPress={() => handleDeleteAppointment(appointment.id, appointment.status)}
                >
                  <Ionicons name="trash-outline" size={24} color="#D32F2F" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.detailsGrid}>
              <View style={styles.detailBox}>
                <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="calendar-outline" size={20} color="#2196F3" />
                </View>
                <View style={styles.detailBoxContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{appointment.date}</Text>
                </View>
              </View>

              <View style={styles.detailBox}>
                <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="time-outline" size={20} color="#4CAF50" />
                </View>
                <View style={styles.detailBoxContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{formattedTime}</Text>
                </View>
              </View>

              <View style={styles.detailBox}>
                <View style={[styles.iconContainer, { backgroundColor: '#FFF8E1' }]}>
                  <Ionicons name="person-outline" size={20} color="#FFC107" />
                </View>
                <View style={styles.detailBoxContent}>
                  <Text style={styles.detailLabel}>Age</Text>
                  <Text style={styles.detailValue}>{appointment.userAge} years</Text>
                </View>
              </View>

              <View style={styles.detailBox}>
                <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="call-outline" size={20} color="#F44336" />
                </View>
                <View style={styles.detailBoxContent}>
                  <Text style={styles.detailLabel}>Contact</Text>
                  <Text style={styles.detailValue}>{appointment.userMobile}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => handleOpenPatientDetails(appointment)}
            >
              <Ionicons name="eye-outline" size={18} color="white" />
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>

            <View style={styles.actionButtonContainer}>
              {appointment.status === 'Pending' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.confirmButton]}
                    onPress={() => handleUpdateAppointmentStatus(appointment.id, 'Confirmed')}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                    <Text style={styles.actionButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleUpdateAppointmentStatus(appointment.id, 'Cancelled')}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="white" />
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
              {appointment.status === 'Confirmed' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton, { width: '100%' }]}
                  onPress={() => handleUpdateAppointmentStatus(appointment.id, 'Completed')}
                >
                  <Ionicons name="checkmark-done-circle-outline" size={18} color="white" />
                  <Text style={styles.actionButtonText}>Mark Completed</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../src/assets/sche.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyHeaderText}>No {selectedFilter} Appointments</Text>
      <Text style={styles.emptySubText}>
        {selectedFilter === 'All'
          ? "You don't have any appointments yet."
          : `You don't have any ${selectedFilter.toLowerCase()} appointments.`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#6A11CB" barStyle="light-content" />

      <LinearGradient
        colors={['#6A11CB', '#2575FC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerContainer}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Patient Requests</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.appointmentSummary}>
          <Text style={styles.summaryText}>
            {refreshing ? 'Refreshing...' : `You have ${appointments.length} total appointments`}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContainer}
        >
          {[
            { label: 'All', count: appointments.length, color: '#7986CB', icon: 'calendar' },
            { label: 'Pending', count: appointmentCounts.pending, color: '#FFA726', icon: 'hourglass' },
            {
              label: 'Accepted',
              count: appointmentCounts.accepted,
              color: '#66BB6A',
              icon: 'checkmark-circle',
            },
            {
              label: 'Completed',
              count: appointmentCounts.completed,
              color: '#42A5F5',
              icon: 'checkmark-done-circle',
            },
            { label: 'Rejected', count: appointmentCounts.rejected, color: '#EF5350', icon: 'close-circle' },
          ].map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.statCard,
                selectedFilter === stat.label && {
                  backgroundColor: stat.color,
                  transform: [{ scale: 1.03 }],
                },
              ]}
              onPress={() => filterAppointments(stat.label)}
            >
              <View
                style={[
                  styles.statIconContainer,
                  {
                    backgroundColor: selectedFilter === stat.label
                      ? 'rgba(255, 255, 255, 0.2)'
                      : `${stat.color}15`,
                  },
                ]}
              >
                <Ionicons
                  name={`${stat.icon}-outline`}
                  size={22}
                  color={selectedFilter === stat.label ? 'white' : stat.color}
                />
              </View>
              <Text
                style={[styles.statCount, selectedFilter === stat.label && { color: 'white' }]}
              >
                {stat.count}
              </Text>
              <Text
                style={[styles.statLabel, selectedFilter === stat.label && { color: 'white' }]}
              >
                {stat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !cache.appointments.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A11CB" />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedFilter === 'All' ? 'All Appointments' : `${selectedFilter} Appointments`}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {filteredAppointments.length}{' '}
              {filteredAppointments.length === 1 ? 'appointment' : 'appointments'}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6A11CB" />
            }
            showsVerticalScrollIndicator={false}
          >
            {filteredAppointments.length === 0 ? (
              renderEmptyState()
            ) : (
              filteredAppointments.map(renderAppointmentCard)
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        </>
      )}

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View style={styles.modalOverlay}>
            <BlurView style={styles.blurContainer} blurType="dark" blurAmount={5} />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                {selectedPatient && (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalHeaderLine} />
                      <Text style={styles.modalHeaderText}>Patient Details</Text>
                      <View style={styles.patientProfile}>
                        {selectedPatient.profilePicture ? (
                          <Image
                            source={{ uri: selectedPatient.profilePicture }}
                            style={styles.modalProfileImage}
                          />
                        ) : (
                          <LinearGradient
                            colors={['#8A2BE2', '#6A5ACD']}
                            style={styles.modalAvatar}
                          >
                            <Text style={styles.modalAvatarText}>
                              {(selectedPatient.userName || 'P').charAt(0).toUpperCase()}
                            </Text>
                          </LinearGradient>
                        )}
                        <Text style={styles.modalPatientName}>{selectedPatient.userName}</Text>
                        <Text style={styles.modalPatientEmail}>{selectedPatient.userEmail}</Text>
                        <View
                          style={[
                            styles.modalStatusBadge,
                            {
                              backgroundColor:
                                selectedPatient.status === 'Pending'
                                  ? '#FFF8E1'
                                  : selectedPatient.status === 'Confirmed'
                                  ? '#E8F5E9'
                                  : selectedPatient.status === 'Completed'
                                  ? '#E3F2FD'
                                  : '#FFEBEE',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.modalStatusText,
                              {
                                color:
                                  selectedPatient.status === 'Pending'
                                    ? '#F57C00'
                                    : selectedPatient.status === 'Confirmed'
                                    ? '#388E3C'
                                    : selectedPatient.status === 'Completed'
                                    ? '#1976D2'
                                    : '#D32F2F',
                              },
                            ]}
                          >
                            {selectedPatient.status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.modalBody}>
                      <Text style={styles.modalSectionTitle}>Appointment Information</Text>
                      <View style={styles.modalInfoGrid}>
                        {[
                          {
                            icon: 'calendar-outline',
                            color: '#5C6BC0',
                            label: 'Date',
                            value: selectedPatient.date,
                          },
                          {
                            icon: 'time-outline',
                            color: '#26A69A',
                            label: 'Time',
                            value: selectedPatient.time,
                          },
                          {
                            icon: 'person-outline',
                            color: '#FFA726',
                            label: 'Age',
                            value: `${selectedPatient.userAge} years`,
                          },
                          {
                            icon: 'call-outline',
                            color: '#EF5350',
                            label: 'Mobile',
                            value: selectedPatient.userMobile,
                          },
                        ].map((detail, index) => (
                          <View key={index} style={styles.modalDetailCard}>
                            <View
                              style={[
                                styles.modalIconContainer,
                                { backgroundColor: `${detail.color}20` },
                              ]}
                            >
                              <Ionicons name={detail.icon} size={22} color={detail.color} />
                            </View>
                            <Text style={styles.modalDetailLabel}>{detail.label}</Text>
                            <Text style={styles.modalDetailValue}>{detail.value}</Text>
                          </View>
                        ))}
                      </View>

                      {selectedPatient.notes && (
                        <View style={styles.notesSection}>
                          <Text style={styles.modalSectionTitle}>Patient Notes</Text>
                          <View style={styles.notesCard}>
                            <Text style={styles.notesText}>{selectedPatient.notes}</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    <View style={styles.modalFooter}>
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={handleCloseModal}
                      >
                        <Text style={styles.modalCloseButtonText}>Close</Text>
                      </TouchableOpacity>

                      <View style={styles.modalActionButtons}>
                        {selectedPatient.status === 'Pending' && (
                          <>
                            <TouchableOpacity
                              style={[styles.modalActionButton, styles.modalConfirmButton]}
                              onPress={() => {
                                handleUpdateAppointmentStatus(selectedPatient.id, 'Confirmed');
                                handleCloseModal();
                              }}
                            >
                              <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                              <Text style={styles.modalActionButtonText}>Confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.modalActionButton, styles.modalCancelButton]}
                              onPress={() => {
                                handleUpdateAppointmentStatus(selectedPatient.id, 'Cancelled');
                                handleCloseModal();
                              }}
                            >
                              <Ionicons name="close-circle-outline" size={18} color="white" />
                              <Text style={styles.modalActionButtonText}>Cancel</Text>
                            </TouchableOpacity>
                          </>
                        )}
                        {(selectedPatient.status === 'Confirmed' || selectedPatient.status === 'Completed') && (
                          <TouchableOpacity
                            style={[styles.modalActionButton, styles.modalDeleteButton]}
                            onPress={() => handleDeleteAppointment(selectedPatient.id, selectedPatient.status)}
                          >
                            <Ionicons name="trash-outline" size={18} color="white" />
                            <Text style={styles.modalActionButtonText}>Delete</Text>
                          </TouchableOpacity>
                        )}
                        {selectedPatient.status === 'Confirmed' && (
                          <TouchableOpacity
                            style={[styles.modalActionButton, styles.modalCompleteButton]}
                            onPress={() => {
                              handleUpdateAppointmentStatus(selectedPatient.id, 'Completed');
                              handleCloseModal();
                            }}
                          >
                            <Ionicons name="checkmark-done-circle-outline" size={18} color="white" />
                            <Text style={styles.modalActionButtonText}>Complete</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerContainer: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  appointmentSummary: {
    marginTop: 3,
  },
  summaryText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    textAlign: 'center',
  },
  statsContainer: {
    marginTop: -25,
    zIndex: 10,
  },
  statsScrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    marginRight: 10,
    marginTop: 30,
    width: 110,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
  statCount843: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#424242',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
  scrollContainer: {
    paddingTop: 10,
    paddingHorizontal: 15,
  },
  appointmentCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardGradient: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  patientHeaderInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37474F',
    marginBottom: 3,
  },
  patientEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageIcon: {
    padding: 5,
    marginRight: 5,
  },
  deleteIcon: {
    padding: 5,
  },
  cardContent: {
    marginVertical: 10,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  detailBox: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailBoxContent: {
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
  },
  cardFooter: {
    marginTop: 5,
  },
  viewButton: {
    backgroundColor: '#6A11CB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    width: '48.5%',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  completeButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 30,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    paddingTop: 15,
    paddingBottom: 30,
    elevation: 20,
    height: height * 0.8,
  },
  modalHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalHeaderLine: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 2.5,
    marginBottom: 15,
  },
  modalHeaderText: {
    fontSize: 18,
    color: '#616161',
    marginBottom: 15,
  },
  patientProfile: {
    alignItems: 'center',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginBottom: 15,
  },
  modalAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  modalPatientName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#37474F',
    marginBottom: 5,
  },
  modalPatientEmail: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 10,
  },
  modalStatusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#616161',
    marginBottom: 15,
  },
  modalInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginBottom: 20,
  },
  modalDetailCard: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  modalIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalDetailLabel: {
    fontSize: 13,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  modalDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#424242',
  },
  notesSection: {
    marginTop: 5,
  },
  notesCard: {
    backgroundColor: '#F5F7FA',
    padding: 15,
    borderRadius: 15,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#5E5E5E',
  },
  modalFooter: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalCloseButton: {
    backgroundColor: '#EEEEEE',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#616161',
  },
  modalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    flexWrap: 'wrap',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 15,
    width: '48.5%',
    marginBottom: 10,
  },
  modalConfirmButton: {
    backgroundColor: '#4CAF50',
  },
  modalCancelButton: {
    backgroundColor: '#F44336',
  },
  modalDeleteButton: {
    backgroundColor: '#D32F2F',
  },
  modalCompleteButton: {
    backgroundColor: '#2196F3',
  },
  modalActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default PatientInformation;