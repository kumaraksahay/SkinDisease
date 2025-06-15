import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const { width, height } = Dimensions.get('window');

// Enhanced Color Constants with more vibrant and harmonious colors
const COLORS = {
  PRIMARY: '#3A86FF',        // Vibrant Blue (Primary)
  SECONDARY: '#2D3748',      // Dark Slate (Headers)
  BACKGROUND: '#F6F9FC',     // Soft Blue-White (Background)
  TEXT_DARK: '#1A202C',      // Deep Charcoal (Primary Text)
  TEXT_MEDIUM: '#4A5568',    // Slate Gray (Secondary Text)
  TEXT_LIGHT: '#FFFFFF',     // White (Light Text)
  PENDING: '#FF9F1C',        // Bright Orange (Pending)
  CONFIRMED: '#3A86FF',      // Vibrant Blue (Confirmed)
  COMPLETED: '#4CAF50',      // Bright Green (Completed)
  CANCELLED: '#F56565',      // Coral Red (Cancelled)
  GRAY: '#CBD5E0',           // Light Gray (Neutral)
  CARD_SHADOW: '#00000020',  // Subtle Shadow
  LIGHT_ACCENT: '#E6F2FF',   // Soft Light Blue (Subtle Accents)
  BUTTON_GRADIENT: ['#3A86FF', '#2B6CB0'], // Blue gradient
  CARD_GRADIENT: ['#FFFFFF', '#F6F9FC'],   // White to Soft Blue-White gradient
  LIGHT_GRAY: '#D3D3D3',     // Light Gray for appointment container
};

