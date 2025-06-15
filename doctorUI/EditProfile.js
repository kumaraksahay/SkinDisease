import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditDoctorProfile = ({ navigation }) => {
  const [doctorData, setDoctorData] = useState({
    fullName: '',
    age: '',
    address: '',
    experienceYears: '',
    degree: '',
    specialization: '',
    languages: '',
    consultationFee: '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [signature, setSignature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cache, setCache] = useState({ doctorData: null, profilePicture: null, signature: null });
  const isMounted = useRef(false);
  const initialFetchDone = useRef(false);
  const currentUser = auth().currentUser;

  // Load cached data
  useEffect(() => {
    isMounted.current = true;
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem('editDoctorProfileCache');
        if (cached && isMounted.current) {
          const parsedCache = JSON.parse(cached);
          setCache(parsedCache);
          if (parsedCache.doctorData) {
            setDoctorData(parsedCache.doctorData);
            setProfilePicture(parsedCache.profilePicture || null);
            setSignature(parsedCache.signature || null);
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
      await AsyncStorage.setItem('editDoctorProfileCache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  };

  const fetchDoctorData = useCallback(
    async (isRefresh = false) => {
      if (!currentUser || !isMounted.current) return;
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (!cache.doctorData) {
          setLoading(true);
        }

        const doctorDoc = await firestore().collection('doctors').doc(currentUser.uid).get();
        if (!isMounted.current) return;

        let newDoctorData = null;
        let newProfilePicture = null;
        let newSignature = null;

        if (doctorDoc.exists) {
          const data = doctorDoc.data();
          newDoctorData = {
            fullName: data.fullName || '',
            age: data.age || '',
            address: data.address || '',
            experienceYears: data.experienceYears || '',
            degree: data.degree || '',
            specialization: data.specialization || '',
            languages: data.languages || '',
            consultationFee: data.consultationFee || '',
          };
          newProfilePicture = data.profilePicture || null;
          newSignature = data.signature || null;

          setDoctorData(newDoctorData);
          setProfilePicture(newProfilePicture);
          setSignature(newSignature);
        } else {
          Alert.alert('Error', 'Doctor data not found.');
        }

        setCache((prev) => {
          const newCache = {
            ...prev,
            doctorData: newDoctorData,
            profilePicture: newProfilePicture,
            signature: newSignature,
          };
          saveCache(newCache);
          return newCache;
        });
      } catch (error) {
        console.error('Fetch error:', error);
        if (isMounted.current) {
          Alert.alert('Error', 'Failed to fetch doctor data.');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [currentUser?.uid, cache.doctorData]
  );

  useEffect(() => {
    if (!currentUser || initialFetchDone.current) return;

    if (cache.doctorData) {
      setDoctorData(cache.doctorData);
      setProfilePicture(cache.profilePicture || null);
      setSignature(cache.signature || null);
      setLoading(false);
      initialFetchDone.current = true;
    } else {
      initialFetchDone.current = true;
      fetchDoctorData();
    }

    const unsubscribeFirestore = firestore()
      .collection('doctors')
      .doc(currentUser.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists && isMounted.current) {
            const data = doc.data();
            const newDoctorData = {
              fullName: data.fullName || '',
              age: data.age || '',
              address: data.address || '',
              experienceYears: data.experienceYears || '',
              degree: data.degree || '',
              specialization: data.specialization || '',
              languages: data.languages || '',
              consultationFee: data.consultationFee || '',
            };
            const newProfilePicture = data.profilePicture || null;
            const newSignature = data.signature || null;

            setDoctorData(newDoctorData);
            setProfilePicture(newProfilePicture);
            setSignature(newSignature);

            setCache((prev) => {
              const newCache = {
                ...prev,
                doctorData: newDoctorData,
                profilePicture: newProfilePicture,
                signature: newSignature,
              };
              saveCache(newCache);
              return newCache;
            });
          }
        },
        (error) => {
          console.error('Error in doctor listener:', error);
        }
      );

    const unsubscribeNavigation = navigation.addListener('focus', () => {
      if (cache.doctorData && isMounted.current) {
        setDoctorData(cache.doctorData);
        setProfilePicture(cache.profilePicture || null);
        setSignature(cache.signature || null);
        setLoading(false);
      } else if (isMounted.current) {
        fetchDoctorData();
      }
    });

    return () => {
      unsubscribeFirestore();
      unsubscribeNavigation();
    };
  }, [currentUser?.uid, fetchDoctorData, cache.doctorData, cache.profilePicture, cache.signature, navigation]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    if (!refreshing) {
      fetchDoctorData(true);
    }
  }, [refreshing, fetchDoctorData]);

  const handleImageUpload = (type) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        quality: 0.8,
        maxWidth: type === 'profile' ? 800 : 600,
        maxHeight: type === 'profile' ? 800 : 200,
      },
      (response) => {
        if (response.didCancel) {
          // User cancelled - do nothing
        } else if (response.errorCode) {
          Alert.alert('Error', 'An error occurred while selecting the image.');
        } else if (response.assets && response.assets.length > 0) {
          if (type === 'profile') {
            setProfilePicture(response.assets[0].uri);
          } else if (type === 'signature') {
            setSignature(response.assets[0].uri);
          }
        }
      }
    );
  };

  const uploadImageToStorage = async (uri, userId, type) => {
    try {
      const fileName = `${type}/${userId}_${Date.now()}.jpg`;
      const reference = storage().ref(fileName);
      await reference.putFile(uri);
      const downloadURL = await reference.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error(`${type} upload error:`, error);
      throw new Error(`Failed to upload ${type}.`);
    }
  };

  const handleUpdateProfile = async () => {
    if (!doctorData.fullName || !doctorData.age) {
      Alert.alert('Missing Information', 'Please fill in all required fields (name and age).');
      return;
    }

    setUpdating(true);
    try {
      if (currentUser) {
        let profilePictureURL = profilePicture;
        let signatureURL = signature;

        if (profilePicture && profilePicture.startsWith('file://')) {
          profilePictureURL = await uploadImageToStorage(profilePicture, currentUser.uid, 'profile_pictures');
        }

        if (signature && signature.startsWith('file://')) {
          signatureURL = await uploadImageToStorage(signature, currentUser.uid, 'signatures');
        }

        await firestore().collection('doctors').doc(currentUser.uid).set(
          {
            fullName: doctorData.fullName,
            age: doctorData.age,
            address: doctorData.address,
            experienceYears: doctorData.experienceYears,
            degree: doctorData.degree,
            specialization: doctorData.specialization,
            languages: doctorData.languages,
            consultationFee: doctorData.consultationFee,
            profilePicture: profilePictureURL || '',
            signature: signatureURL || '',
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        setProfilePicture(profilePictureURL);
        setSignature(signatureURL);

        setCache((prev) => {
          const newCache = {
            ...prev,
            doctorData,
            profilePicture: profilePictureURL,
            signature: signatureURL,
          };
          saveCache(newCache);
          return newCache;
        });

        Alert.alert(
          'Success',
          'Your profile has been updated successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Update Failed', 'Failed to update profile. Please try again later.');
      console.error('Profile update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const renderInputField = (label, key, placeholder, keyboardType = 'default', multiline = false, required = false) => (
    <>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.requiredStar}>*</Text>}
      </Text>
      <View style={[styles.inputContainer, multiline && styles.textAreaContainer]}>
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          value={doctorData[key]}
          onChangeText={(text) => setDoctorData({ ...doctorData, [key]: text })}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      </View>
    </>
  );

  if (loading && !cache.doctorData) {
    return (
      <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.gradientContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.gradientContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={styles.keyboardAvoidView}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>Edit Your Profile</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                <Icon name="refresh" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Profile Picture Upload */}
            <View style={styles.profileContainer}>
              <TouchableOpacity onPress={() => handleImageUpload('profile')} style={styles.profileImageContainer}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.profileImage} />
                ) : (
                  <LinearGradient
                    colors={['#06B6D4', '#3B82F6']}
                    style={styles.profilePlaceholder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="person" size={60} color="#fff" />
                  </LinearGradient>
                )}
                <LinearGradient
                  colors={['#06B6D4', '#3B82F6']}
                  style={styles.editIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="edit" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.uploadText}>
                {profilePicture ? 'Tap to change photo' : 'Tap to upload a photo'}
              </Text>
            </View>

            {/* Signature Upload */}
            <View style={styles.signatureContainer}>
              <TouchableOpacity onPress={() => handleImageUpload('signature')} style={styles.signatureImageContainer}>
                {signature ? (
                  <Image source={{ uri: signature }} style={styles.signatureImage} />
                ) : (
                  <LinearGradient
                    colors={['#06B6D4', '#3B82F6']}
                    style={styles.signaturePlaceholder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="create" size={40} color="#fff" />
                  </LinearGradient>
                )}
                <LinearGradient
                  colors={['#06B6D4', '#3B82F6']}
                  style={styles.editIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="edit" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.uploadText}>
                {signature ? 'Tap to change signature' : 'Tap to upload your signature'}
              </Text>
            </View>

            <View style={styles.formContainer}>
              {/* Input Fields */}
              {renderInputField('Full Name', 'fullName', 'Dr. John Doe', 'default', false, true)}
              {renderInputField('Age', 'age', '45', 'numeric', false, true)}
              {renderInputField('Address', 'address', 'Your clinic or hospital address', 'default', true)}
              {renderInputField('Years of Experience', 'experienceYears', '10', 'numeric')}
              {renderInputField('Degree', 'degree', 'MD, MBBS, etc.')}
              {renderInputField('Specialization', 'specialization', 'Cardiology, Pediatrics, etc.')}
              {renderInputField('Languages Spoken', 'languages', 'English, Spanish, etc.')}
              {renderInputField('Consultation Fee', 'consultationFee', '100', 'numeric')}

              {/* Update Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleUpdateProfile}
                disabled={updating}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#06B6D4', '#3B82F6']}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {updating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Icon name="check-circle" size={20} color="#fff" style={styles.buttonIcon} />
                      <Text style={styles.submitButtonText}>Update Profile</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoidView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  signatureContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImageContainer: {
    position: 'relative',
    borderRadius: 80,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  signatureImageContainer: {
    position: 'relative',
    borderRadius: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#fff',
  },
  signatureImage: {
    width: 200,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profilePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  signaturePlaceholder: {
    width: 200,
    height: 80,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadText: {
    color: '#fff',
    fontWeight: '500',
    marginTop: 8,
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#ff9900',
    fontWeight: 'bold',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  textAreaContainer: {
    height: 100,
  },
  input: {
    fontSize: 16,
    padding: 14,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
});

export default EditDoctorProfile;