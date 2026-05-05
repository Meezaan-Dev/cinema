export type AppErrorCode =
  | 'missing-api-key'
  | 'network'
  | 'http'
  | 'rate-limit'
  | 'not-found'
  | 'auth'
  | 'invalid-json'
  | 'invalid-data'
  | 'configuration'
  | 'unknown'

export class AppError extends Error {
  code: AppErrorCode
  status?: number

  constructor(code: AppErrorCode, message: string, status?: number) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
  }
}

export function getErrorCopy(error: unknown) {
  if (error instanceof AppError) {
    if (error.code === 'missing-api-key') {
      return {
        title: 'TMDB key required',
        message: 'Add VITE_TMDB_API_KEY to your .env file, then restart the dev server.',
      }
    }

    if (error.code === 'auth') {
      return {
        title: 'TMDB rejected the key',
        message: 'Check that your TMDB v3 API key is correct and active.',
      }
    }

    if (error.code === 'not-found') {
      return {
        title: 'Nothing found here',
        message: 'TMDB could not find this resource. It may have moved or been removed.',
      }
    }

    if (error.code === 'network') {
      return {
        title: 'Network problem',
        message: 'The app could not reach TMDB. Check your connection and try again.',
      }
    }

    if (error.code === 'http') {
      return {
        title: 'TMDB is unavailable',
        message: 'TMDB returned an error. Wait a moment, then try again.',
      }
    }

    if (error.code === 'rate-limit') {
      return {
        title: 'Request limit reached',
        message:
          error.message ||
          'The service returned a rate or quota error. Wait a moment, then try again.',
      }
    }

    if (error.code === 'invalid-json' || error.code === 'invalid-data') {
      return {
        title: 'Data unavailable',
        message: 'TMDB returned data in an unexpected format. Try again in a moment.',
      }
    }

    if (error.code === 'configuration') {
      return {
        title: 'Configuration needed',
        message: error.message,
      }
    }
  }

  return {
    title: 'Something went wrong',
    message: 'The app hit an unexpected problem. Try again.',
  }
}
