import { createContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'

export type AuthContextValue = {
  authConfigured: boolean
  isLoading: boolean
  user: FirebaseUser | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
