import { FirebaseError } from 'firebase/app'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { AuthContext, type AuthContextValue } from '@/auth/authState'
import {
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
  type CachedAuthSession,
} from '@/lib/authSessionCache'
import { clearUserQueryCache } from '@/lib/queryLocalCache'
import { auth, googleProvider } from '@/lib/firebase'

function isFirebaseError(error: unknown): error is FirebaseError {
  return error instanceof FirebaseError
}

function signInErrorMessage(error: unknown) {
  if (isFirebaseError(error)) {
    if (error.code === 'auth/popup-closed-by-user') {
      return 'Sign-in was cancelled. Try again when you are ready.'
    }
    if (error.code === 'auth/popup-blocked') {
      return 'Your browser blocked the sign-in window. Allow popups for this site or try again.'
    }
    if (error.code === 'auth/unauthorized-domain') {
      return 'This site is not authorized for Google sign-in. Add this domain in Firebase Authentication settings.'
    }
    return error.message || 'Google sign-in failed.'
  }

  if (error instanceof Error) return error.message
  return 'Google sign-in failed.'
}

function toCachedSession(user: User): CachedAuthSession {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const cachedSession = readAuthSession()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<CachedAuthSession | null>(cachedSession)
  const [isLoading, setIsLoading] = useState(!cachedSession)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  const signInInFlight = useRef(false)

  useEffect(() => {
    let isMounted = true

    void getRedirectResult(auth).catch((error: unknown) => {
      if (!isMounted) return
      setSignInError(signInErrorMessage(error))
    })

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!isMounted) return
      setUser(nextUser)
      setIsLoading(false)

      if (nextUser) {
        const session = toCachedSession(nextUser)
        setProfile(session)
        writeAuthSession(session)
        setSignInError(null)
        return
      }

      setProfile((current) => {
        if (current) clearUserQueryCache(current.uid)
        return null
      })
      clearAuthSession()
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const clearSignInError = useCallback(() => setSignInError(null), [])

  const signInWithGoogle = useCallback(async () => {
    if (signInInFlight.current) return

    signInInFlight.current = true
    setIsSigningIn(true)
    setSignInError(null)

    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error: unknown) {
      if (isFirebaseError(error) && error.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (redirectError: unknown) {
          setSignInError(signInErrorMessage(redirectError))
          return
        }
      }

      if (isFirebaseError(error) && error.code === 'auth/popup-closed-by-user') {
        return
      }

      setSignInError(signInErrorMessage(error))
    } finally {
      signInInFlight.current = false
      setIsSigningIn(false)
    }
  }, [])

  const signOutUser = useCallback(async () => {
    setSignInError(null)
    if (profile) clearUserQueryCache(profile.uid)
    clearAuthSession()
    setProfile(null)
    await signOut(auth)
  }, [profile])

  const uid = profile?.uid

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      uid,
      isLoading,
      isSigningIn,
      signInError,
      signInWithGoogle,
      signOutUser,
      clearSignInError,
    }),
    [clearSignInError, isLoading, isSigningIn, profile, signInError, signInWithGoogle, signOutUser, uid, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
