import { getRedirectResult, onAuthStateChanged, signInWithRedirect, signOut, type User } from 'firebase/auth'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { AuthContext, type AuthContextValue } from '@/auth/authState'
import { auth, googleProvider } from '@/lib/firebase'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    void getRedirectResult(auth).catch((error: unknown) => {
      console.error('Rewind Google sign-in redirect failed', error)
    })

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!isMounted) return
      setUser(nextUser)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async signInWithGoogle() {
        await signInWithRedirect(auth, googleProvider)
      },
      async signOutUser() {
        await signOut(auth)
      },
    }),
    [isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
