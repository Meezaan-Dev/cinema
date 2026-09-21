import { useQueries, useQuery } from '@tanstack/react-query'
import { CalendarDays, History, Import, MapPin, PencilLine, RotateCcw, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

import { getMovieDetails, queryKeys } from '@/api/tmdbEndpoints'
import { getViewingHistory, viewingQueryKeys } from '@/api/viewingsClient'
import { useAuth } from '@/auth/useAuth'
import { MoviePoster } from '@/components/movie/MoviePoster'
import { AuthGate } from '@/components/ui/AuthGate'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/StatusState'
import { formatRating, getYear } from '@/lib/formatters'
import type { RewindViewing, ViewingLocation } from '@/types/viewing'

const locationLabels: Record<ViewingLocation, string> = {
  cinema: 'Cinema',
  home: 'Home',
  other: 'Other',
  unknown: 'Not specified',
}

function formatWatchedDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 rounded-xl border border-white/[0.08] bg-[#1C2228]/70 p-3 sm:grid-cols-[92px_minmax(0,1fr)]">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" />
          <div className="space-y-3 py-1">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ViewingRow({
  viewing,
  movie,
}: {
  viewing: RewindViewing
  movie?: Awaited<ReturnType<typeof getMovieDetails>>
}) {
  const title = movie?.title || viewing.importTitle || 'Untitled movie'
  const year = movie?.release_date ? getYear(movie.release_date) : viewing.importYear?.toString() || 'TBA'

  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 rounded-xl border border-white/[0.08] bg-[#1C2228]/70 p-3 transition hover:border-[#00E054]/30 sm:grid-cols-[92px_minmax(0,1fr)]">
      <Link to={`/movie/${viewing.tmdbId}`} className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00E054]">
        <MoviePoster path={movie?.poster_path} title={title} className="w-full rounded-lg" />
      </Link>
      <div className="min-w-0 py-1">
        <Link to={`/movie/${viewing.tmdbId}`} className="group inline-block max-w-full">
          <h2 className="truncate text-lg font-semibold text-white group-hover:text-[#00E054]">
            {title}
          </h2>
        </Link>
        <p className="mt-1 text-sm text-[#99AABB]">{year}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-[#99AABB]">
          <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-1">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatWatchedDate(viewing.watchedAt)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-1">
            <Star className="size-3.5 text-[#00E054]" aria-hidden="true" />
            {viewing.rating === null ? 'Not rated' : `${formatRating(viewing.rating)} / 5`}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-1">
            <MapPin className="size-3.5" aria-hidden="true" />
            {locationLabels[viewing.location]}
          </span>
          {viewing.rewatch ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-[#00E054]/30 bg-[#00E054]/10 px-2 py-1 text-[#00E054]">
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Rewatch
            </span>
          ) : null}
        </div>
        {viewing.review ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#99AABB]">{viewing.review}</p> : null}
      </div>
    </article>
  )
}

function HistoryStarterState() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#1C2228]/70 p-6">
      <History className="size-8 text-[#00E054]" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-white">No films logged yet</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#99AABB]">
        Start from the films you have already tracked, or build your Rewind history from here as you watch.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-white/[0.08] bg-[#14181C]/70 p-4">
          <Import className="size-5 text-[#00E054]" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-white">Import Letterboxd data</h3>
          <p className="mt-2 text-sm leading-6 text-[#99AABB]">
            If you already have a Letterboxd export, import the diary zip from your terminal:
          </p>
          <code className="mt-3 block overflow-x-auto rounded-md border border-white/[0.08] bg-black/25 px-3 py-2 text-xs text-[#DDE7EE]">
            npm run import:letterboxd -- &lt;export.zip&gt;
          </code>
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-[#14181C]/70 p-4">
          <PencilLine className="size-5 text-[#00E054]" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-white">Log and rate films</h3>
          <p className="mt-2 text-sm leading-6 text-[#99AABB]">
            Use Rewind as your fresh movie log. As logging tools are added, this history will become your timeline of watched films, ratings, rewatches, and notes.
          </p>
        </div>
      </div>
    </div>
  )
}

export function HistoryPage() {
  const { user, isLoading: isAuthLoading, signInWithGoogle } = useAuth()
  const history = useQuery({
    queryKey: viewingQueryKeys.history(user?.uid),
    queryFn: () => getViewingHistory(user!.uid),
    enabled: Boolean(user),
  })
  const uniqueTmdbIds = Array.from(new Set((history.data ?? []).map((viewing) => viewing.tmdbId)))

  const movieQueries = useQueries({
    queries: uniqueTmdbIds.map((tmdbId) => ({
      queryKey: queryKeys.detail(tmdbId),
      queryFn: () => getMovieDetails(tmdbId),
      enabled: history.isSuccess,
      staleTime: 1000 * 60 * 30,
    })),
  })

  const moviesById = new Map(
    uniqueTmdbIds.map((tmdbId, index) => [tmdbId, movieQueries[index]?.data]),
  )

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#99AABB]">Rewind</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">History</h1>
        <p className="mt-3 text-base text-[#99AABB]">
          Your personal movie log, ordered by when you watched each film.
        </p>
      </div>

      {!isAuthLoading && !user ? (
        <AuthGate
          icon={History}
          title="Sign in to view your history"
          message="Rewind keeps your viewing history tied to your Google account so your log stays private and follows you."
          actionLabel="Sign in with Google"
          onAction={() => void signInWithGoogle()}
        />
      ) : null}
      {isAuthLoading || history.isLoading ? <HistorySkeleton /> : null}
      {user && history.isError ? <ErrorState error={history.error} onRetry={() => history.refetch()} /> : null}
      {user && !history.isLoading && !history.isError && history.data?.length === 0 ? (
        <HistoryStarterState />
      ) : null}
      {user && !history.isLoading && !history.isError && history.data?.length ? (
        <div className="space-y-4">
          {history.data.map((viewing) => (
            <ViewingRow key={viewing.id} viewing={viewing} movie={moviesById.get(viewing.tmdbId)} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
