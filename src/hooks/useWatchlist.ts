import { useEffect, useMemo, useState } from 'react'

import { WATCHLIST_STORAGE_KEY } from '@/lib/constants'
import { downloadCsv } from '@/lib/csv'
import { readWatchlistStorage, sanitizeUserMovie, writeWatchlistStorage } from '@/lib/storage'
import type { UserMovie } from '@/types/movie'

export function useWatchlist() {
  const [movies, setMovies] = useState<UserMovie[]>(() => readWatchlistStorage(WATCHLIST_STORAGE_KEY))

  useEffect(() => {
    writeWatchlistStorage(WATCHLIST_STORAGE_KEY, movies)
  }, [movies])

  const byId = useMemo(() => new Map(movies.map((movie) => [movie.id, movie])), [movies])

  function addMovie(movie: UserMovie) {
    const cleanMovie = sanitizeUserMovie(movie)
    if (!cleanMovie) return

    setMovies((current) =>
      current.some((item) => item.id === cleanMovie.id)
        ? current
        : [{ ...cleanMovie, addedAt: new Date().toISOString() }, ...current],
    )
  }

  function removeMovie(movieId: number) {
    setMovies((current) => current.filter((movie) => movie.id !== movieId))
  }

  function updateMovie(movieId: number, updates: Partial<UserMovie>) {
    setMovies((current) =>
      current.map((movie) => {
        if (movie.id !== movieId) return movie
        const cleanMovie = sanitizeUserMovie({ ...movie, ...updates })
        return cleanMovie ?? movie
      }),
    )
  }

  function upsertMovie(movie: UserMovie, updates: Partial<UserMovie> = {}) {
    const cleanMovie = sanitizeUserMovie({ ...movie, ...updates })
    if (!cleanMovie) return

    setMovies((current) => {
      const exists = current.some((item) => item.id === cleanMovie.id)
      if (!exists) return [{ ...cleanMovie, addedAt: new Date().toISOString() }, ...current]
      return current.map((item) => (item.id === cleanMovie.id ? cleanMovie : item))
    })
  }

  function toggleWatched(movie: UserMovie) {
    const savedMovie = byId.get(movie.id)
    upsertMovie(savedMovie ?? movie, { isWatched: !(savedMovie ?? movie).isWatched })
  }

  function toggleFavourite(movie: UserMovie) {
    const savedMovie = byId.get(movie.id)
    upsertMovie(savedMovie ?? movie, { isFavourite: !(savedMovie ?? movie).isFavourite })
  }

  function setRating(movie: UserMovie, personalRating?: number) {
    const savedMovie = byId.get(movie.id)
    upsertMovie(savedMovie ?? movie, { personalRating })
  }

  return {
    movies,
    byId,
    addMovie,
    removeMovie,
    updateMovie,
    upsertMovie,
    toggleWatched,
    toggleFavourite,
    setRating,
    isSaved: (movieId: number) => byId.has(movieId),
    exportCsv: () => downloadCsv(movies),
  }
}
