import { aiRecommendationPlanSchema } from '../src/types/ai'
import {
  cleanString,
  cleanStringArray,
  extractGeminiText,
  getGeminiPublicError,
  parseGeminiJson,
  parseJsonRequestBody,
  shortLogBody,
  type ApiRequest,
  type ApiResponse,
} from './serverUtils'

type RequestBody = {
  prompt?: string
  genres?: unknown
  watchlistTitles?: unknown
}

const responseSchema = {
  type: 'object',
  properties: {
    mediaType: { type: 'string', enum: ['movie', 'series', 'both'] },
    genreIds: { type: 'array', items: { type: 'integer' }, maxItems: 5 },
    minRating: { type: 'number', minimum: 0, maximum: 10 },
    maxRuntime: { type: 'integer', minimum: 60, maximum: 240, nullable: true },
    sortBy: {
      type: 'string',
      enum: ['popularity.desc', 'vote_average.desc', 'primary_release_date.desc'],
    },
    referenceTitle: { type: 'string', nullable: true },
    vibeTags: { type: 'array', items: { type: 'string' }, maxItems: 6 },
    reason: { type: 'string' },
  },
  required: ['mediaType', 'genreIds', 'minRating', 'maxRuntime', 'sortBy', 'referenceTitle', 'vibeTags', 'reason'],
}

function normalizeGenres(value: unknown) {
  if (!Array.isArray(value)) return []
  if (value.length > 80) return null

  return value.slice(0, 40).flatMap((genre) => {
    const id = Number((genre as { id?: unknown })?.id)
    const name = cleanString((genre as { name?: unknown })?.name, 80)
    return Number.isInteger(id) && id > 0 && name ? [{ id, name }] : []
  })
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const parsedBody = parseJsonRequestBody<RequestBody>(req.body)
  if (!parsedBody.ok) {
    res.status(parsedBody.status).json({ error: parsedBody.error })
    return
  }

  const prompt = cleanString(parsedBody.data.prompt, 500)
  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required.' })
    return
  }

  if (typeof parsedBody.data.prompt === 'string' && parsedBody.data.prompt.trim().length > 500) {
    res.status(400).json({ error: 'Prompt must be 500 characters or fewer.' })
    return
  }

  const genres = normalizeGenres(parsedBody.data.genres)
  if (!genres) {
    res.status(400).json({ error: 'Genre payload is too large.' })
    return
  }

  if (Array.isArray(parsedBody.data.watchlistTitles) && parsedBody.data.watchlistTitles.length > 60) {
    res.status(400).json({ error: 'Watchlist title payload is too large.' })
    return
  }

  const watchlistTitles = cleanStringArray(parsedBody.data.watchlistTitles, 30, 160)
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(501).json({ error: 'GEMINI_API_KEY is not configured on the server.' })
    return
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const geminiResponse = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text:
              'You convert natural-language movie and TV requests into a TMDB discovery strategy. Do not recommend exact titles from memory. Choose genre IDs only from the provided TMDB genre list. If the user asks for the same vibe as, like, similar to, or reminds me of a specific title, set referenceTitle to that exact title so TMDB can fetch similar titles. Otherwise set referenceTitle to null. Prefer current TMDB discovery over model knowledge. Return concise reasoning.',
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: JSON.stringify({
                request: prompt,
                tmdbGenres: genres,
                watchlistTitles,
                examples: ['same vibe as Top Gun', 'new sci-fi series with mystery', 'comfort movie for a rainy night'],
              }),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
  })

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text()
    const publicError = getGeminiPublicError(errorText, 'Gemini rejected the recommendation request.')
    console.error('Gemini recommendation request failed', {
      status: geminiResponse.status,
      body: shortLogBody(errorText),
    })
    res.status(geminiResponse.status).json({
      error: 'Gemini request failed.',
      ...publicError,
    })
    return
  }

  const json: unknown = await geminiResponse.json()
  const outputText = extractGeminiText(json)
  if (!outputText) {
    res.status(502).json({ error: 'Gemini returned no structured output.' })
    return
  }

  const parsedOutput = parseGeminiJson(outputText, aiRecommendationPlanSchema)
  if (!parsedOutput.ok) {
    res.status(parsedOutput.status).json({ error: parsedOutput.error })
    return
  }

  res.status(200).json(parsedOutput.data)
}
