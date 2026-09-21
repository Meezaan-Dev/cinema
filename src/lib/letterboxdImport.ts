import { strFromU8, unzipSync } from 'fflate'

import { parseCsv } from '@/lib/parseCsv'

import {
  buildViewingSourceKey,
  inferLocationFromLetterboxdTags,
  normalizeTitle,
  parseLetterboxdRating,
  parseLetterboxdRewatch,
  parseLetterboxdTags,
  parseLetterboxdYear,
  releaseYear,
  type ViewingLocation,
} from '@/lib/viewingDomain'

export type LetterboxdDiaryRow = {
  date: string
  name: string
  year: number | null
  letterboxdUri: string | null
  rating: number | null
  rewatch: boolean
  tags: string[]
  watchedDate: string
}

export type LetterboxdReviewRow = {
  letterboxdUri: string | null
  review: string
}

export type LetterboxdViewingImport = {
  sourceKey: string
  diary: LetterboxdDiaryRow
  review: string | null
}

export type TmdbSearchCandidate = {
  id: number
  title: string
  release_date?: string
}

export type TmdbMatchResult =
  | { status: 'matched'; tmdbId: number; title: string; year: number | null }
  | { status: 'ambiguous'; candidates: TmdbSearchCandidate[]; reason: string }
  | { status: 'unresolved'; candidates: TmdbSearchCandidate[]; reason: string }

export function parseDiaryCsv(content: string) {
  return parseCsv(content).flatMap((row): LetterboxdDiaryRow[] => {
    const name = row.Name?.trim()
    const watchedDate = row['Watched Date']?.trim()
    if (!name || !watchedDate) return []

    return [
      {
        date: row.Date?.trim() ?? '',
        name,
        year: parseLetterboxdYear(row.Year),
        letterboxdUri: row['Letterboxd URI']?.trim() || null,
        rating: parseLetterboxdRating(row.Rating),
        rewatch: parseLetterboxdRewatch(row.Rewatch),
        tags: parseLetterboxdTags(row.Tags),
        watchedDate,
      },
    ]
  })
}

export function parseReviewsCsv(content: string) {
  return parseCsv(content).flatMap((row): LetterboxdReviewRow[] => {
    const review = row.Review?.trim()
    if (!review) return []

    return [
      {
        letterboxdUri: row['Letterboxd URI']?.trim() || null,
        review,
      },
    ]
  })
}

export function joinDiaryWithReviews(
  diaryRows: LetterboxdDiaryRow[],
  reviewRows: LetterboxdReviewRow[],
) {
  const reviewsByUri = new Map<string, string>()
  for (const review of reviewRows) {
    if (review.letterboxdUri) reviewsByUri.set(review.letterboxdUri, review.review)
  }

  return diaryRows.map((diary): LetterboxdViewingImport => {
    const sourceKey = buildViewingSourceKey({
      source: 'letterboxd',
      sourceUri: diary.letterboxdUri,
      title: diary.name,
      year: diary.year,
      watchedAt: diary.watchedDate,
    })

    return {
      sourceKey,
      diary,
      review: diary.letterboxdUri ? reviewsByUri.get(diary.letterboxdUri) ?? null : null,
    }
  })
}

function findZipEntry(files: Record<string, Uint8Array>, fileName: string) {
  if (files[fileName]) return files[fileName]

  const suffix = `/${fileName}`
  const nestedKey = Object.keys(files).find((key) => key.endsWith(suffix) || key.endsWith(fileName))
  return nestedKey ? files[nestedKey] : undefined
}

export function parseLetterboxdZip(buffer: Uint8Array) {
  const files = unzipSync(buffer)
  const diaryFile = findZipEntry(files, 'diary.csv')
  const reviewsFile = findZipEntry(files, 'reviews.csv')

  if (!diaryFile) {
    throw new Error('Letterboxd export is missing diary.csv.')
  }

  const diaryRows = parseDiaryCsv(strFromU8(diaryFile))
  const reviewRows = reviewsFile ? parseReviewsCsv(strFromU8(reviewsFile)) : []

  return {
    diaryRows,
    reviewRows,
    viewings: joinDiaryWithReviews(diaryRows, reviewRows),
  }
}

export function classifyTmdbMatch(
  entry: LetterboxdDiaryRow,
  candidates: TmdbSearchCandidate[],
): TmdbMatchResult {
  if (candidates.length === 0) {
    return { status: 'unresolved', candidates, reason: 'No TMDB results.' }
  }

  const expectedTitle = normalizeTitle(entry.name)
  const exactTitleMatches = candidates.filter(
    (candidate) => normalizeTitle(candidate.title) === expectedTitle,
  )
  const exactTitleAndYearMatches = exactTitleMatches.filter(
    (candidate) => releaseYear(candidate.release_date) === entry.year,
  )

  if (exactTitleAndYearMatches.length === 1) {
    const match = exactTitleAndYearMatches[0]
    return {
      status: 'matched',
      tmdbId: match.id,
      title: match.title,
      year: releaseYear(match.release_date),
    }
  }

  if (exactTitleAndYearMatches.length > 1) {
    return {
      status: 'ambiguous',
      candidates: exactTitleAndYearMatches,
      reason: 'Multiple exact title and year matches.',
    }
  }

  if (exactTitleMatches.length > 0) {
    return {
      status: 'unresolved',
      candidates: exactTitleMatches,
      reason: 'Title matched but release year did not.',
    }
  }

  return {
    status: 'unresolved',
    candidates: candidates.slice(0, 5),
    reason: 'No exact title and year match.',
  }
}

export function letterboxdLocationFromDiary(diary: LetterboxdDiaryRow): ViewingLocation {
  return inferLocationFromLetterboxdTags(diary.tags)
}
