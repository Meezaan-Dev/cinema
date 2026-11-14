import { tmdbRequest } from './tmdbClient'
import {
  tmdbCreditsSchema,
  tmdbExternalIdsSchema,
  tmdbGenresResponseSchema,
  tmdbMovieDetailsSchema,
  tmdbMovieDetailsBundleSchema,
  tmdbMovieSchema,
  tmdbPagedResponseSchema,
  tmdbPersonCombinedCreditsSchema,
  tmdbPersonDetailsSchema,
  tmdbPersonSearchResultSchema,
  tmdbSeriesDetailsSchema,
  tmdbSeriesDetailsBundleSchema,
  tmdbSeriesSchema,
  tmdbTrendingTitlesResponseSchema,
  tmdbVideosSchema,
  tmdbWatchProvidersResponseSchema,
} from '@/types/schemas'
import type {
  TmdbCredits,
  TmdbExternalIds,
  TmdbGenre,
  TmdbMovie,
  TmdbMovieDetails,
  TmdbMovieDetailsBundle,
  TmdbPagedResponse,
  TmdbPersonCombinedCredits,
  TmdbPersonDetails,
  TmdbPersonSearchResult,
  TmdbSeriesDetails,
  TmdbSeriesDetailsBundle,
  TmdbVideos,
  TmdbWatchProvidersResponse,
} from '@/types/tmdb'

export type DiscoverParams = {
  genre?: string
  year?: string
  minRating?: string
  sortBy?: string
  maxRuntime?: string
  page?: number
  watchProvider?: string
  watchRegion?: string
  monetizationTypes?: string
  primaryReleaseDateLte?: string
  firstAirDateLte?: string
  minVoteCount?: number | string
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
  platformSection: (platform: string, section: string, mediaType: string, extra?: unknown) =>
    ['platform', platform, section, mediaType, extra] as const,
  detail: (movieId: string | number) => ['movie', movieId] as const,
  seriesDetail: (seriesId: string | number) => ['series', seriesId] as const,
  watchProviders: (mediaType: 'movie' | 'tv', id: number) => [mediaType, id, 'watch-providers'] as const,
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
    tmdbTrendingTitlesResponseSchema,
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
    with_watch_providers: filters.watchProvider,
    watch_region: filters.watchRegion,
    with_watch_monetization_types: filters.monetizationTypes,
    'primary_release_date.lte': filters.primaryReleaseDateLte,
    'vote_count.gte': filters.minVoteCount,
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
    with_watch_providers: filters.watchProvider,
    watch_region: filters.watchRegion,
    with_watch_monetization_types: filters.monetizationTypes,
    'first_air_date.lte': filters.firstAirDateLte,
    'vote_count.gte': filters.minVoteCount,
  }, tmdbPagedResponseSchema(tmdbSeriesSchema))
}

export async function getPlatformTrending(
  providerId: string,
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  region = 'US',
): Promise<TmdbPagedResponse<TmdbMovie>> {
  if (mediaType === 'movie') {
    return discoverMovies({ watchProvider: providerId, watchRegion: region, sortBy: 'popularity.desc', page: 1 })
  }
  if (mediaType === 'tv') {
    return discoverSeries({ watchProvider: providerId, watchRegion: region, sortBy: 'popularity.desc', page: 1 })
  }

  const [movies, series] = await Promise.all([
    discoverMovies({ watchProvider: providerId, watchRegion: region, sortBy: 'popularity.desc', page: 1 }),
    discoverSeries({ watchProvider: providerId, watchRegion: region, sortBy: 'popularity.desc', page: 1 }),
  ])

  const combined = [...movies.results, ...series.results]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 20)

  return {
    page: 1,
    results: combined,
    total_pages: Math.max(movies.total_pages, series.total_pages),
    total_results: movies.total_results + series.total_results,
  }
}

