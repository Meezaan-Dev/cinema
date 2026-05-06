import type { z } from 'zod'

export type ApiRequest = {
  method?: string
  body?: unknown
}

export type ApiResponse = {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

export type RequestParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string }

export const serverLimits = {
  requestBodyChars: 12_000,
  geminiErrorLogChars: 500,
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function cleanString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : ''
}

export function cleanStringArray(value: unknown, maxItems: number, maxItemLength: number) {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const items: string[] = []

  for (const item of value.slice(0, maxItems)) {
    const clean = cleanString(item, maxItemLength)
    if (!clean || seen.has(clean)) continue
    seen.add(clean)
    items.push(clean)
  }

  return items
}

export function parseJsonRequestBody<T = Record<string, unknown>>(
  body: unknown,
  maxChars = serverLimits.requestBodyChars,
): RequestParseResult<T> {
  if (body === undefined || body === null) return { ok: true, data: {} as T }

  if (typeof body === 'string') {
    if (body.length > maxChars) {
      return { ok: false, status: 413, error: 'Request payload is too large.' }
    }

    try {
      const parsed = JSON.parse(body) as unknown
      if (!isJsonObject(parsed)) {
        return { ok: false, status: 400, error: 'Request body must be a JSON object.' }
      }

      return { ok: true, data: parsed as T }
    } catch {
      return { ok: false, status: 400, error: 'Request body must be valid JSON.' }
    }
  }

  if (isJsonObject(body)) {
    try {
      if (JSON.stringify(body).length > maxChars) {
        return { ok: false, status: 413, error: 'Request payload is too large.' }
      }
    } catch {
      return { ok: false, status: 400, error: 'Request body must be serializable JSON.' }
    }

    return { ok: true, data: body as T }
  }

  return { ok: false, status: 400, error: 'Request body must be a JSON object.' }
}

export function extractGeminiText(response: unknown) {
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

export function parseGeminiJson<T>(text: string, schema: z.ZodType<T>): RequestParseResult<T> {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, status: 502, error: 'Gemini returned invalid structured output.' }
  }

  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return { ok: false, status: 502, error: 'Gemini returned unexpected structured output.' }
  }

  return { ok: true, data: parsed.data }
}

export function getGeminiPublicError(errorText: string, fallback: string) {
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
      detail: message.slice(0, 240) || fallback,
    }
  } catch {
    return {
      code: 'gemini_error',
      detail: fallback,
    }
  }
}

export function shortLogBody(value: string) {
  return value.slice(0, serverLimits.geminiErrorLogChars)
}
