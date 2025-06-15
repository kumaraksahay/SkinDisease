import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Linking,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const About = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#8e2de2', '#4a00e0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../src/assets/skin.png')} 
              style={styles.logo}
              defaultSource={require('../src/assets/doctor.png')}
            />
          </View>
          <Text style={styles.appName}>SkinScan</Text>
          <Text style={styles.tagline}>Advanced Skin Health Management</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Mission Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="heart" size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Our Mission</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.paragraph}>
              SkinScan aims to provide a mobile solution for effective skin health management
              through AI-driven technology. Our goal is to empower users with instant skin
              condition detection, appointment scheduling, and educational resources.
            </Text>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="star" size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Key Features</Text>
          </View>
          <View style={styles.card}>
            {features.map((feature, index) => (
              <View key={index} style={[
                styles.featureItem,
                index === features.length - 1 ? { marginBottom: 0 } : null
              ]}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon} size={20} color="#8e2de2" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Appointment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar" size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Dermatologist Appointments</Text>
          </View>
          <LinearGradient
            colors={['#f7f9fe', '#eef2fd']}
            style={[styles.card, styles.gradientCard]}
          >
            <Text style={styles.paragraph}>
              Our app connects you with certified dermatologists for virtual or in-person consultations. 
              After AI-powered skin analysis, you can seamlessly schedule appointments with specialists 
              who can provide professional diagnosis and treatment plans.
            </Text>
            
            <View style={styles.divider} />
            
            <View style={styles.appointmentFeatures}>
              <View style={styles.appointmentFeature}>
                <View style={styles.appFeatureIconContainer}>
                  <Ionicons name="time-outline" size={18} color="#8e2de2" />
                </View>
                <Text style={styles.appointmentFeatureText}>Quick Scheduling</Text>
              </View>
              <View style={styles.appointmentFeature}>
                <View style={styles.appFeatureIconContainer}>
                  <Ionicons name="videocam-outline" size={18} color="#8e2de2" />
                </View>
                <Text style={styles.appointmentFeatureText}>Virtual Consultations</Text>
              </View>
              <View style={styles.appointmentFeature}>
                <View style={styles.appFeatureIconContainer}>
                  <Ionicons name="location-outline" size={18} color="#8e2de2" />
                </View>
                <Text style={styles.appointmentFeatureText}>Nearby Clinics</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.appointmentButton}>
              <LinearGradient
                colors={['#8e2de2', '#4a00e0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.appointmentButtonText}>Book an Appointment</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Contact Us</Text>
          </View>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL('mailto:support@skinscan.com')}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="mail-outline" size={18} color="#8e2de2" />
              </View>
              <Text style={styles.contactText}>support@skinscan.com</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL('tel:+18001234567')}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="call-outline" size={18} color="#8e2de2" />
              </View>
              <Text style={styles.contactText}>+1 (800) 123-4567</Text>
            </TouchableOpacity>
            
            <View style={styles.socialLinks}>
              <TouchableOpacity style={styles.socialButton}>
                <LinearGradient
                  colors={['#3b5998', '#2c4270']}
                  style={styles.socialGradient}
                >
                  <Ionicons name="logo-facebook" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <LinearGradient
                  colors={['#1DA1F2', '#0d8edb']}
                  style={styles.socialGradient}
                >
                  <Ionicons name="logo-twitter" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <LinearGradient
                  colors={['#E1306C', '#c13584']}
                  style={styles.socialGradient}
                >
                  <Ionicons name="logo-instagram" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 SkinScan. All rights reserved.</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Features data
const features = [
  {
    icon: 'scan-outline',
    title: 'AI-based Skin Detection',
    description: 'Instantly analyze skin conditions with our advanced AI technology'
  },
  {
    icon: 'calendar-outline',
    title: 'Easy Appointment Scheduling',
    description: 'Book appointments with certified dermatologists in just a few taps'
  },
  {
    icon: 'book-outline',
    title: 'Comprehensive Health Guides',
    description: 'Access educational resources about various skin conditions'
  },
  {
    icon: 'people-outline',
    title: 'Community Support',
    description: 'Connect with others and share experiences in a supportive environment'
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    height: 200,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#8e2de2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  logoContainer: {
    width: 95,
    height: 95,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 22,
    marginTop: -30,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#8e2de2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#8e2de2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  gradientCard: {
    borderWidth: 1,
    borderColor: '#e9eeff',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f2edff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9eeff',
    marginVertical: 18,
  },
  appointmentFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  appointmentFeature: {
    alignItems: 'center',
    flex: 1,
  },
  appFeatureIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f2edff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appointmentFeatureText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
  },
  appointmentButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#8e2de2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginLeft: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f2edff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#444',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  socialButton: {
    marginHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  socialGradient: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 6,
    marginBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: '#8e2de2',
  },
  footerDot: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 6,
  }
});

export default About;