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

function getProjectId() {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    ''
  )
}

function parseServiceAccountKey() {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_FILE
  const rawKey =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 ||
    (keyPath ? readFileSync(keyPath, 'utf8') : '')
  if (!rawKey) return null

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
    ? Buffer.from(rawKey, 'base64').toString('utf8')
    : rawKey

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
