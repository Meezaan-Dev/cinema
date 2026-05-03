import { useEffect, useMemo, useState } from 'react'

import { WATCHLIST_STORAGE_KEY } from '@/lib/constants'
import { downloadCsv } from '@/lib/csv'
import { readWatchlistStorage, sanitizeUserMovie, writeWatchlistStorage } from '@/lib/storage'
import { getTmdbWatchlistKey, getWatchlistKey, type UserMovie } from '@/types/movie'
import type { TmdbMovie } from '@/types/tmdb'

export function useWatchlist() {
  const [movies, setMovies] = useState<UserMovie[]>(() => readWatchlistStorage(WATCHLIST_STORAGE_KEY))

  useEffect(() => {
    writeWatchlistStorage(WATCHLIST_STORAGE_KEY, movies)
  }, [movies])

  const byKey = useMemo(() => new Map(movies.map((movie) => [getWatchlistKey(movie), movie])), [movies])

  function addMovie(movie: UserMovie) {
    const cleanMovie = sanitizeUserMovie(movie)
    if (!cleanMovie) return

    setMovies((current) =>
      current.some((item) => getWatchlistKey(item) === getWatchlistKey(cleanMovie))
        ? current
        : [{ ...cleanMovie, addedAt: new Date().toISOString() }, ...current],
    )
  }

  function removeMovie(movie: UserMovie) {
    const key = getWatchlistKey(movie)
    setMovies((current) => current.filter((item) => getWatchlistKey(item) !== key))
  }

  function updateMovie(movie: UserMovie, updates: Partial<UserMovie>) {
    const key = getWatchlistKey(movie)
    setMovies((current) =>
      current.map((item) => {
        if (getWatchlistKey(item) !== key) return item
        const cleanMovie = sanitizeUserMovie({ ...item, ...updates })
        return cleanMovie ?? item
      }),
    )
  }

  function upsertMovie(movie: UserMovie, updates: Partial<UserMovie> = {}) {
    const cleanMovie = sanitizeUserMovie({ ...movie, ...updates })
    if (!cleanMovie) return

    setMovies((current) => {
      const key = getWatchlistKey(cleanMovie)
      const exists = current.some((item) => getWatchlistKey(item) === key)
      if (!exists) return [{ ...cleanMovie, addedAt: new Date().toISOString() }, ...current]
      return current.map((item) => (getWatchlistKey(item) === key ? cleanMovie : item))
    })
  }

  function toggleWatched(movie: UserMovie) {
    const savedMovie = byKey.get(getWatchlistKey(movie))
    upsertMovie(savedMovie ?? movie, { isWatched: !(savedMovie ?? movie).isWatched })
  }

  function toggleFavourite(movie: UserMovie) {
    const savedMovie = byKey.get(getWatchlistKey(movie))
    upsertMovie(savedMovie ?? movie, { isFavourite: !(savedMovie ?? movie).isFavourite })
  }

  function setRating(movie: UserMovie, personalRating?: number) {
    const savedMovie = byKey.get(getWatchlistKey(movie))
    upsertMovie(savedMovie ?? movie, { personalRating })
  }

  function getSaved(movie: TmdbMovie | UserMovie) {
    return 'mediaType' in movie
      ? byKey.get(getWatchlistKey(movie))
      : byKey.get(getTmdbWatchlistKey(movie))
  }

  return {
    movies,
    byKey,
    getSaved,
    addMovie,
    removeMovie,
    updateMovie,
    upsertMovie,
    toggleWatched,
    toggleFavourite,
    setRating,
    isSaved: (movie: TmdbMovie | UserMovie) => Boolean(getSaved(movie)),
    exportCsv: () => downloadCsv(movies),
  }
}
