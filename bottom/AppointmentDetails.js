import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';

const PatientNotifications = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const fetchedNotifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setNotifications(fetchedNotifications);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching notifications:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const renderNotificationItem = ({ item }) => {
    if (item.type === 'appointment_booked') {
      return (
        <TouchableOpacity 
          style={styles.notificationItem}
          onPress={() => navigation.navigate('AppointmentDetails', { 
            appointmentId: item.appointmentId 
          })}
        >
          <LinearGradient 
            colors={['#6A11CB', '#2575FC']} 
            style={styles.notificationGradient}
          >
            <View>
              <Text style={styles.notificationTitle}>Appointment Booked</Text>
              <Text style={styles.notificationText}>Doctor: {item.doctorName}</Text>
              <Text style={styles.notificationText}>Date: {item.date}</Text>
              <Text style={styles.notificationText}>Time: {item.time}</Text>
              <Text style={styles.notificationText}>Status: {item.status}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={['#6A11CB', '#2575FC']} 
        style={styles.headerContainer}
      >
        <Text style={styles.headerText}>Notifications</Text>
      </LinearGradient>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text>No notifications</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  headerContainer: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationItem: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  notificationGradient: {
    padding: 15,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  notificationText: {
    color: 'white',
    marginBottom: 5,
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
  }
});

export default PatientNotifications;