import { describe, expect, it, vi } from 'vitest'

import { createViewingsHandler } from './viewings.ts'
import type { RewindViewing } from './rewindDomain.ts'

function createResponse() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    headers: new Map<string, string>(),
    status: vi.fn((code: number) => {
      response.statusCode = code
      return response
    }),
    json: vi.fn((body: unknown) => {
      response.body = body
    }),
    setHeader: vi.fn((name: string, value: string) => {
      response.headers.set(name, value)
    }),
  }

  return response
}

describe('viewings API handler', () => {
  it('returns viewing history from the repository', async () => {
    const viewing: RewindViewing = {
      id: 'vw_123',
      tmdbId: 872585,
      watchedAt: '2023-07-22T00:00:00.000Z',
      location: 'unknown',
      rating: 4.5,
      rewatch: false,
      review: null,
      tags: [],
      source: 'letterboxd',
      sourceUri: 'https://boxd.it/wUow',
      sourceKey: 'letterboxd:https://boxd.it/wUow',
      importTitle: 'Oppenheimer',
      importYear: 2023,
      createdAt: '2026-09-18T00:00:00.000Z',
      updatedAt: '2026-09-18T00:00:00.000Z',
    }
    const handler = createViewingsHandler({
      listViewings: vi.fn(async () => [viewing]),
      upsertViewing: vi.fn(),
    })
    const response = createResponse()

    await handler({ method: 'GET' }, response)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({ data: { viewings: [viewing] } })
  })

  it('rejects non-GET requests', async () => {
    const handler = createViewingsHandler({
      listViewings: vi.fn(async () => []),
      upsertViewing: vi.fn(),
    })
    const response = createResponse()

    await handler({ method: 'POST' }, response)

    expect(response.statusCode).toBe(405)
  })
})
