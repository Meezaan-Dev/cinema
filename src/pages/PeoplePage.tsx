import { useQuery } from '@tanstack/react-query'
import { Search, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { queryKeys, searchPeople } from '@/api/tmdbEndpoints'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/StatusState'
import { useDebounce } from '@/hooks/useDebounce'
import { imageUrl } from '@/lib/formatters'
import { sanitizeQuery } from '@/lib/filterValidation'
import type { TmdbPersonSearchResult } from '@/types/tmdb'

function PersonCard({ person }: { person: TmdbPersonSearchResult }) {
  const photo = imageUrl(person.profile_path, 'w342')
  const knownFor = person.known_for
    .slice(0, 3)
    .map((credit) => credit.title)
    .filter(Boolean)
    .join(', ')

  return (
    <Link
      to={`/person/${person.id}`}
      className="grid grid-cols-[92px_1fr] gap-4 rounded-xl border border-white/[0.08] bg-[#1C2228] p-3 transition hover:-translate-y-0.5 hover:border-[#00E054]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054] sm:grid-cols-[116px_1fr]"
    >
      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-[#202830]">
        {photo ? (
          <img src={photo} alt={person.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center text-[#99AABB]">
            <User className="size-8" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="min-w-0 self-center">
        <h2 className="line-clamp-2 text-lg font-semibold text-white">{person.name}</h2>
        <p className="mt-1 text-sm text-[#99AABB]">{person.known_for_department || 'Film and TV'}</p>
        {knownFor ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#99AABB]">Known for {knownFor}</p> : null}
      </div>
    </Link>
  )
}

function PeopleSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[92px_1fr] gap-4 rounded-xl border border-white/[0.08] bg-[#1C2228] p-3 sm:grid-cols-[116px_1fr]">
          <Skeleton className="aspect-[2/3] rounded-lg" />
          <div className="space-y-3 self-center">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PeoplePage() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(() => sanitizeQuery(searchParams.get('q') ?? ''))
  const debouncedQuery = useDebounce(sanitizeQuery(query))
  const trimmedQuery = debouncedQuery.trim()

  const people = useQuery({
    queryKey: queryKeys.searchPeople(trimmedQuery),
    queryFn: () => searchPeople(trimmedQuery),
    enabled: Boolean(trimmedQuery),
  })

  const results = (people.data?.results ?? [])
    .filter((person) => person.name.trim())
    .sort((a, b) => b.popularity - a.popularity)

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#99AABB]">People</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">Find actors & directors</h1>
        <p className="mt-3 text-base text-[#99AABB]">Search TMDB profiles and explore filmographies across movies and TV.</p>
      </div>

      <label className="relative block rounded-2xl border border-white/[0.08] bg-[#1C2228] p-3">
        <span className="sr-only">Search people</span>
        <Search
          className="pointer-events-none absolute left-7 top-1/2 size-5 -translate-y-1/2 text-[#99AABB]"
          aria-hidden="true"
        />
        <input
          className="field h-14 w-full rounded-xl border-white/[0.08] bg-[#202830] !pl-12 !pr-4 text-base"
          placeholder="Search for Greta Gerwig, Denzel Washington, Bong Joon Ho..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />
      </label>

      <div className="mt-8">
        {people.isLoading ? <PeopleSkeleton /> : null}
        {people.isError ? <ErrorState error={people.error} onRetry={() => people.refetch()} /> : null}
        {!trimmedQuery && !people.isLoading ? (
          <EmptyState title="Start typing to search" message="Search actors, directors, writers, and other film people." />
        ) : null}
        {!people.isLoading && !people.isError && trimmedQuery && results.length === 0 ? (
          <EmptyState title="No people found" message="Try a broader name or check the spelling." />
        ) : null}
        {!people.isLoading && !people.isError && results.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
