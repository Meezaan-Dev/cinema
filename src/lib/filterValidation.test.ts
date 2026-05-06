import { describe, expect, it, vi } from 'vitest'

import {
  sanitizeGenre,
  sanitizeMood,
  sanitizeQuery,
  sanitizeRating,
  sanitizeRuntime,
  sanitizeSortBy,
  sanitizeWatchPreference,
  sanitizeYear,
} from '@/lib/filterValidation'

describe('filter validation', () => {
  it('normalizes free text queries', () => {
    expect(sanitizeQuery('  Dune    part   two  ')).toBe('Dune part two')
    expect(sanitizeQuery('x'.repeat(100))).toHaveLength(80)
  })

  it('accepts only plausible release years', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-06T00:00:00.000Z'))

    expect(sanitizeYear('1999')).toBe('1999')
    expect(sanitizeYear('2028')).toBe('2028')
    expect(sanitizeYear('2029')).toBe('')
    expect(sanitizeYear('abcd2020')).toBe('2020')

    vi.useRealTimers()
  })

  it('keeps only supported rating runtime sort preference and mood values', () => {
    expect(sanitizeRating('7')).toBe('7')
    expect(sanitizeRating('9')).toBe('')
    expect(sanitizeRuntime('120')).toBe('120')
    expect(sanitizeRuntime('999')).toBe('')
    expect(sanitizeSortBy('vote_average.desc')).toBe('vote_average.desc')
    expect(sanitizeSortBy('bad-sort')).toBe('popularity.desc')
    expect(sanitizeWatchPreference('watched')).toBe('watched')
    expect(sanitizeWatchPreference('everything')).toBe('any')
    expect(sanitizeMood('cozy')).toBe('cozy')
    expect(sanitizeMood('anything')).toBe('electric')
  })

  it('validates genres against known TMDB genres when available', () => {
    const genres = [
      { id: 28, name: 'Action' },
      { id: 878, name: 'Science Fiction' },
    ]

    expect(sanitizeGenre('28', genres)).toBe('28')
    expect(sanitizeGenre('12', genres)).toBe('')
    expect(sanitizeGenre('abc', genres)).toBe('')
    expect(sanitizeGenre('878')).toBe('878')
  })
})
