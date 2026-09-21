import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { applicationDefault, cert, getApps, initializeApp, refreshToken, type App, type Credential } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

function env(name: string) {
  const proc = (globalThis as Record<string, unknown>).process
  if (
    typeof proc === 'object' &&
    proc !== null &&
    typeof (proc as Record<string, unknown>).env === 'object'
  ) {
    return ((proc as Record<string, unknown>).env as Record<string, string | undefined>)[name]
  }

  return undefined
}

function parseServiceAccount() {
  const raw = env('FIREBASE_SERVICE_ACCOUNT_JSON')
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{')) return undefined

  try {
    return JSON.parse(trimmed) as Record<string, string>
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON.')
  }
}

export type FirebaseCliConfig = {
  tokens?: {
    refresh_token?: string
  }
}

export const firebaseCliRefreshTokenCredential = {
  type: 'authorized_user',
  client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
  client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
}

function parseFirebaseCliConfig(path: string): FirebaseCliConfig | null {
  if (!existsSync(path)) return null

  try {
    return JSON.parse(readFileSync(path, 'utf8')) as FirebaseCliConfig
  } catch {
    return null
  }
}

export function getFirebaseCliRefreshToken() {
  const config = parseFirebaseCliConfig(join(homedir(), '.config/configstore/firebase-tools.json'))
  return config?.tokens?.refresh_token
}

function getFirebaseCredential(): Credential {
  const serviceAccount = parseServiceAccount()
  if (serviceAccount) return cert(serviceAccount)

  const cliRefreshToken = getFirebaseCliRefreshToken()
  if (cliRefreshToken) {
    return refreshToken({
      ...firebaseCliRefreshTokenCredential,
      refresh_token: cliRefreshToken,
    })
  }

  return applicationDefault()
}

export function getFirebaseProjectId() {
  return env('FIREBASE_PROJECT_ID') || env('GCLOUD_PROJECT') || env('GOOGLE_CLOUD_PROJECT') || 'rewind-video-club'
}

export function getFirestoreDatabaseId() {
  return env('FIRESTORE_DATABASE_ID') || 'rewind-db'
}

export function getRewindOwnerId() {
  return env('REWIND_OWNER_ID') || env('ABSOLUTE_CINEMA_OWNER_ID') || 'personal'
}

export function getFirebaseAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const projectId = getFirebaseProjectId()

  return initializeApp({
    projectId,
    credential: getFirebaseCredential(),
  })
}

export function getRewindFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp(), getFirestoreDatabaseId())
}
