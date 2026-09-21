import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { CalendarDays, History, MapPin, PencilLine, RotateCcw, Star } from 'lucide-react'
import { lazy, Suspense, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { getMovieDetails, getSeriesDetails, queryKeys } from '@/api/tmdbEndpoints'
import { getViewingHistory, viewingQueryKeys } from '@/api/viewingsClient'
import { useAuth } from '@/auth/useAuth'
import { readHistoryCache } from '@/lib/queryLocalCache'
import { MoviePoster } from '@/components/movie/MoviePoster'
import { AuthGate } from '@/components/ui/AuthGate'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/StatusState'
import { StaleRefreshBanner } from '@/components/ui/StaleRefreshBanner'
import { formatRating } from '@/lib/formatters'
import type { RewindViewing, ViewingLocation } from '@/types/viewing'

const LetterboxdImportPanel = lazy(() =>
  import('@/components/viewing/LetterboxdImportPanel').then((module) => ({
    default: module.LetterboxdImportPanel,
  })),
)

const POSTER_ENRICH_LIMIT = 12

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

function viewingDetailPath(viewing: RewindViewing) {
  return viewing.mediaType === 'tv' ? `/tv/${viewing.tmdbId}` : `/movie/${viewing.tmdbId}`
}

function uniqueIdsInOrder(viewings: RewindViewing[], mediaType: RewindViewing['mediaType'], limit: number) {
  const ids: number[] = []
  for (const viewing of viewings) {
    if (viewing.mediaType !== mediaType) continue
    if (ids.includes(viewing.tmdbId)) continue
    ids.push(viewing.tmdbId)
    if (ids.length >= limit) break
  }
  return ids
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
  title,
  year,
  posterPath,
}: {
  viewing: RewindViewing
  title: string
  year: string
  posterPath: string | null | undefined
}) {
  const detailPath = viewingDetailPath(viewing)

  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 rounded-xl border border-white/[0.08] bg-[#1C2228]/70 p-3 transition hover:border-[#00E054]/30 sm:grid-cols-[92px_minmax(0,1fr)]">
      <Link to={detailPath} className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00E054]">
        <MoviePoster path={posterPath} title={title} className="w-full rounded-lg" />
      </Link>
      <div className="min-w-0 py-1">
        <Link to={detailPath} className="group inline-block max-w-full">
          <h2 className="truncate text-lg font-semibold text-white group-hover:text-[#00E054]">{title}</h2>
        </Link>
        <p className="mt-1 text-sm text-[#99AABB]">
          {year} · {viewing.mediaType === 'tv' ? 'Show' : 'Film'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-[#99AABB]">
          <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-1">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatWatchedDate(viewing.watchedAt)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-1">
            <Star className="size-3.5 text-[#00E054]" aria-hidden="true" />
            {viewing.rating === null ? 'Not rated' : `${formatRating(viewing.rating)} / 5`}
          </span>
          {viewing.mediaType === 'movie' ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              {locationLabels[viewing.location]}
            </span>
          ) : null}
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
      <h2 className="mt-4 text-xl font-semibold text-white">No watch history yet</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#99AABB]">
        Import your Letterboxd diary or log films and shows from their detail pages with ratings and notes.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-36 w-full rounded-lg" />}>
          <LetterboxdImportPanel />
        </Suspense>

        <div className="rounded-lg border border-white/[0.08] bg-[#14181C]/70 p-4">
          <PencilLine className="size-5 text-[#00E054]" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-white">Log and rate</h3>
          <p className="mt-2 text-sm leading-6 text-[#99AABB]">
            Open any movie or TV show, pick a watched date, rate it, and for films choose home or cinema.
          </p>
        </div>
      </div>
    </div>
  )
}

