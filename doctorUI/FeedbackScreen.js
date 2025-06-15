import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Color Constants
const COLORS = {
  PRIMARY: '#F59E0B',         // Core Amber
  PRIMARY_LIGHT: '#FBBF24',   // Lighter, vivid amber
  PRIMARY_DARK: '#D97706',    // Darker, richer amber
  PRIMARY_SOFT: '#FED7AA',    // Soft, pastel amber
  PRIMARY_VIBRANT: '#F97316', // Vivid, orange-leaning amber
  PRIMARY_MUTED: '#F7C948',   // Muted, yellowish amber
  SECONDARY: '#FFF7ED',       // Warm off-white, amber-tinted
  BACKGROUND: '#FEF3E7',      // Light amber-tinted background
  TEXT_DARK: '#1D3557',       // Dark Blue
  TEXT_MEDIUM: '#457B9D',     // Medium Blue
  TEXT_LIGHT: '#FFFFFF',      // White
  ACCENT_WARM: '#E76F51',     // Coral, warm accent
  ACCENT_COOL: '#E9C46A',     // Soft Yellow, cool accent
  GRAY: '#D3D3D3',            // Light Gray
  CARD: '#FFFFFF',            // White
  SHADOW: '#00000020',        // Shadow
};

// Utility function to convert various timestamp formats to Date
const convertToDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp.seconds && timestamp.nanoseconds) {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  return null;
};

// Memoized Feedback Item Component
const FeedbackItem = React.memo(({ feedback, renderStars }) => {
  const date = convertToDate(feedback.timestamp);
  return (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackHeader}>
        {renderStars(feedback.rating)}
        <Text style={styles.timestamp}>
          {date ? date.toLocaleString() : 'Date unavailable'}
        </Text>
      </View>
      <Text style={styles.feedbackText}>{feedback.comment}</Text>
    </View>
  );
});

// Main Feedback Screen Component
const FeedbackReceivedScreen = () => {
  const [doctorName, setDoctorName] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cache, setCache] = useState({ doctor: {}, feedback: [] });
  const navigation = useNavigation();
  const currentUser = auth().currentUser;
  const initialFetchDone = useRef(false);

  // Load cached data from AsyncStorage
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem('feedbackCache');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          setCache(parsedCache);
          setDoctorName(parsedCache.doctor?.fullName || parsedCache.doctor?.username || currentUser?.email || '');
          setFeedbackList(parsedCache.feedback || []);
          if (parsedCache.feedback?.length > 0) {
            const totalRating = parsedCache.feedback.reduce((sum, item) => sum + item.rating, 0);
            const avg = (totalRating / parsedCache.feedback.length).toFixed(1);
            setAverageRating(avg);
          }
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      }
    };
    loadCachedData();
  }, [currentUser?.uid]);

  // Save cache to AsyncStorage
  const saveCache = async (newCache) => {
    try {
      await AsyncStorage.setItem('feedbackCache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  };

  // Fetch feedback data
  const fetchFeedbackData = useCallback(async (isRefresh = false) => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const newCache = { doctor: cache.doctor, feedback: cache.feedback };

      // Fetch doctor name if not cached
      if (!newCache.doctor?.fullName) {
        const docSnapshot = await firestore()
          .collection('doctors')
          .doc(currentUser.uid)
          .get();

        if (docSnapshot.exists) {
          newCache.doctor = docSnapshot.data();
          setDoctorName(newCache.doctor.fullName || newCache.doctor.username || currentUser.email);
        } else {
          newCache.doctor = { fullName: currentUser.displayName || currentUser.email };
          setDoctorName(currentUser.displayName || currentUser.email);
        }
      }

      // Fetch feedback
      const feedbackSnapshot = await firestore()
        .collection('feedback')
        .where('doctorId', '==', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .get();

      const feedbackData = feedbackSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      newCache.feedback = feedbackData;
      setFeedbackList(feedbackData);

      // Calculate average rating
      if (feedbackData.length > 0) {
        const totalRating = feedbackData.reduce((sum, item) => sum + item.rating, 0);
        const avg = (totalRating / feedbackData.length).toFixed(1);
        setAverageRating(avg);
      } else {
        setAverageRating(0);
      }

      setCache(newCache);
      await saveCache(newCache);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [currentUser?.uid]);

  // Initial fetch
  useEffect(() => {
    if (!initialFetchDone.current && currentUser) {
      initialFetchDone.current = true;
      fetchFeedbackData();
    }
  }, [currentUser?.uid, fetchFeedbackData]);

  // Refresh handler with debounce
  const onRefresh = useCallback(() => {
    if (!refreshing) {
      fetchFeedbackData(true);
    }
  }, [fetchFeedbackData, refreshing]);

  // Memoized star rendering function
  const renderStars = useCallback(
    (rating) => (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FontAwesome5
            key={star}
            name="star"
            solid={star <= rating}
            size={14}
            color={star <= rating ? COLORS.ACCENT_COOL : COLORS.GRAY}
          />
        ))}
      </View>
    ),
    []
  );

  // Memoized average rating component
  const renderAverageRating = useMemo(
    () => (
      <View style={styles.averageRatingContainer}>
        <Text style={styles.averageRatingLabel}>Average Rating</Text>
        <View style={styles.averageRatingRow}>
          {renderStars(Math.round(averageRating))}
          <Text style={styles.averageRatingText}>{averageRating} / 5</Text>
        </View>
        <Text style={styles.reviewCount}>({feedbackList.length} reviews)</Text>
      </View>
    ),
    [averageRating, feedbackList.length, renderStars]
  );

  // Loading state
  if (loading && !cache.feedback.length && !refreshing) {
    return (
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.PRIMARY_LIGHT, COLORS.PRIMARY_VIBRANT, COLORS.PRIMARY_MUTED]}
        style={styles.loadingContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color={COLORS.TEXT_LIGHT} />
        <Text style={styles.loadingText}>Loading Feedback...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.PRIMARY_LIGHT, COLORS.PRIMARY_VIBRANT, COLORS.PRIMARY_MUTED]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.TEXT_LIGHT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Feedback for Dr. {doctorName}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={COLORS.PRIMARY_VIBRANT} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.PRIMARY_VIBRANT} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderAverageRating}

        {feedbackList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbox-ellipses-outline" size={60} color={COLORS.ACCENT_WARM} />
            <Text style={styles.emptyText}>No feedback received yet.</Text>
            <Text style={styles.emptySubText}>Check back later for patient reviews!</Text>
          </View>
        ) : (
          feedbackList.map((feedback) => (
            <FeedbackItem key={feedback.id} feedback={feedback} renderStars={renderStars} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 6,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY_SOFT,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY_SOFT,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 30,
  },
  averageRatingContainer: {
    backgroundColor: COLORS.SECONDARY,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_MUTED,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  averageRatingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 10,
  },
  averageRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  averageRatingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginLeft: 10,
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.TEXT_MEDIUM,
  },
  feedbackCard: {
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_MUTED,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.TEXT_MEDIUM,
    fontStyle: 'italic',
  },
  feedbackText: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    lineHeight: 22,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.TEXT_MEDIUM,
    marginTop: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    marginTop: 10,
  },
});

export default FeedbackReceivedScreen;