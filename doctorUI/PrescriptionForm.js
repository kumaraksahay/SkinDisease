import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  StatusBar,
  SafeAreaView,
  Platform,
  FlatList,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MedicationPrescription = () => {
  const [medications, setMedications] = useState([{ id: Date.now(), value: '' }]);
  const [doctorData, setDoctorData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPrescriptionSummary, setShowPrescriptionSummary] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cache, setCache] = useState({
    doctorData: null,
    patients: [],
  });
  const isMounted = useRef(false);
  const initialFetchDone = useRef(false);
  const navigation = useNavigation();
  const currentUser = auth().currentUser;

  // Load cached data
  useEffect(() => {
    isMounted.current = true;
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem('medicationPrescriptionCache');
        if (cached && isMounted.current) {
          const parsedCache = JSON.parse(cached);
          setCache(parsedCache);
          if (parsedCache.doctorData) {
            setDoctorData(parsedCache.doctorData);
          }
          if (parsedCache.patients) {
            setPatients(parsedCache.patients);
          }
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    loadCachedData();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Save cache
  const saveCache = async (newCache) => {
    try {
      await AsyncStorage.setItem('medicationPrescriptionCache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  };

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!currentUser || !isMounted.current) return;
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (!cache.doctorData && !cache.patients.length) {
          setLoading(true);
        }

        // Fetch doctor data
        let newDoctorData = null;
        const doctorDoc = await firestore().collection('doctors').doc(currentUser.uid).get();
        if (!isMounted.current) return;
        if (doctorDoc.exists) {
          newDoctorData = {
            ...doctorDoc.data(),
            email: currentUser.email || 'Not provided',
          };
          setDoctorData(newDoctorData);
        } else {
          Alert.alert('Error', 'Doctor data not found.');
        }

        // Fetch patient list from chats
        const snapshot = await firestore()
          .collection('chats')
          .where('participants', 'array-contains', currentUser.uid)
          .get();

        const patientData = [];
        for (const doc of snapshot.docs) {
          const chatDoc = doc.data();
          const patientId = chatDoc.participants.find((id) => id !== currentUser.uid);

          if (patientId) {
            const patientDoc = await firestore().collection('users').doc(patientId).get();
            if (patientDoc.exists && isMounted.current) {
              const patient = patientDoc.data();
              patientData.push({
                id: patientId,
                username: patient.username || '',
                fullName: patient.fullName || '',
                age: patient.age || '',
                profilePicture: patient.profilePicture || null,
              });
            }
          }
        }
        if (isMounted.current) {
          setPatients(patientData);
        }

        // Update cache
        setCache((prev) => {
          const newCache = {
            ...prev,
            doctorData: newDoctorData,
            patients: patientData,
          };
          saveCache(newCache);
          return newCache;
        });
      } catch (error) {
        console.error('Fetch error:', error);
        if (isMounted.current) {
          Alert.alert('Error', 'Failed to fetch data.');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [currentUser?.uid, cache.doctorData, cache.patients]
  );

  useEffect(() => {
    const date = new Date();
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    setCurrentDate(formattedDate);

    if (!currentUser || initialFetchDone.current) return;

    if (cache.doctorData || cache.patients.length) {
      setDoctorData(cache.doctorData);
      setPatients(cache.patients);
      setLoading(false);
      initialFetchDone.current = true;
    } else {
      initialFetchDone.current = true;
      fetchData();
    }

    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', currentUser.uid)
      .onSnapshot(
        (snapshot) => {
          if (isMounted.current && snapshot.docChanges().length > 0) {
            fetchData();
          }
        },
        (error) => {
          console.error('Error in chats listener:', error);
        }
      );

    const unsubscribeNavigation = navigation.addListener('focus', () => {
      if (isMounted.current && (cache.doctorData || cache.patients.length)) {
        setDoctorData(cache.doctorData);
        setPatients(cache.patients);
        setLoading(false);
      } else if (isMounted.current) {
        fetchData();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeNavigation();
    };
  }, [currentUser?.uid, fetchData, cache.doctorData, cache.patients, navigation]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    if (!refreshing) {
      fetchData(true);
    }
  }, [refreshing, fetchData]);

  const addMedicationField = () => {
    setMedications([...medications, { id: Date.now(), value: '' }]);
  };

  const updateMedication = (id, value) => {
    setMedications(medications.map((med) => (med.id === id ? { ...med, value } : med)));
  };

  const removeMedication = (id) => {
    if (medications.length > 1) {
      setMedications(medications.filter((med) => med.id !== id));
    } else {
      Alert.alert('Warning', 'At least one medication field is required.');
    }
  };

  const handleComplete = () => {
    const validMedications = medications.filter((med) => med.value.trim());
    if (validMedications.length === 0) {
      Alert.alert('Incomplete Information', 'Please enter at least one medication detail.');
      return;
    }

    if (!patientName.trim()) {
      Alert.alert('Incomplete Information', 'Please enter patient name.');
      return;
    }

    setShowPrescriptionSummary(true);
  };

  const savePrescription = async () => {
    try {
      if (currentUser) {
        const validMedications = medications.filter((med) => med.value.trim());
        await firestore().collection('prescriptions').add({
          doctorId: currentUser.uid,
          doctorName: doctorData?.fullName || 'Doctor',
          patientId: selectedPatient?.id || '',
          patientName: patientName,
          patientAge: patientAge,
          medications: validMedications.map((med) => med.value),
          createdAt: firestore.FieldValue.serverTimestamp(),
          date: currentDate,
          signature: doctorData?.signature || '',
        });

        Alert.alert('Success', 'Prescription saved successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setSelectedPatient(null);
              setPatientName('');
              setPatientAge('');
              setMedications([{ id: Date.now(), value: '' }]);
              setShowPrescriptionSummary(false);
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save prescription.');
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setPatientName(patient.fullName || patient.username || '');
    setPatientAge(patient.age || '');
  };

  const handleViewPastPrescriptions = () => {
    if (selectedPatient?.id) {
      navigation.navigate('PrescriptionSummary', { patientId: selectedPatient.id });
    } else {
      Alert.alert('Error', 'Please select a patient to view past prescriptions.');
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      (patient.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (patient.username?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.patientItem}
      onPress={() => handlePatientSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={styles.avatarImage} />
        ) : (
          <LinearGradient colors={['#00DDEB', '#3B82F6']} style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(item.fullName || item.username || 'P').charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
      </View>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.fullName || item.username || 'Patient'}</Text>
        {item.age && <Text style={styles.patientAge}>Age: {item.age}</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderPrescriptionForm = () => (
    <View style={styles.inputCard}>
      <View style={styles.patientInfoContainer}>
        <Text style={styles.inputLabel}>Patient Information</Text>
        <TextInput
          style={styles.patientInput}
          placeholder="Patient Name"
          placeholderTextColor="#A1A1AA"
          value={patientName}
          onChangeText={setPatientName}
        />
        <TextInput
          style={styles.patientInput}
          placeholder="Patient Age"
          placeholderTextColor="#A1A1AA"
          value={patientAge}
          onChangeText={setPatientAge}
          keyboardType="numeric"
        />
      </View>

      <Text style={styles.inputLabel}>Medication Details</Text>
      {medications.map((med, index) => (
        <View key={med.id} style={styles.medicationInputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Medication ${index + 1} (e.g., Amoxicillin 500mg, twice daily, 7 days)`}
            placeholderTextColor="#A1A1AA"
            value={med.value}
            onChangeText={(text) => updateMedication(med.id, text)}
            multiline
          />
          {medications.length > 1 && (
            <TouchableOpacity style={styles.removeButton} onPress={() => removeMedication(med.id)}>
              <Icon name="delete" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={addMedicationField}>
        <Icon name="add" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Add Medication</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.viewPastButton} onPress={handleViewPastPrescriptions}>
        <Icon name="history" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>View Past Prescriptions</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
        <Text style={styles.completeButtonText}>Complete Prescription</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPrescriptionSummary = () => (
    <View style={styles.prescriptionPaper}>
      <View style={styles.prescriptionHeader}>
        <View style={styles.headerLeft}>
          {doctorData?.profilePicture ? (
            <Image source={{ uri: doctorData.profilePicture }} style={styles.doctorStamp} />
          ) : (
            <View style={styles.doctorStampPlaceholder}>
              <Icon name="local-hospital" size={24} color="#374151" />
            </View>
          )}
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.clinicName}>Medical Health Center</Text>
          <Text style={styles.doctorNameHeader}>{doctorData?.fullName || 'Doctor'}</Text>
          <Text style={styles.doctorCredentials}>
            {doctorData?.specialization || 'Specialist'} • {doctorData?.degree || 'MD, PhD'}
          </Text>
          <Text style={styles.doctorLicense}>
            License: {doctorData?.licenseNumber || 'DR12345'}
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
          <Text style={styles.patientInfoValue}>{patientName}</Text>
        </View>
        <View style={styles.patientInfoRow}>
          <Text style={styles.patientInfoLabel}>Age:</Text>
          <Text style={styles.patientInfoValue}>{patientAge}</Text>
        </View>
        <View style={styles.patientInfoRow}>
          <Text style={styles.patientInfoLabel}>Date:</Text>
          <Text style={styles.patientInfoValue}>{currentDate}</Text>
        </View>
      </View>

      <View style={styles.medicationSection}>
        {medications
          .filter((med) => med.value.trim())
          .map((med, index) => (
            <View key={med.id} style={styles.medicationItem}>
              <Text style={styles.medicationNumber}>{index + 1}</Text>
              <Text style={styles.medicationText}>{med.value}</Text>
            </View>
          ))}
      </View>

      <View style={styles.signatureSection}>
        <View style={styles.signatureContainer}>
          {doctorData?.signature ? (
            <Image source={{ uri: doctorData.signature }} style={styles.signatureImage} />
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

      <View style={styles.footerSection}>
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <FontAwesome name="phone" size={14} color="#6B7280" />
            <Text style={styles.contactText}>
              {doctorData?.phoneNumber || '+1 123-456-7890'}
            </Text>
          </View>
          <View style={styles.contactItem}>
            <FontAwesome name="envelope" size={14} color="#6B7280" />
            <Text style={styles.contactText}>
              {doctorData?.email || 'doctor@example.com'}
            </Text>
          </View>
          <View style={styles.contactItem}>
            <FontAwesome name="map-marker" size={14} color="#6B7280" />
            <Text style={styles.contactText}>
              {doctorData?.address || '123 Medical Center, Healthcare City'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={savePrescription}>
        <Icon name="save" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Save Prescription</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.gradientContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (selectedPatient) {
                setSelectedPatient(null);
                setPatientName('');
                setPatientAge('');
                setMedications([{ id: Date.now(), value: '' }]);
                setShowPrescriptionSummary(false);
              } else {
                navigation.goBack();
              }
            }}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {showPrescriptionSummary
              ? 'Prescription Summary'
              : selectedPatient
              ? 'Write Prescription'
              : 'Select Patient'}
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Icon name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {!selectedPatient ? (
          <View style={styles.patientListContainer}>
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#93C5FD" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search patients..."
                placeholderTextColor="#93C5FD"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close" size={20} color="#93C5FD" />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredPatients}
              renderItem={renderPatientItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No patients found</Text>
                </View>
              }
              contentContainerStyle={styles.patientListContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
              }
              ListHeaderComponent={
                loading && !cache.patients.length ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : null
              }
            />
          </View>
        ) : (
          <FlatList
            data={[{}]}
            renderItem={() =>
              showPrescriptionSummary ? renderPrescriptionSummary() : renderPrescriptionForm()
            }
            keyExtractor={() => 'form'}
            contentContainerStyle={styles.container}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#F3F4F6',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  title: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    color: '#F3F4F6',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  container: {
    padding: 16,
    paddingBottom: 48,
  },
  patientListContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  patientItem: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  patientAge: {
    fontSize: 14,
    color: '#D1D5DB',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#D1D5DB',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  patientListContent: {
    paddingBottom: 24,
  },
  inputCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  patientInfoContainer: {
    marginBottom: 20,
  },
  patientInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  medicationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    height: 96,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  removeButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  viewPastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  completeButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completeButtonText: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  prescriptionPaper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    width: 64,
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 64,
    alignItems: 'center',
  },
  clinicName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  doctorNameHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  doctorCredentials: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  doctorLicense: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  doctorStamp: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  doctorStampPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  rxSymbol: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  rxText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
    borderRadius: 1,
  },
  patientInfoSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  patientInfoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  patientInfoLabel: {
    width: 110,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  patientInfoValue: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  medicationSection: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  medicationItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
  },
  medicationNumber: {
    width: 28,
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  medicationText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 24,
    marginBottom: 24,
  },
  signatureContainer: {
    width: '50%',
    alignItems: 'center',
  },
  signatureImage: {
    width: 160,
    height: 64,
    resizeMode: 'contain',
  },
  signatureLine: {
    height: 1,
    width: '100%',
    backgroundColor: '#D1D5DB',
    marginBottom: 6,
  },
  signatureText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  stampContainer: {
    width: '40%',
    alignItems: 'center',
  },
  doctorStampLarge: {
    width: 110,
    height: 56,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    transform: [{ rotate: '-10deg' }],
  },
  stampText: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  footerSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    marginBottom: 24,
  },
  contactInfo: {
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default MedicationPrescription;