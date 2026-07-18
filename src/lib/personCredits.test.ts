import { describe, expect, it } from 'vitest'

import { filterPersonCredits, groupPersonCredits, normalizePersonCredits } from './personCredits'
import type { TmdbMovie, TmdbPersonCombinedCredits } from '@/types/tmdb'

function credit(overrides: Partial<TmdbMovie>): TmdbMovie {
  return {
    id: 1,
    title: 'Untitled',
    overview: '',
    poster_path: null,
    backdrop_path: null,
    release_date: '',
    vote_average: 0,
    vote_count: 0,
    popularity: 0,
    media_type: 'movie',
    ...overrides,
  }
}

describe('person credit helpers', () => {
  it('separates movies from shows', () => {
    const normalized = normalizePersonCredits({
      id: 1,
      cast: [
        { ...credit({ id: 10, title: 'Movie Credit', media_type: 'movie' }), character: 'Lead', credit_id: 'a' },
        { ...credit({ id: 11, title: 'Show Credit', media_type: 'tv' }), character: 'Host', credit_id: 'b' },
      ],
      crew: [],
    })

    expect(groupPersonCredits(normalized).movies.map((item) => item.title)).toEqual(['Movie Credit'])
    expect(groupPersonCredits(normalized).shows.map((item) => item.title)).toEqual(['Show Credit'])
  })

  it('merges duplicate cast and directing credits for the same title', () => {
    const source: TmdbPersonCombinedCredits = {
      id: 1,
      cast: [
        { ...credit({ id: 20, title: 'One Night', popularity: 30 }), character: 'Alex', credit_id: 'cast-credit' },
      ],
      crew: [
        {
          ...credit({ id: 20, title: 'One Night', popularity: 30 }),
          department: 'Directing',
          job: 'Director',
          credit_id: 'crew-credit',
        },
      ],
    }

    expect(normalizePersonCredits(source)).toMatchObject([
      {
        id: 20,
        title: 'One Night',
        creditLabels: ['as Alex', 'Director'],
      },
    ])
  })

  it('sorts normalized credits by popularity', () => {
    const normalized = normalizePersonCredits({
      id: 1,
      cast: [
        { ...credit({ id: 30, title: 'Less Popular', popularity: 1 }), character: '', credit_id: 'a' },
        { ...credit({ id: 31, title: 'More Popular', popularity: 50 }), character: '', credit_id: 'b' },
      ],
      crew: [],
    })

    expect(normalized.map((item) => item.title)).toEqual(['More Popular', 'Less Popular'])
  })

  it('filters credits by title case-insensitively', () => {
    const normalized = normalizePersonCredits({
      id: 1,
      cast: [
        { ...credit({ id: 40, title: 'The Bear' }), character: '', credit_id: 'a' },
        { ...credit({ id: 41, title: 'Past Lives' }), character: '', credit_id: 'b' },
      ],
      crew: [],
    })

    expect(filterPersonCredits(normalized, 'bear').map((item) => item.title)).toEqual(['The Bear'])
  })
})
