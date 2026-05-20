import { beforeEach, describe, expect, it, vi } from 'vitest'

import handler from './create-watchlist'
import { getFirebaseAdminServices } from './firebaseAdmin'
import type { ApiRequest, ApiResponse } from './serverUtils'

vi.mock('./firebaseAdmin', () => ({
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

describe('create-watchlist API route', () => {
  beforeEach(() => {
    vi.mocked(getFirebaseAdminServices).mockReset()
  })

  it('rejects blank watchlist names before initializing Firebase Admin', async () => {
    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { name: '   ' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toMatchObject({ error: 'Give this watchlist a name first.' })
    expect(getFirebaseAdminServices).not.toHaveBeenCalled()
  })

  it('rejects requests without a bearer token', async () => {
    const response = await run({
      method: 'POST',
      body: { name: 'Movie night' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toMatchObject({ error: 'Sign in with Google to use shared watchlists.' })
    expect(getFirebaseAdminServices).not.toHaveBeenCalled()
  })

  it('creates a watchlist and owner membership through Firebase Admin', async () => {
    const set = vi.fn()
    const commit = vi.fn()
    vi.mocked(getFirebaseAdminServices).mockReturnValue({
      app: {} as never,
      auth: {
        verifyIdToken: vi.fn().mockResolvedValue({ uid: 'user-1' }),
      } as never,
      db: {
        batch: vi.fn().mockReturnValue({ set, commit }),
        collection: vi.fn(() => ({
          doc: vi.fn((id: string) => ({ id })),
        })),
      } as never,
    })

    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { name: 'Movie night' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({
      name: 'Movie night',
      ownerId: 'user-1',
      role: 'owner',
      itemCount: 0,
    })
    expect(set).toHaveBeenCalledTimes(2)
    expect(commit).toHaveBeenCalledOnce()
  })
})
