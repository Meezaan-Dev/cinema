import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

import tmdbHandler from './api/tmdb'

function setProcessEnvFromVite(name: string, value: string | undefined) {
  if (!process.env[name] && value) {
    process.env[name] = value
  }
}

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
    name: `cinema-dev-api-${pathname}`,
    configureServer(server: ViteDevServer) {
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  setProcessEnvFromVite('TMDB_API_KEY', env.TMDB_API_KEY || env.VITE_TMDB_API_KEY)
  setProcessEnvFromVite('TMDB_BASE_URL', env.TMDB_BASE_URL || env.VITE_TMDB_BASE_URL)

  return {
    plugins: [
      react(),
      tailwindcss(),
      createJsonDevApi('/api/tmdb', tmdbHandler),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
    },
  }
})
