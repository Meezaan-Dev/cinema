import { z } from 'zod'

import { AppError, type AppErrorCode } from '@/lib/errors'

const defaultBaseUrl = 'https://api.themoviedb.org/3'

export class TmdbError extends AppError {
  constructor(code: AppErrorCode, message: string, status?: number) {
    super(code, message, status)
    this.name = 'TmdbError'
  }
}

export async function tmdbRequest<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {},
  schema: z.ZodType<T>,
): Promise<T> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  const baseUrl = import.meta.env.VITE_TMDB_BASE_URL || defaultBaseUrl

  if (!apiKey) {
    throw new TmdbError('missing-api-key', 'Add VITE_TMDB_API_KEY to your .env file to connect TMDB.')
  }

  const url = new URL(`${baseUrl}${endpoint}`)
  url.searchParams.set('api_key', apiKey)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new TmdbError('network', 'The app could not reach TMDB.')
  }

  if (!response.ok) {
    const code =
      response.status === 401 || response.status === 403
        ? 'auth'
        : response.status === 404
          ? 'not-found'
          : response.status === 429
            ? 'rate-limit'
            : 'http'
    throw new TmdbError(code, `TMDB request failed with status ${response.status}.`, response.status)
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw new TmdbError('invalid-json', 'TMDB returned invalid JSON.')
  }

  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    console.warn('TMDB response validation failed', {
      endpoint,
      issues: parsed.error.issues,
    })
    throw new TmdbError('invalid-data', 'TMDB returned data in an unexpected format.')
  }

  return parsed.data
}
