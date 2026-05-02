import type { TmdbGenre, TmdbMovie, TmdbMovieDetails } from './tmdb'

export type UserMovie = {
  id: number
  title: string
  posterPath: string | null
  backdropPath: string | null
  releaseDate: string
  voteAverage: number
  genres: string[]
  addedAt: string
  isWatched: boolean
  isFavourite: boolean
  personalRating?: number
  notes?: string
  mediaType?: 'movie' | 'tv'
}

export type WatchPreference = 'any' | 'watched' | 'unwatched'

export function toUserMovie(
  movie: TmdbMovie | TmdbMovieDetails,
  genres: TmdbGenre[] = [],
): UserMovie {
  const movieGenres =
    'genres' in movie && movie.genres.length > 0
      ? movie.genres.map((genre) => genre.name)
      : genres
          .filter((genre) => movie.genre_ids?.includes(genre.id))
          .map((genre) => genre.name)

  return {
    id: movie.id,
    title: movie.title,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    releaseDate: movie.release_date,
    voteAverage: movie.vote_average,
    genres: movieGenres,
    addedAt: new Date().toISOString(),
    isWatched: false,
    isFavourite: false,
    mediaType: movie.media_type ?? 'movie',
  }
}
