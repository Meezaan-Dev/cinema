import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { getGenres, queryKeys, type DiscoverParams } from '@/api/tmdbEndpoints'
import { SearchFilters } from '@/components/search/SearchFilters'
import { MovieCard } from '@/components/movie/MovieCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { MovieGridSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/StatusState'
import {
  sanitizeGenre,
  sanitizeQuery,
  sanitizeRating,
  sanitizeSortBy,
  sanitizeYear,
} from '@/lib/filterValidation'
import { useDebounce } from '@/hooks/useDebounce'
import { useMovieSearch, type SearchMediaType } from '@/hooks/useMovieSearch'
import { useWatchlist } from '@/hooks/useWatchlist'

const mediaTypeOptions: Array<{ value: SearchMediaType; label: string }> = [
  { value: 'both', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'Series' },
]

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [mediaType, setMediaType] = useState<SearchMediaType>('both')
  const [filters, setFilters] = useState<Required<Pick<DiscoverParams, 'genre' | 'year' | 'minRating' | 'sortBy'>>>({
    genre: '',
    year: '',
    minRating: '',
    sortBy: 'popularity.desc',
  })
  const debouncedQuery = useDebounce(sanitizeQuery(query))
  const watchlist = useWatchlist()
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
  const search = useMovieSearch(debouncedQuery, safeFilters, mediaType)

  const movies = useMemo(() => {
    const results = search.data?.results ?? []
    if (!debouncedQuery.trim()) return results
    return results
      .filter((movie) => (safeFilters.minRating ? movie.vote_average >= Number(safeFilters.minRating) : true))
      .filter((movie) => (safeFilters.genre ? movie.genre_ids?.includes(Number(safeFilters.genre)) : true))
      .sort((a, b) => {
        if (safeFilters.sortBy === 'vote_average.desc') return b.vote_average - a.vote_average
        if (safeFilters.sortBy === 'primary_release_date.desc') return b.release_date.localeCompare(a.release_date)
        return b.popularity - a.popularity
      })
  }, [search.data?.results, debouncedQuery, safeFilters])

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Search TMDB</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Find your next obsession.</h1>
      </div>
      <div className="space-y-4">
        <div className="grid gap-3 rounded-3xl border border-white/[0.07] bg-white/[0.045] p-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <span className="sr-only">Search movies and series</span>
            <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              className="field h-14 w-full rounded-2xl border-white/[0.08] bg-white/[0.055] !pl-14 !pr-4 text-base"
              placeholder="Search movies or series, then refine the mood..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="flex rounded-2xl border border-white/[0.08] bg-black/20 p-1" aria-label="Search media type">
            {mediaTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMediaType(option.value)}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 lg:flex-none ${mediaType === option.value
                  ? 'bg-white text-[#05070c]'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
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
      </div>

      <div className="mt-8">
        {search.isLoading ? <MovieGridSkeleton count={12} /> : null}
        {search.isError ? <ErrorState error={search.error} onRetry={() => search.refetch()} /> : null}
        {!search.isLoading && !search.isError && movies.length === 0 ? (
          <EmptyState title="No matches" message="Try a broader search, switch between movies and series, or lower the rating filter." />
        ) : null}
        {!search.isLoading && !search.isError && movies.length > 0 ? (
          <div className="movie-grid">
            {movies.map((movie) => (
              <MovieCard key={`${movie.media_type ?? 'movie'}-${movie.id}`} movie={movie} genres={genres.data?.genres} saved={watchlist.getSaved(movie)} onAdd={watchlist.addMovie} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
