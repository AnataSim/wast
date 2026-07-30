import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC-7q-ppftWsCHn4cQc5fk2Lj4mUYKQSUY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "watchlist-app-ae884.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "watchlist-app-ae884",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "watchlist-app-ae884.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "759704473322",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:759704473322:web:a53c776e43b62adc6c5193"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
storage.maxUploadRetryTime = 4000;
storage.maxOperationRetryTime = 4000;

export default app;
