import type { UserMovie } from '@/types/movie'

const headers = [
  'id',
  'title',
  'releaseDate',
  'voteAverage',
  'genres',
  'addedAt',
  'isWatched',
  'isFavourite',
  'personalRating',
]

function escapeCsv(value: unknown) {
  const text = Array.isArray(value) ? value.join('|') : String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function moviesToCsv(movies: UserMovie[]) {
  const rows = movies.map((movie) =>
    headers.map((header) => escapeCsv(movie[header as keyof UserMovie])).join(','),
  )
  return [headers.join(','), ...rows].join('\n')
}

export function downloadCsv(movies: UserMovie[], filename = 'absolute-cinema-watchlist.csv') {
  const blob = new Blob([moviesToCsv(movies)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
