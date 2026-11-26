import type { LocationQuery, RouteLocationRaw } from 'vue-router'

import type { DiscoverParams } from '@/api/tmdbEndpoints'
import { sanitizeGenre, sanitizePlatform, sanitizeRating, sanitizeSortBy, sanitizeYear } from '@/lib/filterValidation'
import { getPlatformProviderId } from '@/lib/streamingPlatforms'
import type { TmdbGenre } from '@/types/tmdb'

export type BrowseType = 'all' | 'movie' | 'tv'

export function browseType(value: unknown): BrowseType {
  return value === 'movie' || value === 'tv' ? value : 'all'
}

export function browsePlatform(value: unknown) {
  return sanitizePlatform(typeof value === 'string' ? value : '')
}

export function legacyBrowseLocation(path: string, query: LocationQuery): RouteLocationRaw {
  const type = path === '/movies' ? 'movie' : path === '/tv-shows' ? 'tv' : 'all'
  const platform = browsePlatform(query.platform)
  return {
    path: '/browse',
    query: {
      ...(type === 'all' ? {} : { type }),
      ...(platform ? { platform } : {}),
    },
  }
}

export function browseDiscoverFilters(
  type: BrowseType,
  platform: string,
  options: { genre: string; year: string; minRating: string; sortBy: string },
  genres: TmdbGenre[],
): DiscoverParams {
  const providerId = getPlatformProviderId(platform)
  return {
    genre: type === 'all' ? '' : sanitizeGenre(options.genre, genres),
    year: options.year.length === 4 ? sanitizeYear(options.year) : '',
    minRating: sanitizeRating(options.minRating),
    sortBy: sanitizeSortBy(options.sortBy),
    minVoteCount: options.sortBy === 'vote_average.desc' ? 50 : undefined,
    watchProvider: providerId,
    watchRegion: providerId ? 'ZA' : undefined,
  }
}