const PatientAppointmentDetails = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('All');
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      navigation.replace('Login');
      return;
    }

    const unsubscribe = firestore()
      .collection('appointments')
      .where('userId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const appointmentData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAppointments(appointmentData);
        filterAppointments(selectedTab, appointmentData);
        setLoading(false);
      }, error => {
        console.error("Fetching appointments failed:", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [navigation]);

  const filterAppointments = (status, data = appointments) => {
    setSelectedTab(status);
    if (status === 'All') {
      setFilteredAppointments(data);
    } else {
      const filtered = data.filter(appointment => 
        status === 'Pending' ? appointment.status === 'Pending' :
        status === 'Confirmed' ? appointment.status === 'Confirmed' :
        status === 'Completed' ? appointment.status === 'Completed' :
        status === 'Cancelled' ? appointment.status === 'Cancelled' : false
      );
      setFilteredAppointments(filtered);
    }
  };

  const handleViewQRCode = (appointment) => {
    setSelectedAppointment(appointment);
    setQrModalVisible(true);
  };

  const handleDeleteAppointment = (appointmentId) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this appointment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore().collection('appointments').doc(appointmentId).delete();
              Alert.alert("Success", "Appointment deleted successfully.");
            } catch (error) {
              console.error("Error deleting appointment:", error);
              Alert.alert("Error", "Failed to delete appointment.");
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return COLORS.PENDING;
      case 'Confirmed': return COLORS.CONFIRMED;
      case 'Completed': return COLORS.COMPLETED;
      case 'Cancelled': return COLORS.CANCELLED;
      default: return COLORS.GRAY;
    }
  };

  const getStatusBackground = (status) => {
    switch (status) {
      case 'Pending': return 'rgba(255, 159, 28, 0.15)';
      case 'Confirmed': return 'rgba(58, 134, 255, 0.15)';
      case 'Completed': return 'rgba(76, 175, 80, 0.15)';
      case 'Cancelled': return 'rgba(245, 101, 101, 0.15)';
      default: return 'rgba(203, 213, 224, 0.15)';
    }
  };

  const generateQRCodeData = (appointment) => {
    return JSON.stringify({
      appointmentId: appointment.id,
      patientName: appointment.userName,
      patientAge: appointment.userAge,
      patientMobile: appointment.userMobile,
      doctorName: appointment.doctorName,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status
    });
  };

  const renderTabButtons = () => {
    const tabs = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map(tab => {
          const isActive = selectedTab === tab;
          const count = tab === 'All' 
            ? appointments.length 
            : appointments.filter(a => a.status === tab).length;
          
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                isActive && styles.activeTabButton,
                { backgroundColor: isActive ? COLORS.TEXT_LIGHT : 'rgba(255, 255, 255, 0.3)' }
              ]}
              onPress={() => filterAppointments(tab)}
            >
              <Text style={[
                styles.tabCount,
                isActive && { color: getStatusColor(tab === 'All' ? 'Confirmed' : tab) }
              ]}>
                {count}
              </Text>
              <Text style={[
                styles.tabLabel,
                isActive && { color: getStatusColor(tab === 'All' ? 'Confirmed' : tab) }
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderAppointmentCard = (appointment) => {
    const statusColor = getStatusColor(appointment.status);
    const statusBgColor = getStatusBackground(appointment.status);
    
    return (
      <TouchableOpacity 
        key={appointment.id}
        style={styles.appointmentCard}
        onPress={() => handleViewQRCode(appointment)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={COLORS.CARD_GRADIENT}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.doctorInfoContainer}>
              <View style={[styles.doctorIconContainer, { backgroundColor: statusBgColor }]}>
                <Ionicons name="medical" size={16} color={statusColor} />
              </View>
              <View>
                <Text style={styles.doctorName}>Dr. {appointment.doctorName}</Text>
                <Text style={styles.specialization}>
                  {appointment.specialization || 'Dermatologist'}
                </Text>
              </View>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: statusBgColor }
            ]}>
              <Text style={[
                styles.statusText,
                { color: statusColor }
              ]}>
                {appointment.status}
              </Text>
            </View>
          </View>
          
          <View style={[styles.appointmentInfoBanner, { backgroundColor: COLORS.LIGHT_ACCENT }]}>
            <View style={styles.bannerItem}>
              <Ionicons name="calendar" size={12} color={COLORS.PRIMARY} />
              <Text style={styles.bannerText}>{appointment.date}</Text>
            </View>
            <View style={styles.bannerDivider} />
            <View style={styles.bannerItem}>
              <Ionicons name="time" size={12} color={COLORS.PRIMARY} />
              <Text style={styles.bannerText}>{appointment.time}</Text>
            </View>
          </View>
          
          <View style={styles.appointmentDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="person" size={12} color={COLORS.PRIMARY} />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Patient</Text>
                  <Text style={styles.detailText}>{appointment.userName}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="call" size={12} color={COLORS.PRIMARY} />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Contact</Text>
                  <Text style={styles.detailText}>{appointment.userMobile}</Text>
                </View>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="medkit" size={12} color={COLORS.PRIMARY} />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Age</Text>
                  <Text style={styles.detailText}>{appointment.userAge} yrs</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="information-circle" size={12} color={COLORS.PRIMARY} />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailText, {color: statusColor, fontWeight: '700'}]}>
                    {appointment.status}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <TouchableOpacity 
              style={styles.viewQrButton}
              onPress={() => handleViewQRCode(appointment)}
            >
              <LinearGradient
                colors={[statusColor, statusColor === COLORS.PENDING ? '#E67E22' : statusColor === COLORS.COMPLETED ? '#2E7D32' : '#2B6CB0']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.gradientButton}
              >
                <Ionicons name="qr-code" size={14} color={COLORS.TEXT_LIGHT} />
                <Text style={styles.viewQrButtonText}>View QR Code</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.deleteButton, { backgroundColor: 'rgba(245, 101, 101, 0.15)' }]}
              onPress={() => handleDeleteAppointment(appointment.id)}
            >
              <Ionicons name="trash" size={16} color={COLORS.CANCELLED} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.BACKGROUND, COLORS.LIGHT_ACCENT]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <LinearGradient 
        colors={[COLORS.SECONDARY, COLORS.PRIMARY]} 
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.headerContainer}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.TEXT_LIGHT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Appointments</Text>
        </View>
        {renderTabButtons()}
      </LinearGradient>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading your appointments...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.contentContainer}
          contentContainerStyle={styles.contentScrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map(renderAppointmentCard)
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: COLORS.LIGHT_ACCENT }]}>
                <Ionicons name="calendar" size={50} color={COLORS.PRIMARY} />
              </View>
              <Text style={styles.emptyText}>No {selectedTab} appointments</Text>
              <Text style={styles.emptySubtext}>
                Your {selectedTab.toLowerCase() === 'all' ? '' : selectedTab.toLowerCase()} appointments will appear here
              </Text>
              <TouchableOpacity style={styles.emptyActionButton}>
                <LinearGradient
                  colors={COLORS.BUTTON_GRADIENT}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.gradientButton}
                >
                  <Ionicons name="add" size={18} color={COLORS.TEXT_LIGHT} />
                  <Text style={styles.emptyActionButtonText}>Book New Appointment</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
      
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Appointment Details</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
            
            {selectedAppointment && (
              <View style={styles.modalContent}>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={generateQRCodeData(selectedAppointment)}
                    size={180}
                    color={COLORS.TEXT_DARK}
                    backgroundColor={COLORS.TEXT_LIGHT}
                    logoBackgroundColor='transparent'
                  />
                </View>
                
                <View style={[
                  styles.appointmentStatusBadge,
                  { backgroundColor: getStatusBackground(selectedAppointment.status) }
                ]}>
                  <Text style={[
                    styles.appointmentStatusText,
                    { color: getStatusColor(selectedAppointment.status) }
                  ]}>
                    {selectedAppointment.status}
                  </Text>
                </View>
                
                <View style={[styles.appointmentInfoContainer, { backgroundColor: COLORS.LIGHT_GRAY }]}>
                  <View style={styles.appointmentContent}>
                    <View style={styles.appointmentInfoRow}>
                      <Text style={styles.appointmentInfoLabel}>Doctor</Text>
                      <Text style={styles.appointmentInfoValue}>Dr. {selectedAppointment.doctorName}</Text>
                    </View>
                    <View style={styles.appointmentInfoRow}>
                      <Text style={styles.appointmentInfoLabel}>Patient</Text>
                      <Text style={styles.appointmentInfoValue}>{selectedAppointment.userName}</Text>
                    </View>
                    <View style={styles.appointmentInfoRow}>
                      <Text style={styles.appointmentInfoLabel}>Age</Text>
                      <Text style={styles.appointmentInfoValue}>{selectedAppointment.userAge} yrs</Text>
                    </View>
                    <View style={styles.appointmentInfoRow}>
                      <Text style={styles.appointmentInfoLabel}>Mobile</Text>
                      <Text style={styles.appointmentInfoValue}>{selectedAppointment.userMobile}</Text>
                    </View>
                    <View style={styles.appointmentInfoRow}>
                      <Text style={styles.appointmentInfoLabel}>Date</Text>
                      <Text style={styles.appointmentInfoValue}>{selectedAppointment.date}</Text>
                    </View>
                    <View style={styles.appointmentInfoRow}>
                      <Text style={styles.appointmentInfoLabel}>Time</Text>
                      <Text style={styles.appointmentInfoValue}>{selectedAppointment.time}</Text>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.closeModalButton}
                  onPress={() => setQrModalVisible(false)}
                >
                  <LinearGradient
                    colors={[getStatusColor(selectedAppointment.status), 
                            selectedAppointment.status === 'Pending' ? '#E67E22' : 
                            selectedAppointment.status === 'Completed' ? '#2E7D32' : '#2B6CB0']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.closeModalButtonText}>Close</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  headerContainer: {
    paddingTop: StatusBar.currentHeight + 10,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
    flex: 1,
  },
  tabsContainer: {
    marginTop: 15,
    paddingLeft: 15,
  },
  tabsContent: {
    paddingRight: 15,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 15,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  activeTabButton: {
    elevation: 2,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabCount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  tabLabel: {
    fontSize: 12,
    color: COLORS.TEXT_MEDIUM,
    marginTop: 4,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  contentScrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  appointmentCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 3,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 2,
  },
  specialization: {
    fontSize: 10,
    color: COLORS.TEXT_MEDIUM,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 10,
  },
  appointmentInfoBanner: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 11,
    color: COLORS.TEXT_DARK,
  },
  bannerDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(203, 213, 224, 0.5)',
  },
  appointmentDetails: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  detailIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.LIGHT_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  detailLabel: {
    fontSize: 10,
    color: COLORS.TEXT_MEDIUM,
    marginBottom: 1,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewQrButton: {
    width: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  viewQrButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 6,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.TEXT_MEDIUM,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.TEXT_MEDIUM,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  emptyActionButton: {
    width: '70%',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
  },
  emptyActionButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    backgroundColor: COLORS.TEXT_LIGHT,
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  modalContent: {
    alignItems: 'center',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: COLORS.TEXT_LIGHT,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 4,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.GRAY,
  },
  appointmentStatusBadge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  appointmentStatusText: {
    fontWeight: '700',
    fontSize: 14,
  },
  appointmentInfoContainer: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  appointmentContent: {
    width: '100%',
  },
  appointmentInfoRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(203, 213, 224, 0.5)',
  },
  appointmentInfoLabel: {
    width: '30%',
    fontSize: 14,
    color: COLORS.TEXT_MEDIUM,
    fontWeight: '600',
  },
  appointmentInfoValue: {
    width: '70%',
    fontSize: 14,
    color: COLORS.TEXT_DARK,
    fontWeight: '700',
  },
  closeModalButton: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  closeModalButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '700',
  }
});

export default PatientAppointmentDetails;