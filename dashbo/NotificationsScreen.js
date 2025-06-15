import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Platform,
  RefreshControl
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';


const NotificationsScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          Alert.alert('Error', 'User not authenticated');
          return;
        }

        const appointmentsRef = firestore()
          .collection('appointments')
          .where('userId', '==', currentUser.uid)
          .orderBy('createdAt', 'desc');

        const unsubscribe = appointmentsRef.onSnapshot((snapshot) => {
          const fetchedAppointments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const sortedAppointments = fetchedAppointments.sort((a, b) => {
            const createdAtA = a.createdAt?.seconds || 0;
            const createdAtB = b.createdAt?.seconds || 0;
            if (createdAtA !== createdAtB) {
              return createdAtB - createdAtA;
            }

            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA;
          });

          setAppointments(sortedAppointments);
          setLoading(false);
        }, (error) => {
          console.error('Snapshot error:', error);
          setLoading(false);
          Alert.alert('Error', 'Could not fetch appointments');
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setLoading(false);
        Alert.alert('Error', 'Could not fetch appointments');
      }
    };

    fetchAppointments();
  }, []);

  const handleAppointmentPress = (appointment) => {
    // Navigate to MyAppointment screen with the appointment data
    navigation.navigate('MyAppointment', { appointment });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof firestore.Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
    return date.toLocaleString();
  };

  const renderAppointmentCard = (appointment) => (
    <TouchableOpacity
      key={appointment.id}
      style={styles.appointmentCard}
      onPress={() => handleAppointmentPress(appointment)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.doctorName}>Appointment Booked with Dr. {appointment.doctorName}</Text>
      </View>

      <View style={styles.cardContent}>
        {appointment.createdAt && (
          <View style={styles.detailRow}>
            <Ionicons name="notifications" size={20} color="#6A11CB" />
            <Text style={styles.createdAtText}>
              Created: {formatDate(appointment.createdAt)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={['#6A11CB', '#2575FC']} 
        style={styles.headerContainer}
      >
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading Notifiction...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                setLoading(true);
                fetchAppointments();
              }}
            />
          }
        >
          {appointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Notification Found</Text>
            </View>
          ) : (
            appointments.map(renderAppointmentCard)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    paddingTop:40
  },

  scrollContainer: {
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cardContent: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  createdAtText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6A11CB',
    fontStyle: 'italic',
  },
  
});

export default NotificationsScreen;