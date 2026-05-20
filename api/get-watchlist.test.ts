import { Timestamp } from 'firebase-admin/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import handler from './get-watchlist'
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

describe('get-watchlist API route', () => {
  beforeEach(() => {
    vi.mocked(getFirebaseAdminServices).mockReset()
  })

  it('rejects missing watchlist ids before initializing Firebase Admin', async () => {
    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: {},
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toMatchObject({ error: 'Choose a watchlist first.' })
    expect(getFirebaseAdminServices).not.toHaveBeenCalled()
  })

  it('returns watchlist detail for active members', async () => {
    const now = Timestamp.now()

    vi.mocked(getFirebaseAdminServices).mockReturnValue({
      app: {} as never,
      auth: {
        verifyIdToken: vi.fn().mockResolvedValue({ uid: 'user-1' }),
      } as never,
      db: {
        collection: vi.fn((name: string) => {
          if (name === 'watchlist_members') {
            return {
              doc: vi.fn(() => ({
                get: vi.fn().mockResolvedValue({
                  exists: true,
                  data: () => ({ role: 'owner', leftAt: null }),
                }),
              })),
            }
          }

          if (name === 'watchlists') {
            return {
              doc: vi.fn(() => ({
                get: vi.fn().mockResolvedValue({
                  exists: true,
                  data: () => ({
                    id: 'list-1',
                    name: 'Movie night',
                    description: null,
                    ownerId: 'user-1',
                    inviteToken: 'invite',
                    createdAt: now,
                    updatedAt: now,
                  }),
                }),
              })),
            }
          }

          if (name === 'watchlist_items') {
            return {
              where: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue({
                  docs: [
                    {
                      data: () => ({
                        id: 'list-1_movie_603',
                        watchlistId: 'list-1',
                        tmdbId: 603,
                        mediaType: 'movie',
                        title: 'The Matrix',
                        overview: '',
                        posterPath: null,
                        backdropPath: null,
                        releaseDate: '',
                        voteAverage: 8.2,
                        genres: ['Action'],
                        addedBy: 'user-1',
                        createdAt: now,
                        updatedAt: now,
                      }),
                    },
                  ],
                }),
              }),
            }
          }

          return {
            where: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({
                docs: [
                  {
                    data: () => ({
                      itemId: 'list-1_movie_603',
                      userId: 'user-1',
                      status: 'to_watch',
                      isFavourite: false,
                      personalRating: null,
                      notes: null,
                      hiddenAt: null,
                      updatedAt: now,
                    }),
                  },
                ],
              }),
            }),
          }
        }),
      } as never,
    })

    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { watchlistId: 'list-1' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({
      id: 'list-1',
      role: 'owner',
      itemCount: 1,
      items: [
        {
          id: 'list-1_movie_603',
          title: 'The Matrix',
          state: { userId: 'user-1', status: 'to_watch' },
        },
      ],
    })
  })
})
