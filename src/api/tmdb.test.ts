import { describe, expect, it } from 'vitest'

import { isValidEndpoint, validateParams } from '../../api/tmdb.ts'

describe('isValidEndpoint', () => {
  it('accepts known movie endpoints', () => {
    expect(isValidEndpoint('/movie/popular')).toBe(true)
    expect(isValidEndpoint('/movie/now_playing')).toBe(true)
    expect(isValidEndpoint('/movie/top_rated')).toBe(true)
    expect(isValidEndpoint('/movie/upcoming')).toBe(true)
  })

  it('accepts known TV endpoints', () => {
    expect(isValidEndpoint('/tv/popular')).toBe(true)
    expect(isValidEndpoint('/tv/on_the_air')).toBe(true)
    expect(isValidEndpoint('/tv/top_rated')).toBe(true)
  })

  it('accepts trending endpoints', () => {
    expect(isValidEndpoint('/trending/movie/week')).toBe(true)
    expect(isValidEndpoint('/trending/all/week')).toBe(true)
  })

  it('accepts search endpoints', () => {
    expect(isValidEndpoint('/search/movie')).toBe(true)
    expect(isValidEndpoint('/search/tv')).toBe(true)
    expect(isValidEndpoint('/search/person')).toBe(true)
  })

  it('accepts discover endpoints', () => {
    expect(isValidEndpoint('/discover/movie')).toBe(true)
    expect(isValidEndpoint('/discover/tv')).toBe(true)
  })

  it('accepts genre list endpoints', () => {
    expect(isValidEndpoint('/genre/movie/list')).toBe(true)
    expect(isValidEndpoint('/genre/tv/list')).toBe(true)
  })

  it('accepts detail endpoints with numeric IDs', () => {
    expect(isValidEndpoint('/movie/123')).toBe(true)
    expect(isValidEndpoint('/tv/456')).toBe(true)
    expect(isValidEndpoint('/person/789')).toBe(true)
    expect(isValidEndpoint('/movie/999999')).toBe(true)
  })

  it('accepts sub-resource endpoints with numeric IDs', () => {
    expect(isValidEndpoint('/movie/123/credits')).toBe(true)
    expect(isValidEndpoint('/movie/123/videos')).toBe(true)
    expect(isValidEndpoint('/movie/123/recommendations')).toBe(true)
    expect(isValidEndpoint('/tv/456/credits')).toBe(true)
    expect(isValidEndpoint('/tv/456/videos')).toBe(true)
    expect(isValidEndpoint('/tv/456/recommendations')).toBe(true)
    expect(isValidEndpoint('/tv/456/external_ids')).toBe(true)
    expect(isValidEndpoint('/person/789/combined_credits')).toBe(true)
  })

  it('rejects unknown endpoints', () => {
    expect(isValidEndpoint('/some/random/path')).toBe(false)
    expect(isValidEndpoint('/movie/delete/123')).toBe(false)
    expect(isValidEndpoint('/admin')).toBe(false)
    expect(isValidEndpoint('/')).toBe(false)
    expect(isValidEndpoint('')).toBe(false)
  })

  it('rejects endpoints without leading slash', () => {
    expect(isValidEndpoint('movie/popular')).toBe(false)
  })

  it('rejects endpoints with non-numeric IDs', () => {
    expect(isValidEndpoint('/movie/abc')).toBe(false)
    expect(isValidEndpoint('/tv/<script>')).toBe(false)
    expect(isValidEndpoint('/person/abc')).toBe(false)
  })
})

describe('validateParams', () => {
  it('returns cleaned params for valid input', () => {
    const result = validateParams({ page: 1, include_adult: false })
    expect(result).toEqual({ page: '1', include_adult: 'false' })
  })

  it('strips undefined, null, and empty strings', () => {
    const result = validateParams({ page: 1, query: undefined, extra: '', nothing: null })
    expect(result).toEqual({ page: '1' })
  })

  it('truncates query to max length', () => {
    const longQuery = 'a'.repeat(500)
    const result = validateParams({ query: longQuery })
    expect(result).toBeDefined()
    expect(result!.query).toHaveLength(200)
  })

  it('rejects invalid page numbers', () => {
    expect(validateParams({ page: 0 })).toBeNull()
    expect(validateParams({ page: -1 })).toBeNull()
    expect(validateParams({ page: 501 })).toBeNull()
    expect(validateParams({ page: 'abc' })).toBeNull()
  })

  it('rejects invalid include_adult values', () => {
    expect(validateParams({ include_adult: 'yes' })).toBeNull()
    expect(validateParams({ include_adult: '1' })).toBeNull()
  })

  it('rejects invalid sort_by values', () => {
    expect(validateParams({ sort_by: 'drop tables;' })).toBeNull()
  })

  it('accepts valid sort_by values', () => {
    const result = validateParams({ sort_by: 'popularity.desc' })
    expect(result).toEqual({ sort_by: 'popularity.desc' })
  })

  it('rejects params with HTML/special characters', () => {
    expect(validateParams({ query: '<script>alert(1)</script>' })).toBeNull()
    expect(validateParams({ query: 'foo & bar' })).toBeNull()
    expect(validateParams({ query: 'quote"test' })).toBeNull()
  })

  it('rejects unknown param keys', () => {
    expect(validateParams({ api_key: 'secret' })).toBeNull()
    expect(validateParams({ admin: 'true' })).toBeNull()
    expect(validateParams({ password: 'hack' })).toBeNull()
  })

  it('returns empty object for empty params', () => {
    const result = validateParams({})
    expect(result).toEqual({})
  })
})
