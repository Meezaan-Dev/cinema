type ApiRequest = {
  method?: string
  body?: unknown
}

type ApiResponse = {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

type RequestBody = {
  prompt?: string
  genres?: Array<{ id: number; name: string }>
  watchlistTitles?: string[]
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

function parseBody(body: unknown): RequestBody {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as RequestBody
    } catch {
      return {}
    }
  }

  return typeof body === 'object' && body !== null ? (body as RequestBody) : {}
}

function extractGeminiText(response: unknown) {
  const candidates = (response as { candidates?: unknown })?.candidates
  if (!Array.isArray(candidates)) return null

  for (const candidate of candidates) {
    const parts = (candidate as { content?: { parts?: unknown } })?.content?.parts
    if (!Array.isArray(parts)) continue

    for (const part of parts) {
      const text = (part as { text?: unknown })?.text
      if (typeof text === 'string') return text
    }
  }

  return null
}

function getGeminiPublicError(errorText: string) {
  try {
    const parsed = JSON.parse(errorText) as {
      error?: { message?: unknown; status?: unknown; code?: unknown }
    }
    const message = typeof parsed.error?.message === 'string' ? parsed.error.message : ''
    const status = typeof parsed.error?.status === 'string' ? parsed.error.status : ''
    const code = typeof parsed.error?.code === 'number' ? String(parsed.error.code) : ''

    if (status.includes('RESOURCE_EXHAUSTED') || message.toLowerCase().includes('quota')) {
      return {
        code: status || code || 'resource_exhausted',
        detail: 'Gemini says this key has hit a quota or free-tier limit. Wait for the quota window to reset or check Google AI Studio limits.',
      }
    }

    if (status.includes('PERMISSION_DENIED') || status.includes('UNAUTHENTICATED')) {
      return {
        code: status || code || 'gemini_auth_error',
        detail: 'Gemini rejected the API key. Check that GEMINI_API_KEY is valid and enabled for the Gemini API.',
      }
    }

    return {
      code: status || code || 'gemini_error',
      detail: message.slice(0, 240) || 'Gemini rejected the recommendation request.',
    }
  } catch {
    return {
      code: 'gemini_error',
      detail: 'Gemini rejected the recommendation request.',
    }
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(501).json({ error: 'GEMINI_API_KEY is not configured on the server.' })
    return
  }

  const body = parseBody(req.body)
  const prompt = body.prompt?.trim().slice(0, 500)
  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required.' })
    return
  }

  const genres = (body.genres ?? []).slice(0, 40)
  const watchlistTitles = (body.watchlistTitles ?? []).slice(0, 30)
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
    const publicError = getGeminiPublicError(errorText)
    console.error('Gemini recommendation request failed', {
      status: geminiResponse.status,
      body: errorText.slice(0, 1000),
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

  try {
    res.status(200).json(JSON.parse(outputText))
  } catch {
    res.status(502).json({ error: 'Gemini returned invalid structured output.' })
  }
}
