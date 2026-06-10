import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { discoverMovies, getGenres, queryKeys, type DiscoverParams } from '@/api/tmdbEndpoints'
import { MovieCard } from '@/components/movie/MovieCard'
import { SearchFilters } from '@/components/search/SearchFilters'
import { EmptyState } from '@/components/ui/EmptyState'
import { MovieGridSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/StatusState'
import {
  sanitizeGenre,
  sanitizeRating,
  sanitizeSortBy,
  sanitizeYear,
} from '@/lib/filterValidation'

export function MoviesPage() {
  const [filters, setFilters] = useState<Required<Pick<DiscoverParams, 'genre' | 'year' | 'minRating' | 'sortBy'>>>({
    genre: '',
    year: '',
    minRating: '',
    sortBy: 'popularity.desc',
  })

  const genres = useQuery({ queryKey: queryKeys.genres, queryFn: getGenres })
  const safeFilters = useMemo(
    () => ({
      genre: sanitizeGenre(filters.genre, genres.data?.genres),
      year: filters.year.length === 4 ? sanitizeYear(filters.year) : '',
      minRating: sanitizeRating(filters.minRating),
      sortBy: sanitizeSortBy(filters.sortBy),
    }),
    [filters, genres.data?.genres],
  )

  const discover = useQuery({
    queryKey: queryKeys.discover(safeFilters),
    queryFn: () => discoverMovies(safeFilters),
  })

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#99AABB]">Browse</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">Movies</h1>
        <p className="mt-3 text-base text-[#99AABB]">Explore popular, top-rated, and newly released films.</p>
      </div>

      <SearchFilters
        genres={genres.data?.genres ?? []}
        genre={filters.genre}
        year={filters.year}
        minRating={filters.minRating}
        sortBy={filters.sortBy}
        onChange={(updates) =>
          setFilters((current) => ({
            ...current,
            genre: updates.genre !== undefined ? sanitizeGenre(updates.genre, genres.data?.genres) : current.genre,
            year: updates.year !== undefined ? sanitizeYear(updates.year) : current.year,
            minRating: updates.minRating !== undefined ? sanitizeRating(updates.minRating) : current.minRating,
            sortBy: updates.sortBy !== undefined ? sanitizeSortBy(updates.sortBy) : current.sortBy,
          }))
        }
      />

      <div className="mt-8">
        {discover.isLoading ? <MovieGridSkeleton count={15} /> : null}
        {discover.isError ? <ErrorState error={discover.error} onRetry={() => discover.refetch()} /> : null}
        {!discover.isLoading && !discover.isError && discover.data?.results.length === 0 ? (
          <EmptyState title="No movies found" message="Try adjusting your filters." />
        ) : null}
        {!discover.isLoading && !discover.isError && discover.data?.results.length ? (
          <div className="movie-grid">
            {discover.data.results.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
