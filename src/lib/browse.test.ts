import { describe, expect, it } from 'vitest'

import { browseDiscoverFilters, browsePlatform, browseType, legacyBrowseLocation } from './browse'

const defaults = { genre: '', year: '', minRating: '', sortBy: 'popularity.desc' }

describe('browse links', () => {
  it('preserves valid platform links while mapping old routes', () => {
    expect(legacyBrowseLocation('/movies', { platform: 'netflix' })).toEqual({ path: '/browse', query: { type: 'movie', platform: 'netflix' } })
    expect(legacyBrowseLocation('/tv-shows', { platform: 'apple' })).toEqual({ path: '/browse', query: { type: 'tv', platform: 'apple' } })
    expect(legacyBrowseLocation('/streaming', { platform: 'disney' })).toEqual({ path: '/browse', query: { platform: 'disney' } })
  })

  it('ignores invalid route values', () => {
    expect(legacyBrowseLocation('/streaming', { platform: 'unknown' })).toEqual({ path: '/browse', query: {} })
    expect(browseType('invalid')).toBe('all')
    expect(browsePlatform(['netflix'])).toBe('')
  })
})

describe('browse discovery filters', () => {
  it('uses South African availability only when a service is chosen', () => {
    expect(browseDiscoverFilters('all', '', defaults, [])).toMatchObject({ watchProvider: undefined, watchRegion: undefined })
    expect(browseDiscoverFilters('movie', 'netflix', defaults, [])).toMatchObject({ watchProvider: '8', watchRegion: 'ZA' })
    expect(browseDiscoverFilters('tv', 'prime', defaults, [])).toMatchObject({ watchProvider: '9|119', watchRegion: 'ZA' })
  })

  it('does not apply a movie or show genre to mixed results', () => {
    const options = { ...defaults, genre: '28' }
    const genres = [{ id: 28, name: 'Action' }]
    expect(browseDiscoverFilters('all', '', options, genres).genre).toBe('')
    expect(browseDiscoverFilters('movie', '', options, genres).genre).toBe('28')
  })

  it('requires enough votes for rating sort', () => {
    expect(browseDiscoverFilters('all', '', { ...defaults, sortBy: 'vote_average.desc' }, []).minVoteCount).toBe(50)
  })
})
