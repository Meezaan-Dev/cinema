import { Timestamp, type Firestore } from 'firebase-admin/firestore'

import { getRewindFirestore, getRewindOwnerId } from './firebaseAdmin.js'
import { createFirestoreRestViewingRepository } from './firestoreRestRepository.js'
import type { FirestoreViewingInput, RewindViewing, ViewingLocation, ViewingSource } from './rewindDomain.js'

type FirestoreTimestampLike = {
  toDate: () => Date
}

export type ViewingWriteResult = {
  id: string
  created: boolean
}

export type ViewingRepository = {
  listViewings: () => Promise<RewindViewing[]>
  upsertViewing: (id: string, input: FirestoreViewingInput) => Promise<ViewingWriteResult>
}

function isTimestampLike(value: unknown): value is FirestoreTimestampLike {
  return typeof value === 'object' && value !== null && typeof (value as FirestoreTimestampLike).toDate === 'function'
}

function timestampToIso(value: unknown) {
  if (isTimestampLike(value)) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return new Date(0).toISOString()
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function nullableString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function nullableNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function viewingLocation(value: unknown): ViewingLocation {
  return value === 'cinema' || value === 'home' || value === 'other' || value === 'unknown' ? value : 'unknown'
}

function viewingSource(value: unknown): ViewingSource {
  return value === 'rewind' ? 'rewind' : 'letterboxd'
}

function mapViewing(id: string, data: Record<string, unknown>): RewindViewing {
  return {
    id,
    tmdbId: typeof data.tmdbId === 'number' ? data.tmdbId : 0,
    watchedAt: timestampToIso(data.watchedAt),
    location: viewingLocation(data.location),
    rating: nullableNumber(data.rating),
    rewatch: data.rewatch === true,
    review: nullableString(data.review),
    tags: stringArray(data.tags),
    source: viewingSource(data.source),
    sourceUri: nullableString(data.sourceUri),
    sourceKey: typeof data.sourceKey === 'string' ? data.sourceKey : '',
    importTitle: typeof data.importTitle === 'string' ? data.importTitle : '',
    importYear: nullableNumber(data.importYear),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }
}

export function createFirestoreViewingRepository(
  db: Firestore = getRewindFirestore(),
  ownerId = getRewindOwnerId(),
): ViewingRepository {
  const collectionRef = db.collection('users').doc(ownerId).collection('viewings')

  return {
    async listViewings() {
      const snapshot = await collectionRef.orderBy('watchedAt', 'desc').get()
      return snapshot.docs.map((doc) => mapViewing(doc.id, doc.data()))
    },

    async upsertViewing(id, input) {
      const docRef = collectionRef.doc(id)
      const existing = await docRef.get()
      const now = Timestamp.now()

      await docRef.set(
        {
          tmdbId: input.tmdbId,
          watchedAt: Timestamp.fromDate(input.watchedAt),
          location: input.location,
          rating: input.rating,
          rewatch: input.rewatch,
          review: input.review,
          tags: input.tags,
          source: input.source,
          sourceUri: input.sourceUri,
          sourceKey: input.sourceKey,
          importTitle: input.importTitle,
          importYear: input.importYear,
          createdAt: existing.exists ? existing.get('createdAt') : now,
          updatedAt: now,
        },
        { merge: true },
      )

      return { id, created: !existing.exists }
    },
  }
}

export function createViewingRepository(): ViewingRepository {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim().startsWith('{')) {
    return createFirestoreViewingRepository()
  }

  return createFirestoreRestViewingRepository()
}