export async function getPlatformNew(
  providerId: string,
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  region = 'US',
): Promise<TmdbPagedResponse<TmdbMovie>> {
  const today = new Date().toISOString().split('T')[0]

  if (mediaType === 'movie') {
    return discoverMovies({
      watchProvider: providerId,
      watchRegion: region,
      sortBy: 'primary_release_date.desc',
      primaryReleaseDateLte: today,
      minVoteCount: 5,
      page: 1,
    })
  }
  if (mediaType === 'tv') {
    return discoverSeries({
      watchProvider: providerId,
      watchRegion: region,
      sortBy: 'first_air_date.desc',
      firstAirDateLte: today,
      minVoteCount: 5,
      page: 1,
    })
  }

  const [movies, series] = await Promise.all([
    discoverMovies({
      watchProvider: providerId,
      watchRegion: region,
      sortBy: 'primary_release_date.desc',
      primaryReleaseDateLte: today,
      minVoteCount: 5,
      page: 1,
    }),
    discoverSeries({
      watchProvider: providerId,
      watchRegion: region,
      sortBy: 'first_air_date.desc',
      firstAirDateLte: today,
      minVoteCount: 5,
      page: 1,
    }),
  ])

  const combined = [...movies.results, ...series.results]
    .sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 20)

  return {
    page: 1,
    results: combined,
    total_pages: Math.max(movies.total_pages, series.total_pages),
    total_results: movies.total_results + series.total_results,
  }
}

export async function getPlatformCatalog(
  providerId: string,
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  filters: DiscoverParams = {},
  region = 'US',
): Promise<TmdbPagedResponse<TmdbMovie>> {
  const isRatingSort = filters.sortBy === 'vote_average.desc'
  const minVoteCount = isRatingSort ? (filters.minVoteCount ?? 50) : filters.minVoteCount

  const baseFilters: DiscoverParams = {
    ...filters,
    watchProvider: providerId,
    watchRegion: region,
    minVoteCount,
  }

  if (mediaType === 'movie') {
    return discoverMovies(baseFilters)
  }
  if (mediaType === 'tv') {
    return discoverSeries(baseFilters)
  }

  const [movies, series] = await Promise.all([
    discoverMovies(baseFilters),
    discoverSeries(baseFilters),
  ])

  const sortKey = filters.sortBy || 'vote_average.desc'
  const combined = [...movies.results, ...series.results].sort((a, b) => {
    if (sortKey === 'vote_average.desc') return b.vote_average - a.vote_average
    if (sortKey === 'primary_release_date.desc') {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0
      return dateB - dateA
    }
    return b.popularity - a.popularity
  })

  return {
    page: filters.page ?? 1,
    results: combined.slice(0, 20),
    total_pages: Math.max(movies.total_pages, series.total_pages),
    total_results: movies.total_results + series.total_results,
  }
}

export function getMovieDetails(movieId: string | number) {
  return tmdbRequest<TmdbMovieDetails>(`/movie/${movieId}`, {}, tmdbMovieDetailsSchema)
}

export function getMovieDetailsBundle(movieId: string | number) {
  return tmdbRequest<TmdbMovieDetailsBundle>(`/movie/${movieId}`, {
    append_to_response: 'credits,videos,recommendations',
  }, tmdbMovieDetailsBundleSchema)
}

export function getSeriesDetails(seriesId: string | number) {
  return tmdbRequest<TmdbSeriesDetails>(`/tv/${seriesId}`, {}, tmdbSeriesDetailsSchema)
}

export function getSeriesDetailsBundle(seriesId: string | number) {
  return tmdbRequest<TmdbSeriesDetailsBundle>(`/tv/${seriesId}`, {
    append_to_response: 'credits,videos,recommendations,external_ids',
  }, tmdbSeriesDetailsBundleSchema)
}

export function getWatchProviders(mediaType: 'movie' | 'tv', id: number) {
  return tmdbRequest<TmdbWatchProvidersResponse>(
    `/${mediaType}/${id}/watch/providers`,
    {},
    tmdbWatchProvidersResponseSchema,
  )
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
