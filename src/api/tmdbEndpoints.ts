import { tmdbRequest } from './tmdbClient'
import {
  tmdbCreditsSchema,
  tmdbExternalIdsSchema,
  tmdbGenresResponseSchema,
  tmdbMovieDetailsSchema,
  tmdbMovieSchema,
  tmdbPagedResponseSchema,
  tmdbPersonCombinedCreditsSchema,
  tmdbPersonDetailsSchema,
  tmdbPersonSearchResultSchema,
  tmdbSeriesDetailsSchema,
  tmdbSeriesSchema,
  tmdbVideosSchema,
} from '@/types/schemas'
import type {
  TmdbCredits,
  TmdbExternalIds,
  TmdbGenre,
  TmdbMovie,
  TmdbMovieDetails,
  TmdbPagedResponse,
  TmdbPersonCombinedCredits,
  TmdbPersonDetails,
  TmdbPersonSearchResult,
  TmdbSeriesDetails,
  TmdbVideos,
} from '@/types/tmdb'

export type DiscoverParams = {
  genre?: string
  year?: string
  minRating?: string
  sortBy?: string
  maxRuntime?: string
  page?: number
}

export const queryKeys = {
  trending: ['movies', 'trending'] as const,
  trendingAll: ['all', 'trending'] as const,
  popular: ['movies', 'popular'] as const,
  popularSeries: ['series', 'popular'] as const,
  newMovies: ['movies', 'new'] as const,
  newSeries: ['series', 'new'] as const,
  topRated: ['movies', 'top-rated'] as const,
  topRatedSeries: ['series', 'top-rated'] as const,
  upcoming: ['movies', 'upcoming'] as const,
  genres: ['genres'] as const,
  tvGenres: ['genres', 'tv'] as const,
  search: (query: string, filters: DiscoverParams) => ['movies', 'search', query, filters] as const,
  searchSeries: (query: string, filters: DiscoverParams) => ['series', 'search', query, filters] as const,
  searchAll: (query: string, filters: DiscoverParams) => ['all', 'search', query, filters] as const,
  searchPeople: (query: string) => ['people', 'search', query] as const,
  discover: (filters: DiscoverParams) => ['movies', 'discover', filters] as const,
  discoverSeries: (filters: DiscoverParams) => ['series', 'discover', filters] as const,
  discoverAll: (filters: DiscoverParams) => ['all', 'discover', filters] as const,
  detail: (movieId: string | number) => ['movie', movieId] as const,
  seriesDetail: (seriesId: string | number) => ['series', seriesId] as const,
  seriesExternalIds: (seriesId: string | number) => ['series', seriesId, 'external-ids'] as const,
  credits: (movieId: string | number) => ['movie', movieId, 'credits'] as const,
  seriesCredits: (seriesId: string | number) => ['series', seriesId, 'credits'] as const,
  videos: (movieId: string | number) => ['movie', movieId, 'videos'] as const,
  seriesVideos: (seriesId: string | number) => ['series', seriesId, 'videos'] as const,
  similar: (movieId: string | number) => ['movie', movieId, 'similar'] as const,
  similarSeries: (seriesId: string | number) => ['series', seriesId, 'similar'] as const,
  personDetail: (personId: string | number) => ['person', personId] as const,
  personCredits: (personId: string | number) => ['person', personId, 'combined-credits'] as const,
}

export function getTrendingMovies() {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>(
    '/trending/movie/week',
    {},
    tmdbPagedResponseSchema(tmdbMovieSchema),
  )
}

export function getTrendingAll() {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>(
    '/trending/all/week',
    {},
    tmdbPagedResponseSchema(tmdbMovieSchema),
  )
}

export function getPopularMovies() {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>(
    '/movie/popular',
    {},
    tmdbPagedResponseSchema(tmdbMovieSchema),
  )
}

export function getPopularSeries() {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>(
    '/tv/popular',
    {},
    tmdbPagedResponseSchema(tmdbSeriesSchema),
  )
}

export function getNewMovies() {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>(
    '/movie/now_playing',
    {},
    tmdbPagedResponseSchema(tmdbMovieSchema),
  )
}

export function getNewSeries() {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>(
    '/tv/on_the_air',
    {},
    tmdbPagedResponseSchema(tmdbSeriesSchema),
  )
}

export function getTopRatedMovies() {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>(
    '/movie/top_rated',
    {},
    tmdbPagedResponseSchema(tmdbMovieSchema),
  )
}

export function getTopRatedSeries() {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>(
    '/tv/top_rated',
    {},
    tmdbPagedResponseSchema(tmdbSeriesSchema),
  )
}

