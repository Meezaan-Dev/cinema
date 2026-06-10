import { AppError } from '@/lib/errors'
import { sanitizeAiSummaryRequest } from '@/lib/sanitize'
import { aiSummarySchema, type AiSummary, type AiSummaryRequest } from '@/types/ai'

export const aiSummaryKeys = {
  summary: (mediaType: string, tmdbId: string | number) => ['ai-summary', mediaType, tmdbId] as const,
}

export async function getAiSummary(input: AiSummaryRequest): Promise<AiSummary> {
  const payload = sanitizeAiSummaryRequest(input)
  if (!payload.tmdbId || !payload.title) {
    throw new AppError('invalid-data', 'A valid title is required for Usher.')
  }

  let response: Response
  try {
    response = await fetch('/api/ai-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new AppError('network', 'The AI summary endpoint could not be reached.')
  }

  if (!response.ok) {
    let detail = 'The AI summary endpoint returned an error.'
    try {
      const errorBody = (await response.json()) as { detail?: unknown; error?: unknown }
      if (typeof errorBody.detail === 'string') detail = errorBody.detail
      if (typeof errorBody.error === 'string') detail = errorBody.error
    } catch {
      // Keep generic detail.
    }

    throw new AppError(
      response.status === 429
        ? 'rate-limit'
        : response.status === 401
          ? 'auth'
          : response.status === 404
            ? 'not-found'
            : 'http',
      detail,
      response.status,
    )
  }

  const json: unknown = await response.json()
  const parsed = aiSummarySchema.safeParse(json)
  if (!parsed.success) {
    throw new AppError('invalid-data', 'The AI summary endpoint returned unexpected data.')
  }

  return parsed.data
}
