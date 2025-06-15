import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

const ContactScreen = () => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:support@doctormate.com');
  };

  const handleCallPress = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleChatPress = () => {
    // Implement chat functionality
    console.log('Open chat support');
  };

  const handleFAQPress = () => {
    // Navigate to FAQ screen
    console.log('Navigate to FAQ screen');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Contact & Support</Text>
        <Text style={styles.subtitle}>We're here to help you</Text>
      </View>

      {/* Card Section */}
      <View style={styles.cardContainer}>
        {/* Email Card */}
        <TouchableOpacity style={styles.card} onPress={handleEmailPress}>
          <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
            <MaterialIcons name="email" size={28} color="#1976D2" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Email Support</Text>
            <Text style={styles.cardDescription}>support@doctormate.com</Text>
            <Text style={styles.responseTime}>Response within 24 hours</Text>
          </View>
        </TouchableOpacity>

        {/* Phone Card */}
        <TouchableOpacity style={styles.card} onPress={handleCallPress}>
          <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
            <MaterialIcons name="phone" size={28} color="#2E7D32" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Phone Support</Text>
            <Text style={styles.cardDescription}>+1 (234) 567-890</Text>
            <Text style={styles.responseTime}>Available 9AM - 5PM EST</Text>
          </View>
        </TouchableOpacity>

        {/* Live Chat Card */}
        <TouchableOpacity style={styles.card} onPress={handleChatPress}>
          <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
            <MaterialIcons name="chat" size={28} color="#E65100" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Live Chat</Text>
            <Text style={styles.cardDescription}>Chat with our support team</Text>
            <Text style={styles.responseTime}>Instant assistance</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* FAQ Section */}
      <TouchableOpacity style={styles.faqContainer} onPress={handleFAQPress}>
        <View style={styles.faqContent}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          <Text style={styles.faqDescription}>Browse our knowledge base for quick answers</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="#666" />
      </TouchableOpacity>

      {/* Support Hours Section */}
      <View style={styles.hoursContainer}>
        <Text style={styles.hoursTitle}>Support Hours</Text>
        <View style={styles.hoursRow}>
          <Text style={styles.hoursDay}>Monday - Friday</Text>
          <Text style={styles.hoursTime}>9:00 AM - 5:00 PM</Text>
        </View>
        <View style={styles.hoursRow}>
          <Text style={styles.hoursDay}>Saturday</Text>
          <Text style={styles.hoursTime}>10:00 AM - 2:00 PM</Text>
        </View>
        <View style={styles.hoursRow}>
          <Text style={styles.hoursDay}>Sunday</Text>
          <Text style={styles.hoursTime}>Closed</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
  },
  cardContainer: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 4,
  },
  responseTime: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
  },
  faqContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  faqContent: {
    flex: 1,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  faqDescription: {
    fontSize: 14,
    color: '#757575',
  },
  hoursContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hoursTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hoursDay: {
    fontSize: 16,
    color: '#424242',
  },
  hoursTime: {
    fontSize: 16,
    color: '#424242',
    fontWeight: '500',
  },
});

export default ContactScreen;