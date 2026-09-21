import {
  collection,
  getDocs,
  orderBy,
  query,
  type Timestamp,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import { AppError } from '@/lib/errors'
import type { RewindViewing } from '@/types/viewing'

export const viewingQueryKeys = {
  history: (uid: string | undefined) => ['viewings', 'history', uid] as const,
}

class ViewingsError extends AppError {
  constructor(message = 'Viewing history is not available right now.') {
    super('network', message)
    this.name = 'ViewingsError'
  }
}

type ViewingDocument = {
  tmdbId?: unknown
  watchedAt?: Timestamp
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
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

function timestampToIso(value: Timestamp | undefined) {
  return value?.toDate().toISOString() ?? new Date(0).toISOString()
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function mapViewing(id: string, data: ViewingDocument): RewindViewing {
  return {
    id,
    tmdbId: typeof data.tmdbId === 'number' ? data.tmdbId : 0,
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

export async function getViewingHistory(uid: string) {
  try {
    const snapshot = await getDocs(query(collection(db, 'users', uid, 'viewings'), orderBy('watchedAt', 'desc')))
    return snapshot.docs.map((item) => mapViewing(item.id, item.data() as ViewingDocument))
  } catch {
    throw new ViewingsError()
  }
}
