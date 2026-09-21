import { useQuery } from '@tanstack/react-query'
import { Bookmark } from 'lucide-react'
import { Link } from 'react-router-dom'

import { getMovieDetails, queryKeys } from '@/api/tmdbEndpoints'
import { getSavedMovies, watchlistQueryKeys } from '@/api/watchlistClient'
import { useAuth } from '@/auth/useAuth'
import { MoviePoster } from '@/components/movie/MoviePoster'
import { EmptyState } from '@/components/ui/EmptyState'
import { MovieGridSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/StatusState'
import { getYear } from '@/lib/formatters'

function SavedMovieCard({ tmdbId }: { tmdbId: number }) {
  const movie = useQuery({
    queryKey: queryKeys.detail(tmdbId),
    queryFn: () => getMovieDetails(tmdbId),
  })

  if (movie.isLoading) {
    return <div className="aspect-[2/3] animate-pulse rounded-xl bg-[#1C2228]" />
  }

  if (!movie.data) return null

  return (
    <article className="group">
      <Link
        to={`/movie/${movie.data.id}`}
        className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00E054]"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#1C2228] shadow-[0_12px_40px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.06] transition duration-300 group-hover:-translate-y-1 group-hover:ring-[#00E054]/30">
          <MoviePoster path={movie.data.poster_path} title={movie.data.title} className="w-full transition duration-500 group-hover:scale-[1.03]" />
          <div className="absolute bottom-2 right-2 rounded-md bg-[#00E054] px-2 py-1 text-xs font-semibold text-[#14181C]">
            Saved
          </div>
        </div>
      </Link>
      <div className="mt-2.5 space-y-0.5">
        <h2 className="line-clamp-2 min-h-9 text-sm font-medium leading-snug text-white">{movie.data.title}</h2>
        <p className="text-xs text-[#99AABB]">{getYear(movie.data.release_date)}</p>
      </div>
    </article>
  )
}

export function WatchlistPage() {
  const { user, isLoading, signInWithGoogle } = useAuth()
  const saved = useQuery({
    queryKey: watchlistQueryKeys.all(user?.uid),
    queryFn: () => getSavedMovies(user!.uid),
    enabled: Boolean(user),
  })

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#99AABB]">Rewind</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">Watchlist</h1>
        <p className="mt-3 text-base text-[#99AABB]">Movies you want to come back to.</p>
      </div>

      {!isLoading && !user ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#1C2228]/70 p-6">
          <Bookmark className="size-8 text-[#00E054]" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-white">Sign in to save movies</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#99AABB]">
            Rewind saves your watchlist to your Google account so it can travel with you.
          </p>
          <button type="button" onClick={() => void signInWithGoogle()} className="button-link button-link-accent mt-5">
            Sign in with Google
          </button>
        </div>
      ) : null}

      {saved.isLoading ? <MovieGridSkeleton count={10} /> : null}
      {saved.isError ? <ErrorState error={saved.error} onRetry={() => saved.refetch()} /> : null}
      {!saved.isLoading && !saved.isError && saved.data?.length === 0 ? (
        <EmptyState title="No saved movies yet" message="Open a movie and save it to build your Rewind watchlist." />
      ) : null}
      {!saved.isLoading && !saved.isError && saved.data?.length ? (
        <div className="movie-grid">
          {saved.data.map((movie) => (
            <SavedMovieCard key={movie.tmdbId} tmdbId={movie.tmdbId} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
