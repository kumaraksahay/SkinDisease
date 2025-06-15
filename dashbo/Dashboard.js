import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
  Dimensions,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import MaskedView from '@react-native-masked-view/masked-view';

// Import necessary screens
import CareGuide from './CareGuide';
import CameraScreen from '../skinscan/CameraScreen';
import DoctorPortal from './DoctorPortal';
import AppointmentDetails from './MyAppointment';
import SettingsScreen from './SettingsScreen';
import ProfileScreen from './ProfileScreen';
import NotificationsScreen from './NotificationsScreen';
import ChatView from './ChatView';
import HeartRateScreen from './HeartRateScreen';

const { width, height } = Dimensions.get('window');
const SPACING = 16;
const CARD_RADIUS = 24;
const AVATAR_SIZE = 48;

const COLORS = {
  BACKGROUND: '#F6F5FF',
  PRIMARY: '#6C63FF',
  SECONDARY: '#FF6F91',
  ACCENT: '#40C4FF',
  TEXT_DARK: '#2D2A4A',
  TEXT_LIGHT: '#FFFFFF',
  CARD_BG: '#FFFFFF',
  SHADOW: 'rgba(108, 99, 255, 0.1)',
  GRADIENT_START: '#8A81FF',
  GRADIENT_END: '#5C54D9',
  TAB_ACTIVE: '#6C63FF',
  TAB_INACTIVE: '#B0A8FF',
};

