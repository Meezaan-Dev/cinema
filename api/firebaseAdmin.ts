import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'

type FirebaseAdminServices = {
  app: App
  auth: Auth
  db: Firestore
}

let services: FirebaseAdminServices | null = null

function getOptionalEnv(name: string) {
  const value = process.env[name]?.trim()
  return value && value !== 'undefined' && value !== 'null' ? value : ''
}

function getProjectId() {
  return (
    getOptionalEnv('FIREBASE_PROJECT_ID') ||
    getOptionalEnv('VITE_FIREBASE_PROJECT_ID') ||
    getOptionalEnv('GOOGLE_CLOUD_PROJECT') ||
    getOptionalEnv('GCLOUD_PROJECT') ||
    ''
  )
}

function parseServiceAccountKey() {
  const keyPath = getOptionalEnv('FIREBASE_SERVICE_ACCOUNT_FILE')
  const rawJsonKey = getOptionalEnv('FIREBASE_SERVICE_ACCOUNT_KEY')
  const base64Key = getOptionalEnv('FIREBASE_SERVICE_ACCOUNT_KEY_BASE64')
  const fileKey = keyPath ? readFileSync(keyPath, 'utf8') : ''
  const rawKey = rawJsonKey || base64Key || fileKey
  if (!rawKey) return null

  const json = rawJsonKey || fileKey ? rawKey : Buffer.from(rawKey, 'base64').toString('utf8')

  const parsed = JSON.parse(json) as Record<string, unknown>
  if (typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
  }

  return parsed
}

export function getFirebaseAdminServices(): FirebaseAdminServices | null {
  if (services) return services

  const projectId = getProjectId()

  if (!projectId) {
    return null
  }

  try {
    const serviceAccount = parseServiceAccountKey()
    const app =
      getApps()[0] ??
      initializeApp(
        serviceAccount
          ? {
              credential: cert(serviceAccount),
              projectId,
            }
          : {
              credential: applicationDefault(),
              projectId,
            },
      )

    services = {
      app,
      auth: getAuth(app),
      db: getFirestore(app),
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error)
    return null
  }

  return services
}

export function isMissingFirestoreDatabaseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('NOT_FOUND') || message.includes('Database') || message.includes('database')
}
