import { AppError } from '@/lib/errors'
import { sanitizeQuery } from '@/lib/filterValidation'
import { aiRecommendationPlanSchema, type AiRecommendationPlan } from '@/types/ai'
import type { TmdbGenre } from '@/types/tmdb'

export async function getAiRecommendationPlan(input: {
  prompt: string
  genres: TmdbGenre[]
  watchlistTitles: string[]
}): Promise<AiRecommendationPlan> {
  const prompt = sanitizeQuery(input.prompt)
  if (!prompt) {
    throw new AppError('invalid-data', 'Describe what you want to watch first.')
  }

  let response: Response
  try {
    response = await fetch('/api/ai-recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        genres: input.genres,
        watchlistTitles: input.watchlistTitles.slice(0, 30),
      }),
    })
  } catch {
    throw new AppError('network', 'The AI recommendation endpoint could not be reached.')
  }

  if (!response.ok) {
    let detail = 'The AI recommendation endpoint returned an error.'
    try {
      const errorBody = (await response.json()) as { detail?: unknown }
      if (typeof errorBody.detail === 'string') {
        detail = errorBody.detail
      }
    } catch {
      // Keep the generic message if the endpoint does not return JSON.
    }

    throw new AppError(
      response.status === 429
        ? 'rate-limit'
        : response.status === 404
          ? 'not-found'
          : response.status === 401
            ? 'auth'
            : 'http',
      detail,
      response.status,
    )
  }

  const json: unknown = await response.json()
  const parsed = aiRecommendationPlanSchema.safeParse(json)
  if (!parsed.success) {
    throw new AppError('invalid-data', 'The AI recommendation endpoint returned unexpected data.')
  }

  return parsed.data
}
