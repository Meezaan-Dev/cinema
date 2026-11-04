import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCinemaShowtimesHandler } from '../../api/cinema-showtimes'
import type { ApiResponse } from '../../api/serverUtils'

const now = new Date('2026-11-01T10:00:00Z')
const url = '/api/cinema-showtimes?movieId=7025&date=2026-11-01&cinemas=sk:blue-route,nm:22,nm:45'

function response() {
  let status = 200
  let body: unknown
  const headers: Record<string, string> = {}
  const res: ApiResponse = {
    status(code) { status = code; return res },
    json(payload) { body = payload },
    setHeader(name, value) { headers[name] = value },
  }
  return { res, get status() { return status }, get body() { return body }, headers }
}

function json(value: unknown) { return new Response(JSON.stringify(value), { status: 200 }) }

afterEach(() => { delete process.env.TMDB_API_KEY })

describe('cinema showtimes handler', () => {
  it('keeps the working chain when another source fails, then lets retry fetch again', async () => {
    process.env.TMDB_API_KEY = 'test-key'
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const target = String(input)
      if (target.includes('themoviedb')) return json({ title: 'Spider-Man: Brand New Day', runtime: 145 })
      if (target.includes('sterkinekor')) throw new Error('Source offline')
      if (target.includes('movies=true')) return json([{ id: '7025', title: 'Spider-Man: Brand New Day', running_time: '145' }])
      if (target.includes('admin-ajax') && String(init?.body).includes('update_cine_session')) return json([{ '2026-11-01': 'Sun 01 Nov' }])
      if (target.includes('admin-ajax')) return json([])
      throw new Error(`Unexpected URL: ${target}`)
    }) as unknown as typeof fetch
    const handler = createCinemaShowtimesHandler(fetcher, () => now)
    const first = response()
    await handler({ method: 'GET', url }, first.res)
    expect(first.status).toBe(200)
    expect((first.body as { results: { status: string }[] }).results.map((item) => item.status)).toEqual(['unavailable', 'none', 'none'])
    expect(first.headers['Cache-Control']).toBe('no-store')
    const requests = vi.mocked(fetcher).mock.calls.length
    await handler({ method: 'GET', url }, response().res)
    expect(vi.mocked(fetcher).mock.calls.length).toBeGreaterThan(requests)
  })

  it('sets a five-minute CDN cache header for complete results without process memory', async () => {
    process.env.TMDB_API_KEY = 'test-key'
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const target = String(input)
      if (target.includes('themoviedb')) return json({ title: 'Unlisted Movie', runtime: 100 })
      if (target.includes('sterkinekor')) return new Response('<div class="program-movie-card-container"><a href="/f/other/1">Other</a></div>')
      if (target.includes('movies=true')) return json([])
      throw new Error(target)
    }) as unknown as typeof fetch
    const handler = createCinemaShowtimesHandler(fetcher, () => now)
    const requestUrl = url.replace('7025', '7026')
    const first = response()
    await handler({ method: 'GET', url: requestUrl }, first.res)
    expect(first.headers['Cache-Control']).toBe('public, max-age=0, must-revalidate')
    expect(first.headers['Vercel-CDN-Cache-Control']).toBe('public, max-age=300')
    const requests = vi.mocked(fetcher).mock.calls.length
    await handler({ method: 'GET', url: requestUrl }, response().res)
    expect(vi.mocked(fetcher).mock.calls.length).toBeGreaterThan(requests)
  })

  it('shows working branches but marks malformed Cavendish Square sessions unavailable', async () => {
    process.env.TMDB_API_KEY = 'test-key'
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const target = String(input)
      if (target.includes('themoviedb')) return json({ title: 'Clayface', runtime: 108 })
      if (target.includes('sterkinekor')) return new Response('<div class="program-movie-card-container"><a href="/f/clayface/750">Clayface</a><div class="movieDetailsCard__info">1h 48m</div><div class="gr-showtimes__container"><div class="gr-showtimes__bordered-text">2D</div><a class="showtime_card"><span class="text-nowrap">6:45 PM</span></a></div></div>')
      if (target.includes('movies=true')) return json([{ id: '7120', title: 'Clayface', running_time: '108' }])
      if (target.includes('admin-ajax') && String(init?.body).includes('update_cine_session')) return json([{ '2026-11-01': 'Sun 01 Nov' }])
      if (target.includes('admin-ajax') && String(init?.body).includes('cinema_id=45')) return json([{ error: 'unavailable' }])
      if (target.includes('admin-ajax')) return json([{ ',**,2D': { '536471': ['Cinema 10', '19:30:00', true] } }])
      throw new Error(target)
    }) as unknown as typeof fetch
    const handler = createCinemaShowtimesHandler(fetcher, () => now)
    const result = response()
    await handler({ method: 'GET', url: url.replace('7025', '7027') }, result.res)
    const branches = (result.body as { results: { status: string; showtimes: { time: string; format: string }[]; bookingUrl: string }[] }).results
    expect(branches.map((branch) => branch.status)).toEqual(['playing', 'playing', 'unavailable'])
    expect(branches[0]?.bookingUrl).toBe('https://www.sterkinekor.com/f/clayface/750')
    expect(branches[1]?.showtimes).toEqual([{ time: '19:30', format: '2D' }])
    expect(branches[1]?.bookingUrl).toBe('https://numetro.co.za/movie/7120/')
    expect(result.headers['Cache-Control']).toBe('no-store')
  })
})
