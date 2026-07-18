import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Film, Search, MapPin, Star, Tv, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getPersonCombinedCredits, getPersonDetails, queryKeys } from '@/api/tmdbEndpoints'
import { MovieCard } from '@/components/movie/MovieCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState, StatusState } from '@/components/ui/StatusState'
import { formatRating, getYear, imageUrl } from '@/lib/formatters'
import { filterPersonCredits, groupPersonCredits, normalizePersonCredits } from '@/lib/personCredits'
import { parsePositiveIntegerParam } from '@/lib/routeParams'

function displayDate(date: string | null) {
  return date || 'Unknown'
}

const BIO_PREVIEW_LENGTH = 420

type FilmographyMediaFilter = 'movie' | 'tv'

function CollapsibleBio({ biography }: { biography: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = biography.length > BIO_PREVIEW_LENGTH
  const visibleBio = !isLong || isExpanded ? biography : `${biography.slice(0, BIO_PREVIEW_LENGTH).trim()}...`

  if (!biography) {
    return <p className="mt-6 max-w-3xl text-base leading-7 text-[#99AABB]">No biography is available from TMDB yet.</p>
  }

  return (
    <div className="mt-6 max-w-3xl">
      <p className="text-base leading-7 text-[#99AABB]">{visibleBio}</p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="mt-3 text-sm font-semibold text-[#00E054] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  )
}

export function PersonDetailPage() {
  const { personId = '' } = useParams()
  const personTmdbId = parsePositiveIntegerParam(personId)
  const isValidPersonId = personTmdbId !== null

  const details = useQuery({
    queryKey: queryKeys.personDetail(personTmdbId ?? personId),
    queryFn: () => getPersonDetails(personTmdbId ?? ''),
    enabled: isValidPersonId,
  })
  const credits = useQuery({
    queryKey: queryKeys.personCredits(personTmdbId ?? personId),
    queryFn: () => getPersonCombinedCredits(personTmdbId ?? ''),
    enabled: isValidPersonId,
  })

  const person = details.data
  const [creditQuery, setCreditQuery] = useState('')
  const [mediaFilter, setMediaFilter] = useState<FilmographyMediaFilter>('movie')
  const photo = imageUrl(person?.profile_path, 'w780')
  const allCredits = useMemo(() => normalizePersonCredits(credits.data), [credits.data])
  const filteredCredits = useMemo(() => filterPersonCredits(allCredits, creditQuery), [allCredits, creditQuery])
  const groupedCredits = useMemo(() => groupPersonCredits(filteredCredits), [filteredCredits])
  const visibleCredits = mediaFilter === 'movie' ? groupedCredits.movies : groupedCredits.shows
  const visibleTitle = mediaFilter === 'movie' ? 'Movies' : 'Shows'
  const hasCredits = allCredits.length > 0
  const hasFilteredCredits = filteredCredits.length > 0

  if (!isValidPersonId) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <StatusState title="Person not found" message="Person URLs need a valid TMDB person ID." />
      </section>
    )
  }

  if (details.isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </section>
    )
  }

  if (details.isError || !person) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <ErrorState error={details.error} onRetry={() => details.refetch()} />
      </section>
    )
  }

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,34,40,.65),#14181C_90%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr] lg:py-14">
          <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-[#1C2228] shadow-[0_24px_60px_rgba(0,0,0,.5)] ring-1 ring-white/[0.08] sm:w-64 lg:w-full">
            {photo ? (
              <img src={photo} alt={person.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-[#99AABB]">
                <User className="size-16" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="max-w-3xl self-end">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#99AABB]">
              {person.known_for_department || 'Film and TV'}
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {person.name}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#00E054] px-3 py-1 text-sm font-semibold text-[#14181C]">
                <Star className="size-4 fill-current" aria-hidden="true" />
                {formatRating(person.popularity)}
              </span>
              {person.birthday ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#1C2228] px-3 py-1 text-sm text-[#99AABB]">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  Born {getYear(person.birthday)}
                </span>
              ) : null}
              {person.place_of_birth ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#1C2228] px-3 py-1 text-sm text-[#99AABB]">
                  <MapPin className="size-4" aria-hidden="true" />
                  {person.place_of_birth}
                </span>
              ) : null}
            </div>
            <CollapsibleBio biography={person.biography} />
            <dl className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.08] bg-[#1C2228] p-4">
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">Born</dt>
                <dd className="mt-1 text-sm text-white">{displayDate(person.birthday)}</dd>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#1C2228] p-4">
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">Died</dt>
                <dd className="mt-1 text-sm text-white">{displayDate(person.deathday)}</dd>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#1C2228] p-4">
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">Credits</dt>
                <dd className="mt-1 text-sm text-white">{allCredits.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {credits.isLoading ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </section>
      ) : null}
      {credits.isError ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <ErrorState error={credits.error} onRetry={() => credits.refetch()} />
        </section>
      ) : null}
      {!credits.isLoading && !credits.isError && !hasCredits ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <EmptyState title="No filmography found" message="TMDB does not have movie or TV credits for this person yet." />
        </section>
      ) : null}
      {!credits.isLoading && !credits.isError && hasCredits ? (
        <>
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_360px] lg:items-end">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#99AABB]">Filmography</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Movies & Shows</h2>
              </div>
              <div
                className="inline-grid grid-cols-2 rounded-xl border border-white/[0.08] bg-[#1C2228] p-1"
                aria-label="Filter filmography by media type"
                role="radiogroup"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={mediaFilter === 'movie'}
                  onClick={() => setMediaFilter('movie')}
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054] ${
                    mediaFilter === 'movie'
                      ? 'bg-[#00E054] text-[#14181C]'
                      : 'text-[#99AABB] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Film className="size-4" aria-hidden="true" />
                  Movies
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={mediaFilter === 'tv'}
                  onClick={() => setMediaFilter('tv')}
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054] ${
                    mediaFilter === 'tv'
                      ? 'bg-[#00E054] text-[#14181C]'
                      : 'text-[#99AABB] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Tv className="size-4" aria-hidden="true" />
                  Shows
                </button>
              </div>
              <label className="relative block">
                <span className="sr-only">Search this filmography</span>
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#99AABB]"
                  aria-hidden="true"
                />
                <input
                  className="field h-12 w-full rounded-xl border-white/[0.08] bg-[#202830] !pl-11 !pr-4 text-sm"
                  placeholder="Search this filmography..."
                  value={creditQuery}
                  onChange={(event) => setCreditQuery(event.target.value)}
                />
              </label>
            </div>
            {creditQuery.trim() && !hasFilteredCredits ? (
              <div className="mt-6">
                <EmptyState title="No matching credits" message="Try a broader title search for this person." />
              </div>
            ) : null}
          </section>
          {hasFilteredCredits ? (
            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#99AABB]">Filmography</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">{visibleTitle}</h2>
                </div>
                <p className="text-sm text-[#99AABB]">{visibleCredits.length} credits</p>
              </div>
              {visibleCredits.length ? (
                <div className="movie-grid">
                  {visibleCredits.map((credit) => (
                    <div key={`${credit.media_type ?? 'movie'}-${credit.id}`} className="space-y-2">
                      <MovieCard movie={credit} compact />
                      <p className="line-clamp-2 text-xs leading-5 text-[#99AABB]">
                        {credit.creditLabels.join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#99AABB]">
                  No {visibleTitle.toLowerCase()} credits match the current search.
                </p>
              )}
            </section>
          ) : null}
        </>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <Link to="/people" className="text-sm font-medium text-[#99AABB] hover:text-white">
          Back to People
        </Link>
      </div>
    </>
  )
}
