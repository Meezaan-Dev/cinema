import {
  classifyTmdbMatch,
  joinDiaryWithReviews as joinDiaryWithReviewsBase,
  letterboxdLocationFromDiary,
  parseDiaryCsv,
  parseLetterboxdZip,
  parseReviewsCsv,
  type LetterboxdDiaryRow,
  type LetterboxdReviewRow,
  type LetterboxdViewingImport,
  type TmdbMatchResult,
  type TmdbSearchCandidate,
} from '../src/lib/letterboxdImport.ts'
import { buildViewingId, type FirestoreViewingInput } from './rewindDomain.js'

export type { LetterboxdDiaryRow, LetterboxdReviewRow, LetterboxdViewingImport, TmdbMatchResult, TmdbSearchCandidate }

export type LetterboxdViewingImportWithId = LetterboxdViewingImport & { id: string }

export { classifyTmdbMatch, parseDiaryCsv, parseLetterboxdZip, parseReviewsCsv, letterboxdLocationFromDiary }

export function joinDiaryWithReviews(
  diaryRows: LetterboxdDiaryRow[],
  reviewRows: LetterboxdReviewRow[],
): LetterboxdViewingImportWithId[] {
  return joinDiaryWithReviewsBase(diaryRows, reviewRows).map((entry) => ({
    ...entry,
    id: buildViewingId(entry.sourceKey),
  }))
}

export function toFirestoreViewingInput(
  entry: LetterboxdViewingImport,
  match: Extract<TmdbMatchResult, { status: 'matched' }>,
): FirestoreViewingInput {
  return {
    tmdbId: match.tmdbId,
    watchedAt: new Date(`${entry.diary.watchedDate}T00:00:00.000Z`),
    location: letterboxdLocationFromDiary(entry.diary),
    rating: entry.diary.rating,
    rewatch: entry.diary.rewatch,
    review: entry.review,
    tags: entry.diary.tags,
    source: 'letterboxd',
    sourceUri: entry.diary.letterboxdUri,
    sourceKey: entry.sourceKey,
    importTitle: entry.diary.name,
    importYear: entry.diary.year,
    mediaType: 'movie',
  }
}
