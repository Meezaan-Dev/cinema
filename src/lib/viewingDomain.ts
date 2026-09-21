export const viewingLocations = ['cinema', 'home', 'other', 'unknown'] as const
export type ViewingLocation = (typeof viewingLocations)[number]

export const viewingSources = ['letterboxd', 'rewind'] as const
export type ViewingSource = (typeof viewingSources)[number]

export type ViewingMediaType = 'movie' | 'tv'

const cinemaTagPattern = /^(cinema|theater|theatre|imax)$/

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
  if (input.sourceUri) {
    return `${input.source}:${input.sourceUri.trim()}:${input.watchedAt}`
  }

  return [
    input.source,
    normalizeTitle(input.title),
    input.year ?? 'unknown-year',
    input.watchedAt,
  ].join(':')
}

export async function buildViewingId(sourceKey: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sourceKey))
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return `vw_${hex.slice(0, 32)}`
}

export function parseLetterboxdRating(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const rating = Number(trimmed)
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) return null
  return rating
}

export function sanitizeViewingRating(rating: number | null) {
  if (rating === null) return null
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

export function inferLocationFromLetterboxdTags(tags: string[]): ViewingLocation {
  const normalized = tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)
  if (normalized.some((tag) => cinemaTagPattern.test(tag))) return 'cinema'
  if (normalized.includes('home')) return 'home'
  return 'unknown'
}
