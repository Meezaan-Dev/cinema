import type { ApiRequest, ApiResponse } from './serverUtils.js'
import { isBlockedCrawlerUserAgent } from './crawlerGuards.js'
import {
  parseCinemaRequest,
  parseNuDates,
  parseNuMovies,
  parseNuSessions,
  parseSterKinekor,
  matchMovie,
  type MovieMatch,
} from './cinemaData.js'
import { cinemaBranches, type CinemaId, type CinemaResult } from '../src/types/cinema.js'

type Fetcher = typeof fetch
type MovieDetails = MovieMatch & { original_title?: string }

function apiKey() {
  return process.env.TMDB_API_KEY
}

async function readResponse(response: Response, maxBytes: number) {
  if (!response.ok) throw new Error(`Source returned ${response.status}`)
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Source returned no body')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) throw new Error('Source response too large')
      chunks.push(value)
    }
  } catch (error) {
    await reader.cancel()
    throw error
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

async function getJson(fetcher: Fetcher, url: string, maxBytes = 200_000, init?: RequestInit) {
  const response = await fetcher(url, { ...init, signal: AbortSignal.timeout(8_000) })
  return JSON.parse(await readResponse(response, maxBytes)) as unknown
}

async function getText(fetcher: Fetcher, url: string, maxBytes = 1_000_000) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(8_000) })
  return readResponse(response, maxBytes)
}

async function getTmdbMovie(fetcher: Fetcher, movieId: string): Promise<MovieMatch> {
  const base = (process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3').replace(/\/+$/, '')
  const url = new URL(`${base}/movie/${movieId}`)
  url.searchParams.set('api_key', apiKey()!)
  const value = await getJson(fetcher, url.toString(), 100_000) as MovieDetails
  if (typeof value?.title !== 'string' || !value.title.trim()) throw new Error('TMDB movie details are unavailable')
  return { title: value.title, originalTitle: value.original_title, runtime: typeof value.runtime === 'number' ? value.runtime : null }
}

async function nuPost(fetcher: Fetcher, params: Record<string, string>) {
  return getJson(fetcher, 'https://numetro.co.za/wp-admin/admin-ajax.php', 200_000, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
}

async function checkSterKinekor(fetcher: Fetcher, movie: MovieMatch, date: string, checkedAt: string): Promise<CinemaResult> {
  const branch = cinemaBranches[0]
  try {
    const url = new URL(branch.siteUrl)
    url.searchParams.set('date', date)
    const parsed = parseSterKinekor(await getText(fetcher, url.toString()), movie)
    return { id: branch.id, ...parsed, checkedAt }
  } catch (error) {
    console.error('Ster-Kinekor program check failed:', error)
    return { id: branch.id, status: 'unavailable', showtimes: [], bookingUrl: branch.siteUrl, checkedAt }
  }
}

async function checkNuMetro(fetcher: Fetcher, movie: MovieMatch, date: string, id: 'nm:22' | 'nm:45', checkedAt: string): Promise<CinemaResult> {
  const branch = cinemaBranches.find((item) => item.id === id)!
  const cinemaId = id.slice(3)
  let bookingUrl: string = branch.siteUrl
  try {
    const listingUrl = `https://numetro.co.za/api/?movies=true&cinema=${cinemaId}`
    const movies = parseNuMovies(await getJson(fetcher, listingUrl))
    const match = matchMovie(movie, movies.map((item) => ({ title: item.title, runtime: Number(item.running_time) || null })))
    if (match.status !== 'matched') return { id, status: match.status, showtimes: [], bookingUrl, checkedAt }
    const film = movies[match.index!]!
    bookingUrl = `https://numetro.co.za/movie/${film.id}/`
    const dates = parseNuDates(await nuPost(fetcher, { action: 'update_cine_session', cinema_id: cinemaId, movie_id: film.id }))
    if (!dates.includes(date)) return { id, status: 'none', showtimes: [], bookingUrl, checkedAt }
    const showtimes = parseNuSessions(await nuPost(fetcher, { action: 'get_cine_session', cinema_id: cinemaId, movie_id: film.id, date }))
    return { id, status: showtimes.length ? 'playing' : 'none', showtimes, bookingUrl, checkedAt }
  } catch (error) {
    console.error(`Nu Metro ${cinemaId} check failed:`, error)
    return { id, status: 'unavailable', showtimes: [], bookingUrl, checkedAt }
  }
}

export function createCinemaShowtimesHandler(fetcher: Fetcher = fetch, now: () => Date = () => new Date()) {
  return async (req: ApiRequest, res: ApiResponse) => {
    const userAgent = req.headers?.['user-agent']
    if (isBlockedCrawlerUserAgent(Array.isArray(userAgent) ? userAgent.join(' ') : userAgent)) {
      res.setHeader('Cache-Control', 'no-store')
      res.status(403).json({ error: 'Crawler is not allowed.' })
      return
    }
    if (req.method !== 'GET') {
      res.setHeader('Cache-Control', 'no-store')
      res.status(405).json({ error: 'Method not allowed.' })
      return
    }
    const parsed = parseCinemaRequest(req.url, now())
    if (!parsed) {
      res.setHeader('Cache-Control', 'no-store')
      res.status(400).json({ error: 'Invalid movie, date, or cinema selection.' })
      return
    }
    if (!apiKey()) {
      res.setHeader('Cache-Control', 'no-store')
      res.status(501).json({ error: 'TMDB is not configured on the server.' })
      return
    }
    let movie: MovieMatch
    try {
      movie = await getTmdbMovie(fetcher, parsed.movieId)
    } catch (error) {
      console.error('Cinema check could not load TMDB movie:', error)
      res.setHeader('Cache-Control', 'no-store')
      res.status(502).json({ error: 'Movie details could not be checked right now.' })
      return
    }
    const checkedAt = now().toISOString()
    const results = await Promise.all(parsed.cinemas.map((id: CinemaId) => id === 'sk:blue-route'
      ? checkSterKinekor(fetcher, movie, parsed.date, checkedAt)
      : checkNuMetro(fetcher, movie, parsed.date, id, checkedAt)))
    const complete = results.every((result) => result.status !== 'unavailable')
    res.setHeader('Cache-Control', complete ? 'public, max-age=0, must-revalidate' : 'no-store')
    if (complete) {
      res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=300')
    }
    res.status(200).json({ date: parsed.date, results })
  }
}

export default createCinemaShowtimesHandler()
