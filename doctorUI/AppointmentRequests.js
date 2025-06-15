import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Share
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const AppointmentRequests = ({ route, navigation }) => {
  // Destructure with default values to prevent undefined errors
  const { 
    doctor = {}, 
    doctorName = '', 
    doctorAddress = '', 
    date = '', 
    time = '', 
    appointmentId = '' 
  } = route.params || {};

  const displayDoctorName = doctorName || doctor.fullName || 'Unknown Doctor';

  const handleShareReceipt = async () => {
    try {
      const shareContent = `
Appointment Confirmation
------------------------
Doctor: ${displayDoctorName}
Address: ${doctorAddress || doctor.address || 'Not Available'}
Date: ${date}
Time: ${time}
Appointment ID: ${appointmentId}

Thank you for your visit!
      `;

      await Share.share({
        message: shareContent,
        title: 'Appointment Confirmation'
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={['#6A11CB', '#2575FC']} 
        style={styles.headerContainer}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Appointment Confirmation</Text>
      </LinearGradient>

      <View style={styles.receiptContainer}>
        <View style={styles.receiptHeader}>
          <Text style={styles.doctorName}>Dr. {displayDoctorName}</Text>
          <Text style={styles.headerSubtext}>Thank You for Your Visit</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={24} color="#007bff" />
            <Text style={styles.detailText}>{date || 'Date Not Specified'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={24} color="#007bff" />
            <Text style={styles.detailText}>{time || 'Time Not Specified'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={24} color="#007bff" />
            <Text style={styles.detailText}>
              {doctorAddress || doctor.address || 'Address Not Available'}
            </Text>
          </View>
        </View>

        <View style={styles.qrContainer}>
          <QRCode
            value={appointmentId || 'No Appointment ID'}
            size={200}
            color="black"
            backgroundColor="white"
          />
          <Text style={styles.appointmentIdText}>
            Appointment ID: {appointmentId || 'Not Available'}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShareReceipt}
        >
          <Ionicons name="share-social" size={24} color="white" />
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  receiptContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 15,
    elevation: 5,
    padding: 20,
    alignItems: 'center',
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  headerSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  detailText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appointmentIdText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppointmentRequests;