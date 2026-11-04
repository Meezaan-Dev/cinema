import { describe, expect, it } from 'vitest'

import { tmdbWatchProvidersResponseSchema } from './schemas'

describe('tmdbWatchProvidersResponseSchema', () => {
  it('parses South African viewing categories and missing logo paths', () => {
    const result = tmdbWatchProvidersResponseSchema.parse({
      id: 123,
      results: {
        ZA: {
          link: 'https://www.themoviedb.org/movie/123/watch?locale=ZA',
          flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: null, display_priority: 1 }],
          free: [{ provider_id: 2, provider_name: 'Free service', logo_path: '/logo.jpg', display_priority: 2 }],
          ads: [{ provider_id: 3, provider_name: 'Ad service', logo_path: '/ads.jpg', display_priority: 3 }],
          rent: [{ provider_id: 4, provider_name: 'Rental service', logo_path: '/rent.jpg', display_priority: 4 }],
          buy: [{ provider_id: 5, provider_name: 'Store', logo_path: '/buy.jpg', display_priority: 5 }],
        },
      },
    })

    expect(result.results.ZA?.flatrate[0].logo_path).toBeNull()
    expect(result.results.ZA?.free[0].logo_path).toBe('/logo.jpg')
    expect(result.results.ZA?.ads).toHaveLength(1)
    expect(result.results.ZA?.rent).toHaveLength(1)
    expect(result.results.ZA?.buy).toHaveLength(1)
  })

  it('handles a missing watch link or country listing', () => {
    const withoutLink = tmdbWatchProvidersResponseSchema.parse({
      id: 123,
      results: { ZA: { flatrate: [] } },
    })
    const withoutZa = tmdbWatchProvidersResponseSchema.parse({ id: 123, results: { US: {} } })

    expect(withoutLink.results.ZA?.link).toBeNull()
    expect(withoutLink.results.ZA?.rent).toEqual([])
    expect(withoutZa.results.ZA).toBeUndefined()
  })
})
