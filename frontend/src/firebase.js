import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
function validateFirebaseConfig(config) {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingKeys = requiredKeys.filter((key) => {
    const value = config[key];
    return value === undefined || value === null || value === '';
  });

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required Firebase configuration values: ${missingKeys.join(', ')}. ` +
      `Please check your .env file and ensure all VITE_FIREBASE_* variables are set.`
    );
  }
}

// Validate before initializing
validateFirebaseConfig(firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Storage
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
