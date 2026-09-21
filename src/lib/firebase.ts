import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  initializeAuth,
} from 'firebase/auth'
import { initializeFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB3UXfb2NWp4Y2Pwh8x2FV5sYhigr_34aQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'rewind-video-club.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'rewind-video-club',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'rewind-video-club.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '414216833089',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:414216833089:web:5839a29d3dc6d12ace5ec0',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = initializeAuth(firebaseApp, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
})
export const googleProvider = new GoogleAuthProvider()

let firestoreDb: Firestore | null = null

export function getDb() {
  if (!firestoreDb) {
    firestoreDb = initializeFirestore(
      firebaseApp,
      {
        experimentalAutoDetectLongPolling: true,
      },
      import.meta.env.VITE_FIRESTORE_DATABASE_ID || 'rewind-db',
    )
  }
  return firestoreDb
}