export function HistoryPage() {
  const { user, uid, isLoading: isAuthLoading, isSigningIn, signInError, signInWithGoogle } = useAuth()
  const firestoreUid = user?.uid
  const cachedUid = uid
  const history = useQuery({
    queryKey: viewingQueryKeys.history(firestoreUid),
    queryFn: () => getViewingHistory(firestoreUid!),
    enabled: Boolean(firestoreUid),
    initialData: cachedUid ? readHistoryCache(cachedUid) : undefined,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10,
  })

  const viewings = history.data ?? []
  const movieIds = useMemo(() => uniqueIdsInOrder(viewings, 'movie', POSTER_ENRICH_LIMIT), [viewings])
  const seriesIds = useMemo(() => uniqueIdsInOrder(viewings, 'tv', POSTER_ENRICH_LIMIT), [viewings])

  const movieQueries = useQueries({
    queries: movieIds.map((tmdbId) => ({
      queryKey: queryKeys.detail(tmdbId),
      queryFn: () => getMovieDetails(tmdbId),
      enabled: history.isSuccess && Boolean(user),
      staleTime: 1000 * 60 * 30,
    })),
  })

  const seriesQueries = useQueries({
    queries: seriesIds.map((tmdbId) => ({
      queryKey: queryKeys.seriesDetail(tmdbId),
      queryFn: () => getSeriesDetails(tmdbId),
      enabled: history.isSuccess && Boolean(user),
      staleTime: 1000 * 60 * 30,
    })),
  })

  const postersByKey = useMemo(() => {
    const map = new Map<string, string | null>()
    movieIds.forEach((tmdbId, index) => {
      map.set(`movie:${tmdbId}`, movieQueries[index]?.data?.poster_path ?? null)
    })
    seriesIds.forEach((tmdbId, index) => {
      map.set(`tv:${tmdbId}`, seriesQueries[index]?.data?.poster_path ?? null)
    })
    return map
  }, [movieIds, movieQueries, seriesIds, seriesQueries])

  const hasHistoryData = viewings.length > 0
  const showHardError = history.isError && !hasHistoryData
  const showStaleBanner = history.isError && hasHistoryData
  const showEmpty =
    Boolean(firestoreUid) &&
    !history.isLoading &&
    !history.isFetching &&
    !history.isError &&
    viewings.length === 0

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#99AABB]">Rewind</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">History</h1>
        <p className="mt-3 text-base text-[#99AABB]">
          Your personal log of watched films and shows, ordered by when you watched them.
        </p>
      </div>

      {!isAuthLoading && !uid ? (
        <AuthGate
          icon={History}
          title="Sign in to view your history"
          message="Rewind keeps your viewing history tied to your Google account so your log stays private and follows you."
          actionLabel={isSigningIn ? 'Signing in…' : 'Sign in with Google'}
          actionDisabled={isSigningIn}
          errorMessage={signInError}
          onAction={() => void signInWithGoogle()}
        />
      ) : null}

      {uid ? (
        <div className="mb-8">
          <Suspense fallback={<Skeleton className="h-36 w-full rounded-lg" />}>
            <LetterboxdImportPanel />
          </Suspense>
        </div>
      ) : null}

      {isAuthLoading && !uid ? <HistorySkeleton /> : null}
      {uid && !firestoreUid && !hasHistoryData ? <HistorySkeleton /> : null}
      {firestoreUid && history.isLoading && !history.data ? <HistorySkeleton /> : null}
      {showStaleBanner ? <StaleRefreshBanner onRetry={() => history.refetch()} /> : null}
      {showHardError ? <ErrorState error={history.error} onRetry={() => history.refetch()} /> : null}
      {showEmpty ? <HistoryStarterState /> : null}
      {hasHistoryData ? (
        <div className="space-y-4">
          {viewings.map((viewing) => {
            const title =
              viewing.importTitle || (viewing.mediaType === 'tv' ? 'Untitled show' : 'Untitled movie')
            const year = viewing.importYear?.toString() || 'TBA'
            const posterPath = postersByKey.get(`${viewing.mediaType}:${viewing.tmdbId}`) ?? null

            return (
              <ViewingRow
                key={viewing.id}
                viewing={viewing}
                title={title}
                year={year}
                posterPath={posterPath}
              />
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
