import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA-7R6B59zooCoNu7odOtqCgOny0A0JQuU",
  authDomain: "strava-but-productive.firebaseapp.com",
  projectId: "strava-but-productive",
  storageBucket: "strava-but-productive.firebasestorage.app",
  messagingSenderId: "374690007345",
  appId: "1:374690007345:web:7f704b27b371eed5a48810",
  measurementId: "G-CS97PM6G6H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
