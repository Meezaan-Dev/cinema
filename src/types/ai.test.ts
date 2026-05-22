import { describe, expect, it } from 'vitest'

import { parseGeminiJson, parseJsonRequestBody } from '../../api/serverUtils'
import { aiSummarySchema } from '@/types/ai'

describe('ai schemas', () => {
  it('accepts valid summary payloads', () => {
    expect(
      aiSummarySchema.parse({
        takeaway: 'A tense, compact watch.',
        bestFor: ['Thriller night'],
        skipIf: ['You want comedy'],
        tone: 'Tense',
        pacing: 'Fast',
        spoilerFree: true,
      }),
    ).toMatchObject({ spoilerFree: true })
  })

  it('rejects invalid JSON and normalizes malformed Gemini fields', () => {
    expect(parseGeminiJson('{bad json', aiSummarySchema)).toMatchObject({ ok: false, status: 502 })
    expect(parseGeminiJson('{"takeaway":false}', aiSummarySchema)).toMatchObject({
      ok: true,
      data: {
        takeaway: 'A spoiler-free decision guide is not available yet.',
        bestFor: [],
        spoilerFree: true,
      },
    })
  })

  it('accepts only JSON object request bodies', () => {
    expect(parseJsonRequestBody('{"prompt":"movie night"}')).toMatchObject({
      ok: true,
      data: { prompt: 'movie night' },
    })
    expect(parseJsonRequestBody('[]')).toMatchObject({
      ok: false,
      status: 400,
      error: 'Request body must be a JSON object.',
    })
    expect(parseJsonRequestBody([])).toMatchObject({
      ok: false,
      status: 400,
      error: 'Request body must be a JSON object.',
    })
  })
})
