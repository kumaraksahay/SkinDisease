import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Animated,
  FlatList,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

// Modern Color Palette
const COLORS = {
  PRIMARY: '#6C5CE7',
  SECONDARY: '#A29BFE',
  TERTIARY: '#FD79A8',
  ACCENT: '#00CEC9',
  BACKGROUND: '#F8F9FA',
  CARD_BG: '#FFFFFF',
  TEXT_PRIMARY: '#2D3436',
  TEXT_SECONDARY: '#636E72',
  TEXT_LIGHT: '#B2BEC3',
  SUCCESS: '#00B894',
  WARNING: '#FDCB6E',
  DANGER: '#E17055',
  GLASS: 'rgba(255, 255, 255, 0.25)',
  SHADOW: 'rgba(108, 92, 231, 0.3)',
};

// Component for Full-Screen All Doctors View
const AllDoctorsView = ({ doctors, onApprove, onView, onBack }) => {
  // Render Doctor Card
  const DoctorCard = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={800}
      style={styles.doctorCard}
    >
      <LinearGradient
        colors={[COLORS.CARD_BG, COLORS.BACKGROUND]}
        style={styles.doctorCardGradient}
      >
        <View style={styles.doctorHeader}>
          <View style={styles.doctorImageContainer}>
            {item.profilePicture ? (
              <Image source={{ uri: item.profilePicture }} style={styles.doctorImage} />
            ) : (
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                style={styles.doctorPlaceholder}
              >
                <Text style={styles.doctorPlaceholderText}>
                  {item.fullName?.charAt(0).toUpperCase() || 'D'}
                </Text>
              </LinearGradient>
            )}
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? COLORS.SUCCESS : COLORS.WARNING }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{item.fullName}</Text>
            <Text style={styles.doctorSpecialty}>{item.degree}</Text>
            <View style={styles.experienceContainer}>
              <Text style={styles.experienceText}>{item.experienceYears} years exp.</Text>
            </View>
          </View>
        </View>

        <View style={styles.doctorDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📧 Email:</Text>
            <Text style={styles.detailValue}>{item.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🎂 Age:</Text>
            <Text style={styles.detailValue}>{item.age}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Address:</Text>
            <Text style={styles.detailValue}>{item.address || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => onApprove(item.id, item.fullName)}
            disabled={item.status === 'active'}
          >
            <Text style={styles.actionBtnText}>
              {item.status === 'active' ? 'Approved' : '✓ Approve'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.viewBtn]}
            onPress={() => onView(item)}
          >
            <Text style={styles.actionBtnText}>👁 View</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animatable.View>
  );

  return (
    <LinearGradient colors={[COLORS.PRIMARY, COLORS.SECONDARY, COLORS.TERTIARY]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={styles.allDoctorsHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.allDoctorsTitle}>All Registered Doctors</Text>
      </View>
      <FlatList
        data={doctors}
        renderItem={({ item, index }) => <DoctorCard item={item} index={index} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.allDoctorsList}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
};

const AdminDashboard = () => {
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    pendingApprovals: 0,
  });
  const [showAllDoctors, setShowAllDoctors] = useState(false);

  // Animation References
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Fetch doctors from Firestore
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('doctors')
      .onSnapshot(
        (snapshot) => {
          const doctorList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            status: doc.data().status || 'pending', // Default to 'pending' if status is missing
          }));
          setDoctors(doctorList);
          setStats({
            totalDoctors: doctorList.length,
            activeDoctors: doctorList.filter((doc) => doc.status === 'active').length,
            pendingApprovals: doctorList.filter((doc) => doc.status === 'pending').length,
          });
        },
        (error) => {
          console.error('Firestore Error:', error);
          Alert.alert('Error', 'Failed to load doctors.');
        }
      );

    // Animation Sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    return () => unsubscribe();
  }, []);

  // Logout Handler
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
              navigation.navigate('DLogin');
            } catch (error) {
              console.error('Logout Error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Approve Doctor Handler
  const handleApproveDoctor = async (doctorId, doctorName) => {
    try {
      await firestore().collection('doctors').doc(doctorId).update({
        status: 'active',
      });
      Alert.alert('Success', `${doctorName} has been approved!`);
    } catch (error) {
      console.error('Approve Doctor Error:', error);
      Alert.alert('Error', 'Failed to approve doctor.');
    }
  };

  // View Doctor Details Handler
  const handleViewDoctor = (doctor) => {
    Alert.alert(
      `Dr. ${doctor.fullName}`,
      `Email: ${doctor.email}\nAge: ${doctor.age}\nDegree: ${doctor.degree}\nExperience: ${doctor.experienceYears} years\nAddress: ${doctor.address || 'N/A'}\nStatus: ${doctor.status}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  // Render Stats Card
  const StatCard = ({ title, value, color, icon }) => (
    <Animatable.View animation="fadeInUp" duration={1000} style={[styles.statCard, { borderTopColor: color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Text style={styles.statIconText}>{icon}</Text>
        </View>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </Animatable.View>
  );

  // Render Doctor Card for Main Dashboard
  const DoctorCard = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={800}
      style={styles.doctorCard}
    >
      <LinearGradient
        colors={[COLORS.CARD_BG, COLORS.BACKGROUND]}
        style={styles.doctorCardGradient}
      >
        <View style={styles.doctorHeader}>
          <View style={styles.doctorImageContainer}>
            {item.profilePicture ? (
              <Image source={{ uri: item.profilePicture }} style={styles.doctorImage} />
            ) : (
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                style={styles.doctorPlaceholder}
              >
                <Text style={styles.doctorPlaceholderText}>
                  {item.fullName?.charAt(0).toUpperCase() || 'D'}
                </Text>
              </LinearGradient>
            )}
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? COLORS.SUCCESS : COLORS.WARNING }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{item.fullName}</Text>
            <Text style={styles.doctorSpecialty}>{item.degree}</Text>
            <View style={styles.experienceContainer}>
              <Text style={styles.experienceText}>{item.experienceYears} years exp.</Text>
            </View>
          </View>
        </View>

        <View style={styles.doctorDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📧 Email:</Text>
            <Text style={styles.detailValue}>{item.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🎂 Age:</Text>
            <Text style={styles.detailValue}>{item.age}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Address:</Text>
            <Text style={styles.detailValue}>{item.address || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleApproveDoctor(item.id, item.fullName)}
            disabled={item.status === 'active'}
          >
            <Text style={styles.actionBtnText}>
              {item.status === 'active' ? 'Approved' : '✓ Approve'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.viewBtn]}
            onPress={() => handleViewDoctor(item)}
          >
            <Text style={styles.actionBtnText}>👁 View</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animatable.View>
  );

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (showAllDoctors) {
    return (
      <AllDoctorsView
        doctors={doctors}
        onApprove={handleApproveDoctor}
        onView={handleViewDoctor}
        onBack={() => setShowAllDoctors(false)}
      />
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY, COLORS.TERTIARY]}
        style={styles.container}
      >
        <Animated.ScrollView
          style={[
            styles.scrollContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Animatable.View animation="fadeInDown" duration={1200} style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.adminText}>Administrator 👋</Text>
              </View>
              <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
                <LinearGradient
                  colors={[COLORS.DANGER, '#FF6B6B']}
                  style={styles.profileGradient}
                >
                  <Text style={styles.profileText}>Logout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Animated.View style={[styles.logoContainer, { transform: [{ rotate: spin }] }]}>
              <LinearGradient
                colors={[COLORS.GLASS, 'rgba(255, 255, 255, 0.1)']}
                style={styles.logoBackground}
              >
                <Image source={require('../src/assets/doctor.png')} style={styles.logoIcon} />
              </LinearGradient>
            </Animated.View>
          </Animatable.View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <StatCard
              title="Total Doctors"
              value={stats.totalDoctors}
              color={COLORS.PRIMARY}
              icon="👨‍⚕️"
            />
            <StatCard
              title="Active Doctors"
              value={stats.activeDoctors}
              color={COLORS.SUCCESS}
              icon="✅"
            />
            <StatCard
              title="Pending"
              value={stats.pendingApprovals}
              color={COLORS.WARNING}
              icon="⏳"
            />
          </View>

          {/* Quick Actions */}
          <Animatable.View animation="fadeInUp" duration={1000} style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => Alert.alert('Feature', 'Reports feature coming soon!')}
              >
                <LinearGradient
                  colors={[COLORS.ACCENT, '#00B2D6']}
                  style={styles.quickActionGradient}
                >
                  <Text style={styles.quickActionIcon}>📊</Text>
                  <Text style={styles.quickActionText}>Reports</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => Alert.alert('Feature', 'Settings feature coming soon!')}
              >
                <LinearGradient
                  colors={[COLORS.TERTIARY, '#FF7675']}
                  style={styles.quickActionGradient}
                >
                  <Text style={styles.quickActionIcon}>⚙️</Text>
                  <Text style={styles.quickActionText}>Settings</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Doctors Section */}
          <Animatable.View animation="fadeInUp" duration={1200} style={styles.doctorsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Registered Doctors</Text>
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => setShowAllDoctors(true)}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {doctors.length > 0 ? (
              <FlatList
                data={doctors.slice(0, 3)} // Show only 3 doctors in preview
                renderItem={({ item, index }) => <DoctorCard item={item} index={index} />}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                style={styles.doctorsList}
              />
            ) : (
              <Animatable.View animation="fadeIn" style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>👨‍⚕️</Text>
                <Text style={styles.emptyStateText}>No doctors registered yet</Text>
                <Text style={styles.emptyStateSubtext}>New registrations will appear here</Text>
              </Animatable.View>
            )}
          </Animatable.View>
        </Animated.ScrollView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.BACKGROUND,
    opacity: 0.8,
  },
  adminText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.BACKGROUND,
  },
  profileButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  profileGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  profileText: {
    color: COLORS.BACKGROUND,
    fontWeight: '600',
    fontSize: 14,
  },
  logoContainer: {
    marginTop: 10,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.GLASS,
  },
  logoIcon: {
    width: 80,
    height: 80,
    tintColor: COLORS.BACKGROUND,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderTopWidth: 4,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconText: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  quickActions: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.BACKGROUND,
    marginBottom: 15,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 16,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    color: COLORS.BACKGROUND,
    fontWeight: '600',
    fontSize: 14,
  },
  doctorsSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.GLASS,
    borderRadius: 12,
  },
  viewAllText: {
    color: COLORS.BACKGROUND,
    fontSize: 12,
    fontWeight: '500',
  },
  doctorsList: {
    maxHeight: height * 0.6,
  },
  allDoctorsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: COLORS.BACKGROUND,
    fontWeight: '600',
  },
  allDoctorsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.BACKGROUND,
  },
  allDoctorsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  doctorCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  doctorCardGradient: {
    padding: 20,
    borderRadius: 20,
  },
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  doctorImageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: COLORS.PRIMARY,
  },
  doctorPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorPlaceholderText: {
    color: COLORS.BACKGROUND,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: COLORS.BACKGROUND,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  doctorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
    marginBottom: 4,
  },
  experienceContainer: {
    backgroundColor: COLORS.ACCENT,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  experienceText: {
    color: COLORS.BACKGROUND,
    fontSize: 12,
    fontWeight: '500',
  },
  doctorDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    width: 80,
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  approveBtn: {
    backgroundColor: COLORS.SUCCESS,
  },
  viewBtn: {
    backgroundColor: COLORS.PRIMARY,
  },
  actionBtnText: {
    color: COLORS.BACKGROUND,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 20,
    marginTop: 10,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});

export default AdminDashboard;