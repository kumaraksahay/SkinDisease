import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const Support = () => {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('faq');
  
  const handleSubmit = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message.');
      return;
    }
    Alert.alert('Success', 'Your message has been sent.');
    setMessage('');
  };
  
  const renderFAQItem = (question, answer) => (
    <View style={styles.faqItem}>
      <View style={styles.questionContainer}>
        <Ionicons name="help-circle" size={22} color="#8e2de2" />
        <Text style={styles.question}>{question}</Text>
      </View>
      <Text style={styles.answer}>{answer}</Text>
    </View>
  );
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#8e2de2', '#4a00e0']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Support Center</Text>
          <Text style={styles.headerSubtitle}>We're here to help you</Text>
        </View>
      </LinearGradient>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'faq' && styles.activeTab
          ]}
          onPress={() => setActiveTab('faq')}
        >
          <Ionicons 
            name="document-text" 
            size={18} 
            color={activeTab === 'faq' ? '#8e2de2' : '#777'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'faq' && styles.activeTabText
          ]}>FAQs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'contact' && styles.activeTab
          ]}
          onPress={() => setActiveTab('contact')}
        >
          <Ionicons 
            name="mail" 
            size={18} 
            color={activeTab === 'contact' ? '#8e2de2' : '#777'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'contact' && styles.activeTabText
          ]}>Contact Us</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'faq' ? (
          <View style={styles.faqContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={24} color="#8e2de2" />
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            </View>
            
            <View style={styles.card}>
              {renderFAQItem(
                "How do I book an appointment?",
                "Navigate to the Appointments tab, select your preferred dermatologist, then choose an available time slot that works for you. You can filter doctors by specialty or location."
              )}
              
              {renderFAQItem(
                "How does the AI-based detection work?",
                "Take a clear photo of your skin concern using the app camera. Our AI will analyze the image against a database of skin conditions and provide potential matches with confidence levels."
              )}
              
              {renderFAQItem(
                "Is my medical data secure?",
                "Absolutely. SkinScan uses end-to-end encryption and follows HIPAA compliance standards. Your medical information is never shared without your explicit consent."
              )}
              
              {renderFAQItem(
                "Can I get a prescription through the app?",
                "Yes, for certain conditions. After your virtual consultation, the dermatologist can issue electronic prescriptions where appropriate and legally allowed."
              )}
              
              {renderFAQItem(
                "How do I update my profile information?",
                "Go to Profile → Edit Profile, where you can update your personal details, medical history, and preferences."
              )}
            </View>
          </View>
        ) : (
          <View style={styles.contactContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles" size={24} color="#8e2de2" />
              <Text style={styles.sectionTitle}>Contact Support</Text>
            </View>
            
            <View style={styles.card}>
              <Text style={styles.contactLabel}>Message</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="create-outline" size={20} color="#8e2de2" style={styles.inputIcon} />
                <TextInput
                  style={styles.messageInput}
                  placeholder="Describe your issue in detail..."
                  placeholderTextColor="#999"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.buttonText}>Submit Ticket</Text>
              </TouchableOpacity>
              
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.line} />
              </View>
              
              <View style={styles.contactOptionsContainer}>
                <TouchableOpacity style={styles.contactOption}>
                  <View style={[styles.contactOptionIcon, { backgroundColor: 'rgba(142, 45, 226, 0.1)' }]}>
                    <Ionicons name="chatbubbles-outline" size={24} color="#8e2de2" />
                  </View>
                  <Text style={styles.contactOptionText}>Live Chat</Text>
                  <Text style={styles.contactOptionSubtext}>Available 24/7</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.contactOption}>
                  <View style={[styles.contactOptionIcon, { backgroundColor: 'rgba(40, 167, 69, 0.1)' }]}>
                    <Ionicons name="call-outline" size={24} color="#28a745" />
                  </View>
                  <Text style={styles.contactOptionText}>Call Support</Text>
                  <Text style={styles.contactOptionSubtext}>9am - 6pm EST</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.emailContainer}>
                <Ionicons name="mail-outline" size={18} color="#666" />
                <Text style={styles.emailText}>support@skinscan.com</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    height: 150,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 5,
    borderRadius: 30,
    marginTop: -25,
    marginHorizontal: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 30,
  },
  activeTab: {
    backgroundColor: 'rgba(142, 45, 226, 0.1)',
  },
  tabText: {
    marginLeft: 5,
    fontWeight: '500',
    color: '#777',
  },
  activeTabText: {
    color: '#8e2de2',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  faqItem: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  answer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 30,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 15,
  },
  inputIcon: {
    marginTop: 12,
    marginLeft: 10,
  },
  messageInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#8e2de2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 14,
  },
  contactOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  contactOption: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  contactOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  contactOptionSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});

export default Support;