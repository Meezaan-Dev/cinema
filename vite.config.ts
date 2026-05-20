import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

import aiRecommendationHandler from './api/ai-recommendation'
import aiSummaryHandler from './api/ai-summary'
import addWatchlistItemHandler from './api/add-watchlist-item'
import createWatchlistHandler from './api/create-watchlist'
import getWatchlistHandler from './api/get-watchlist'
import joinWatchlistHandler from './api/join-watchlist'
import listWatchlistsHandler from './api/list-watchlists'

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

type DevApiResponse = {
  status: (code: number) => DevApiResponse
  json: (payload: unknown) => void
  setHeader: (name: string, value: string) => void
}

function createJsonDevApi(pathname: string, handler: (req: { method?: string; body?: unknown; headers?: IncomingMessage['headers'] }, res: DevApiResponse) => Promise<void>): Plugin {
  return {
    name: `absolute-cinema-dev-api-${pathname}`,
    configureServer(server: ViteDevServer) {
      // Mirrors Vercel serverless JSON routes during local Vite dev.
      server.middlewares.use(pathname, async (req: IncomingMessage, res: ServerResponse) => {
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
          await handler({ method: req.method, body, headers: req.headers }, response)
        } catch (error) {
          console.error(`Local API route failed: ${pathname}`, error)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
          }
          res.end(JSON.stringify({ error: 'Local API route failed.' }))
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
  process.env.FIREBASE_PROJECT_ID ||= env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||= env.FIREBASE_SERVICE_ACCOUNT_KEY
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 ||= env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
  process.env.FIREBASE_SERVICE_ACCOUNT_FILE ||= env.FIREBASE_SERVICE_ACCOUNT_FILE
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||= env.GOOGLE_APPLICATION_CREDENTIALS

  return {
    plugins: [
      react(),
      tailwindcss(),
      createJsonDevApi('/api/add-watchlist-item', addWatchlistItemHandler),
      createJsonDevApi('/api/ai-recommendation', aiRecommendationHandler),
      createJsonDevApi('/api/ai-summary', aiSummaryHandler),
      createJsonDevApi('/api/create-watchlist', createWatchlistHandler),
      createJsonDevApi('/api/get-watchlist', getWatchlistHandler),
      createJsonDevApi('/api/join-watchlist', joinWatchlistHandler),
      createJsonDevApi('/api/list-watchlists', listWatchlistsHandler),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
    },
    server: {
      headers: {
        // Allow Firebase Auth popups to work properly
        // Firebase signInWithPopup() requires access to window.closed on the popup
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
    },
  }
})
