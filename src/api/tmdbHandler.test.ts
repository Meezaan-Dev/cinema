import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import tmdbHandler from '../../api/tmdb.ts'
import type { ApiRequest } from '../../api/serverUtils.ts'

function createResponse() {
  const headers = new Map<string, string>()
  let statusCode = 200
  let body: unknown

  const response = {
    status(code: number) {
      statusCode = code
      return response
    },
    json(payload: unknown) {
      body = payload
    },
    setHeader(name: string, value: string) {
      headers.set(name, value)
    },
  }

  return {
    response,
    result() {
      return { body, headers, statusCode }
    },
  }
}

async function invoke(req: ApiRequest) {
  const { response, result } = createResponse()
  await tmdbHandler(req, response)
  return result()
}

describe('tmdbHandler', () => {
  beforeEach(() => {
    process.env.TMDB_API_KEY = 'test-key'
    process.env.TMDB_BASE_URL = 'https://tmdb.test/3'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.TMDB_API_KEY
    delete process.env.TMDB_BASE_URL
  })

  it('serves valid GET requests with Vercel cache headers', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ genres: [] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await invoke({
      method: 'GET',
      url: '/api/tmdb?endpoint=%2Fgenre%2Fmovie%2Flist',
      headers: { 'user-agent': 'Mozilla/5.0' },
    })

    expect(result.statusCode).toBe(200)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0][0])).toContain('https://tmdb.test/3/genre/movie/list?')
    expect(result.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate')
    expect(result.headers.get('Vercel-CDN-Cache-Control')).toBe('public, max-age=86400, stale-while-revalidate=604800')
  })

  it('blocks unwanted crawlers before calling TMDB', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await invoke({
      method: 'GET',
      url: '/api/tmdb?endpoint=%2Fgenre%2Fmovie%2Flist',
      headers: { 'user-agent': 'meta-externalagent/1.1' },
    })

    expect(result.statusCode).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.body).toEqual({
      error: { message: 'Crawler is not allowed.', code: 'blocked-crawler', status: 403 },
    })
  })

  it('rejects POST requests before calling TMDB', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await invoke({
      method: 'POST',
      url: '/api/tmdb?endpoint=%2Fgenre%2Fmovie%2Flist',
      headers: { 'user-agent': 'Mozilla/5.0' },
    })

    expect(result.statusCode).toBe(405)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
