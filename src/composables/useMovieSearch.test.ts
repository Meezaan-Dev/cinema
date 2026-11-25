import { describe, expect, it } from 'vitest'

import { mergeResponses } from './useMovieSearch'
import type { TmdbMovie, TmdbPagedResponse } from '@/types/tmdb'

function title(id: number, popularity: number, rating: number, date: string): TmdbMovie {
  return { id, title: String(id), overview: '', poster_path: null, backdrop_path: null, release_date: date, vote_average: rating, vote_count: 20, popularity }
}

function page(results: TmdbMovie[]): TmdbPagedResponse<TmdbMovie> {
  return { page: 1, results, total_pages: 1, total_results: results.length }
}

describe('combined Browse results', () => {
  const movies = page([title(1, 10, 9, '2020-01-01')])
  const shows = page([title(2, 20, 7, '2025-01-01')])

  it('honors the selected sort across movie and show results', () => {
    expect(mergeResponses(movies, shows, 'popularity.desc').results.map((item) => item.id)).toEqual([2, 1])
    expect(mergeResponses(movies, shows, 'vote_average.desc').results.map((item) => item.id)).toEqual([1, 2])
    expect(mergeResponses(movies, shows, 'primary_release_date.desc').results.map((item) => item.id)).toEqual([2, 1])
  })

  it('keeps the requested page number when merging results', () => {
    expect(mergeResponses({ ...movies, page: 2 }, { ...shows, page: 2 }, 'popularity.desc').page).toBe(2)
  })
})
