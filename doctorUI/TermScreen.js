import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const TermsScreen = () => {
  const renderSection = (icon, title, content) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <FontAwesome name={icon} size={24} color="#3498db" style={styles.icon} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Terms for Medical Professionals</Text>
          <Text style={styles.subtitle}>Please review before using DoctorMate</Text>
        </View>

        {renderSection(
          'calendar-check-o',
          'Appointment Management',
          'As a healthcare provider, you agree to maintain accurate availability schedules. Once a patient books an appointment slot, you will receive a notification. You have 24 hours to confirm or reschedule the appointment.'
        )}

        {renderSection(
          'clock-o',
          'Cancellation Policy',
          'Appointments may be cancelled up to 24 hours in advance. Last-minute cancellations may affect your visibility ranking in patient searches. Emergency cancellations must be accompanied by a reason.'
        )}

        {renderSection(
          'user-md',
          'Professional Conduct',
          'You are responsible for maintaining patient confidentiality and adhering to all applicable medical regulations in your jurisdiction. Your profile information must be accurate and up-to-date.'
        )}

        {renderSection(
          'lock',
          'Data Security',
          'You agree to protect patient information and use secure channels for communication. Do not share login credentials or allow unauthorized access to patient records through the platform.'
        )}

        {renderSection(
          'credit-card',
          'Payment Processing',
          'DoctorMate facilitates payments between patients and providers. Standard processing fees apply. Funds will be transferred to your account within 3-5 business days of appointment completion.'
        )}

        <View style={styles.acceptanceContainer}>
          <TouchableOpacity style={styles.acceptButton}>
            <Text style={styles.acceptButtonText}>Accept Terms</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f9ff',
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#596275',
  },
  acceptanceContainer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  declineText: {
    color: '#7f8c8d',
    fontSize: 14,
  }
});

export default TermsScreen;