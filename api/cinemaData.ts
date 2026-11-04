import { load } from 'cheerio'
import { allowedDates, cinemaBranches, type CinemaId, type CinemaStatus, type Showtime } from '../src/types/cinema.js'

export type MovieMatch = { title: string; originalTitle?: string; runtime?: number | null }
type Candidate = { title: string; runtime?: number | null }

export function parseCinemaRequest(url: string | undefined, now = new Date()) {
  const params = new URL(url || '/', 'http://local.test').searchParams
  if ([...params.keys()].some((key) => !['movieId', 'date', 'cinemas'].includes(key))) return null
  const movieId = params.get('movieId')
  const date = params.get('date')
  const rawCinemas = params.get('cinemas')
  if (!movieId || !/^[1-9]\d*$/.test(movieId) || !Number.isSafeInteger(Number(movieId))) return null
  if (!date || !allowedDates(now).includes(date) || !rawCinemas) return null
  const cinemas = rawCinemas.split(',')
  const validIds = new Set<string>(cinemaBranches.map((branch) => branch.id))
  if (cinemas.length > 3 || new Set(cinemas).size !== cinemas.length || cinemas.some((id) => !validIds.has(id))) return null
  return { movieId, date, cinemas: cinemas as CinemaId[] }
}

function normalizeTitle(title: string) {
  return title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
}

export function matchMovie(movie: MovieMatch, candidates: Candidate[]): { status: 'matched' | 'none' | 'uncertain'; index?: number } {
  const titles = [movie.title, movie.originalTitle].filter((value): value is string => Boolean(value)).map(normalizeTitle)
  const exact = candidates.map((candidate, index) => ({ candidate, index })).filter(({ candidate }) => titles.includes(normalizeTitle(candidate.title)))
  if (exact.length === 1) {
    const candidate = exact[0]!
    if (movie.runtime && candidate.candidate.runtime && Math.abs(movie.runtime - candidate.candidate.runtime) > 10) return { status: 'uncertain' }
    return { status: 'matched', index: candidate.index }
  }
  if (exact.length > 1) return { status: 'uncertain' }
  const near = candidates.some((candidate) => {
    const name = normalizeTitle(candidate.title)
    return name.length >= 6 && titles.some((title) => title.length >= 6 && (name.includes(title) || title.includes(name)))
  })
  return { status: near ? 'uncertain' : 'none' }
}

function formatTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (match) return `${match[1]!.padStart(2, '0')}:${match[2]}`
  const twelveHour = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!twelveHour) return null
  const hour = (Number(twelveHour[1]) % 12) + (twelveHour[3]!.toUpperCase() === 'PM' ? 12 : 0)
  return `${String(hour).padStart(2, '0')}:${twelveHour[2]}`
}

export function parseSterKinekor(html: string, movie: MovieMatch): { status: CinemaStatus; showtimes: Showtime[]; bookingUrl: string } {
  const $ = load(html)
  const cards = $('.program-movie-card-container').toArray()
  if (!cards.length) {
    if ($('.program-empty-section').length) return { status: 'none', showtimes: [], bookingUrl: cinemaBranches[0].siteUrl }
    throw new Error('Ster-Kinekor program markup is unavailable')
  }
  const candidates = cards.map((card) => {
    const root = $(card)
    const runtime = root.find('.movieDetailsCard__info').text().match(/(\d+)h\s*(\d+)m/)
    return {
      title: root.find('a[href^="/f/"]').first().text().trim(),
      runtime: runtime ? Number(runtime[1]) * 60 + Number(runtime[2]) : null,
      root,
    }
  })
  const match = matchMovie(movie, candidates)
  if (match.status !== 'matched') return { status: match.status, showtimes: [], bookingUrl: cinemaBranches[0].siteUrl }
  const card = candidates[match.index!]!
  const link = card.root.find('a[href^="/f/"]').first().attr('href') || ''
  const showtimes: Showtime[] = []
  card.root.find('.gr-showtimes__container').each((_, group) => {
    const format = $(group).find('.gr-showtimes__bordered-text').first().text().trim() || 'Standard'
    $(group).find('.showtime_card .text-nowrap').each((_, node) => {
      const time = formatTime($(node).text())
      if (time) showtimes.push({ time, format })
    })
  })
  return { status: showtimes.length ? 'playing' : 'none', showtimes, bookingUrl: /^\/f\/[a-z0-9-]+\/\d+$/.test(link) ? `https://www.sterkinekor.com${link}` : cinemaBranches[0].siteUrl }
}

export type NuMovie = { id: string; title: string; running_time?: string | number | null }
export function parseNuMovies(value: unknown): NuMovie[] {
  if (!Array.isArray(value)) throw new Error('Nu Metro listing is unavailable')
  const movies = value.filter((item): item is NuMovie => typeof item === 'object' && item !== null && /^\d+$/.test(String(item.id)) && typeof item.title === 'string')
  if (value.length && !movies.length) throw new Error('Nu Metro listing format changed')
  return movies
}

export function parseNuDates(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error('Nu Metro dates are unavailable')
  const dates = value.flatMap((item) => typeof item === 'object' && item !== null ? Object.keys(item) : []).filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))
  if (value.length && !dates.length) throw new Error('Nu Metro date format changed')
  return dates
}

export function parseNuSessions(value: unknown): Showtime[] {
  if (!Array.isArray(value)) throw new Error('Nu Metro sessions are unavailable')
  const showtimes: Showtime[] = []
  let foundGroup = false
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue
    for (const [rawFormat, sessions] of Object.entries(item)) {
      if (typeof sessions !== 'object' || sessions === null || Array.isArray(sessions)) continue
      foundGroup = true
      const format = rawFormat.split(',').map((part) => part.trim()).filter((part) => part && !/^\*+$/.test(part)).join(' · ') || 'Standard'
      for (const session of Object.values(sessions)) {
        if (!Array.isArray(session) || typeof session[1] !== 'string' || session[2] === false) continue
        const time = formatTime(session[1])
        if (time) showtimes.push({ time, format })
      }
    }
  }
  if (value.length && !foundGroup) throw new Error('Nu Metro session format changed')
  return showtimes.sort((a, b) => a.time.localeCompare(b.time))
}
