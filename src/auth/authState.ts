import { createContext } from 'react'
import type { User } from 'firebase/auth'

import type { CachedAuthSession } from '@/lib/authSessionCache'

export type AuthContextValue = {
  user: User | null
  profile: CachedAuthSession | null
  uid: string | undefined
  isLoading: boolean
  isSigningIn: boolean
  signInError: string | null
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
  clearSignInError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
