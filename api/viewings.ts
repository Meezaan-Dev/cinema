import type { ApiRequest, ApiResponse } from './serverUtils.js'
import { createViewingRepository, type ViewingRepository } from './viewingRepository.js'

type ViewingsErrorResponse = {
  error: { message: string; code: string; status: number }
}

type ViewingsSuccessResponse = {
  data: {
    viewings: Awaited<ReturnType<ViewingRepository['listViewings']>>
  }
}

function errorResponse(message: string, code: string, status: number): ViewingsErrorResponse {
  return { error: { message, code, status } }
}

export function createViewingsHandler(repository: ViewingRepository) {
  return async function handler(req: ApiRequest, res: ApiResponse) {
    res.setHeader('Cache-Control', 'no-store')

    if (req.method !== 'GET') {
      res.status(405).json(errorResponse('Method not allowed', 'method', 405))
      return
    }

    try {
      const viewings = await repository.listViewings()
      const response: ViewingsSuccessResponse = { data: { viewings } }
      res.status(200).json(response)
    } catch (error) {
      console.error('Rewind viewings API failed', { error: String(error) })
      res.status(500).json(errorResponse('Viewing history is not available right now.', 'server', 500))
    }
  }
}

export default createViewingsHandler(createViewingRepository())
