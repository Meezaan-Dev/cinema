import { useQuery } from '@tanstack/react-query'
import { Search, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import {
  getGenres,
  getNewMovies,
  getNewSeries,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  queryKeys,
} from '@/api/tmdbEndpoints'
import { Button } from '@/components/ui/Button'
import { MovieSection } from '@/components/movie/MovieSection'
import { ErrorState } from '@/components/ui/StatusState'
import { imageUrl } from '@/lib/formatters'
import { useWatchlist } from '@/hooks/useWatchlist'

export function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const watchlist = useWatchlist()
  const genresQuery = useQuery({ queryKey: queryKeys.genres, queryFn: getGenres })
  const trending = useQuery({ queryKey: queryKeys.trending, queryFn: getTrendingMovies })
  const newMovies = useQuery({ queryKey: queryKeys.newMovies, queryFn: getNewMovies })
  const newSeries = useQuery({ queryKey: queryKeys.newSeries, queryFn: getNewSeries })
  const popular = useQuery({ queryKey: queryKeys.popular, queryFn: getPopularMovies })
  const topRated = useQuery({ queryKey: queryKeys.topRated, queryFn: getTopRatedMovies })

  const hero = trending.data?.results[0]
  const heroImage = imageUrl(hero?.backdrop_path, 'original')

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`)
  }

  return (
    <>
      <section className="relative overflow-hidden">
        {heroImage ? <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-48" /> : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070c_0%,rgba(5,7,12,.92)_36%,rgba(5,7,12,.42)_72%,rgba(5,7,12,.78)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05070c] to-transparent" />
        <div className="relative mx-auto grid min-h-[72svh] max-w-7xl content-end px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Movie discovery, with taste memory</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-7xl">
              Find the film your night is asking for.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              See what is new across movies and series, then describe the vibe you want and let smart recommendations narrow the night.
            </p>
            <form onSubmit={submitSearch} className="mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.08] p-2 shadow-[0_24px_70px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:flex-row">
              <label className="sr-only" htmlFor="home-search">Search movies</label>
              <input id="home-search" className="field flex-1 border-0 bg-transparent" placeholder="Search for Aftersun, Dune, Parasite..." value={query} onChange={(event) => setQuery(event.target.value)} />
              <Button type="submit" variant="primary" className="shrink-0">
                <Search className="size-4" aria-hidden="true" />
                Search
              </Button>
            </form>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="button-link button-link-primary" to="/picker">
                <Sparkles className="size-4" aria-hidden="true" />
                What Should I Watch Tonight?
              </Link>
              {hero ? <Link className="button-link" to={`/movie/${hero.id}`}>Open featured film</Link> : null}
            </div>
          </div>
        </div>
      </section>

      {trending.isError ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <ErrorState error={trending.error} onRetry={() => trending.refetch()} />
        </section>
      ) : null}

      <MovieSection title="What's new in movies" eyebrow="Fresh arrivals" movies={newMovies.data?.results.slice(0, 12)} isLoading={newMovies.isLoading} isError={newMovies.isError} error={newMovies.error} onRetry={() => newMovies.refetch()} genres={genresQuery.data?.genres} savedById={watchlist.byId} onAdd={watchlist.addMovie} horizontal />
      <MovieSection title="What's new in series" eyebrow="Now airing" movies={newSeries.data?.results.slice(0, 12)} isLoading={newSeries.isLoading} isError={newSeries.isError} error={newSeries.error} onRetry={() => newSeries.refetch()} genres={genresQuery.data?.genres} savedById={watchlist.byId} onAdd={watchlist.addMovie} horizontal />
      <MovieSection title="Trending this week" eyebrow="Featured" movies={trending.data?.results.slice(0, 12)} isLoading={trending.isLoading} isError={trending.isError} error={trending.error} onRetry={() => trending.refetch()} genres={genresQuery.data?.genres} savedById={watchlist.byId} onAdd={watchlist.addMovie} horizontal />
      <MovieSection title="Popular movies" eyebrow="Browse" movies={popular.data?.results.slice(0, 10)} isLoading={popular.isLoading} isError={popular.isError} error={popular.error} onRetry={() => popular.refetch()} genres={genresQuery.data?.genres} savedById={watchlist.byId} onAdd={watchlist.addMovie} />
      <MovieSection title="Top rated" eyebrow="Critic signal" movies={topRated.data?.results.slice(0, 10)} isLoading={topRated.isLoading} isError={topRated.isError} error={topRated.error} onRetry={() => topRated.refetch()} genres={genresQuery.data?.genres} savedById={watchlist.byId} onAdd={watchlist.addMovie} />
    </>
  )
}
