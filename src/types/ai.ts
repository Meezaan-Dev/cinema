import { z } from 'zod'

export const aiMediaTypeSchema = z.enum(['movie', 'series', 'both'])

export const aiRecommendationPlanSchema = z.object({
  mediaType: aiMediaTypeSchema.catch('both'),
  genreIds: z.array(z.number().int()).max(5).catch([]),
  minRating: z.number().min(0).max(10).catch(7),
  maxRuntime: z.number().int().min(60).max(240).nullable().catch(null),
  sortBy: z
    .enum(['popularity.desc', 'vote_average.desc', 'primary_release_date.desc'])
    .catch('popularity.desc'),
  referenceTitle: z.string().nullable().catch(null),
  vibeTags: z.array(z.string()).max(6).catch([]),
  reason: z.string().catch('Matched from your prompt.'),
})

export type AiRecommendationPlan = z.infer<typeof aiRecommendationPlanSchema>

export type AiRecommendationRequest = {
  prompt: string
  genres: Array<{ id: number; name: string }>
  watchlistTitles: string[]
}
