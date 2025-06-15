import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const PrivacyScreen = () => {
  const renderPrivacySection = (icon, title, content) => {
    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconContainer}>
            <FontAwesome5 name={icon} size={20} color="#fff" />
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Text style={styles.sectionContent}>{content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#1a5276', '#2471a3']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MaterialIcons name="privacy-tip" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSubtitle}>For Healthcare Professionals</Text>
        </View>
      </LinearGradient>
      
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.introCard}>
          <Text style={styles.introParagraph}>
            At DoctorMate, we understand the critical importance of privacy in healthcare. 
            This policy explains how we protect your information and maintain HIPAA compliance 
            when you use our platform as a medical professional.
          </Text>
        </View>

        {renderPrivacySection(
          "user-md", 
          "Physician Information Collection",
          "We collect professional information including medical credentials, specialization, " +
          "license numbers, and practice information required for verification and to maintain " +
          "a trusted network of healthcare providers. All credentials are verified through secure channels."
        )}

        {renderPrivacySection(
          "shield-alt", 
          "Data Security Measures",
          "Your data is protected with enterprise-grade encryption both in transit and at rest. " +
          "We implement multi-factor authentication and maintain continuous security monitoring " +
          "systems that exceed industry standards for healthcare applications."
        )}

        {renderPrivacySection(
          "file-medical-alt", 
          "Patient Data Protection",
          "Any patient information you access through our platform is handled in strict compliance " +
          "with HIPAA regulations. We maintain audit logs of all data access and implement " +
          "role-based access controls to prevent unauthorized access to sensitive information."
        )}

        {renderPrivacySection(
          "laptop-medical", 
          "Your Professional Dashboard",
          "Information displayed on your professional dashboard is securely transmitted and " +
          "access-controlled. We never share your practice metrics or patient interaction data " +
          "with unauthorized third parties."
        )}

        {renderPrivacySection(
          "handshake", 
          "Third-Party Integration Policy",
          "When connecting with EHR systems or other medical tools, we maintain secure API " +
          "connections with minimal-access principles. All integrations undergo rigorous " +
          "security assessments before implementation."
        )}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions About Our Privacy Practices?</Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contact Data Protection Officer</Text>
          </TouchableOpacity>
          <Text style={styles.contactEmail}>privacy@doctormate.com</Text>
        </View>

        <Text style={styles.versionText}>Privacy Policy v3.2 - Last updated: February 15, 2025</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f9fc',
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0f0ff',
    marginTop: 4,
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introParagraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#445a74',
  },
  sectionCard: {
    backgroundColor: '#fff',
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#546e7a',
    paddingLeft: 52,
  },
  contactSection: {
    backgroundColor: '#eaf2f8',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: '#2980b9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  contactEmail: {
    fontSize: 15,
    color: '#2980b9',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#95a5a6',
    marginTop: 8,
    marginBottom: 24,
  },
});

export default PrivacyScreen;