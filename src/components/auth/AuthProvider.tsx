import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { FirebaseError } from 'firebase/app'
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'

import { AppError } from '@/lib/errors'
import { AuthContext, type AuthContextValue } from '@/lib/authContext'
import { isFirebaseConfigured, getAuth_Client } from '@/lib/firebaseClient'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return
    }

    const auth = getAuth_Client()

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser ?? null)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      authConfigured: isFirebaseConfigured,
      isLoading: authLoading,
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
          const firebaseError =
            typeof error === 'object' && error !== null && 'code' in error
              ? (error as FirebaseError)
              : null

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
    [authLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
