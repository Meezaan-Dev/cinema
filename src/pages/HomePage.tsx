import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  getGenres,
  getPopularMovies,
  getPopularSeries,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
  queryKeys,
} from '@/api/tmdbEndpoints'
import { MovieSection } from '@/components/movie/MovieSection'
import { ErrorState } from '@/components/ui/StatusState'
import { formatRating, getYear, imageUrl } from '@/lib/formatters'

export function HomePage() {
  const genresQuery = useQuery({ queryKey: queryKeys.genres, queryFn: getGenres })
  const trending = useQuery({ queryKey: queryKeys.trending, queryFn: getTrendingMovies })
  const popular = useQuery({ queryKey: queryKeys.popular, queryFn: getPopularMovies })
  const popularSeries = useQuery({ queryKey: queryKeys.popularSeries, queryFn: getPopularSeries })
  const topRated = useQuery({ queryKey: queryKeys.topRated, queryFn: getTopRatedMovies })
  const upcoming = useQuery({ queryKey: queryKeys.upcoming, queryFn: getUpcomingMovies })

  const hero = trending.data?.results[0]
  const heroImage = imageUrl(hero?.backdrop_path, 'original')
  const heroGenres = hero?.genre_ids
    ?.map((id) => genresQuery.data?.genres.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3)

  const heroPath = hero
    ? hero.media_type === 'tv'
      ? `/tv/${hero.id}`
      : `/movie/${hero.id}`
    : '/'

  return (
    <>
      <section className="relative overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#14181C_0%,rgba(20,24,28,.85)_40%,rgba(20,24,28,.3)_70%,rgba(20,24,28,.9)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#14181C] to-transparent" />
        <div className="relative mx-auto flex min-h-[70svh] max-w-7xl flex-col justify-end px-4 py-16 sm:px-6">
          {hero ? (
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#99AABB]">Featured</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
                {hero.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#99AABB]">
                <span>{getYear(hero.release_date)}</span>
                {heroGenres?.length ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{heroGenres.join(', ')}</span>
                  </>
                ) : null}
                <span className="inline-flex items-center gap-1 rounded-md bg-[#00E054]/10 px-2 py-0.5 font-semibold text-[#00E054]">
                  <Star className="size-3.5 fill-current" aria-hidden="true" />
                  {formatRating(hero.vote_average)}
                </span>
              </div>
              {hero.overview ? (
                <p className="mt-5 max-w-xl text-base leading-7 text-[#99AABB] line-clamp-3">{hero.overview}</p>
              ) : null}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={heroPath} className="button-link button-link-accent">
                  View details
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link to="/search" className="button-link">
                  Search titles
                </Link>
              </div>
            </div>
          ) : trending.isLoading ? (
            <div className="h-48 animate-pulse rounded-2xl bg-[#1C2228]" />
          ) : null}
        </div>
      </section>

      {trending.isError ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <ErrorState error={trending.error} onRetry={() => trending.refetch()} />
        </section>
      ) : null}

      <MovieSection
        title="Trending Now"
        eyebrow="This week"
        movies={trending.data?.results.slice(0, 12)}
        isLoading={trending.isLoading}
        isError={trending.isError}
        error={trending.error}
        onRetry={() => trending.refetch()}
        carousel
      />
      <MovieSection
        title="Popular Movies"
        eyebrow="Browse"
        movies={popular.data?.results.slice(0, 10)}
        isLoading={popular.isLoading}
        isError={popular.isError}
        error={popular.error}
        onRetry={() => popular.refetch()}
        exploreTo="/movies"
      />
      <MovieSection
        title="Popular TV Shows"
        eyebrow="Series"
        movies={popularSeries.data?.results.slice(0, 10)}
        isLoading={popularSeries.isLoading}
        isError={popularSeries.isError}
        error={popularSeries.error}
        onRetry={() => popularSeries.refetch()}
        exploreTo="/tv-shows"
      />
      <MovieSection
        title="Top Rated"
        eyebrow="Critics & audiences"
        movies={topRated.data?.results.slice(0, 10)}
        isLoading={topRated.isLoading}
        isError={topRated.isError}
        error={topRated.error}
        onRetry={() => topRated.refetch()}
        exploreTo="/movies"
      />
      <MovieSection
        title="Coming Soon"
        eyebrow="Up next"
        movies={upcoming.data?.results.slice(0, 10)}
        isLoading={upcoming.isLoading}
        isError={upcoming.isError}
        error={upcoming.error}
        onRetry={() => upcoming.refetch()}
        exploreTo="/movies"
      />
    </>
  )
}
