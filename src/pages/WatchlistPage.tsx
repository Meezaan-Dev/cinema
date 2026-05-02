import { Download, Heart } from 'lucide-react'
import { useMemo, useState } from 'react'

import { MovieCard } from '@/components/movie/MovieCard'
import { Button } from '@/components/ui/Button'
import { RatingControl } from '@/components/ui/RatingControl'
import { StatusState } from '@/components/ui/StatusState'
import { getYear } from '@/lib/formatters'
import { useWatchlist } from '@/hooks/useWatchlist'

type WatchFilter = 'all' | 'watched' | 'unwatched'
type WatchSort = 'addedAt' | 'rating' | 'releaseDate'

export function WatchlistPage() {
  const watchlist = useWatchlist()
  const [filter, setFilter] = useState<WatchFilter>('all')
  const [sort, setSort] = useState<WatchSort>('addedAt')

  const movies = useMemo(() => {
    return [...watchlist.movies]
      .filter((movie) => filter === 'all' || (filter === 'watched' ? movie.isWatched : !movie.isWatched))
      .sort((a, b) => {
        if (sort === 'rating') return (b.personalRating ?? b.voteAverage) - (a.personalRating ?? a.voteAverage)
        if (sort === 'releaseDate') return b.releaseDate.localeCompare(a.releaseDate)
        return b.addedAt.localeCompare(a.addedAt)
      })
  }, [filter, sort, watchlist.movies])

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Personal shelf</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Watchlist</h1>
          <p className="mt-2 text-slate-400">{watchlist.movies.length} saved movies, {watchlist.movies.filter((movie) => movie.isWatched).length} watched.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select className="field w-auto" value={filter} onChange={(event) => setFilter(event.target.value as WatchFilter)} aria-label="Filter watchlist">
            <option value="all">All</option>
            <option value="watched">Watched</option>
            <option value="unwatched">Unwatched</option>
          </select>
          <select className="field w-auto" value={sort} onChange={(event) => setSort(event.target.value as WatchSort)} aria-label="Sort watchlist">
            <option value="addedAt">Date added</option>
            <option value="rating">Rating</option>
            <option value="releaseDate">Release year</option>
          </select>
          <Button type="button" variant="primary" onClick={watchlist.exportCsv} disabled={watchlist.movies.length === 0}>
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>

      {movies.length === 0 ? (
        <StatusState title="Your watchlist is waiting" message="Save movies from the home, search, or detail pages and they will stay here after refresh." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="movie-grid">
            {movies.map((movie) => <MovieCard key={movie.id} movie={movie} saved={movie} />)}
          </div>
          <aside className="space-y-3">
            {movies.slice(0, 6).map((movie) => (
              <div key={movie.id} className="rounded-3xl border border-white/[0.07] bg-white/[0.045] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-white">{movie.title}</h2>
                    <p className="text-sm text-slate-400">{getYear(movie.releaseDate)}</p>
                  </div>
                  <Button size="icon" variant={movie.isFavourite ? 'primary' : 'ghost'} type="button" onClick={() => watchlist.toggleFavourite(movie)} aria-label={`Toggle favourite for ${movie.title}`}>
                    <Heart className={movie.isFavourite ? 'size-4 fill-current' : 'size-4'} aria-hidden="true" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <Button size="sm" type="button" onClick={() => watchlist.toggleWatched(movie)}>
                    {movie.isWatched ? 'Watched' : 'Mark watched'}
                  </Button>
                  <RatingControl value={movie.personalRating} onChange={(rating) => watchlist.setRating(movie, rating)} />
                </div>
              </div>
            ))}
          </aside>
        </div>
      )}
    </section>
  )
}
