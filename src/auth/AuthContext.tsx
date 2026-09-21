import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { AuthContext, type AuthContextValue } from '@/auth/authState'
import { auth, googleProvider } from '@/lib/firebase'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setIsLoading(false)
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async signInWithGoogle() {
        const credential = await signInWithPopup(auth, googleProvider)
        return credential.user
      },
      async signOutUser() {
        await signOut(auth)
      },
    }),
    [isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
