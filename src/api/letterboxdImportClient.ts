import { z } from 'zod'

import { upsertViewing } from '@/api/viewingsClient'
import { tmdbRequest } from '@/api/tmdbClient'
import {
  classifyTmdbMatch,
  letterboxdLocationFromDiary,
  parseLetterboxdZip,
  type LetterboxdViewingImport,
  type TmdbMatchResult,
} from '@/lib/letterboxdImport'
import { buildViewingId } from '@/lib/viewingDomain'
import type { ViewingUpsertInput } from '@/types/viewing'

const tmdbSearchMovieSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        title: z.string(),
        release_date: z.string().optional(),
      }),
    )
    .catch([]),
})

export type LetterboxdImportProgress = {
  phase: 'parsing' | 'matching' | 'writing' | 'done'
  processed: number
  total: number
}

export type LetterboxdImportSummary = {
  imported: number
  skipped: number
  unresolved: Array<{ title: string; year: number | null; watchedDate: string; reason: string }>
  ambiguous: Array<{ title: string; year: number | null; watchedDate: string; reason: string }>
}

function toUpsertInput(entry: LetterboxdViewingImport, tmdbId: number): ViewingUpsertInput {
  return {
    tmdbId,
    mediaType: 'movie',
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
  }
}

async function searchMovie(entry: LetterboxdViewingImport): Promise<TmdbMatchResult> {
  const params: Record<string, string | number | boolean | undefined> = {
    query: entry.diary.name,
    include_adult: false,
  }
  if (entry.diary.year) params.primary_release_year = entry.diary.year

  try {
    const body = await tmdbRequest('/search/movie', params, tmdbSearchMovieSchema)
    const candidates = body.results.map((item) => ({
      id: item.id,
      title: item.title,
      release_date: item.release_date,
    }))
    return classifyTmdbMatch(entry.diary, candidates)
  } catch {
    return { status: 'unresolved', candidates: [], reason: 'TMDB search failed.' }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function importLetterboxdZipForUser(
  uid: string,
  file: File,
  onProgress?: (progress: LetterboxdImportProgress) => void,
): Promise<LetterboxdImportSummary> {
  onProgress?.({ phase: 'parsing', processed: 0, total: 0 })
  const buffer = new Uint8Array(await file.arrayBuffer())
  const parsed = parseLetterboxdZip(buffer)
  const total = parsed.viewings.length

  const summary: LetterboxdImportSummary = {
    imported: 0,
    skipped: 0,
    unresolved: [],
    ambiguous: [],
  }

  onProgress?.({ phase: 'matching', processed: 0, total })

  for (let index = 0; index < parsed.viewings.length; index += 1) {
    const entry = parsed.viewings[index]
    onProgress?.({ phase: 'matching', processed: index, total })

    const match = await searchMovie(entry)
    if (match.status === 'ambiguous') {
      summary.ambiguous.push({
        title: entry.diary.name,
        year: entry.diary.year,
        watchedDate: entry.diary.watchedDate,
        reason: match.reason,
      })
      await sleep(120)
      continue
    }

    if (match.status !== 'matched') {
      summary.unresolved.push({
        title: entry.diary.name,
        year: entry.diary.year,
        watchedDate: entry.diary.watchedDate,
        reason: match.reason,
      })
      await sleep(120)
      continue
    }

    onProgress?.({ phase: 'writing', processed: index, total })
    const viewingId = await buildViewingId(entry.sourceKey)
    const result = await upsertViewing(uid, viewingId, toUpsertInput(entry, match.tmdbId))
    if (result.created) {
      summary.imported += 1
    } else {
      summary.skipped += 1
    }

    await sleep(120)
  }

  onProgress?.({ phase: 'done', processed: total, total })
  return summary
}
