import { createClient } from '@supabase/supabase-js'

type ApiRequest = {
  method?: string
  body?: unknown
}

type ApiResponse = {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

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

function parseBody(body: unknown): SummaryRequest {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as SummaryRequest
    } catch {
      return {}
    }
  }

  return typeof body === 'object' && body !== null ? (body as SummaryRequest) : {}
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
      detail: message.slice(0, 240) || 'Gemini rejected the summary request.',
    }
  } catch {
    return {
      code: 'gemini_error',
      detail: 'Gemini rejected the summary request.',
    }
  }
}

function getServerSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return null

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function normalizeRequest(body: SummaryRequest) {
  const mediaType = body.mediaType === 'tv' ? 'tv' : 'movie'
  const tmdbId = Number(body.tmdbId)
  const title = body.title?.trim().slice(0, 160) ?? ''

  if (!Number.isInteger(tmdbId) || tmdbId <= 0 || !title) {
    return null
  }

  return {
    mediaType,
    tmdbId,
    title,
    overview: body.overview?.trim().slice(0, 1200) ?? '',
    releaseDate: body.releaseDate?.trim().slice(0, 40) ?? '',
    genres: (body.genres ?? []).slice(0, 8),
    runtime: typeof body.runtime === 'number' ? body.runtime : null,
    status: body.status?.trim().slice(0, 80) ?? '',
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const input = normalizeRequest(parseBody(req.body))
  if (!input) {
    res.status(400).json({ error: 'A valid TMDB title payload is required.' })
    return
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
  const supabase = getServerSupabase()

  if (supabase) {
    const { data, error } = await supabase
      .from('ai_summaries')
      .select('summary')
      .eq('media_type', input.mediaType)
      .eq('tmdb_id', input.tmdbId)
      .maybeSingle()

    if (!error && data?.summary && typeof data.summary === 'object') {
      res.status(200).json(data.summary)
      return
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
    const publicError = getGeminiPublicError(errorText)
    console.error('Gemini summary request failed', {
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
    const summary = JSON.parse(outputText) as unknown

    if (supabase) {
      await supabase.from('ai_summaries').upsert(
        {
          media_type: input.mediaType,
          tmdb_id: input.tmdbId,
          title: input.title,
          summary,
          model,
        },
        { onConflict: 'media_type,tmdb_id' },
      )
    }

    res.status(200).json(summary)
  } catch {
    res.status(502).json({ error: 'Gemini returned invalid structured output.' })
  }
}
