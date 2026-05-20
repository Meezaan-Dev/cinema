import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
      setIsLoading(false)
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
          throw new AppError('auth', errorMessage)
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
