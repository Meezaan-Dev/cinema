import { useQuery } from '@tanstack/react-query'

import {
  discoverMovies,
  discoverSeries,
  searchMovies,
  searchSeries,
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

  return useQuery({
    queryKey: ['search', mediaType, trimmed, filters],
    queryFn: async () => {
      if (mediaType === 'series') {
        return trimmed ? searchSeries(trimmed, filters) : discoverSeries(filters)
      }

      if (mediaType === 'both') {
        const [movies, series] = await Promise.all([
          trimmed ? searchMovies(trimmed, filters) : discoverMovies(filters),
          trimmed ? searchSeries(trimmed, filters) : discoverSeries(filters),
        ])
        return mergeResponses(movies, series)
      }

      return trimmed ? searchMovies(trimmed, filters) : discoverMovies(filters)
    },
  })
}
