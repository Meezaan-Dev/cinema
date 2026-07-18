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

const tmdbMixedMediaSchema = z
  .object({
    id: z.number().int(),
    media_type: z.enum(['movie', 'tv']).catch('movie'),
    title: z.string().optional(),
    name: z.string().optional(),
    overview: z.string().catch(''),
    poster_path: nullablePathSchema,
    backdrop_path: nullablePathSchema,
    release_date: z.string().optional().catch(''),
    first_air_date: z.string().optional().catch(''),
    vote_average: z.number().catch(0),
    vote_count: z.number().catch(0),
    popularity: z.number().catch(0),
    genre_ids: z.array(z.number().int()).optional().catch([]),
  })
  .transform((item) => ({
    id: item.id,
    title: item.media_type === 'tv' ? item.name || item.title || 'Untitled series' : item.title || item.name || 'Untitled',
    overview: item.overview,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: item.media_type === 'tv' ? item.first_air_date || item.release_date || '' : item.release_date || item.first_air_date || '',
    vote_average: item.vote_average,
    vote_count: item.vote_count,
    popularity: item.popularity,
    genre_ids: item.genre_ids,
    media_type: item.media_type,
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

export const tmdbPersonSearchResultSchema = z.object({
  id: z.number().int(),
  name: z.string().catch('Unknown person'),
  profile_path: nullablePathSchema,
  known_for_department: z.string().catch(''),
  popularity: z.number().catch(0),
  known_for: z.array(tmdbMixedMediaSchema).catch([]),
})

export const tmdbPersonDetailsSchema = z.object({
  id: z.number().int(),
  name: z.string().catch('Unknown person'),
  biography: z.string().catch(''),
  birthday: z.string().nullable().catch(null),
  deathday: z.string().nullable().catch(null),
  place_of_birth: z.string().nullable().catch(null),
  profile_path: nullablePathSchema,
  known_for_department: z.string().catch(''),
  popularity: z.number().catch(0),
})

export const tmdbPersonCastCreditSchema = tmdbMixedMediaSchema.and(
  z.object({
    character: z.string().catch(''),
    credit_id: z.string().catch(''),
  }),
)

export const tmdbPersonCrewCreditSchema = tmdbMixedMediaSchema.and(
  z.object({
    department: z.string().catch(''),
    job: z.string().catch(''),
    credit_id: z.string().catch(''),
  }),
)

export const tmdbPersonCombinedCreditsSchema = z.object({
  id: z.number().int(),
  cast: z.array(tmdbPersonCastCreditSchema).catch([]),
  crew: z.array(tmdbPersonCrewCreditSchema).catch([]),
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
