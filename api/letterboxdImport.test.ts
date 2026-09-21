import { describe, expect, it } from 'vitest'

import {
  classifyTmdbMatch,
  joinDiaryWithReviews,
  parseDiaryCsv,
  parseReviewsCsv,
  toFirestoreViewingInput,
} from './letterboxdImport.ts'
import { buildViewingId, buildViewingSourceKey } from './rewindDomain.ts'

const diaryCsv = `Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date
2023-09-14,Spider-Man: Across the Spider-Verse,2023,https://boxd.it/4Qh6VB,5,Yes,"animation, cinema",2023-09-13
2023-09-15,Oppenheimer,2023,,4.5,,,2023-09-14
`

const reviewsCsv = `Date,Name,Year,Letterboxd URI,Rating,Rewatch,Review,Tags,Watched Date
2023-09-14,Spider-Man: Across the Spider-Verse,2023,https://boxd.it/4Qh6VB,5,Yes,"Amazing
still thinking about it",,2023-09-13
`

describe('Letterboxd parsing', () => {
  it('parses diary fields using Watched Date as the viewing date', () => {
    const rows = parseDiaryCsv(diaryCsv)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      name: 'Spider-Man: Across the Spider-Verse',
      year: 2023,
      rating: 5,
      rewatch: true,
      tags: ['animation', 'cinema'],
      watchedDate: '2023-09-13',
    })
    expect(rows[1].rating).toBe(4.5)
  })

  it('joins multiline reviews by diary Letterboxd URI', () => {
    const viewings = joinDiaryWithReviews(parseDiaryCsv(diaryCsv), parseReviewsCsv(reviewsCsv))

    expect(viewings[0].review).toBe('Amazing\nstill thinking about it')
    expect(viewings[1].review).toBeNull()
  })
})

describe('TMDB matching', () => {
  it('accepts one exact normalized title and release-year match', () => {
    const [entry] = parseDiaryCsv(diaryCsv)
    const match = classifyTmdbMatch(entry, [
      { id: 569094, title: 'Spider-Man: Across the Spider-Verse', release_date: '2023-05-31' },
    ])

    expect(match).toEqual({
      status: 'matched',
      tmdbId: 569094,
      title: 'Spider-Man: Across the Spider-Verse',
      year: 2023,
    })
  })

  it('marks multiple exact matches as ambiguous', () => {
    const [entry] = parseDiaryCsv(diaryCsv)
    const match = classifyTmdbMatch(entry, [
      { id: 1, title: 'Spider-Man: Across the Spider-Verse', release_date: '2023-05-31' },
      { id: 2, title: 'Spider-Man: Across the Spider-Verse', release_date: '2023-06-01' },
    ])

    expect(match.status).toBe('ambiguous')
  })

  it('does not accept a title match with the wrong year', () => {
    const [entry] = parseDiaryCsv(diaryCsv)
    const match = classifyTmdbMatch(entry, [
      { id: 1, title: 'Spider-Man: Across the Spider-Verse', release_date: '2024-05-31' },
    ])

    expect(match).toMatchObject({ status: 'unresolved', reason: 'Title matched but release year did not.' })
  })
})

describe('viewing identity and Firestore mapping', () => {
  it('generates deterministic IDs from source identity', () => {
    const sourceKey = buildViewingSourceKey({
      source: 'letterboxd',
      sourceUri: 'https://boxd.it/4Qh6VB',
      title: 'Spider-Man: Across the Spider-Verse',
      year: 2023,
      watchedAt: '2023-09-13',
    })

    expect(sourceKey).toBe('letterboxd:https://boxd.it/4Qh6VB')
    expect(buildViewingId(sourceKey)).toBe(buildViewingId(sourceKey))
    expect(buildViewingId(sourceKey)).toMatch(/^vw_[a-f0-9]{32}$/)
  })

  it('falls back to stable title/year/date IDs when URI is unavailable', () => {
    const first = buildViewingSourceKey({
      source: 'letterboxd',
      sourceUri: null,
      title: 'Oppenheimer',
      year: 2023,
      watchedAt: '2023-09-14',
    })
    const second = buildViewingSourceKey({
      source: 'letterboxd',
      sourceUri: null,
      title: 'Oppenheimer',
      year: 2023,
      watchedAt: '2023-09-14',
    })

    expect(first).toBe(second)
    expect(buildViewingId(first)).toBe(buildViewingId(second))
  })

  it('maps imported Letterboxd viewings to unknown viewing location', () => {
    const [viewing] = joinDiaryWithReviews(parseDiaryCsv(diaryCsv), parseReviewsCsv(reviewsCsv))
    const input = toFirestoreViewingInput(viewing, {
      status: 'matched',
      tmdbId: 569094,
      title: 'Spider-Man: Across the Spider-Verse',
      year: 2023,
    })

    expect(input.location).toBe('unknown')
    expect(input.source).toBe('letterboxd')
    expect(input.review).toBe('Amazing\nstill thinking about it')
  })
})
