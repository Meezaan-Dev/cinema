import { beforeEach, describe, expect, it, vi } from 'vitest'

import handler from './add-watchlist-item'
import { getFirebaseAdminServices } from './firebaseAdmin'
import type { ApiRequest, ApiResponse } from './serverUtils'

vi.mock('./firebaseAdmin', () => ({
  getFirebaseAdminServices: vi.fn(),
  isMissingFirestoreDatabaseError: vi.fn(() => false),
}))

function createResponse() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
  }

  const res: ApiResponse = {
    status(code) {
      response.statusCode = code
      return res
    },
    json(payload) {
      response.body = payload
    },
    setHeader(name, value) {
      response.headers[name] = value
    },
  }

  return { response, res }
}

async function run(req: ApiRequest) {
  const { response, res } = createResponse()
  await handler(req, res)
  return response
}

describe('add-watchlist-item API route', () => {
  beforeEach(() => {
    vi.mocked(getFirebaseAdminServices).mockReset()
  })

  it('rejects invalid item payloads before initializing Firebase Admin', async () => {
    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { watchlistId: 'list-1', movie: { title: 'Missing TMDB id' } },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toMatchObject({ error: 'A valid watchlist and title payload is required.' })
    expect(getFirebaseAdminServices).not.toHaveBeenCalled()
  })

  it('rejects requests without a bearer token', async () => {
    const response = await run({
      method: 'POST',
      body: {
        watchlistId: 'list-1',
        movie: { tmdbId: 603, mediaType: 'movie', title: 'The Matrix' },
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toMatchObject({ error: 'Sign in with Google to use shared watchlists.' })
    expect(getFirebaseAdminServices).not.toHaveBeenCalled()
  })

  it('writes the deterministic item and user state through Firebase Admin', async () => {
    const set = vi.fn()
    const commit = vi.fn()

    vi.mocked(getFirebaseAdminServices).mockReturnValue({
      app: {} as never,
      auth: {
        verifyIdToken: vi.fn().mockResolvedValue({ uid: 'user-1' }),
      } as never,
      db: {
        batch: vi.fn().mockReturnValue({ set, commit }),
        collection: vi.fn((name: string) => ({
          doc: vi.fn((id: string) => {
            const ref = { collection: name, id }
            return {
              ...ref,
              get: vi.fn().mockResolvedValue(
                name === 'watchlist_members'
                  ? { exists: true, data: () => ({ leftAt: null }) }
                  : { exists: false, data: () => undefined },
              ),
            }
          }),
        })),
      } as never,
    })

    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: {
        watchlistId: 'list-1',
        movie: { tmdbId: 603, mediaType: 'movie', title: 'The Matrix' },
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({
      id: 'list-1_movie_603',
      watchlistId: 'list-1',
      tmdbId: 603,
      title: 'The Matrix',
      state: { userId: 'user-1', status: 'to_watch' },
    })
    expect(set).toHaveBeenCalledTimes(3)
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'watchlist_items', id: 'list-1_movie_603' }),
      expect.objectContaining({ id: 'list-1_movie_603', addedBy: 'user-1' }),
      { merge: true },
    )
    expect(commit).toHaveBeenCalledOnce()
  })
})
