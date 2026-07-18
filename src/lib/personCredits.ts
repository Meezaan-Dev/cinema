import type { TmdbMovie, TmdbPersonCastCredit, TmdbPersonCombinedCredits, TmdbPersonCrewCredit } from '@/types/tmdb'

export type PersonCredit = TmdbMovie & {
  creditLabels: string[]
}

export type PersonCreditGroups = {
  movies: PersonCredit[]
  shows: PersonCredit[]
}

function creditKey(credit: TmdbMovie) {
  return `${credit.media_type ?? 'movie'}-${credit.id}`
}

function addLabel(credit: PersonCredit, label: string) {
  if (label && !credit.creditLabels.includes(label)) {
    credit.creditLabels.push(label)
  }
}

function castLabel(credit: TmdbPersonCastCredit) {
  return credit.character ? `as ${credit.character}` : 'Cast'
}

function crewLabel(credit: TmdbPersonCrewCredit) {
  return credit.job || 'Crew'
}

function isDirectingCredit(credit: TmdbPersonCrewCredit) {
  return credit.job === 'Director' || credit.department === 'Directing'
}

function byPopularity(a: PersonCredit, b: PersonCredit) {
  return b.popularity - a.popularity
}

export function normalizePersonCredits(credits: TmdbPersonCombinedCredits | undefined): PersonCredit[] {
  const byTitle = new Map<string, PersonCredit>()

  for (const credit of credits?.cast ?? []) {
    const key = creditKey(credit)
    const current = byTitle.get(key)
    if (current) {
      addLabel(current, castLabel(credit))
      continue
    }

    byTitle.set(key, {
      ...credit,
      media_type: credit.media_type ?? 'movie',
      creditLabels: [castLabel(credit)],
    })
  }

  for (const credit of credits?.crew.filter(isDirectingCredit) ?? []) {
    const key = creditKey(credit)
    const current = byTitle.get(key)
    if (current) {
      addLabel(current, crewLabel(credit))
      continue
    }

    byTitle.set(key, {
      ...credit,
      media_type: credit.media_type ?? 'movie',
      creditLabels: [crewLabel(credit)],
    })
  }

  return [...byTitle.values()].sort(byPopularity)
}

export function filterPersonCredits(credits: PersonCredit[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return credits

  return credits.filter((credit) => credit.title.toLocaleLowerCase().includes(normalizedQuery))
}

export function groupPersonCredits(credits: PersonCredit[]): PersonCreditGroups {
  return {
    movies: credits.filter((credit) => (credit.media_type ?? 'movie') === 'movie'),
    shows: credits.filter((credit) => credit.media_type === 'tv'),
  }
}
