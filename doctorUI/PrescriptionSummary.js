import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';

const PatientPrescriptionHistoryScreen = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId } = route.params;

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const snapshot = await firestore()
          .collection('prescriptions')
          .where('patientId', '==', patientId)
          .orderBy('createdAt', 'desc')
          .get();

        const prescriptionData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPrescriptions(preservationData);
      } catch (error) {
        console.error('Fetch prescriptions error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [patientId]);

  const renderPrescriptionItem = ({ item }) => (
    <View style={styles.prescriptionPaper}>
      <View style={styles.prescriptionHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.doctorStampPlaceholder}>
            <Icon name="local-hospital" size={24} color="#444" />
          </View>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.clinicName}>Medical Health Center</Text>
          <Text style={styles.doctorNameHeader}>{item.doctorName}</Text>
          <Text style={styles.doctorCredentials}>
            Specialist
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.rxSymbol}>
            <Text style={styles.rxText}>Rx</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.divider}></View>
      
      <View style={styles.patientInfoSection}>
        <View style={styles.patientInfoRow}>
          <Text style={styles.patientInfoLabel}>Patient Name:</Text>
          <Text style={styles.patientInfoValue}>{item.patientName}</Text>
        </View>
        <View style={styles.patientInfoRow}>
          <Text style={styles.patientInfoLabel}>Age:</Text>
          <Text style={styles.patientInfoValue}>{item.patientAge}</Text>
        </View>
        <View style={styles.patientInfoRow}>
          <Text style={styles.patientInfoLabel}>Date:</Text>
          <Text style={styles.patientInfoValue}>{item.date}</Text>
        </View>
      </View>
      
      <View style={styles.medicationSection}>
        {item.medications.map((med, index) => (
          <View key={index} style={styles.medicationItem}>
            <Text style={styles.medicationNumber}>{index + 1}</Text>
            <Text style={styles.medicationText}>{med}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.signatureSection}>
        <View style={styles.signatureContainer}>
          {item.signature ? (
            <Image source={{ uri: item.signature }} style={styles.signatureImage} />
          ) : (
            <>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>Doctor's Signature</Text>
            </>
          )}
        </View>
        <View style={styles.stampContainer}>
          <View style={styles.doctorStampLarge}>
            <Text style={styles.stampText}>APPROVED</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#4A90E2', '#9013FE']} style={styles.gradientContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#4A90E2', '#9013FE']} style={styles.gradientContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Prescription History</Text>
        </View>

        <FlatList
          data={prescriptions}
          renderItem={renderPrescriptionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.container}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No prescriptions found</Text>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: { 
    flex: 1 
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    color: '#fff', 
    fontSize: 18 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff'
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#fff',
  },
  prescriptionPaper: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerLeft: {
    width: 60,
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 60,
    alignItems: 'center',
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 3,
  },
  doctorNameHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2a2a2a',
    marginBottom: 3,
  },
  doctorCredentials: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  doctorStampPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  rxSymbol: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
  },
  rxText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A90E2',
    fontStyle: 'italic',
  },
  divider: {
    height: 2,
    backgroundColor: '#f0f0f0',
    marginVertical: 15,
    borderRadius: 1,
  },
  patientInfoSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  patientInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  patientInfoLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  patientInfoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  medicationSection: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  medicationItem: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  medicationNumber: {
    width: 25,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  medicationText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
    marginBottom: 20,
  },
  signatureContainer: {
    width: '50%',
    alignItems: 'center',
  },
  signatureImage: {
    width: 150,
    height: 60,
    resizeMode: 'contain',
  },
  signatureLine: {
    height: 2,
    width: '100%',
    backgroundColor: '#ddd',
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 12,
    color: '#777',
  },
  stampContainer: {
    width: '40%',
    alignItems: 'center',
  },
  doctorStampLarge: {
    width: 100,
    height: 50,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    transform: [{ rotate: '-15deg' }],
  },
  stampText: {
    color: '#4A90E2',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PatientPrescriptionHistoryScreen;