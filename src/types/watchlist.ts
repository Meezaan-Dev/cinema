import type { TmdbGenre, TmdbMovie } from '@/types/tmdb'
import type { MediaType, UserMovie } from '@/types/movie'

export type WatchlistRole = 'owner' | 'editor'
export type WatchStatus = 'to_watch' | 'watched'

export type WatchlistMovieInput = {
  tmdbId: number
  mediaType: MediaType
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  releaseDate: string
  voteAverage: number
  genres: string[]
}

export type CloudWatchlist = {
  id: string
  name: string
  description: string | null
  ownerId: string
  inviteToken: string
  createdAt: string
  updatedAt: string
  role: WatchlistRole
  itemCount: number
}

export type CloudWatchlistItemState = {
  itemId: string
  userId: string
  status: WatchStatus
  isFavourite: boolean
  personalRating?: number
  notes?: string
  hiddenAt?: string
  updatedAt: string
}

export type CloudWatchlistItem = WatchlistMovieInput & {
  id: string
  watchlistId: string
  addedBy: string | null
  createdAt: string
  updatedAt: string
  state?: CloudWatchlistItemState
}

export type CloudWatchlistDetail = CloudWatchlist & {
  items: CloudWatchlistItem[]
}

export function toWatchlistMovieInput(
  movie: TmdbMovie | UserMovie | WatchlistMovieInput,
  genres: TmdbGenre[] = [],
): WatchlistMovieInput {
  if ('tmdbId' in movie) return movie

  if ('posterPath' in movie) {
    return {
      tmdbId: movie.id,
      mediaType: movie.mediaType ?? 'movie',
      title: movie.title,
      overview: '',
      posterPath: movie.posterPath,
      backdropPath: movie.backdropPath,
      releaseDate: movie.releaseDate,
      voteAverage: movie.voteAverage,
      genres: movie.genres,
    }
  }

  return {
    tmdbId: movie.id,
    mediaType: movie.media_type ?? 'movie',
    title: movie.title,
    overview: movie.overview,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    releaseDate: movie.release_date,
    voteAverage: movie.vote_average,
    genres: genres
      .filter((genre) => movie.genre_ids?.includes(genre.id))
      .map((genre) => genre.name),
  }
}

export function watchlistMovieToUserMovie(movie: WatchlistMovieInput): UserMovie {
  return {
    id: movie.tmdbId,
    title: movie.title,
    posterPath: movie.posterPath,
    backdropPath: movie.backdropPath,
    releaseDate: movie.releaseDate,
    voteAverage: movie.voteAverage,
    genres: movie.genres,
    addedAt: new Date().toISOString(),
    isWatched: false,
    isFavourite: false,
    mediaType: movie.mediaType,
  }
}

export function cloudItemToUserMovie(item: CloudWatchlistItem): UserMovie {
  return {
    id: item.tmdbId,
    title: item.title,
    posterPath: item.posterPath,
    backdropPath: item.backdropPath,
    releaseDate: item.releaseDate,
    voteAverage: item.voteAverage,
    genres: item.genres,
    addedAt: item.createdAt,
    isWatched: item.state?.status === 'watched',
    isFavourite: item.state?.isFavourite ?? false,
    personalRating: item.state?.personalRating,
    notes: item.state?.notes,
    mediaType: item.mediaType,
  }
}

export function getWatchlistMovieKey(movie: WatchlistMovieInput) {
  return `${movie.mediaType}:${movie.tmdbId}`
}
