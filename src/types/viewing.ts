export type ViewingLocation = 'cinema' | 'home' | 'other' | 'unknown'

export type ViewingSource = 'letterboxd' | 'rewind'

export type ViewingMediaType = 'movie' | 'tv'

export type RewindViewing = {
  id: string
  tmdbId: number
  mediaType: ViewingMediaType
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

export type ViewingUpsertInput = {
  tmdbId: number
  mediaType: ViewingMediaType
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
}
