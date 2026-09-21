import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Bookmark } from 'lucide-react'
import { Link } from 'react-router-dom'

import { getSavedMovies, watchlistQueryKeys, type SavedMovie } from '@/api/watchlistClient'
import { useAuth } from '@/auth/useAuth'
import { readWatchlistCache } from '@/lib/queryLocalCache'
import { MoviePoster } from '@/components/movie/MoviePoster'
import { AuthGate } from '@/components/ui/AuthGate'
import { EmptyState } from '@/components/ui/EmptyState'
import { MovieGridSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/StatusState'
import { StaleRefreshBanner } from '@/components/ui/StaleRefreshBanner'

function SavedMovieCard({ movie }: { movie: SavedMovie }) {
  return (
    <article className="group">
      <Link
        to={`/movie/${movie.tmdbId}`}
        className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00E054]"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#1C2228] shadow-[0_12px_40px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.06] transition duration-300 group-hover:-translate-y-1 group-hover:ring-[#00E054]/30">
          <MoviePoster path={movie.posterPath} title={movie.title} className="w-full transition duration-500 group-hover:scale-[1.03]" />
          <div className="absolute bottom-2 right-2 rounded-md bg-[#00E054] px-2 py-1 text-xs font-semibold text-[#14181C]">
            Saved
          </div>
        </div>
      </Link>
      <div className="mt-2.5 space-y-0.5">
        <h2 className="line-clamp-2 min-h-9 text-sm font-medium leading-snug text-white">{movie.title}</h2>
        <p className="text-xs text-[#99AABB]">{movie.releaseYear ?? 'TBA'}</p>
      </div>
    </article>
  )
}

export function WatchlistPage() {
  const { user, uid, isLoading: isAuthLoading, isSigningIn, signInError, signInWithGoogle } = useAuth()
  const firestoreUid = user?.uid
  const cachedUid = uid
  const saved = useQuery({
    queryKey: watchlistQueryKeys.all(firestoreUid),
    queryFn: () => getSavedMovies(firestoreUid!),
    enabled: Boolean(firestoreUid),
    initialData: cachedUid ? readWatchlistCache(cachedUid) : undefined,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10,
  })

  const hasSavedData = (saved.data?.length ?? 0) > 0
  const showHardError = saved.isError && !hasSavedData
  const showStaleBanner = saved.isError && hasSavedData
  const showEmpty =
    Boolean(firestoreUid) &&
    !saved.isLoading &&
    !saved.isFetching &&
    !saved.isError &&
    saved.data?.length === 0

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#99AABB]">Rewind</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">Watchlist</h1>
        <p className="mt-3 text-base text-[#99AABB]">Movies you want to come back to.</p>
      </div>

      {!isAuthLoading && !uid ? (
        <AuthGate
          icon={Bookmark}
          title="Sign in to save movies"
          message="Rewind saves your watchlist to your Google account so it can travel with you."
          actionLabel={isSigningIn ? 'Signing in…' : 'Sign in with Google'}
          actionDisabled={isSigningIn}
          errorMessage={signInError}
          onAction={() => void signInWithGoogle()}
        />
      ) : null}

      {isAuthLoading && !uid ? <MovieGridSkeleton count={10} /> : null}
      {uid && !firestoreUid && !hasSavedData ? <MovieGridSkeleton count={10} /> : null}
      {firestoreUid && saved.isLoading && !saved.data ? <MovieGridSkeleton count={10} /> : null}
      {showStaleBanner ? <StaleRefreshBanner onRetry={() => saved.refetch()} /> : null}
      {showHardError ? <ErrorState error={saved.error} onRetry={() => saved.refetch()} /> : null}
      {showEmpty ? (
        <EmptyState title="No saved movies yet" message="Open a movie and save it to build your Rewind watchlist." />
      ) : null}
      {hasSavedData ? (
        <div className="movie-grid">
          {saved.data!.map((movie) => (
            <SavedMovieCard key={movie.tmdbId} movie={movie} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
