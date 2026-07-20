import type { TmdbMovie, TmdbPersonSearchResult } from '@/types/tmdb'

export type SuperSearchResult = {
  key: string
  kind: 'movie' | 'tv' | 'person'
  id: number
  title: string
  subtitle: string
  description: string
  imagePath: string | null
  to: string
  popularity: number
  rating?: number
}

function getYear(date: string) {
  return /^\d{4}/.test(date) ? date.slice(0, 4) : 'TBA'
}

function compactList(items: string[]) {
  return items.filter(Boolean).slice(0, 3).join(', ')
}

export function normalizeTitleResult(item: TmdbMovie): SuperSearchResult {
  const kind = item.media_type === 'tv' ? 'tv' : 'movie'
  const label = kind === 'tv' ? 'TV Show' : 'Movie'
  const year = getYear(item.release_date)

  return {
    key: `${kind}-${item.id}`,
    kind,
    id: item.id,
    title: item.title,
    subtitle: `${label} • ${year}`,
    description: item.overview,
    imagePath: item.poster_path,
    to: kind === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`,
    popularity: item.popularity,
    rating: item.vote_average,
  }
}

export function normalizePersonResult(person: TmdbPersonSearchResult): SuperSearchResult {
  const knownFor = compactList(person.known_for.map((item) => item.title))

  return {
    key: `person-${person.id}`,
    kind: 'person',
    id: person.id,
    title: person.name,
    subtitle: person.known_for_department || 'Person',
    description: knownFor ? `Known for ${knownFor}` : '',
    imagePath: person.profile_path,
    to: `/person/${person.id}`,
    popularity: person.popularity,
  }
}

export function normalizeSuperSearchResults({
  titles,
  people = [],
}: {
  titles: TmdbMovie[]
  people?: TmdbPersonSearchResult[]
}) {
  return [...titles.map(normalizeTitleResult), ...people.map(normalizePersonResult)]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 12)
}
