export type ApiRequest = {
  method?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
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
