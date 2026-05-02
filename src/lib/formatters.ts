export function getYear(date?: string) {
  return date ? new Date(date).getFullYear().toString() : 'TBA'
}

export function formatRuntime(minutes?: number | null) {
  if (!minutes) return 'Runtime unknown'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

export function formatRating(rating?: number) {
  return typeof rating === 'number' ? rating.toFixed(1) : 'NR'
}

export function imageUrl(path: string | null | undefined, size = 'w500') {
  if (!path) return null
  const base = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p'
  return `${base}/${size}${path}`
}
