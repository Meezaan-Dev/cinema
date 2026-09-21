const STORAGE_KEY = 'rewind:auth-session:v1'

export type CachedAuthSession = {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

export function readAuthSession(): CachedAuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedAuthSession
    if (typeof parsed.uid !== 'string' || !parsed.uid) return null
    return parsed
  } catch {
    return null
  }
}

export function writeAuthSession(session: CachedAuthSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEY)
}
