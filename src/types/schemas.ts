import { z } from 'zod'

import { sanitizeImdbId, sanitizeTmdbImagePath, sanitizeYoutubeKey } from '@/lib/sanitize'

const nullablePathSchema = z
  .string()
  .nullable()
  .catch(null)
  .transform((path) => sanitizeTmdbImagePath(path))

const nullableExternalIdSchema = z
  .string()
  .nullable()
  .catch(null)
  .transform((id) => sanitizeImdbId(id))

export const tmdbGenreSchema = z.object({
  id: z.number().int(),
  name: z.string().catch('Unknown'),
})

export const tmdbMovieSchema = z.object({
  id: z.number().int(),
  title: z.string().catch('Untitled'),
  overview: z.string().catch(''),
  poster_path: nullablePathSchema,
  backdrop_path: nullablePathSchema,
  release_date: z.string().catch(''),
  vote_average: z.number().catch(0),
  vote_count: z.number().catch(0),
  popularity: z.number().catch(0),
  media_type: z.enum(['movie', 'tv']).optional().catch('movie'),
  genre_ids: z.array(z.number().int()).optional().catch([]),
})

export const tmdbSeriesSchema = z
  .object({
    id: z.number().int(),
    name: z.string().catch('Untitled series'),
    overview: z.string().catch(''),
    poster_path: nullablePathSchema,
    backdrop_path: nullablePathSchema,
    first_air_date: z.string().catch(''),
    vote_average: z.number().catch(0),
    vote_count: z.number().catch(0),
    popularity: z.number().catch(0),
    genre_ids: z.array(z.number().int()).optional().catch([]),
  })
  .transform((series) => ({
    id: series.id,
    title: series.name,
    overview: series.overview,
    poster_path: series.poster_path,
    backdrop_path: series.backdrop_path,
    release_date: series.first_air_date,
    vote_average: series.vote_average,
    vote_count: series.vote_count,
    popularity: series.popularity,
    genre_ids: series.genre_ids,
    media_type: 'tv' as const,
  }))

export const tmdbMovieDetailsSchema = tmdbMovieSchema.extend({
  runtime: z.number().nullable().catch(null),
  genres: z.array(tmdbGenreSchema).catch([]),
  tagline: z.string().catch(''),
  status: z.string().catch(''),
  imdb_id: nullableExternalIdSchema,
})

export const tmdbSeasonSchema = z.object({
  id: z.number().int(),
  name: z.string().catch('Untitled season'),
  overview: z.string().catch(''),
  poster_path: nullablePathSchema,
  air_date: z.string().nullable().catch('').transform((date) => date ?? ''),
  episode_count: z.number().int().catch(0),
  season_number: z.number().int().catch(0),
})

export const tmdbSeriesDetailsSchema = z
  .object({
    id: z.number().int(),
    name: z.string().catch('Untitled series'),
    overview: z.string().catch(''),
    poster_path: nullablePathSchema,
    backdrop_path: nullablePathSchema,
    first_air_date: z.string().catch(''),
    vote_average: z.number().catch(0),
    vote_count: z.number().catch(0),
    popularity: z.number().catch(0),
    genres: z.array(tmdbGenreSchema).catch([]),
    status: z.string().catch(''),
    number_of_seasons: z.number().int().catch(0),
    number_of_episodes: z.number().int().catch(0),
    seasons: z.array(tmdbSeasonSchema).catch([]),
  })
  .transform((series) => ({
    ...series,
    media_type: 'tv' as const,
  }))

export const tmdbCastMemberSchema = z.object({
  id: z.number().int(),
  name: z.string().catch('Unknown performer'),
  character: z.string().catch(''),
  profile_path: nullablePathSchema,
  order: z.number().catch(0),
})

export const tmdbCreditsSchema = z.object({
  id: z.number().int(),
  cast: z.array(tmdbCastMemberSchema).catch([]),
})

export const tmdbVideoSchema = z
  .object({
    id: z.string(),
    key: z.string(),
    name: z.string().catch('Trailer'),
    site: z.string().catch(''),
    type: z.string().catch(''),
    official: z.boolean().catch(false),
  })
  .transform((video) => ({
    ...video,
    key: video.site === 'YouTube' ? sanitizeYoutubeKey(video.key) ?? '' : video.key.trim().slice(0, 32),
  }))

export const tmdbVideosSchema = z.object({
  id: z.number().int(),
  results: z.array(tmdbVideoSchema).catch([]),
})

export const tmdbExternalIdsSchema = z.object({
  id: z.number().int(),
  imdb_id: nullableExternalIdSchema,
})

export function tmdbPagedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    page: z.number().int().catch(1),
    results: z.array(itemSchema).catch([]),
    total_pages: z.number().int().catch(1),
    total_results: z.number().int().catch(0),
  })
}

export const tmdbGenresResponseSchema = z.object({
  genres: z.array(tmdbGenreSchema).catch([]),
})

