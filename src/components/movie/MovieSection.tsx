import { Link } from 'react-router-dom'

import { MovieCard } from './MovieCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { MovieGridSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/StatusState'
import type { TmdbGenre, TmdbMovie } from '@/types/tmdb'
import type { UserMovie } from '@/types/movie'

type MovieSectionProps = {
  title: string
  eyebrow?: string
  movies?: TmdbMovie[]
  isLoading?: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
  genres?: TmdbGenre[]
  savedById?: Map<number, UserMovie>
  onAdd?: (movie: UserMovie) => void
  horizontal?: boolean
}

export function MovieSection({
  title,
  eyebrow,
  movies,
  isLoading,
  isError,
  error,
  onRetry,
  genres,
  savedById,
  onAdd,
  horizontal,
}: MovieSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p> : null}
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        </div>
        <Link to="/search" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">
          Explore
        </Link>
      </div>
      {isLoading ? <MovieGridSkeleton count={horizontal ? 6 : 10} /> : null}
      {isError ? <ErrorState error={error} onRetry={onRetry} /> : null}
      {!isLoading && !isError && movies?.length === 0 ? (
        <EmptyState title="No movies found" message="Try changing your filters or search phrase." />
      ) : null}
      {!isLoading && !isError && movies?.length ? (
        <div className={horizontal ? 'scroll-row' : 'movie-grid'}>
          {movies.map((movie) => (
            <MovieCard
              key={`${movie.media_type ?? 'movie'}-${movie.id}`}
              movie={movie}
              genres={genres}
              saved={savedById?.get(movie.id)}
              onAdd={onAdd}
              compact={horizontal}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
