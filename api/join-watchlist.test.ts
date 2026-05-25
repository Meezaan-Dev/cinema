import { beforeEach, describe, expect, it, vi } from 'vitest'

import handler from './join-watchlist.js'
import { getFirebaseAdminServices } from './firebaseAdmin.js'
import type { ApiRequest, ApiResponse } from './serverUtils.js'

vi.mock('./firebaseAdmin.js', () => ({
  getFirebaseAdminServices: vi.fn(),
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

describe('join-watchlist API route', () => {
  beforeEach(() => {
    vi.mocked(getFirebaseAdminServices).mockReset()
  })

  it('rejects requests without a bearer token before initializing Firebase Admin', async () => {
    const response = await run({
      method: 'POST',
      body: { inviteToken: 'abc123' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toMatchObject({ error: 'Sign in before joining this watchlist.' })
    expect(getFirebaseAdminServices).not.toHaveBeenCalled()
  })

  it('rejects missing invite tokens', async () => {
    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: {},
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toMatchObject({ error: 'A valid invite token is required.' })
  })

  it('creates editor membership through Firebase Admin and returns the watchlist id', async () => {
    const set = vi.fn()
    vi.mocked(getFirebaseAdminServices).mockReturnValue({
      app: {} as never,
      auth: {
        verifyIdToken: vi.fn().mockResolvedValue({ uid: 'user-1' }),
      } as never,
      db: {
        collection: vi.fn((name: string) => {
          if (name === 'watchlists') {
            return {
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  get: vi.fn().mockResolvedValue({
                    empty: false,
                    docs: [{ id: 'list-1' }],
                  }),
                }),
              }),
            }
          }

          return {
            doc: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ exists: false }),
              set,
            }),
          }
        }),
      } as never,
    })

    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { inviteToken: 'abc123' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({ watchlistId: 'list-1' })
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        watchlistId: 'list-1',
        userId: 'user-1',
        role: 'editor',
        leftAt: null,
      }),
      { merge: true },
    )
  })
})
