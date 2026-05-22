import { z } from 'zod'

import type { TmdbGenre } from '@/types/tmdb'

export const sortBySchema = z.enum([
  'popularity.desc',
  'vote_average.desc',
  'primary_release_date.desc',
])

const allowedRatings = ['', '6', '6.5', '7', '8'] as const

export function sanitizeQuery(query: string) {
  return query.trim().replace(/\s+/g, ' ').slice(0, 80)
}

export function sanitizeYear(year: string) {
  const value = year.replace(/\D/g, '').slice(0, 4)
  if (value.length !== 4) return value

  const currentYear = new Date().getFullYear() + 2
  const numeric = Number(value)
  return numeric >= 1888 && numeric <= currentYear ? value : ''
}

export function sanitizeRating(rating: string) {
  return allowedRatings.includes(rating as (typeof allowedRatings)[number]) ? rating : ''
}

export function sanitizeSortBy(sortBy: string) {
  return sortBySchema.catch('popularity.desc').parse(sortBy)
}

export function sanitizeGenre(genre: string, genres: TmdbGenre[] = []) {
  if (!genre) return ''
  if (!/^\d+$/.test(genre)) return ''
  if (genres.length === 0) return genre
  return genres.some((item) => String(item.id) === genre) ? genre : ''
}
