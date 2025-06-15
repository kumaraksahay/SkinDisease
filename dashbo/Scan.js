import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient'; // For gradient background
import Icon from 'react-native-vector-icons/MaterialIcons'; // For icons

const SkinImageUpload = () => {
  const [skinImage, setSkinImage] = useState(null); // State to store the uploaded image
  const [loading, setLoading] = useState(false); // State to handle loading

  // Function to handle image upload
  const handleImageUpload = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        Alert.alert('Upload Cancelled', 'You did not select any image.');
      } else if (response.errorCode) {
        Alert.alert('Error', 'An error occurred while selecting the image.');
      } else if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0].uri;
        setSkinImage(selectedImage); // Set the selected image URI
      }
    });
  };

  // Function to handle image submission
  const handleSubmit = () => {
    if (!skinImage) {
      Alert.alert('Error', 'Please upload a skin image before submitting.');
      return;
    }

    setLoading(true); // Show loading indicator
    // Simulate an API call or image processing
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Your skin image has been submitted successfully!');
    }, 2000);
  };

  return (
    <LinearGradient colors={['#6A11CB', '#2575FC']} style={styles.container}>
      <Text style={styles.title}>Upload Skin Image</Text>
      <Text style={styles.subtitle}>
        Please upload a clear image of your skin for analysis.
      </Text>

      {/* Image Preview */}
      <View style={styles.imageContainer}>
        {skinImage ? (
          <Image source={{ uri: skinImage }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="image" size={50} color="#6A11CB" />
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}
      </View>

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={handleImageUpload}>
        <Text style={styles.uploadButtonText}>
          {skinImage ? 'Change Image' : 'Upload Image'}
        </Text>
      </TouchableOpacity>

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Image</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 30,
    textAlign: 'center',
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#6A11CB',
    marginTop: 10,
  },
  uploadButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A11CB',
  },
  submitButton: {
    backgroundColor: '#6A11CB',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default SkinImageUpload;