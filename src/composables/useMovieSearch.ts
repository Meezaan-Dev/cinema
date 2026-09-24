import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

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

type UseMovieSearchOptions = {
  enabled?: Ref<boolean>
}

export function useMovieSearch(query: Ref<string>, filters: Ref<DiscoverParams>, mediaType: Ref<SearchMediaType>, options: UseMovieSearchOptions = {}) {
  const trimmed = computed(() => sanitizeQuery(query.value))
  const hasQuery = computed(() => trimmed.value.length >= 2)

  const queryKey = computed(() => {
    const f = filters.value
    const q = trimmed.value
    const mt = mediaType.value

    if (mt === 'series') {
      return hasQuery.value ? queryKeys.searchSeries(q, f) : queryKeys.discoverSeries(f)
    }
    if (mt === 'both') {
      return hasQuery.value ? queryKeys.searchAll(q, f) : queryKeys.discoverAll(f)
    }
    return hasQuery.value ? queryKeys.search(q, f) : queryKeys.discover(f)
  })

  return useQuery({
    queryKey,
    enabled: options.enabled,
    queryFn: async () => {
      const f = filters.value
      const q = trimmed.value
      const mt = mediaType.value

      if (mt === 'series') {
        return hasQuery.value ? searchSeries(q, f) : discoverSeries(f)
      }

      if (mt === 'both') {
        const [movies, series] = await Promise.all([
          hasQuery.value ? searchMovies(q, f) : discoverMovies(f),
          hasQuery.value ? searchSeries(q, f) : discoverSeries(f),
        ])
        return mergeResponses(movies, series)
      }

      return hasQuery.value ? searchMovies(q, f) : discoverMovies(f)
    },
  })
}
