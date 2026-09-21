import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type Timestamp as FirestoreTimestamp,
} from 'firebase/firestore'

import { getDb } from '@/lib/firebase'
import { writeHistoryCache } from '@/lib/queryLocalCache'
import { sanitizeViewingRating } from '@/lib/viewingDomain'
import { AppError } from '@/lib/errors'
import type { RewindViewing, ViewingMediaType, ViewingUpsertInput } from '@/types/viewing'

export const viewingQueryKeys = {
  history: (uid: string | undefined) => ['viewings', 'history', uid] as const,
  forTitle: (uid: string | undefined, mediaType: ViewingMediaType, tmdbId: number | null) =>
    ['viewings', 'title', uid, mediaType, tmdbId] as const,
}

class ViewingsError extends AppError {
  constructor(message = 'Viewing history is not available right now.') {
    super('network', message)
    this.name = 'ViewingsError'
  }
}

type ViewingDocument = {
  tmdbId?: unknown
  mediaType?: unknown
  watchedAt?: FirestoreTimestamp
  location?: unknown
  rating?: unknown
  rewatch?: unknown
  review?: unknown
  tags?: unknown
  source?: unknown
  sourceUri?: unknown
  sourceKey?: unknown
  importTitle?: unknown
  importYear?: unknown
  createdAt?: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

function timestampToIso(value: FirestoreTimestamp | undefined) {
  return value?.toDate().toISOString() ?? new Date(0).toISOString()
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function mapViewing(id: string, data: ViewingDocument): RewindViewing {
  return {
    id,
    tmdbId: typeof data.tmdbId === 'number' ? data.tmdbId : 0,
    mediaType: data.mediaType === 'tv' ? 'tv' : 'movie',
    watchedAt: timestampToIso(data.watchedAt),
    location: data.location === 'cinema' || data.location === 'home' || data.location === 'other' || data.location === 'unknown' ? data.location : 'unknown',
    rating: typeof data.rating === 'number' ? data.rating : null,
    rewatch: data.rewatch === true,
    review: typeof data.review === 'string' ? data.review : null,
    tags: stringArray(data.tags),
    source: data.source === 'rewind' ? 'rewind' : 'letterboxd',
    sourceUri: typeof data.sourceUri === 'string' ? data.sourceUri : null,
    sourceKey: typeof data.sourceKey === 'string' ? data.sourceKey : '',
    importTitle: typeof data.importTitle === 'string' ? data.importTitle : '',
    importYear: typeof data.importYear === 'number' ? data.importYear : null,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }
}

function viewingDoc(uid: string, viewingId: string) {
  return doc(getDb(), 'users', uid, 'viewings', viewingId)
}

export async function getViewingHistory(uid: string) {
  try {
    const snapshot = await getDocs(
      query(collection(getDb(), 'users', uid, 'viewings'), orderBy('watchedAt', 'desc')),
    )
    const viewings = snapshot.docs.map((item) => mapViewing(item.id, item.data() as ViewingDocument))
    writeHistoryCache(uid, viewings)
    return viewings
  } catch {
    throw new ViewingsError()
  }
}

export async function getViewingsForTitle(uid: string, mediaType: ViewingMediaType, tmdbId: number) {
  try {
    const snapshot = await getDocs(
      query(collection(getDb(), 'users', uid, 'viewings'), where('tmdbId', '==', tmdbId)),
    )
    return snapshot.docs
      .map((item) => mapViewing(item.id, item.data() as ViewingDocument))
      .filter((viewing) => viewing.mediaType === mediaType)
      .sort((left, right) => right.watchedAt.localeCompare(left.watchedAt))
  } catch {
    throw new ViewingsError()
  }
}

export async function upsertViewing(uid: string, viewingId: string, input: ViewingUpsertInput) {
  const docRef = viewingDoc(uid, viewingId)
  const existing = await getDoc(docRef)
  const now = serverTimestamp()
  const rating = sanitizeViewingRating(input.rating)

  await setDoc(docRef, {
    tmdbId: input.tmdbId,
    mediaType: input.mediaType,
    watchedAt: Timestamp.fromDate(input.watchedAt),
    location: input.location,
    rating,
    rewatch: input.rewatch,
    review: input.review,
    tags: input.tags,
    source: input.source,
    sourceUri: input.sourceUri,
    sourceKey: input.sourceKey,
    importTitle: input.importTitle,
    importYear: input.importYear,
    createdAt: existing.exists() ? existing.data()?.createdAt ?? now : now,
    updatedAt: now,
  })

  try {
    const viewings = await getViewingHistory(uid)
    writeHistoryCache(uid, viewings)
  } catch {
    // History cache refresh is best-effort; callers invalidate React Query separately.
  }

  return { id: viewingId, created: !existing.exists() }
}
