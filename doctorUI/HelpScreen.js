import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking,
  Image,
  TextInput,
  SafeAreaView
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const HelpScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState('schedule');

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@doctormate.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+18005551234');
  };

  const FaqSection = ({ title, icon, questions, id }) => {
    const isExpanded = expandedSection === id;
    
    return (
      <View style={styles.faqContainer}>
        <TouchableOpacity 
          style={[styles.faqHeader, isExpanded && styles.faqHeaderActive]}
          onPress={() => setExpandedSection(isExpanded ? null : id)}
        >
          <View style={styles.faqHeaderLeft}>
            <FontAwesome name={icon} size={22} color="#4a6da7" />
            <Text style={styles.faqTitle}>{title}</Text>
          </View>
          <FontAwesome 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#4a6da7" 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.faqContent}>
            {questions.map((item, index) => (
              <View key={index} style={styles.questionContainer}>
                <View style={styles.questionBox}>
                  <Text style={styles.question}>{item.q}</Text>
                  <FontAwesome name="question-circle" size={16} color="#4a6da7" />
                </View>
                <Text style={styles.answer}>{item.a}</Text>
                {item.steps && (
                  <View style={styles.stepsContainer}>
                    {item.steps.map((step, idx) => (
                      <View key={idx} style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Doctor Help Center</Text>
            <Text style={styles.headerText}>Find answers to common questions and get assistance</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={20} color="#aaa" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help topics..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinksContainer}>
          <TouchableOpacity style={styles.quickLink}>
            <View style={[styles.quickLinkIcon, {backgroundColor: '#e8f4ff'}]}>
              <FontAwesome name="calendar-plus-o" size={22} color="#4a6da7" />
            </View>
            <Text style={styles.quickLinkText}>Add Slots</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickLink}>
            <View style={[styles.quickLinkIcon, {backgroundColor: '#e8ffea'}]}>
              <FontAwesome name="check-circle" size={22} color="#2a9d5c" />
            </View>
            <Text style={styles.quickLinkText}>Confirm Appointments</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickLink}>
            <View style={[styles.quickLinkIcon, {backgroundColor: '#fff4e8'}]}>
              <FontAwesome name="user" size={22} color="#e67e22" />
            </View>
            <Text style={styles.quickLinkText}>Patient Records</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Sections */}
        <FaqSection
          id="schedule"
          title="Managing Your Schedule"
          icon="calendar"
          questions={[
            {
              q: "How do I create a schedule?",
              a: "Creating your availability schedule is simple:",
              steps: [
                "Go to the Schedule tab in your dashboard",
                "Select 'Add Slot' button at the top right",
                "Set your available days, times, and recurring patterns",
                "Tap Save to publish your availability"
              ]
            },
            {
              q: "Can I set recurring availability?",
              a: "Yes, when creating slots, toggle 'Recurring' and select your preferred pattern (weekly, bi-weekly, monthly)."
            },
            {
              q: "How do I block out vacation time?",
              a: "Use the 'Vacation Mode' feature to block out extended periods. Go to Schedule → Manage → Vacation Mode."
            }
          ]}
        />
        
        <FaqSection
          id="appointments"
          title="Appointment Management"
          icon="calendar-check-o"
          questions={[
            {
              q: "How do I confirm an appointment?",
              a: "To confirm an appointment request from a patient:",
              steps: [
                "Go to the Appointments tab",
                "Find the pending request in the 'Awaiting Confirmation' section",
                "Tap the green check icon to confirm",
                "Optionally add notes or pre-appointment instructions"
              ]
            },
            {
              q: "How can I reschedule a patient?",
              a: "To reschedule, select the appointment and tap 'Reschedule'. Choose a new available slot and add a reason for rescheduling."
            }
          ]}
        />
        
        <FaqSection
          id="billing"
          title="Billing & Payments"
          icon="credit-card"
          questions={[
            {
              q: "When do I receive payments?",
              a: "Payments are processed 24 hours after completed appointments and deposited to your connected bank account within 2-3 business days."
            },
            {
              q: "How do I set up my payment details?",
              a: "Go to Profile → Payment Settings → Connect Bank Account to enter your banking information securely."
            }
          ]}
        />

        {/* Contact Support Section */}
        <View style={styles.supportContainer}>
          <Text style={styles.supportTitle}>Still Need Help?</Text>
          <Text style={styles.supportText}>
            Our dedicated medical provider support team is available 24/7
          </Text>
          
          <View style={styles.contactOptions}>
            <TouchableOpacity style={styles.contactButton} onPress={handleEmailPress}>
              <FontAwesome name="envelope" size={18} color="#fff" />
              <Text style={styles.contactButtonText}>Email Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactButton} onPress={handlePhonePress}>
              <FontAwesome name="phone" size={18} color="#fff" />
              <Text style={styles.contactButtonText}>Call Support</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.supportHours}>
            <FontAwesome name="clock-o" size={16} color="#4a6da7" />
            <Text style={styles.supportHoursText}>
              Support Hours: Mon-Fri 8AM-8PM EST
            </Text>
          </View>
        </View>
        
        {/* Video Tutorials */}
        <View style={styles.videoSection}>
          <Text style={styles.videoTitle}>Video Tutorials</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videoScrollView}>
            <TouchableOpacity style={styles.videoCard}>
              <View style={styles.videoThumbnail}>
                <FontAwesome name="play-circle" size={40} color="#fff" />
              </View>
              <Text style={styles.videoCardTitle}>Schedule Management</Text>
              <Text style={styles.videoDuration}>4:23</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.videoCard}>
              <View style={styles.videoThumbnail}>
                <FontAwesome name="play-circle" size={40} color="#fff" />
              </View>
              <Text style={styles.videoCardTitle}>Patient Communication</Text>
              <Text style={styles.videoDuration}>3:45</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.videoCard}>
              <View style={styles.videoThumbnail}>
                <FontAwesome name="play-circle" size={40} color="#fff" />
              </View>
              <Text style={styles.videoCardTitle}>Billing Overview</Text>
              <Text style={styles.videoDuration}>5:12</Text>
            </TouchableOpacity>
          </ScrollView>
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
    flex: 1,
  },
  header: {
    backgroundColor: '#4a6da7',
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: -20,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  quickLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginHorizontal: 20,
  },
  quickLink: {
    alignItems: 'center',
    width: '30%',
  },
  quickLinkIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLinkText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  faqContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  faqHeaderActive: {
    backgroundColor: '#f8faff',
  },
  faqHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqTitle: {
    marginLeft: 12,
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  faqContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  questionContainer: {
    marginTop: 12,
  },
  questionBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  answer: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    lineHeight: 22,
  },
  stepsContainer: {
    marginTop: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4a6da7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
    lineHeight: 22,
  },
  supportContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
  },
  contactOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a6da7',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 0.48,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  supportHours: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  supportHoursText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  videoSection: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 30,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  videoScrollView: {
    paddingBottom: 8,
  },
  videoCard: {
    width: 200,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  videoThumbnail: {
    height: 110,
    backgroundColor: '#4a6da7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    padding: 10,
    paddingBottom: 4,
  },
  videoDuration: {
    fontSize: 12,
    color: '#888',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});

export default HelpScreen;