import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

import aiRecommendationHandler from './api/ai-recommendation'

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')
  if (!rawBody) return undefined

  try {
    return JSON.parse(rawBody) as unknown
  } catch {
    return rawBody
  }
}

function aiRecommendationDevApi(): Plugin {
  return {
    name: 'absolute-cinema-ai-dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/ai-recommendation', async (req: IncomingMessage, res: ServerResponse) => {
        const body = await readJsonBody(req)

        const response = {
          status(code: number) {
            res.statusCode = code
            return response
          },
          json(payload: unknown) {
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'application/json')
            }
            res.end(JSON.stringify(payload))
          },
          setHeader(name: string, value: string) {
            res.setHeader(name, value)
          },
        }

        try {
          await aiRecommendationHandler({ method: req.method, body }, response)
        } catch (error) {
          console.error('Local AI API route failed', error)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
          }
          res.end(JSON.stringify({ error: 'Local AI API route failed.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.GEMINI_API_KEY ||= env.GEMINI_API_KEY
  process.env.GEMINI_MODEL ||= env.GEMINI_MODEL

  return {
    plugins: [react(), tailwindcss(), aiRecommendationDevApi()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
