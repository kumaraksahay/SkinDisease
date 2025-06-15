import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyANlug2EUIkaTSUYGsyEbzeJkk7X9Rg3EQ",
  authDomain: "com.akshaykumar123.FireAkshay",
  projectId: "myprojectkolhi",
  storageBucket: "myprojectkolhi.firebasestorage.app",
  messagingSenderId: "153052758568",
  appId: "1:153052758568:android:530dd32a508a3880dceb1d",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Auth with AsyncStorage for persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
