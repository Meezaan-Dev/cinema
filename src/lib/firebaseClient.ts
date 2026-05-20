import { initializeApp } from 'firebase/app'
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from 'firebase/auth'
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore'

import { AppError } from '@/lib/errors'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
)

let firebaseApp: ReturnType<typeof initializeApp> | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (isFirebaseConfigured) {
  firebaseApp = initializeApp(firebaseConfig)
  auth = getAuth(firebaseApp)
  db = getFirestore(firebaseApp)

  // Connect to emulators in development if specified
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    const authEmulatorUrl = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL
    const firestoreEmulatorHost = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST

    if (authEmulatorUrl) {
      try {
        connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true })
      } catch (e) {
        // Already connected or error
      }
    }

    if (firestoreEmulatorHost) {
      try {
        const [host, port] = firestoreEmulatorHost.split(':')
        connectFirestoreEmulator(db, host, Number(port))
      } catch (e) {
        // Already connected or error
      }
    }
  }
}

export function getAuth_Client(): Auth {
  if (!auth) {
    throw new AppError(
      'configuration',
      'Firebase is not configured. Add Firebase environment variables to enable authentication.',
    )
  }
  return auth
}

export function getFirebaseDB(): Firestore {
  if (!db) {
    throw new AppError(
      'configuration',
      'Firebase is not configured. Add Firebase environment variables to enable Firestore.',
    )
  }
  return db
}

export { auth, db }
