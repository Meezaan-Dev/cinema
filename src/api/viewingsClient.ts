import { AppError, type AppErrorCode } from '@/lib/errors'
import type { RewindViewing } from '@/types/viewing'

export const viewingQueryKeys = {
  history: ['viewings', 'history'] as const,
}

export class ViewingsError extends AppError {
  constructor(code: AppErrorCode, message: string, status?: number) {
    super(code, message, status)
    this.name = 'ViewingsError'
  }
}

function isProxyError(
  body: unknown,
): body is { error: { message: string; code: string; status: number } } {
  return typeof body === 'object' && body !== null && 'error' in body
}

function isViewingsResponse(body: unknown): body is { data: { viewings: RewindViewing[] } } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'data' in body &&
    typeof (body as { data?: unknown }).data === 'object' &&
    (body as { data: { viewings?: unknown } }).data !== null &&
    Array.isArray((body as { data: { viewings?: unknown } }).data.viewings)
  )
}

export async function getViewingHistory() {
  let response: Response
  try {
    response = await fetch('/api/viewings')
  } catch {
    throw new ViewingsError('network', 'The app could not reach the viewing-history API.')
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ViewingsError('invalid-json', 'The server returned an invalid viewing-history response.')
  }

  if (isProxyError(body)) {
    const { message, code, status } = body.error
    throw new ViewingsError(code as AppErrorCode, message, status)
  }

  if (!isViewingsResponse(body)) {
    throw new ViewingsError('invalid-data', 'The server returned an unexpected viewing-history shape.')
  }

  return body.data.viewings
}
