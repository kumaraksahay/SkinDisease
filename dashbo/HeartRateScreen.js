import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Vibration, 
  Alert, 
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const HeartRateScreen = () => {
  const [bpm, setBpm] = useState(0);
  const [measuring, setMeasuring] = useState(false);
  const [pressStartTime, setPressStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5); // 5 seconds for measurement
  const [measurementHistory, setMeasurementHistory] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('measure');
  const MEASUREMENT_DURATION = 5; // in seconds

  // Fetch all measurements from Firestore
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      console.warn('No authenticated user');
      setLoading(false);
      return;
    }

    // Real-time listener for heart rate measurements
    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('heartRateMeasurements')
      .orderBy('timestamp', 'desc')
      .onSnapshot(
        (snapshot) => {
          const measurements = snapshot.docs.map((doc) => {
            const data = doc.data();
            // Convert Firestore timestamp to formatted string
            const timestamp = data.timestamp
              ? data.timestamp.toDate().toLocaleString()
              : new Date().toLocaleString();
            return { bpm: data.bpm, timestamp };
          });
          setMeasurementHistory(measurements);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching measurements:', error);
          setMeasurementHistory([]);
          setLoading(false);
        }
      );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Handle long press start
  const handlePressIn = () => {
    if (measuring) return;
    setMeasuring(true);
    setPressStartTime(Date.now());
    setTimeLeft(MEASUREMENT_DURATION);
    setBpm(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => Vibration.vibrate(100));
  };

  // Handle press release
  const handlePressOut = () => {
    if (!measuring) return;
    const pressDuration = (Date.now() - pressStartTime) / 1000; // in seconds
    setMeasuring(false);
    setPressStartTime(null);
    setTimeLeft(MEASUREMENT_DURATION);

    if (pressDuration < MEASUREMENT_DURATION - 0.1) { // Allow slight timing variation
      Alert.alert('Measurement Incomplete', 'Please hold for the full 5 seconds to measure your heart rate.');
      return;
    }

    // Simulate heart rate calculation
    calculateBpm();
  };

  // Update time left during measurement
  useEffect(() => {
    if (!measuring) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [measuring]);

  // Simulate BPM calculation and save to Firestore
  const calculateBpm = () => {
    // Simulate realistic BPM with natural variation
    const baseBpm = Math.floor(Math.random() * (100 - 60 + 1)) + 60; // 60-100 BPM
    const variation = Math.sin(Date.now() / 1000) * 3; // Subtle fluctuation
    const finalBpm = Math.round(baseBpm + variation);
    setBpm(finalBpm);

    // Save to Firestore
    const user = auth().currentUser;
    if (user) {
      firestore()
        .collection('users')
        .doc(user.uid)
        .collection('heartRateMeasurements')
        .add({
          bpm: finalBpm,
          timestamp: firestore.FieldValue.serverTimestamp(),
        })
        .catch((error) => {
          console.error('Error saving BPM:', error);
          Alert.alert('Error', 'Failed to save measurement.');
        });
    } else {
      console.warn('No authenticated user');
      Alert.alert('Error', 'Please sign in to save measurements.');
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => Vibration.vibrate(200));
  };

  // Determine BPM status and color
  const getBpmStatus = (bpmValue) => {
    if (!bpmValue) return { text: 'Not measured', color: '#888' };
    if (bpmValue < 60) return { text: 'Low', color: '#3498db' };
    if (bpmValue <= 100) return { text: 'Normal', color: '#2ecc71' };
    return { text: 'High', color: '#e74c3c' };
  };

  const bpmStatus = getBpmStatus(bpm);

  // Render measurement tab content
  const renderMeasureTab = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.bpmDisplayContainer}>
        <LinearGradient
          colors={['#ff7e5f', '#feb47b']}
          style={styles.bpmGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.bpmInnerContainer}>
            <Text style={styles.bpmValue}>{bpm || '--'}</Text>
            <Text style={styles.bpmUnit}>BPM</Text>
            <Text style={[styles.bpmStatus, { color: bpmStatus.color }]}>
              {bpmStatus.text}
            </Text>
          </View>
        </LinearGradient>
      </View>

      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={measuring ? ['#ff5e62', '#ff9966'] : ['#4776E6', '#8E54E9']}
          style={[styles.measureButton, measuring && styles.measureButtonActive]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.measureButtonContent}>
            {measuring ? (
              <View style={styles.measuringIndicator}>
                <Text style={styles.timeLeftText}>{timeLeft}</Text>
                <FontAwesome5 name="heartbeat" size={30} color="#fff" style={styles.pulsingHeart} />
              </View>
            ) : (
              <>
                <Ionicons name="finger-print" size={40} color="#fff" />
                <Text style={styles.measureButtonText}>Hold to Measure</Text>
              </>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>How to Measure</Text>
        <View style={styles.instructionItem}>
          <View style={styles.instructionIcon}>
            <Ionicons name="finger-print" size={24} color="#4776E6" />
          </View>
          <Text style={styles.instructionText}>Place your finger firmly on the button</Text>
        </View>
        <View style={styles.instructionItem}>
          <View style={styles.instructionIcon}>
            <Ionicons name="timer-outline" size={24} color="#4776E6" />
          </View>
          <Text style={styles.instructionText}>Hold steady for 5 seconds</Text>
        </View>
        <View style={styles.instructionItem}>
          <View style={styles.instructionIcon}>
            <Ionicons name="body-outline" size={24} color="#4776E6" />
          </View>
          <Text style={styles.instructionText}>Stay relaxed & breathe normally</Text>
        </View>
        <View style={styles.instructionItem}>
          <View style={styles.instructionIcon}>
            <Ionicons name="heart-circle-outline" size={24} color="#4776E6" />
          </View>
          <Text style={styles.instructionText}>Results will appear automatically</Text>
        </View>
      </View>
    </ScrollView>
  );

  // Render history tab content
  const renderHistoryTab = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Measurement History</Text>
        <View style={styles.historyFilterContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="calendar-outline" size={18} color="#555" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4776E6" />
          <Text style={styles.loadingText}>Loading measurements...</Text>
        </View>
      ) : measurementHistory.length === 0 ? (
        <View style={styles.emptyHistoryContainer}>
          <Ionicons name="heart-dislike-outline" size={60} color="#ccc" />
          <Text style={styles.emptyHistoryText}>No measurements yet</Text>
          <Text style={styles.emptyHistorySubtext}>
            Your heart rate history will appear here
          </Text>
        </View>
      ) : (
        measurementHistory.map((item, index) => {
          const status = getBpmStatus(item.bpm);
          return (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyCardLeft}>
                <View style={[styles.bpmIndicator, { backgroundColor: status.color }]}>
                  <Ionicons name="heart" size={16} color="#fff" />
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyBpm}>{item.bpm} BPM</Text>
                  <Text style={styles.historyStatus}>{status.text}</Text>
                </View>
              </View>
              <Text style={styles.historyTimestamp}>{item.timestamp}</Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4776E6', '#8E54E9']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Heart Monitor</Text>
        <FontAwesome5 name="heartbeat" size={24} color="#fff" />
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'measure' && styles.activeTab]}
          onPress={() => setActiveTab('measure')}
        >
          <Ionicons 
            name="heart" 
            size={20} 
            color={activeTab === 'measure' ? '#4776E6' : '#888'} 
          />
          <Text style={[styles.tabText, activeTab === 'measure' && styles.activeTabText]}>
            Measure
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name="time" 
            size={20} 
            color={activeTab === 'history' ? '#4776E6' : '#888'} 
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'measure' ? renderMeasureTab() : renderHistoryTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#4776E6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: '#4776E6',
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // BPM Display
  bpmDisplayContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  bpmGradient: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#ff7e5f',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  bpmInnerContainer: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: 'white',
    borderRadius: width * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bpmValue: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#333',
  },
  bpmUnit: {
    fontSize: 20,
    color: '#666',
    marginTop: -5,
  },
  bpmStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  // Measure Button
  measureButton: {
    height: 80,
    borderRadius: 40,
    marginVertical: 20,
    elevation: 5,
    shadowColor: '#4776E6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  measureButtonActive: {
    transform: [{ scale: 0.98 }],
  },
  measureButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  measureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  measuringIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  timeLeftText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  pulsingHeart: {
    transform: [{ scale: 1.2 }],
  },
  // Instructions
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  // History Tab
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  historyFilterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  filterText: {
    fontSize: 12,
    color: '#555',
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bpmIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyDetails: {
    flexDirection: 'column',
  },
  historyBpm: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  historyStatus: {
    fontSize: 12,
    color: '#666',
  },
  historyTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  // Empty and Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyHistoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
});

export default HeartRateScreen;