import { describe, expect, it } from 'vitest'

import { getWatchlistKey, type UserMovie } from '@/types/movie'
import { getWatchlistMovieKey, toWatchlistMovieInput, watchlistMovieToUserMovie } from '@/types/watchlist'
import type { TmdbMovie } from '@/types/tmdb'

const baseTmdbMovie: TmdbMovie = {
  id: 10,
  title: 'Sunshine',
  overview: 'A solar mission.',
  poster_path: null,
  backdrop_path: null,
  release_date: '2007-04-05',
  vote_average: 7.3,
  vote_count: 1000,
  popularity: 20,
  media_type: 'movie',
  genre_ids: [878],
}

describe('watchlist conversions', () => {
  it('keeps movie and tv entries with the same TMDB ID distinct', () => {
    const movie: UserMovie = {
      id: 10,
      title: 'Movie',
      posterPath: null,
      backdropPath: null,
      releaseDate: '',
      voteAverage: 7,
      genres: [],
      addedAt: '2024-01-01T00:00:00.000Z',
      isWatched: false,
      isFavourite: false,
      mediaType: 'movie',
    }
    const series = { ...movie, title: 'Series', mediaType: 'tv' as const }

    expect(getWatchlistKey(movie)).toBe('movie:10')
    expect(getWatchlistKey(series)).toBe('tv:10')
  })

  it('maps TMDB and watchlist inputs without losing media type keys', () => {
    const input = toWatchlistMovieInput(baseTmdbMovie, [{ id: 878, name: 'Science Fiction' }])
    const userMovie = watchlistMovieToUserMovie(input)

    expect(input).toMatchObject({ tmdbId: 10, mediaType: 'movie', genres: ['Science Fiction'] })
    expect(getWatchlistMovieKey(input)).toBe('movie:10')
    expect(userMovie).toMatchObject({ id: 10, mediaType: 'movie' })
  })
})
