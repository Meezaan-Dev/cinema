import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB3UXfb2NWp4Y2Pwh8x2FV5sYhigr_34aQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'rewind-video-club.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'rewind-video-club',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'rewind-video-club.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '414216833089',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:414216833089:web:5839a29d3dc6d12ace5ec0',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(firebaseApp, import.meta.env.VITE_FIRESTORE_DATABASE_ID || 'rewind-db')
