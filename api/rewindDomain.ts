import { createHash } from 'node:crypto'

export const viewingLocations = ['cinema', 'home', 'other', 'unknown'] as const
export type ViewingLocation = (typeof viewingLocations)[number]

export const viewingSources = ['letterboxd', 'rewind'] as const
export type ViewingSource = (typeof viewingSources)[number]

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
}

export function normalizeTitle(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function buildViewingSourceKey(input: {
  source: ViewingSource
  sourceUri?: string | null
  title: string
  year: number | null
  watchedAt: string
}) {
  if (input.sourceUri) return `${input.source}:${input.sourceUri.trim()}`

  return [
    input.source,
    normalizeTitle(input.title),
    input.year ?? 'unknown-year',
    input.watchedAt,
  ].join(':')
}

export function buildViewingId(sourceKey: string) {
  return `vw_${createHash('sha256').update(sourceKey).digest('hex').slice(0, 32)}`
}

export function parseLetterboxdRating(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const rating = Number(trimmed)
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) return null
  return rating
}

export function parseLetterboxdRewatch(value: string | undefined) {
  return value?.trim().toLowerCase() === 'yes'
}

export function parseLetterboxdTags(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return []

  return trimmed
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function parseLetterboxdYear(value: string | undefined) {
  const year = Number(value?.trim())
  return Number.isInteger(year) && year > 1800 ? year : null
}

export function releaseYear(value: string | undefined) {
  if (!value) return null
  const year = Number(value.slice(0, 4))
  return Number.isInteger(year) ? year : null
}
