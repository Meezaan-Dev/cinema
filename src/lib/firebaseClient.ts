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

// Log Firebase configuration status (redact sensitive parts)
if (typeof window !== 'undefined') {
  console.log('🔥 Firebase Configuration:', {
    configured: isFirebaseConfigured,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apiKeyLength: firebaseConfig.apiKey?.length || 0,
    appId: firebaseConfig.appId,
    environment: import.meta.env.MODE,
    emulatorEnabled: import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true',
  })
}

let auth: Auth | null = null
let db: Firestore | null = null

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)

  // Connect to emulators in development if specified
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    const authEmulatorUrl = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL
    const firestoreEmulatorHost = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST

    if (authEmulatorUrl) {
      try {
        connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true })
      } catch {
        // Already connected or error
      }
    }

    if (firestoreEmulatorHost) {
      try {
        const [host, port] = firestoreEmulatorHost.split(':')
        connectFirestoreEmulator(db, host, Number(port))
      } catch {
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
