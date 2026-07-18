import { describe, expect, it } from 'vitest'

import {
  tmdbPagedResponseSchema,
  tmdbPersonCombinedCreditsSchema,
  tmdbPersonDetailsSchema,
  tmdbPersonSearchResultSchema,
} from './schemas'

describe('TMDB person schemas', () => {
  it('parses person search results with mixed known-for credits', () => {
    const parsed = tmdbPagedResponseSchema(tmdbPersonSearchResultSchema).parse({
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [
        {
          id: 1,
          name: 'Greta Gerwig',
          profile_path: '/profile.jpg',
          known_for_department: 'Directing',
          popularity: 42,
          known_for: [
            {
              id: 10,
              media_type: 'tv',
              name: 'A TV Credit',
              first_air_date: '2020-01-01',
              overview: null,
              poster_path: '/poster.jpg',
              backdrop_path: null,
              vote_average: 8,
              vote_count: 100,
              popularity: 20,
            },
          ],
        },
      ],
    })

    expect(parsed.results[0].profile_path).toBe('/profile.jpg')
    expect(parsed.results[0].known_for[0]).toMatchObject({
      title: 'A TV Credit',
      release_date: '2020-01-01',
      media_type: 'tv',
    })
  })

  it('defaults optional person detail fields safely', () => {
    const parsed = tmdbPersonDetailsSchema.parse({
      id: 2,
      name: 'Denzel Washington',
      profile_path: 'https://example.com/bad.jpg',
      known_for_department: 'Acting',
      popularity: 35,
    })

    expect(parsed.biography).toBe('')
    expect(parsed.birthday).toBeNull()
    expect(parsed.deathday).toBeNull()
    expect(parsed.place_of_birth).toBeNull()
    expect(parsed.profile_path).toBeNull()
  })

  it('parses movie and TV combined credits with acting and directing metadata', () => {
    const parsed = tmdbPersonCombinedCreditsSchema.parse({
      id: 3,
      cast: [
        {
          id: 30,
          media_type: 'movie',
          title: 'A Movie',
          release_date: '2019-02-03',
          overview: 'Movie overview',
          poster_path: null,
          backdrop_path: null,
          vote_average: 7.5,
          vote_count: 200,
          popularity: 50,
          character: 'Lead',
          credit_id: 'abc',
        },
      ],
      crew: [
        {
          id: 31,
          media_type: 'tv',
          name: 'A Series',
          first_air_date: '',
          overview: 'Series overview',
          poster_path: '/series.jpg',
          backdrop_path: null,
          vote_average: 8.2,
          vote_count: 150,
          popularity: 45,
          department: 'Directing',
          job: 'Director',
          credit_id: 'def',
        },
      ],
    })

    expect(parsed.cast[0]).toMatchObject({
      title: 'A Movie',
      character: 'Lead',
      media_type: 'movie',
    })
    expect(parsed.crew[0]).toMatchObject({
      title: 'A Series',
      job: 'Director',
      media_type: 'tv',
    })
  })
})
