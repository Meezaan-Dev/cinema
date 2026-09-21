import { createHash } from 'node:crypto'

export {
  inferLocationFromLetterboxdTags,
  normalizeTitle,
  parseLetterboxdRating,
  parseLetterboxdRewatch,
  parseLetterboxdTags,
  parseLetterboxdYear,
  releaseYear,
  buildViewingSourceKey,
  viewingLocations,
  viewingSources,
  type ViewingMediaType,
} from '../src/lib/viewingDomain.ts'

import type { ViewingLocation, ViewingSource } from '../src/lib/viewingDomain.ts'

export type { ViewingLocation, ViewingSource }

export type RewindViewing = {
  id: string
  tmdbId: number
  watchedAt: string
  location: ViewingLocation
  rating: number | null
  rewatch: boolean
  review: string | null
  tags: string[]
  source: ViewingSource
  sourceUri: string | null
  sourceKey: string
  importTitle: string
  importYear: number | null
  createdAt: string
  updatedAt: string
}

export type FirestoreViewingInput = {
  tmdbId: number
  watchedAt: Date
  location: ViewingLocation
  rating: number | null
  rewatch: boolean
  review: string | null
  tags: string[]
  source: ViewingSource
  sourceUri: string | null
  sourceKey: string
  importTitle: string
  importYear: number | null
  mediaType?: import('../src/lib/viewingDomain.ts').ViewingMediaType
}

export function buildViewingId(sourceKey: string) {
  return `vw_${createHash('sha256').update(sourceKey).digest('hex').slice(0, 32)}`
}
