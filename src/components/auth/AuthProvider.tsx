import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { AppError } from '@/lib/errors'
import { AuthContext, type AuthContextValue } from '@/lib/authContext'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

async function ensureProfile(nextSession: Session | null) {
  if (!supabase || !nextSession?.user) return

  const metadata = nextSession.user.user_metadata
  await supabase.from('profiles').upsert({
    id: nextSession.user.id,
    display_name:
      typeof metadata.full_name === 'string'
        ? metadata.full_name
        : typeof metadata.name === 'string'
          ? metadata.name
          : nextSession.user.email,
    avatar_url: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null,
  })
}

function getAuthRedirectTo() {
  return `${window.location.origin}${window.location.pathname}${window.location.search}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return undefined

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setIsLoading(false)
      ensureProfile(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
      ensureProfile(nextSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      authConfigured: isSupabaseConfigured,
      isLoading,
      session,
      user: session?.user ?? null,
      signInWithGoogle: async () => {
        if (!supabase) {
          throw new AppError('configuration', 'Supabase is not configured for Google sign-in.')
        }

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: getAuthRedirectTo(),
          },
        })

        if (error) {
          throw new AppError('auth', error.message)
        }
      },
      signOut: async () => {
        if (!supabase) return
        const { error } = await supabase.auth.signOut()
        if (error) {
          throw new AppError('auth', error.message)
        }
      },
    }),
    [isLoading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
