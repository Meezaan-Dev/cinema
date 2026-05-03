import { z } from 'zod'

const nullablePathSchema = z.string().nullable().catch(null)

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

export const tmdbSeriesDetailsSchema = z.object({
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
  media_type: z.literal('tv').catch('tv'),
})

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

export const tmdbVideoSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string().catch('Trailer'),
  site: z.string().catch(''),
  type: z.string().catch(''),
  official: z.boolean().catch(false),
})

export const tmdbVideosSchema = z.object({
  id: z.number().int(),
  results: z.array(tmdbVideoSchema).catch([]),
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

const validIsoDate = z.string().datetime().catch(() => new Date().toISOString())

export const userMovieSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    title: z.string().trim().min(1).catch('Untitled'),
    posterPath: z.string().nullable().catch(null),
    backdropPath: z.string().nullable().catch(null),
    releaseDate: z.string().catch(''),
    voteAverage: z.coerce.number().min(0).max(10).catch(0),
    genres: z.array(z.string()).catch([]),
    addedAt: validIsoDate,
    isWatched: z.coerce.boolean().catch(false),
    isFavourite: z.coerce.boolean().catch(false),
    personalRating: z.coerce.number().min(1).max(5).optional().catch(undefined),
    notes: z.string().optional().catch(undefined),
    mediaType: z.enum(['movie', 'tv']).optional().catch('movie'),
  })
  .transform((movie) => ({
    ...movie,
    genres: movie.genres.map((genre) => genre.trim()).filter(Boolean),
  }))

export const watchlistStorageSchema = z.object({
  version: z.literal(1),
  movies: z.array(userMovieSchema).catch([]),
})
