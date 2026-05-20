import { aiSummarySchema } from '../src/types/ai'
import { getFirebaseAdminServices } from './firebaseAdmin'
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

type SummaryRequest = {
  mediaType?: string
  tmdbId?: number
  title?: string
  overview?: string
  releaseDate?: string
  genres?: string[]
  runtime?: number | null
  status?: string
}

const responseSchema = {
  type: 'object',
  properties: {
    takeaway: { type: 'string' },
    bestFor: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    skipIf: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    tone: { type: 'string' },
    pacing: { type: 'string' },
    spoilerFree: { type: 'boolean' },
  },
  required: ['takeaway', 'bestFor', 'skipIf', 'tone', 'pacing', 'spoilerFree'],
}

function getFirebaseDb() {
  return getFirebaseAdminServices()?.db ?? null
}

function normalizeRequest(body: SummaryRequest) {
  const mediaType = body.mediaType === 'tv' ? 'tv' : 'movie'
  const tmdbId = Number(body.tmdbId)
  const title = cleanString(body.title, 160)

  if (!Number.isInteger(tmdbId) || tmdbId <= 0 || !title) {
    return null
  }

  return {
    mediaType,
    tmdbId,
    title,
    overview: cleanString(body.overview, 1200),
    releaseDate: cleanString(body.releaseDate, 40),
    genres: cleanStringArray(body.genres, 8, 80),
    runtime: typeof body.runtime === 'number' ? body.runtime : null,
    status: cleanString(body.status, 80),
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const parsedBody = parseJsonRequestBody<SummaryRequest>(req.body)
  if (!parsedBody.ok) {
    res.status(parsedBody.status).json({ error: parsedBody.error })
    return
  }

  if (Array.isArray(parsedBody.data.genres) && parsedBody.data.genres.length > 24) {
    res.status(400).json({ error: 'Genre payload is too large.' })
    return
  }

  const input = normalizeRequest(parsedBody.data)
  if (!input) {
    res.status(400).json({ error: 'A valid TMDB title payload is required.' })
    return
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
  const db = getFirebaseDb()

  if (db) {
    try {
      const docRef = db.collection('ai_summaries').doc(`${input.mediaType}_${input.tmdbId}`)
      const doc = await docRef.get()

      if (doc.exists) {
        const data = doc.data()
        const cached = aiSummarySchema.safeParse(data?.summary)
        if (cached.success) {
          res.status(200).json(cached.data)
          return
        }
      }
    } catch (error) {
      console.error('Error fetching cached summary:', error)
    }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(501).json({ error: 'GEMINI_API_KEY is not configured on the server.' })
    return
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const geminiResponse = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text:
              'You write spoiler-free movie and TV decision guides. Do not reveal twists, endings, deaths, or late-story turns. Use only the provided metadata. Be concrete, concise, and helpful for deciding what to watch tonight.',
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: JSON.stringify({
                title: input.title,
                mediaType: input.mediaType,
                overview: input.overview,
                releaseDate: input.releaseDate,
                genres: input.genres,
                runtime: input.runtime,
                status: input.status,
                instruction:
                  'Return a decision helper: one short takeaway, best-for bullets, skip-if bullets, tone, pacing, and spoilerFree true.',
              }),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 512,
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
  })

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text()
    const publicError = getGeminiPublicError(errorText, 'Gemini rejected the summary request.')
    console.error('Gemini summary request failed', {
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

  const parsedOutput = parseGeminiJson(outputText, aiSummarySchema)
  if (!parsedOutput.ok) {
    res.status(parsedOutput.status).json({ error: parsedOutput.error })
    return
  }

  if (db) {
    try {
      await db.collection('ai_summaries').doc(`${input.mediaType}_${input.tmdbId}`).set({
        mediaType: input.mediaType,
        tmdbId: input.tmdbId,
        title: input.title,
        summary: parsedOutput.data,
        model,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error('Error caching summary:', error)
    }
  }

  res.status(200).json(parsedOutput.data)
}
