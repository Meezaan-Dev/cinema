import { describe, expect, it } from 'vitest'

import { moviesToCsv } from '@/lib/csv'
import type { UserMovie } from '@/types/movie'

const baseMovie: UserMovie = {
  id: 1,
  title: 'Heat',
  posterPath: null,
  backdropPath: null,
  releaseDate: '1995-12-15',
  voteAverage: 8.2,
  genres: ['Crime'],
  addedAt: '2024-01-01T00:00:00.000Z',
  isWatched: false,
  isFavourite: false,
  mediaType: 'movie',
}

describe('csv export', () => {
  it('returns headers for an empty watchlist', () => {
    expect(moviesToCsv([])).toBe('id,title,releaseDate,voteAverage,genres,addedAt,isWatched,isFavourite,personalRating')
  })

  it('escapes commas quotes and newlines', () => {
    const csv = moviesToCsv([
      {
        ...baseMovie,
        title: 'A "Great", Film',
        genres: ['Drama', 'Neo\nNoir'],
      },
    ])

    expect(csv).toContain('"A ""Great"", Film"')
    expect(csv).toContain('"Drama|Neo\nNoir"')
  })
})