const GradientText = ({ text, style, colors = [COLORS.PRIMARY, COLORS.SECONDARY] }) => {
  return (
    <MaskedView maskElement={<Text style={style}>{text}</Text>}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      >
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

const HealthTipCard = ({ tip }) => (
  <Animatable.View animation="fadeInRight" duration={800} style={styles.tipCard}>
    <LinearGradient
      colors={['#FFFFFF', '#F2F1FF']}
      style={styles.tipCardGradient}
    >
      <View style={styles.tipIconContainer}>
        <Ionicons name="leaf" size={20} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.tipContent}>
        <Text style={styles.tipTitle}>Daily Health Tip</Text>
        <Text style={styles.tipText}>{tip}</Text>
      </View>
    </LinearGradient>
  </Animatable.View>
);

function DashboardScreen({ navigation }) {
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [latestBpm, setLatestBpm] = useState(null);
  const scrollViewRef = useRef(null);
  const [healthTip, setHealthTip] = useState(
    'Drink at least 8 glasses of water daily to stay hydrated and maintain healthy skin.'
  );

  const moods = [
    {
      emoji: '😊',
      text: 'Great',
      color: '#40C4FF',
      message: "Looking forward to a great day? Keep that positive energy flowing!",
    },
    {
      emoji: '😐',
      text: 'Okay',
      color: '#FFCA28',
      message: "Just an average day? Let's make it better together!",
    },
    {
      emoji: '🤒',
      text: 'Unwell',
      color: '#FF6F91',
      message: "Not feeling well? Take it easy and prioritize your health!",
    },
    {
      emoji: '😴',
      text: 'Tired',
      color: '#9575CD',
      message: "Feeling sleepy? A little rest might do wonders!",
    },
  ];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));

    const fetchUserData = async () => {
      const currentUser = auth().currentUser;
      if (currentUser) {
        try {
          const userDoc = await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .get();

          if (userDoc.exists) {
            const data = userDoc.data();
            const fullName = data.username || currentUser.displayName || currentUser.email;
            const firstName = fullName.split(' ')[0];
            setUserName(firstName);
            setProfileImage(data.profilePicture || null);
          } else {
            console.warn('User document not found');
            setUserName(currentUser.email.split('@')[0]);
          }

          const bpmSnapshot = await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .collection('heartRateMeasurements')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

          if (!bpmSnapshot.empty) {
            const latest = bpmSnapshot.docs[0].data();
            setLatestBpm(latest.bpm);
          } else {
            setLatestBpm(null);
          }
        } catch (error) {
          console.error('Error fetching user data or BPM:', error);
          Alert.alert('Error', 'Unable to fetch user data.');
        } finally {
          setLoading(false);
        }
      } else {
        console.warn('No authenticated user');
        setLoading(false);
      }
    };

    fetchUserData();

    const unsubscribeProfile = firestore()
      .collection('users')
      .doc(auth().currentUser?.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            setProfileImage(data.profilePicture || null);
          }
        },
        (error) => {
          console.error('Error in profile snapshot:', error);
        }
      );

    const unsubscribeBpm = firestore()
      .collection('users')
      .doc(auth().currentUser?.uid)
      .collection('heartRateMeasurements')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.empty) {
            const latest = snapshot.docs[0].data();
            setLatestBpm(latest.bpm);
          } else {
            setLatestBpm(null);
          }
        },
        (error) => {
          console.error('Error in BPM snapshot:', error);
        }
      );

    return () => {
      unsubscribeProfile();
      unsubscribeBpm();
    };
  }, []);

  const features = [
    {
      name: 'Skin Scan',
      icon: require('../src/assets/camera2.gif'),
      screen: 'Camera',
      description: 'Analyze skin conditions with advanced imaging',
      color: [COLORS.PRIMARY, COLORS.GRADIENT_END],
    },
    {
      name: 'Doctor Portal',
      icon: require('../src/assets/doct.png'),
      screen: 'DoctorPortal',
      description: 'Connect with top specialists for consultations',
      color: [COLORS.SECONDARY, '#FF4081'],
    },
    {
      name: 'Care Guide',
      icon: require('../src/assets/sche.png'),
      screen: 'CareGuide',
      description: 'Personalized health tips and wellness advice',
      color: [COLORS.ACCENT, '#0288D1'],
    },
    {
      name: 'Appointments',
      icon: require('../src/assets/notif.png'),
      screen: 'Appointment Details',
      description: 'Manage your doctor appointments effortlessly',
      color: ['#9575CD', '#7E57C2'],
    },
  ];

  const quickActions = [
    {
      name: 'Health Records',
      icon: 'file-medical',
      iconType: 'FontAwesome5',
      color: COLORS.PRIMARY,
      background: '#EDEAFF',
    },
    {
      name: 'Prescriptions',
      icon: 'pill',
      iconType: 'MaterialCommunityIcons',
      color: COLORS.SECONDARY,
      background: '#FFE8EE',
    },
    {
      name: 'Lab Results',
      icon: 'flask',
      iconType: 'FontAwesome5',
      color: COLORS.ACCENT,
      background: '#E0F7FA',
    },
    {
      name: 'Emergency',
      icon: 'alert-circle',
      iconType: 'Feather',
      color: '#FF5252',
      background: '#FFEBEE',
    },
    {
      name: 'Telemedicine',
      icon: 'video',
      iconType: 'Feather',
      color: '#7E57C2',
      background: '#F3E5F5',
    },
  ];

  const renderIconByType = (icon, type, size, color) => {
    switch (type) {
      case 'FontAwesome5':
        return <FontAwesome5 name={icon} size={size} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={icon} size={size} color={color} />;
      case 'Feather':
        return <Feather name={icon} size={size} color={color} />;
      default:
        return <Ionicons name={icon} size={size} color={color} />;
    }
  };

  const handleMoodSelect = (index) => {
    setSelectedMood(index);
    setShowMoodPopup(true);
    setTimeout(() => {
      setShowMoodPopup(false);
    }, 2000);
  };

  const renderMoodSelector = () => (
    <View style={styles.moodSelectorContainer}>
      <Text style={styles.moodPrompt}>How are you feeling today?</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodOptionsContainer}
      >
        {moods.map((mood, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.moodOption,
              selectedMood === index && { borderColor: mood.color, backgroundColor: `${mood.color}10` },
            ]}
            onPress={() => handleMoodSelect(index)}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiText}>{mood.emoji}</Text>
            <Text style={[styles.moodText, { color: mood.color }]}>{mood.text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showMoodPopup}
        onRequestClose={() => setShowMoodPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View
            animation="bounceIn"
            duration={600}
            style={styles.moodPopup}
          >
            <LinearGradient
              colors={
                selectedMood !== null
                  ? [moods[selectedMood].color + '20', '#FFFFFF']
                  : ['#FFFFFF', '#FFFFFF']
              }
              style={styles.moodPopupGradient}
            >
              {selectedMood !== null && (
                <>
                  <Text
                    style={[styles.moodPopupEmoji, { color: moods[selectedMood].color }]}
                  >
                    {moods[selectedMood].emoji}
                  </Text>
                  <Text style={styles.moodPopupText}>
                    {moods[selectedMood].message}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />

      <LinearGradient
        colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
        style={styles.customHeader}
      >
        <View>
          {loading ? (
            <View style={styles.loadingPlaceholder}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.dateText}>{currentDate}</Text>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>{greeting}, </Text>
                <GradientText
                  text={userName}
                  style={styles.nameText}
                  colors={[COLORS.ACCENT, COLORS.SECONDARY]}
                />
              </View>
            </>
          )}
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <LinearGradient
              colors={[COLORS.PRIMARY, COLORS.GRADIENT_END]}
              style={styles.profileGradient}
            >
              <Text style={styles.profileInitial}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.onlineIndicator} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animatable.View animation="fadeIn" duration={800} delay={300}>
          {renderMoodSelector()}
        </Animatable.View>

        <HealthTipCard tip={healthTip} />

        <Animatable.View animation="fadeInUp" delay={300} duration={800}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Health Services</Text>
            <TouchableOpacity>
              <Feather name="sliders" size={20} color={COLORS.TEXT_DARK} />
            </TouchableOpacity>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <Animatable.View
                key={index}
                animation="zoomIn"
                delay={400 + index * 100}
                duration={600}
                style={styles.featureCardContainer}
              >
                <TouchableOpacity
                  style={styles.featureCard}
                  onPress={() => navigation.navigate(feature.screen)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={feature.color}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featureCardGradient}
                  >
                    <Image
                      source={feature.icon}
                      style={styles.featureIcon}
                      resizeMode="contain"
                    />
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureText}>{feature.name}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animatable.View>
            ))}
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={600} duration={800} style={styles.quickActionsContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
            decelerationRate="fast"
            snapToInterval={width * 0.35 + SPACING}
          >
            {quickActions.map((item, index) => (
              <Animatable.View animation="fadeInRight" delay={700 + index * 100} duration={500} key={index}>
                <TouchableOpacity
                  style={[styles.quickActionCard, { backgroundColor: item.background }]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                    {renderIconByType(item.icon, item.iconType, 24, item.color)}
                  </View>
                  <Text style={[styles.quickActionText, { color: item.color }]}>{item.name}</Text>
                </TouchableOpacity>
              </Animatable.View>
            ))}
          </ScrollView>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={800} duration={800} style={styles.statsContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Health Statistics</Text>
            <TouchableOpacity style={styles.calendarButton}>
              <Feather name="calendar" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.todayText}>Today</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScrollContainer}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('HeartRate')}
            >
              <LinearGradient
                colors={['#E8F0FE', '#D1DCFD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.statCardGradient}
              >
                <View style={styles.statHeader}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${COLORS.PRIMARY}20` }]}>
                    <Ionicons name="heart" size={18} color={COLORS.PRIMARY} />
                  </View>
                  <Text style={styles.statLabel}>Heart Rate</Text>
                </View>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>{latestBpm ? latestBpm : '--'}</Text>
                  <Text style={styles.statUnit}>BPM</Text>
                </View>
                <Text style={styles.statTrend}>
                  {latestBpm ? (
                    <>
                      <Feather name="arrow-up-right" size={12} color={COLORS.ACCENT} /> Latest measurement
                    </>
                  ) : (
                    'No data available'
                  )}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard}>
              <LinearGradient
                colors={['#E8F5E9', '#C8E6C9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.statCardGradient}
              >
                <View style={styles.statHeader}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${COLORS.SECONDARY}20` }]}>
                    <MaterialCommunityIcons name="shoe-print" size={18} color={COLORS.SECONDARY} />
                  </View>
                  <Text style={styles.statLabel}>Steps</Text>
                </View>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>8,234</Text>
                  <Text style={styles.statUnit}>steps</Text>
                </View>
                <Text style={styles.statProgress}>
                  <Text style={styles.statProgressBold}>82%</Text> of daily goal
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard}>
              <LinearGradient
                colors={['#E0F7FA', '#B2EBF2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.statCardGradient}
              >
                <View style={styles.statHeader}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${COLORS.ACCENT}20` }]}>
                    <Ionicons name="water" size={18} color={COLORS.ACCENT} />
                  </View>
                  <Text style={styles.statLabel}>Hydration</Text>
                </View>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>1.2</Text>
                  <Text style={styles.statUnit}>L</Text>
                </View>
                <Text style={styles.statTrend}>
                  <Feather name="arrow-down-right" size={12} color={COLORS.SECONDARY} /> 15% below target
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Animatable.View>
      </ScrollView>

      <Animatable.View animation="bounceIn" delay={1500} duration={1000} style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Camera')}>
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="camera" size={24} color={COLORS.TEXT_LIGHT} />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, { marginTop: 10 }]}
          onPress={() => navigation.navigate('ChatView')}
        >
          <LinearGradient
            colors={[COLORS.ACCENT, COLORS.PRIMARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="chatbubble" size={24} color={COLORS.TEXT_LIGHT} />
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    </SafeAreaView>
  );
}

function DoctorStackNavigator() {
  const [username, setUsername] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth().currentUser;
      if (currentUser) {
        try {
          const userDoc = await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .get();

          if (userDoc.exists) {
            const data = userDoc.data();
            setUsername(data.username || currentUser.email);
            setUserProfile(data.profilePicture || null);
          } else {
            setUsername(currentUser.email);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          Alert.alert('Error', 'Unable to fetch user data.');
        }
      }
    };

    fetchUserData();

    const unsubscribe = firestore()
      .collection('users')
      .doc(auth().currentUser?.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            setUserProfile(data.profilePicture || null);
          }
        },
        (error) => {
          console.error('Error in profile snapshot:', error);
        }
      );

    return () => unsubscribe();
  }, []);

  const Stack = createStackNavigator();

  const HeaderAvatar = () => (
    <TouchableOpacity style={styles.headerAvatar}>
      {userProfile ? (
        <Image source={{ uri: userProfile }} style={styles.profileImage} />
      ) : (
        <View style={styles.defaultAvatar}>
          <Text style={styles.avatarText}>
            {username.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
          backgroundColor: COLORS.BACKGROUND,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          color: COLORS.TEXT_DARK,
        },
        headerTintColor: COLORS.PRIMARY,
        headerLeftContainerStyle: {
          paddingLeft: 15,
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CareGuide"
        component={CareGuide}
        options={{
          headerShown: false,
          title: 'Care Guide',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{
          headerShown: true,
          title: 'Notifications',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          headerShown: false,
          title: 'Skin Scanner',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="DoctorPortal"
        component={DoctorPortal}
        options={{
          headerShown: true,
          title: 'Find Specialists',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Appointment Details"
        component={AppointmentDetails}
        options={{
          headerShown: false,
          title: 'My Appointments',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="ChatView"
        component={ChatView}
        options={{
          headerShown: false,
          title: 'Health Assistant',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="HeartRate"
        component={HeartRateScreen}
        options={{
          headerShown: true,
          title: 'Heart Rate Monitor',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

function TabBarIcon({ focused, name, color }) {
  return (
    <View style={styles.tabIconContainer}>
      <Animatable.View
        animation={focused ? 'bounceIn' : 'pulse'}
        duration={focused ? 800 : 1500}
        iterationCount={focused ? 1 : 'infinite'}
        style={[
          styles.tabIcon,
          focused && styles.tabIconFocused,
        ]}
      >
        <LinearGradient
          colors={focused ? [COLORS.TAB_ACTIVE, COLORS.GRADIENT_END] : ['#FFFFFF', '#FFFFFF']}
          style={styles.tabIconGradient}
        >
          <Ionicons
            name={focused ? name : `${name}-outline`}
            size={26}
            color={focused ? COLORS.TEXT_LIGHT : color}
          />
        </LinearGradient>
      </Animatable.View>
      {focused && (
        <LinearGradient
          colors={[COLORS.TAB_ACTIVE, COLORS.GRADIENT_END]}
          style={styles.tabIndicator}
        />
      )}
    </View>
  );
}

function BottomTabNavigator() {
  const Tab = createBottomTabNavigator();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          switch (route.name) {
            case 'HomeU':
              iconName = 'home';
              break;
            case 'Appointments':
              iconName = 'calendar';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
          }

          return <TabBarIcon focused={focused} name={iconName} color={color} />;
        },
        tabBarActiveTintColor: COLORS.TAB_ACTIVE,
        tabBarInactiveTintColor: COLORS.TAB_INACTIVE,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 8,
          color: COLORS.TEXT_DARK,
        },
        tabBarStyle: {
          height: 80,
          paddingTop: 10,
          paddingBottom: 20,
          backgroundColor: COLORS.CARD_BG,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: COLORS.SHADOW,
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeU"
        component={DoctorStackNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentDetails}
        options={{ tabBarLabel: 'Appointments' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function Dashboard() {
  return <BottomTabNavigator />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING,
    paddingVertical: SPACING * 1.5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
    opacity: 0.8,
    paddingTop: 20,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileButton: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  profileGradient: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: COLORS.TEXT_LIGHT,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.ACCENT,
    borderWidth: 2,
    borderColor: COLORS.TEXT_LIGHT,
  },
  moodSelectorContainer: {
    marginHorizontal: SPACING,
    marginTop: SPACING,
  },
  moodPrompt: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 12,
  },
  moodOptionsContainer: {
    paddingVertical: 8,
  },
  moodOption: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.CARD_BG,
    borderWidth: 1,
    borderColor: '#E8E6FF',
    width: 80,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  emojiText: {
    fontSize: 24,
    marginBottom: 6,
  },
  moodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  moodPopup: {
    width: width * 0.7,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  moodPopupGradient: {
    padding: SPACING,
    alignItems: 'center',
  },
  moodPopupEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  moodPopupText: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    textAlign: 'center',
    fontWeight: '500',
  },
  tipCard: {
    marginHorizontal: SPACING,
    marginTop: SPACING,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tipCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING,
    borderRadius: CARD_RADIUS,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#5C577A',
    lineHeight: 18,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SPACING,
    marginTop: SPACING * 1.5,
    marginBottom: SPACING / 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: SPACING / 2,
  },
  featureCardContainer: {
    width: '50%',
    padding: SPACING / 2,
  },
  featureCard: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  featureCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING,
    height: 110,
  },
  featureIcon: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  quickActionsContainer: {
    marginTop: SPACING,
  },
  quickActionsScroll: {
    paddingHorizontal: SPACING,
    paddingVertical: SPACING / 2,
  },
  quickActionCard: {
    width: width * 0.35,
    padding: SPACING,
    marginRight: SPACING,
    borderRadius: CARD_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    marginTop: SPACING,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.PRIMARY}15`,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginLeft: 4,
  },
  statsScrollContainer: {
    paddingHorizontal: SPACING,
    paddingVertical: SPACING / 2,
  },
  statCard: {
    width: width * 0.35,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    marginRight: SPACING,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statCardGradient: {
    padding: SPACING,
    height: 140,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7A759A',
    marginLeft: 4,
    marginBottom: 4,
  },
  statTrend: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7A759A',
  },
  statProgress: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7A759A',
  },
  statProgressBold: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    alignItems: 'flex-end',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    width: 30,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginLeft: 10,
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: `${COLORS.PRIMARY}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  loadingPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
  },
});