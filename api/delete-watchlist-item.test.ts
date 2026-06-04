import { beforeEach, describe, expect, it, vi } from 'vitest'

import handler from './delete-watchlist-item.js'
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

function mockFirebase({
  itemExists = true,
  memberExists = true,
  role = 'editor',
  leftAt = null,
}: {
  itemExists?: boolean
  memberExists?: boolean
  role?: 'owner' | 'editor'
  leftAt?: string | null
} = {}) {
  const deleteRef = vi.fn()
  const commit = vi.fn()
  const set = vi.fn()
  const stateRefs = [
    { collection: 'watchlist_item_states', id: 'item-1_user-1' },
    { collection: 'watchlist_item_states', id: 'item-1_user-2' },
  ]

  vi.mocked(getFirebaseAdminServices).mockReturnValue({
    app: {} as never,
    auth: {
      verifyIdToken: vi.fn().mockResolvedValue({ uid: 'user-1' }),
    } as never,
    db: {
      batch: vi.fn().mockReturnValue({ delete: deleteRef, commit }),
      collection: vi.fn((name: string) => {
        if (name === 'watchlist_items') {
          return {
            doc: vi.fn((id: string) => ({
              collection: name,
              id,
              get: vi.fn().mockResolvedValue({
                exists: itemExists,
                data: () => (itemExists ? { watchlistId: 'list-1' } : undefined),
              }),
            })),
          }
        }

        if (name === 'watchlist_members') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({
                exists: memberExists,
                data: () => (memberExists ? { role, leftAt } : undefined),
              }),
            })),
          }
        }

        if (name === 'watchlist_item_states') {
          return {
            where: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({
                docs: stateRefs.map((ref) => ({ ref })),
              }),
            }),
          }
        }

        return {
          doc: vi.fn(() => ({ set })),
        }
      }),
    } as never,
  })

  return { commit, deleteRef, set, stateRefs }
}

describe('delete-watchlist-item API route', () => {
  beforeEach(() => {
    vi.mocked(getFirebaseAdminServices).mockReset()
  })

  it('rejects missing item ids before initializing Firebase Admin', async () => {
    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { itemId: '   ' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toMatchObject({ error: 'Choose a title first.' })
    expect(getFirebaseAdminServices).not.toHaveBeenCalled()
  })

  it('rejects requests without a bearer token', async () => {
    const response = await run({
      method: 'POST',
      body: { itemId: 'item-1' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toMatchObject({ error: 'Sign in with Google to use shared watchlists.' })
    expect(getFirebaseAdminServices).not.toHaveBeenCalled()
  })

  it('returns not found when the item does not exist', async () => {
    mockFirebase({ itemExists: false })

    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { itemId: 'item-1' },
    })

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({ error: 'This title is no longer in the watchlist.' })
  })

  it('rejects users who are not active members', async () => {
    const { commit, deleteRef } = mockFirebase({ memberExists: false })

    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { itemId: 'item-1' },
    })

    expect(response.statusCode).toBe(403)
    expect(response.body).toMatchObject({ error: 'You are not a member of this watchlist.' })
    expect(deleteRef).not.toHaveBeenCalled()
    expect(commit).not.toHaveBeenCalled()
  })

  it('deletes the item, related states, and updates the parent watchlist for an active editor', async () => {
    const { commit, deleteRef, set, stateRefs } = mockFirebase({ role: 'editor' })

    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { itemId: 'item-1' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({ ok: true })
    expect(deleteRef).toHaveBeenCalledWith(expect.objectContaining({ collection: 'watchlist_items', id: 'item-1' }))
    for (const stateRef of stateRefs) {
      expect(deleteRef).toHaveBeenCalledWith(stateRef)
    }
    expect(commit).toHaveBeenCalledOnce()
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ updatedAt: expect.anything() }), { merge: true })
  })

  it('deletes the item, related states, and updates the parent watchlist for an owner', async () => {
    const { commit, deleteRef, set } = mockFirebase({ role: 'owner' })

    const response = await run({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { itemId: 'item-1' },
    })

    expect(response.statusCode).toBe(200)
    expect(deleteRef).toHaveBeenCalledTimes(3)
    expect(commit).toHaveBeenCalledOnce()
    expect(set).toHaveBeenCalledOnce()
  })
})
