import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

import {
  classifyTmdbMatch,
  parseLetterboxdZip,
  toFirestoreViewingInput,
  type LetterboxdViewingImportWithId,
  type TmdbMatchResult,
  type TmdbSearchCandidate,
} from '../api/letterboxdImport.js'
import { buildViewingId } from '../api/rewindDomain.js'
import { createViewingRepository } from '../api/viewingRepository.js'

type TmdbSearchResponse = {
  results?: Array<{
    id?: unknown
    title?: unknown
    release_date?: unknown
  }>
}

type ImportReportEntry = {
  title: string
  year: number | null
  watchedDate: string
  sourceUri: string | null
  status: Exclude<TmdbMatchResult['status'], 'matched'>
  reason: string
  candidates: TmdbSearchCandidate[]
}

function loadEnvFile(path = '.env') {
  const fullPath = resolve(path)
  if (!existsSync(fullPath)) return

  const content = readFileSync(fullPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator).trim()
    const rawValue = trimmed.slice(separator + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function tmdbBaseUrl() {
  return (process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3').replace(/\/+$/, '')
}

function toTmdbCandidates(body: TmdbSearchResponse) {
  return (body.results ?? []).flatMap((item): TmdbSearchCandidate[] => {
    if (typeof item.id !== 'number' || typeof item.title !== 'string') return []

    return [
      {
        id: item.id,
        title: item.title,
        release_date: typeof item.release_date === 'string' ? item.release_date : '',
      },
    ]
  })
}

async function searchTmdb(entry: LetterboxdViewingImportWithId) {
  const apiKey = requireEnv('TMDB_API_KEY')
  const url = new URL(`${tmdbBaseUrl()}/search/movie`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('query', entry.diary.name)
  url.searchParams.set('include_adult', 'false')
  if (entry.diary.year) url.searchParams.set('primary_release_year', String(entry.diary.year))

  const response = await fetch(url)
  if (!response.ok) {
    return {
      status: 'unresolved',
      candidates: [],
      reason: `TMDB request failed with ${response.status}.`,
    } satisfies TmdbMatchResult
  }

  const body = (await response.json()) as TmdbSearchResponse
  return classifyTmdbMatch(entry.diary, toTmdbCandidates(body))
}

function importReportPath(zipPath: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return resolve(`letterboxd-import-report-${basename(zipPath, '.zip')}-${stamp}.json`)
}

async function main() {
  loadEnvFile()

  const zipPath = process.argv[2]
  if (!zipPath) {
    throw new Error('Usage: npm run import:letterboxd -- <letterboxd-export.zip>')
  }

  const parsed = parseLetterboxdZip(readFileSync(resolve(zipPath)))
  const repository = createViewingRepository()

  let matched = 0
  let created = 0
  let updated = 0
  let reviewsJoined = 0
  let rewatches = 0
  let unknownLocations = 0
  const unresolved: ImportReportEntry[] = []
  const ambiguous: ImportReportEntry[] = []

  for (const entry of parsed.viewings) {
    if (entry.review) reviewsJoined += 1
    if (entry.diary.rewatch) rewatches += 1

    const match = await searchTmdb(entry)

    if (match.status !== 'matched') {
      const reportEntry: ImportReportEntry = {
        title: entry.diary.name,
        year: entry.diary.year,
        watchedDate: entry.diary.watchedDate,
        sourceUri: entry.diary.letterboxdUri,
        status: match.status,
        reason: match.reason,
        candidates: match.candidates,
      }
      if (match.status === 'ambiguous') {
        ambiguous.push(reportEntry)
      } else {
        unresolved.push(reportEntry)
      }
      continue
    }

    const viewingId = entry.id ?? buildViewingId(entry.sourceKey)
    const input = toFirestoreViewingInput(entry, match)
    const result = await repository.upsertViewing(viewingId, input)
    matched += 1
    if (input.location === 'unknown') unknownLocations += 1
    if (result.created) {
      created += 1
    } else {
      updated += 1
    }
  }

  const report = {
    export: resolve(zipPath),
    diaryRowsFound: parsed.diaryRows.length,
    successfullyMatchedTmdbMovies: matched,
    firestoreRecordsCreated: created,
    firestoreRecordsUpdated: updated,
    unresolvedMovies: unresolved.length,
    ambiguousMatches: ambiguous.length,
    reviewsJoined,
    rewatchesDetected: rewatches,
    duplicatesPrevented: updated,
    unknownLocationRecords: unknownLocations,
    unresolved,
    ambiguous,
  }

  const reportPath = importReportPath(zipPath)
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)

  console.log(JSON.stringify({ ...report, reportPath }, null, 2))
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
