import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { AppError } from '@/lib/errors'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        persistSession: true,
      },
    })
  : null

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new AppError(
      'configuration',
      'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable cloud watchlists.',
    )
  }

  return supabase
}