export function getUpcomingMovies() {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>(
    '/movie/upcoming',
    {},
    tmdbPagedResponseSchema(tmdbMovieSchema),
  )
}

export function getGenres() {
  return tmdbRequest<{ genres: TmdbGenre[] }>('/genre/movie/list', {}, tmdbGenresResponseSchema)
}

export function getTvGenres() {
  return tmdbRequest<{ genres: TmdbGenre[] }>('/genre/tv/list', {}, tmdbGenresResponseSchema)
}

export function searchMovies(query: string, filters: DiscoverParams = {}) {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>('/search/movie', {
    query,
    include_adult: false,
    primary_release_year: filters.year,
    page: filters.page ?? 1,
  }, tmdbPagedResponseSchema(tmdbMovieSchema))
}

export function searchSeries(query: string, filters: DiscoverParams = {}) {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>('/search/tv', {
    query,
    include_adult: false,
    first_air_date_year: filters.year,
    page: filters.page ?? 1,
  }, tmdbPagedResponseSchema(tmdbSeriesSchema))
}

export function searchPeople(query: string) {
  return tmdbRequest<TmdbPagedResponse<TmdbPersonSearchResult>>('/search/person', {
    query,
    include_adult: false,
    page: 1,
  }, tmdbPagedResponseSchema(tmdbPersonSearchResultSchema))
}

export function discoverMovies(filters: DiscoverParams = {}) {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>('/discover/movie', {
    include_adult: false,
    with_genres: filters.genre,
    primary_release_year: filters.year,
    'vote_average.gte': filters.minRating,
    sort_by: filters.sortBy || 'popularity.desc',
    'with_runtime.lte': filters.maxRuntime,
    page: filters.page ?? 1,
  }, tmdbPagedResponseSchema(tmdbMovieSchema))
}

export function discoverSeries(filters: DiscoverParams = {}) {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>('/discover/tv', {
    include_adult: false,
    with_genres: filters.genre,
    first_air_date_year: filters.year,
    'vote_average.gte': filters.minRating,
    sort_by: filters.sortBy || 'popularity.desc',
    'with_runtime.lte': filters.maxRuntime,
    page: filters.page ?? 1,
  }, tmdbPagedResponseSchema(tmdbSeriesSchema))
}

export function getMovieDetails(movieId: string | number) {
  return tmdbRequest<TmdbMovieDetails>(`/movie/${movieId}`, {}, tmdbMovieDetailsSchema)
}

export function getSeriesDetails(seriesId: string | number) {
  return tmdbRequest<TmdbSeriesDetails>(`/tv/${seriesId}`, {}, tmdbSeriesDetailsSchema)
}

export function getSeriesExternalIds(seriesId: string | number) {
  return tmdbRequest<TmdbExternalIds>(`/tv/${seriesId}/external_ids`, {}, tmdbExternalIdsSchema)
}

export function getMovieCredits(movieId: string | number) {
  return tmdbRequest<TmdbCredits>(`/movie/${movieId}/credits`, {}, tmdbCreditsSchema)
}

export function getSeriesCredits(seriesId: string | number) {
  return tmdbRequest<TmdbCredits>(`/tv/${seriesId}/credits`, {}, tmdbCreditsSchema)
}

export function getMovieVideos(movieId: string | number) {
  return tmdbRequest<TmdbVideos>(`/movie/${movieId}/videos`, {}, tmdbVideosSchema)
}

export function getSeriesVideos(seriesId: string | number) {
  return tmdbRequest<TmdbVideos>(`/tv/${seriesId}/videos`, {}, tmdbVideosSchema)
}

export function getSimilarMovies(movieId: string | number) {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>(
    `/movie/${movieId}/recommendations`,
    {},
    tmdbPagedResponseSchema(tmdbMovieSchema),
  )
}

export function getSimilarSeries(seriesId: string | number) {
  return tmdbRequest<TmdbPagedResponse<TmdbMovie>>(
    `/tv/${seriesId}/recommendations`,
    {},
    tmdbPagedResponseSchema(tmdbSeriesSchema),
  )
}

export function getPersonDetails(personId: string | number) {
  return tmdbRequest<TmdbPersonDetails>(`/person/${personId}`, {}, tmdbPersonDetailsSchema)
}

export function getPersonCombinedCredits(personId: string | number) {
  return tmdbRequest<TmdbPersonCombinedCredits>(
    `/person/${personId}/combined_credits`,
    {},
    tmdbPersonCombinedCreditsSchema,
  )
}
