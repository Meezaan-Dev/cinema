import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { FirebaseError } from 'firebase/app'
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

import { AppError } from '@/lib/errors'
import { AuthContext, type AuthContextValue } from '@/lib/authContext'
import { isFirebaseConfigured, getAuth_Client, getFirebaseDB } from '@/lib/firebaseClient'

async function ensureUserProfile(user: FirebaseUser | null) {
  if (!user || !isFirebaseConfigured) return

  const db = getFirebaseDB()
  const userDocRef = doc(db, 'users', user.uid)

  await setDoc(
    userDocRef,
    {
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || null,
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return
    }

    const auth = getAuth_Client()

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser ?? null)
      setIsLoading(false)
      await ensureUserProfile(authUser)
    })

    return () => unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      authConfigured: isFirebaseConfigured,
      isLoading,
      user,
      signInWithGoogle: async () => {
        if (!isFirebaseConfigured) {
          throw new AppError('configuration', 'Firebase is not configured for Google sign-in.')
        }

        const auth = getAuth_Client()
        const provider = new GoogleAuthProvider()

        try {
          await signInWithPopup(auth, provider)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          const firebaseError = error as (FirebaseError & { customData?: unknown }) | null

          // Log detailed error info for debugging
          console.error('🔥 Firebase Sign-In Error:', {
            message: errorMessage,
            code: firebaseError?.code,
            customData: firebaseError?.customData,
            fullError: error,
          })
          
          // Provide helpful error messages based on error type
          let userMessage = errorMessage
          if (errorMessage.includes('CONFIGURATION_NOT_FOUND')) {
            userMessage = 'Firebase configuration error. Please check your API key and Firebase Console settings. See FIREBASE_TROUBLESHOOTING.md for help.'
          } else if (errorMessage.includes('auth/operation-not-allowed')) {
            userMessage = 'Google Sign-In is not enabled in Firebase Console. Enable it in Authentication > Sign-in methods.'
          } else if (errorMessage.includes('auth/popup-closed-by-user')) {
            userMessage = 'Sign-in was cancelled. Please try again.'
          }
          
          throw new AppError('auth', userMessage)
        }
      },
      signOut: async () => {
        if (!isFirebaseConfigured) return

        const auth = getAuth_Client()
        try {
          await firebaseSignOut(auth)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          throw new AppError('auth', errorMessage)
        }
      },
    }),
    [isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
