import {
  firebaseCliRefreshTokenCredential,
  getFirebaseCliRefreshToken,
  getFirebaseProjectId,
  getFirestoreDatabaseId,
  getRewindOwnerId,
} from './firebaseAdmin.js'
import type { FirestoreViewingInput, RewindViewing, ViewingLocation, ViewingSource } from './rewindDomain.js'
import type { ViewingRepository, ViewingWriteResult } from './viewingRepository.js'

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }

type FirestoreDocument = {
  name: string
  fields?: Record<string, FirestoreValue>
}

type RunQueryResponse = Array<{
  document?: FirestoreDocument
}>

type TokenResponse = {
  access_token?: string
  expires_in?: number
  token_type?: string
}

type TokenCache = {
  accessToken: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

function tokenIsFresh(cache: TokenCache | null) {
  return Boolean(cache && cache.expiresAt > Date.now() + 60_000)
}

async function getFirebaseCliAccessToken() {
  if (tokenIsFresh(tokenCache)) return tokenCache!.accessToken

  const refreshToken = getFirebaseCliRefreshToken()
  if (!refreshToken) {
    throw new Error('Run `firebase login` before using local Rewind Firestore access.')
  }

  const body = new URLSearchParams({
    client_id: firebaseCliRefreshTokenCredential.client_id,
    client_secret: firebaseCliRefreshTokenCredential.client_secret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    throw new Error(`Firebase CLI credential refresh failed with ${response.status}.`)
  }

  const token = (await response.json()) as TokenResponse
  if (!token.access_token) {
    throw new Error('Firebase CLI credential refresh did not return an access token.')
  }

  tokenCache = {
    accessToken: token.access_token,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
  }

  return tokenCache.accessToken
}

function baseUrl(projectId: string, databaseId: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`
}

async function firestoreRequest<T>(url: string, init: RequestInit = {}) {
  const accessToken = await getFirebaseCliAccessToken()
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Firestore REST request failed with ${response.status}: ${body}`)
  }

  return (await response.json()) as T
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function nullableStringValue(value: unknown) {
  return typeof value === 'string' ? value : null
}

function numberValue(value: unknown) {
  if (typeof value !== 'object' || value === null) return null

  if ('integerValue' in value) {
    return Number((value as { integerValue: string }).integerValue)
  }
  if ('doubleValue' in value) {
    return (value as { doubleValue: number }).doubleValue
  }
  return null
}

function timestampValue(value: unknown) {
  return typeof (value as { timestampValue?: unknown })?.timestampValue === 'string'
    ? (value as { timestampValue: string }).timestampValue
    : new Date(0).toISOString()
}

function arrayStringValue(value: unknown) {
  const values = (value as { arrayValue?: { values?: FirestoreValue[] } })?.arrayValue?.values ?? []
  return values.flatMap((item) => ('stringValue' in item ? [item.stringValue] : []))
}

function boolValue(value: unknown) {
  return (value as { booleanValue?: unknown })?.booleanValue === true
}

function locationValue(value: unknown): ViewingLocation {
  const location = stringValue((value as { stringValue?: string })?.stringValue)
  return location === 'cinema' || location === 'home' || location === 'other' || location === 'unknown'
    ? location
    : 'unknown'
}

function sourceValue(value: unknown): ViewingSource {
  return (value as { stringValue?: string })?.stringValue === 'rewind' ? 'rewind' : 'letterboxd'
}

function encodeString(value: string): FirestoreValue {
  return { stringValue: value }
}

function encodeNullableString(value: string | null): FirestoreValue {
  return value === null ? { nullValue: null } : { stringValue: value }
}

function encodeNullableNumber(value: number | null): FirestoreValue {
  return value === null
    ? { nullValue: null }
    : Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value }
}

function encodeTimestamp(date: Date): FirestoreValue {
  return { timestampValue: date.toISOString() }
}

function encodeStringArray(values: string[]): FirestoreValue {
  return { arrayValue: { values: values.map((value) => ({ stringValue: value })) } }
}

function decodeDocument(document: FirestoreDocument): RewindViewing {
  const fields = document.fields ?? {}
  const id = document.name.split('/').at(-1) ?? ''

  return {
    id,
    tmdbId: numberValue(fields.tmdbId) ?? 0,
    watchedAt: timestampValue(fields.watchedAt),
    location: locationValue(fields.location),
    rating: numberValue(fields.rating),
    rewatch: boolValue(fields.rewatch),
    review: nullableStringValue((fields.review as { stringValue?: string })?.stringValue),
    tags: arrayStringValue(fields.tags),
    source: sourceValue(fields.source),
    sourceUri: nullableStringValue((fields.sourceUri as { stringValue?: string })?.stringValue),
    sourceKey: stringValue((fields.sourceKey as { stringValue?: string })?.stringValue),
    importTitle: stringValue((fields.importTitle as { stringValue?: string })?.stringValue),
    importYear: numberValue(fields.importYear),
    createdAt: timestampValue(fields.createdAt),
    updatedAt: timestampValue(fields.updatedAt),
  }
}

function encodeViewing(input: FirestoreViewingInput, createdAt: Date, updatedAt: Date) {
  return {
    fields: {
      tmdbId: { integerValue: String(input.tmdbId) },
      watchedAt: encodeTimestamp(input.watchedAt),
      location: encodeString(input.location),
      rating: encodeNullableNumber(input.rating),
      rewatch: { booleanValue: input.rewatch },
      review: encodeNullableString(input.review),
      tags: encodeStringArray(input.tags),
      source: encodeString(input.source),
      sourceUri: encodeNullableString(input.sourceUri),
      sourceKey: encodeString(input.sourceKey),
      importTitle: encodeString(input.importTitle),
      importYear: encodeNullableNumber(input.importYear),
      createdAt: encodeTimestamp(createdAt),
      updatedAt: encodeTimestamp(updatedAt),
    },
  }
}

export function createFirestoreRestViewingRepository(
  projectId = getFirebaseProjectId(),
  databaseId = getFirestoreDatabaseId(),
  ownerId = getRewindOwnerId(),
): ViewingRepository {
  const root = baseUrl(projectId, databaseId)
  const collectionPath = `users/${ownerId}/viewings`

  return {
    async listViewings() {
      const response = await firestoreRequest<RunQueryResponse>(`${root}/users/${ownerId}:runQuery`, {
        method: 'POST',
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'viewings' }],
            orderBy: [{ field: { fieldPath: 'watchedAt' }, direction: 'DESCENDING' }],
          },
        }),
      })

      return response.flatMap((item) => (item.document ? [decodeDocument(item.document)] : []))
    },

    async upsertViewing(id: string, input: FirestoreViewingInput): Promise<ViewingWriteResult> {
      const documentUrl = `${root}/${collectionPath}/${id}`
      let existing: FirestoreDocument | null = null

      try {
        existing = await firestoreRequest<FirestoreDocument>(documentUrl)
      } catch (error) {
        if (!String(error).includes(' 404:')) throw error
      }

      const createdAt = existing?.fields?.createdAt
        ? new Date(timestampValue(existing.fields.createdAt))
        : new Date()
      const updatedAt = new Date()

      await firestoreRequest<FirestoreDocument>(documentUrl, {
        method: 'PATCH',
        body: JSON.stringify(encodeViewing(input, createdAt, updatedAt)),
      })

      return { id, created: existing === null }
    },
  }
}
