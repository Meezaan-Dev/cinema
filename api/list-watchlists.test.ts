import { Timestamp } from 'firebase-admin/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import handler from './list-watchlists.js'
import { getFirebaseAdminServices } from './firebaseAdmin.js'
import type { ApiRequest, ApiResponse } from './serverUtils.js'

vi.mock('./firebaseAdmin.js', () => ({
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

describe('list-watchlists API route', () => {
  beforeEach(() => {
    vi.mocked(getFirebaseAdminServices).mockReset()
  })

  it('rejects requests without a bearer token before initializing Firebase Admin', async () => {
    const response = await run({ method: 'GET' })

    expect(response.statusCode).toBe(401)
    expect(response.body).toMatchObject({ error: 'Sign in with Google to use shared watchlists.' })
    expect(getFirebaseAdminServices).not.toHaveBeenCalled()
  })

  it('returns watchlists when Firestore timestamps are mixed or missing', async () => {
    const now = Timestamp.now()
    const membershipQuery = {
      where: vi.fn(),
      get: vi.fn().mockResolvedValue({
        docs: [
          {
            data: () => ({
              watchlistId: 'list-1',
              role: 'owner',
            }),
          },
          {
            data: () => ({
              watchlistId: 'list-2',
              role: 'editor',
            }),
          },
        ],
      }),
    }
    membershipQuery.where.mockReturnValue(membershipQuery)

    const itemsQuery = {
      where: vi.fn(),
      get: vi.fn().mockResolvedValue({ size: 2 }),
    }
    itemsQuery.where.mockReturnValue(itemsQuery)

    vi.mocked(getFirebaseAdminServices).mockReturnValue({
      app: {} as never,
      auth: {
        verifyIdToken: vi.fn().mockResolvedValue({ uid: 'user-1' }),
      } as never,
      db: {
        collection: vi.fn((name: string) => {
          if (name === 'watchlist_members') return membershipQuery
          if (name === 'watchlist_items') return itemsQuery

          return {
            doc: vi.fn((id: string) => ({
              get: vi.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  id,
                  name: id === 'list-1' ? 'Movie night' : 'Older list',
                  description: null,
                  ownerId: 'user-1',
                  inviteToken: `${id}-invite`,
                  createdAt: id === 'list-1' ? now : '2024-01-01T00:00:00.000Z',
                  updatedAt: id === 'list-1' ? now : undefined,
                }),
              }),
            })),
          }
        }),
      } as never,
    })

    const response = await run({
      method: 'GET',
      headers: { authorization: 'Bearer token' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({
      watchlists: [
        {
          id: 'list-1',
          name: 'Movie night',
          role: 'owner',
          itemCount: 2,
        },
        {
          id: 'list-2',
          name: 'Older list',
          role: 'editor',
          updatedAt: '1970-01-01T00:00:00.000Z',
        },
      ],
    })
  })
})
