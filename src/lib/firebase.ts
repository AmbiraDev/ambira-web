import {
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { debug } from './debug';

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

const isFirebaseConfigured = missingEnvVars.length === 0;

let appInstance: FirebaseApp | undefined;
let authInstance: Auth;
let dbInstance: Firestore;
let storageInstance: FirebaseStorage;

if (isFirebaseConfigured) {
  const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  appInstance = initializeApp(firebaseConfig);
  authInstance = getAuth(appInstance);
  dbInstance = getFirestore(appInstance);
  storageInstance = getStorage(appInstance);

  if (typeof window !== 'undefined') {
    setPersistence(authInstance, browserLocalPersistence).catch(error => {
      debug.error('[Firebase] Failed to set persistence:', error);
    });
  }
} else {
  debug.warn(
    '[Firebase] Missing configuration environment variables. Firebase features are disabled. Missing:',
    missingEnvVars.join(', ')
  );

  const createUnavailableProxy = <T extends object>(serviceName: string) =>
    new Proxy({} as T, {
      get() {
        throw new Error(
          `[Firebase] Attempted to access ${serviceName} before Firebase was configured.`
        );
      },
    });

  authInstance = createUnavailableProxy<Auth>('auth');
  dbInstance = createUnavailableProxy<Firestore>('firestore');
  storageInstance = createUnavailableProxy<FirebaseStorage>('storage');
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export const isFirebaseInitialized = isFirebaseConfigured;

export default appInstance ?? ({} as FirebaseApp);
