import { useQuery } from '@tanstack/react-query'

import {
  discoverMovies,
  discoverSeries,
  searchMovies,
  searchSeries,
  queryKeys,
  type DiscoverParams,
} from '@/api/tmdbEndpoints'
import { sanitizeQuery } from '@/lib/filterValidation'
import type { TmdbMovie, TmdbPagedResponse } from '@/types/tmdb'

export type SearchMediaType = 'movie' | 'series' | 'both'

function mergeResponses(
  first: TmdbPagedResponse<TmdbMovie>,
  second: TmdbPagedResponse<TmdbMovie>,
): TmdbPagedResponse<TmdbMovie> {
  return {
    page: 1,
    results: [...first.results, ...second.results].sort((a, b) => b.popularity - a.popularity),
    total_pages: Math.max(first.total_pages, second.total_pages),
    total_results: first.total_results + second.total_results,
  }
}

export function useMovieSearch(query: string, filters: DiscoverParams, mediaType: SearchMediaType = 'movie') {
  const trimmed = sanitizeQuery(query)
  const hasQuery = Boolean(trimmed)

  const queryKey = (() => {
    if (mediaType === 'series') {
      return hasQuery ? queryKeys.searchSeries(trimmed, filters) : queryKeys.discoverSeries(filters)
    }

    if (mediaType === 'both') {
      return hasQuery ? queryKeys.searchAll(trimmed, filters) : queryKeys.discoverAll(filters)
    }

    return hasQuery ? queryKeys.search(trimmed, filters) : queryKeys.discover(filters)
  })()

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (mediaType === 'series') {
        return hasQuery ? searchSeries(trimmed, filters) : discoverSeries(filters)
      }

      if (mediaType === 'both') {
        const [movies, series] = await Promise.all([
          hasQuery ? searchMovies(trimmed, filters) : discoverMovies(filters),
          hasQuery ? searchSeries(trimmed, filters) : discoverSeries(filters),
        ])
        return mergeResponses(movies, series)
      }

      return hasQuery ? searchMovies(trimmed, filters) : discoverMovies(filters)
    },
  })
}
