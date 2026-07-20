const TMDB_IMAGE_PATH = /^\/[A-Za-z0-9._-]+$/
const IMDB_ID = /^tt\d{7,10}$/
const YOUTUBE_KEY = /^[A-Za-z0-9_-]{11}$/
const TMDB_IMAGE_SIZES = new Set(['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'])

export function sanitizeTmdbImagePath(path: string | null | undefined) {
  if (!path || typeof path !== 'string') return null

  const clean = path.trim()
  return TMDB_IMAGE_PATH.test(clean) ? clean : null
}

export function sanitizeTmdbImageSize(size: string | undefined) {
  if (!size) return 'w500'
  return TMDB_IMAGE_SIZES.has(size) ? size : 'w500'
}

export function sanitizeImdbId(id: string | null | undefined) {
  if (!id || typeof id !== 'string') return null

  const clean = id.trim()
  return IMDB_ID.test(clean) ? clean : null
}

export function sanitizeYoutubeKey(key: string | null | undefined) {
  if (!key || typeof key !== 'string') return null

  const clean = key.trim()
  return YOUTUBE_KEY.test(clean) ? clean : null
}

export function buildImdbUrl(id: string | null | undefined) {
  const imdbId = sanitizeImdbId(id)
  return imdbId ? `https://www.imdb.com/title/${imdbId}/` : undefined
}

export function buildMagicLinkUrl(id: string | null | undefined) {
  const imdbId = sanitizeImdbId(id)
  return imdbId ? `https://www.playimdb.com/title/${imdbId}/` : undefined
}

export function sanitizeDisplayText(value: string | null | undefined, maxLength = 500) {
  if (!value || typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}
