import { userMovieSchema, watchlistStorageSchema } from '@/types/schemas'
import { getWatchlistKey, type UserMovie } from '@/types/movie'

export function sanitizeUserMovie(movie: unknown): UserMovie | null {
  const parsed = userMovieSchema.safeParse(movie)
  return parsed.success ? parsed.data : null
}

function sanitizeMovies(value: unknown) {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  return value.reduce<UserMovie[]>((movies, item) => {
    const movie = sanitizeUserMovie(item)
    if (!movie) return movies

    const key = getWatchlistKey(movie)
    if (seen.has(key)) return movies

    seen.add(key)
    movies.push(movie)
    return movies
  }, [])
}

export function readWatchlistStorage(key: string): UserMovie[] {
  if (typeof window === 'undefined') return []

  try {
    const item = window.localStorage.getItem(key)
    if (!item) return []

    const parsed: unknown = JSON.parse(item)
    if (Array.isArray(parsed)) {
      const movies = sanitizeMovies(parsed)
      writeWatchlistStorage(key, movies)
      return movies
    }

    const storage = watchlistStorageSchema.safeParse(parsed)
    if (!storage.success) return []

    const movies = sanitizeMovies(storage.data.movies)
    if (movies.length !== storage.data.movies.length) {
      writeWatchlistStorage(key, movies)
    }
    return movies
  } catch {
    return []
  }
}

export function writeWatchlistStorage(key: string, movies: UserMovie[]) {
  if (typeof window === 'undefined') return
  const cleanMovies = sanitizeMovies(movies)
  window.localStorage.setItem(key, JSON.stringify({ version: 1, movies: cleanMovies }))
}
