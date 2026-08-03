import { Link } from 'react-router-dom'

import { MovieCard } from './MovieCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { MovieGridSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/StatusState'
import type { TmdbMovie } from '@/types/tmdb'

type MovieSectionProps = {
  title: string
  eyebrow?: string
  movies?: TmdbMovie[]
  isLoading?: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
  horizontal?: boolean
  carousel?: boolean
  exploreTo?: string
}

export function MovieSection({
  title,
  eyebrow,
  movies,
  isLoading,
  isError,
  error,
  onRetry,
  horizontal,
  carousel,
  exploreTo = '/search',
}: MovieSectionProps) {
  const isHorizontal = horizontal || carousel

  return (
    <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#99AABB]">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        </div>
        <Link
          to={exploreTo}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-[#99AABB] transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]"
        >
          Explore
        </Link>
      </div>
      {isLoading ? <MovieGridSkeleton count={isHorizontal ? 6 : 10} /> : null}
      {isError ? <ErrorState error={error} onRetry={onRetry} /> : null}
      {!isLoading && !isError && movies?.length === 0 ? (
        <EmptyState title="Nothing here yet" message="Check back soon for new titles." />
      ) : null}
      {!isLoading && !isError && movies?.length && carousel ? (
        <div className="carousel-row">
          <div className="carousel-track">
            {movies.map((movie) => (
              <MovieCard
                key={`${movie.media_type ?? 'movie'}-${movie.id}`}
                movie={movie}
                compact
              />
            ))}
            {movies.map((movie) => (
              <div key={`duplicate-${movie.media_type ?? 'movie'}-${movie.id}`} aria-hidden="true" inert>
                <MovieCard movie={movie} compact />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {!isLoading && !isError && movies?.length && !carousel ? (
        <div className={horizontal ? 'scroll-row' : 'movie-grid'}>
          {movies.map((movie) => (
            <MovieCard
              key={`${movie.media_type ?? 'movie'}-${movie.id}`}
              movie={movie}
              compact={isHorizontal}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
