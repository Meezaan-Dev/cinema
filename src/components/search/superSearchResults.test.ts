import { describe, expect, it } from 'vitest'

import { normalizePersonResult, normalizeSuperSearchResults, normalizeTitleResult } from './superSearchResults'
import type { TmdbMovie, TmdbPersonSearchResult } from '@/types/tmdb'

const movie: TmdbMovie = {
  id: 101,
  title: 'Dune',
  overview: 'A desert planet changes everything.',
  poster_path: '/dune.jpg',
  backdrop_path: null,
  release_date: '2021-10-22',
  vote_average: 8.1,
  vote_count: 1000,
  popularity: 75,
  media_type: 'movie',
}

const series: TmdbMovie = {
  ...movie,
  id: 202,
  title: 'Severance',
  release_date: '2022-02-18',
  popularity: 85,
  media_type: 'tv',
}

const person: TmdbPersonSearchResult = {
  id: 303,
  name: 'Rebecca Ferguson',
  profile_path: '/rebecca.jpg',
  known_for_department: 'Acting',
  popularity: 95,
  known_for: [movie, series],
}

describe('super search result normalization', () => {
  it('creates movie routes and metadata', () => {
    expect(normalizeTitleResult(movie)).toMatchObject({
      key: 'movie-101',
      kind: 'movie',
      title: 'Dune',
      subtitle: 'Movie • 2021',
      to: '/movie/101',
      rating: 8.1,
    })
  })

  it('creates tv routes and metadata', () => {
    expect(normalizeTitleResult(series)).toMatchObject({
      key: 'tv-202',
      kind: 'tv',
      title: 'Severance',
      subtitle: 'TV Show • 2022',
      to: '/tv/202',
    })
  })

  it('creates person routes and known-for copy', () => {
    expect(normalizePersonResult(person)).toMatchObject({
      key: 'person-303',
      kind: 'person',
      title: 'Rebecca Ferguson',
      subtitle: 'Acting',
      description: 'Known for Dune, Severance',
      to: '/person/303',
    })
  })

  it('sorts mixed results by popularity', () => {
    expect(normalizeSuperSearchResults({ titles: [movie, series], people: [person] }).map((item) => item.key))
      .toEqual(['person-303', 'tv-202', 'movie-101'])
  })
})
