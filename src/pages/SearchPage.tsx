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

const mediaTypeOptions: Array<{ value: SearchMediaType; label: string }> = [
  { value: 'both', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'TV Shows' },
]

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(() => sanitizeQuery(searchParams.get('q') ?? ''))
  const [mediaType, setMediaType] = useState<SearchMediaType>('both')
  const [filters, setFilters] = useState<Required<Pick<DiscoverParams, 'genre' | 'year' | 'minRating' | 'sortBy'>>>({
    genre: '',
    year: '',
    minRating: '',
    sortBy: 'popularity.desc',
  })
  const debouncedQuery = useDebounce(sanitizeQuery(query))
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

  const showEmptyPrompt = !debouncedQuery.trim() && !search.isLoading

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#99AABB]">Search</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">Find movies & TV shows</h1>
        <p className="mt-3 text-base text-[#99AABB]">Instant search across TMDB with filters and suggestions.</p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 rounded-2xl border border-white/[0.08] bg-[#1C2228] p-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <span className="sr-only">Search movies and TV shows</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#99AABB]"
              aria-hidden="true"
            />
            <input
              className="field h-14 w-full rounded-xl border-white/[0.08] bg-[#202830] !pl-12 !pr-4 text-base"
              placeholder="Search for Breaking Bad, Dune, Parasite..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />
          </label>
          <div className="flex rounded-xl border border-white/[0.08] bg-[#14181C] p-1" aria-label="Search media type">
            {mediaTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMediaType(option.value)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054] lg:flex-none ${
                  mediaType === option.value
                    ? 'bg-[#00E054] text-[#14181C]'
                    : 'text-[#99AABB] hover:bg-white/5 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {debouncedQuery.trim() ? (
          <p className="text-sm text-[#99AABB]">
            Showing results for <span className="font-medium text-white">&ldquo;{debouncedQuery}&rdquo;</span>
          </p>
        ) : null}

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
        {showEmptyPrompt && !search.isError ? (
          <EmptyState
            title="Start typing to search"
            message="Search movies and TV shows by title. Results update as you type."
          />
        ) : null}
        {!search.isLoading && !search.isError && debouncedQuery.trim() && movies.length === 0 ? (
          <EmptyState
            title="No matches"
            message="Try a broader search, switch between movies and TV shows, or lower the rating filter."
          />
        ) : null}
        {!search.isLoading && !search.isError && movies.length > 0 ? (
          <div className="movie-grid">
            {movies.map((movie) => (
              <MovieCard key={`${movie.media_type ?? 'movie'}-${movie.id}`} movie={movie} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
