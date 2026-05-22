import { z } from 'zod'

export const aiSummarySchema = z.object({
  takeaway: z.string().catch('A spoiler-free decision guide is not available yet.'),
  bestFor: z.array(z.string()).max(4).catch([]),
  skipIf: z.array(z.string()).max(4).catch([]),
  tone: z.string().catch('Tone unavailable'),
  pacing: z.string().catch('Pacing unavailable'),
  spoilerFree: z.literal(true).catch(true),
})

export type AiSummary = z.infer<typeof aiSummarySchema>

export type AiSummaryRequest = {
  mediaType: 'movie' | 'tv'
  tmdbId: number
  title: string
  overview: string
  releaseDate: string
  genres: string[]
  runtime?: number | null
  status?: string
}
