import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ListVideo, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { aiSummaryKeys, getAiSummary } from '@/api/aiSummaries'
import { getSeriesDetails, getSeriesExternalIds, queryKeys } from '@/api/tmdbEndpoints'
import { MovieActions } from '@/components/movie/MovieActions'
import { MoviePoster } from '@/components/movie/MoviePoster'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState, StatusState } from '@/components/ui/StatusState'
import { formatRating, getYear, imageUrl } from '@/lib/formatters'
import { parsePositiveIntegerParam } from '@/lib/routeParams'
import { useAuth } from '@/hooks/useAuth'
import { useWatchlist } from '@/hooks/useWatchlist'
import { useWatchlistPicker } from '@/hooks/useWatchlistPicker'
import type { TmdbSeriesDetails } from '@/types/tmdb'
import type { UserMovie } from '@/types/movie'

function toUserSeries(series: TmdbSeriesDetails): UserMovie {
  return {
    id: series.id,
    title: series.name,
    posterPath: series.poster_path,
    backdropPath: series.backdrop_path,
    releaseDate: series.first_air_date,
    voteAverage: series.vote_average,
    genres: series.genres.map((genre) => genre.name),
    addedAt: new Date().toISOString(),
    isWatched: false,
    isFavourite: false,
    mediaType: 'tv',
  }
}

function displayDate(date: string) {
  return date || 'TBA'
}

export function SeriesDetailPage() {
  const { seriesId = '' } = useParams()
  const seriesTmdbId = parsePositiveIntegerParam(seriesId)
  const isValidSeriesId = seriesTmdbId !== null
  const { user } = useAuth()
  const watchlist = useWatchlist()
  const watchlistPicker = useWatchlistPicker()
  const details = useQuery({
    queryKey: queryKeys.seriesDetail(seriesTmdbId ?? seriesId),
    queryFn: () => getSeriesDetails(seriesTmdbId ?? ''),
    enabled: isValidSeriesId,
  })
  const externalIds = useQuery({
    queryKey: queryKeys.seriesExternalIds(seriesTmdbId ?? seriesId),
    queryFn: () => getSeriesExternalIds(seriesTmdbId ?? ''),
    enabled: isValidSeriesId,
  })
  const series = details.data
  const aiSummary = useQuery({
    queryKey: aiSummaryKeys.summary('tv', seriesTmdbId ?? seriesId),
    queryFn: () =>
      getAiSummary({
        mediaType: 'tv',
        tmdbId: series?.id ?? 0,
        title: series?.name ?? '',
        overview: series?.overview ?? '',
        releaseDate: series?.first_air_date ?? '',
        genres: series?.genres.map((genre) => genre.name) ?? [],
        status: series?.status,
      }),
    enabled: Boolean(series),
    retry: false,
  })

  const backdrop = imageUrl(series?.backdrop_path, 'original')

  if (!isValidSeriesId) {
    return (
      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
        <StatusState title="Series not found" message="Series URLs need a valid TMDB series ID." />
      </section>
    )
  }

  if (details.isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
        <Skeleton className="h-[420px] w-full" />
      </section>
    )
  }

  if (details.isError || !series) {
    return (
      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
        <ErrorState error={details.error} onRetry={() => details.refetch()} />
      </section>
    )
  }

  const userSeries = toUserSeries(series)
  const saved = user ? undefined : watchlist.getSaved(userSeries)
  const imdbUrl = externalIds.data?.imdb_id ? `https://www.imdb.com/title/${externalIds.data.imdb_id}/` : undefined
  const magicLinkUrl = externalIds.data?.imdb_id ? `https://www.playimdb.com/title/${externalIds.data.imdb_id}/` : undefined

  return (
    <>
      <section className="relative overflow-hidden">
        {backdrop ? <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-48" /> : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,12,.5),#05070c_88%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-6 px-3 py-8 sm:gap-8 sm:px-6 lg:grid-cols-[320px_1fr] lg:py-16">
          <MoviePoster path={series.poster_path} title={series.name} className="w-full shadow-[0_24px_70px_rgba(0,0,0,.48)] sm:w-72 lg:w-full" size="w780" />
          <div className="max-w-4xl self-end">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
              {getYear(series.first_air_date)} • {series.status || 'Status unknown'}
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">{series.name}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {series.genres.map((genre) => (
                <span key={genre.id} className="rounded-full border border-white/[0.08] bg-white/[0.08] px-3 py-1 text-sm text-slate-200">
                  {genre.name}
                </span>
              ))}
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#05070c]">
                <Star className="mr-1 inline size-4 fill-current" aria-hidden="true" />
                {formatRating(series.vote_average)} TMDB
              </span>
            </div>
            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-200">{series.overview || 'No overview is available for this series yet.'}</p>
            <dl className="mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.06] p-4">
                <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  First aired
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">{displayDate(series.first_air_date)}</dd>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.06] p-4">
                <dt className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Seasons</dt>
                <dd className="mt-2 text-lg font-semibold text-white">{series.number_of_seasons}</dd>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.06] p-4">
                <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  <ListVideo className="size-4" aria-hidden="true" />
                  Episodes
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">{series.number_of_episodes}</dd>
              </div>
            </dl>
            <div className="mt-8 max-w-3xl">
              <MovieActions
                movie={userSeries}
                saved={saved}
                onAdd={watchlistPicker.open}
                onRemove={watchlist.removeMovie}
                onRate={watchlist.setRating}
                magicLinkUrl={magicLinkUrl}
                imdbUrl={imdbUrl}
                aiSummary={aiSummary.data}
                isAiSummaryLoading={aiSummary.isLoading}
                aiSummaryError={aiSummary.error}
                onAiSummaryRetry={() => {
                  aiSummary.refetch()
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Episode guide</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">Seasons</h2>
        </div>
        {series.seasons.length === 0 ? (
          <StatusState title="No seasons listed" message="TMDB does not have season information for this series yet." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {series.seasons.map((season) => (
              <article key={season.id} className="grid grid-cols-[92px_1fr] gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.045] p-3 sm:grid-cols-[116px_1fr]">
                <MoviePoster path={season.poster_path} title={season.name} className="w-full rounded-xl" size="w342" />
                <div className="min-w-0 py-1">
                  <h3 className="line-clamp-2 text-base font-semibold text-white">{season.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {season.episode_count} {season.episode_count === 1 ? 'episode' : 'episodes'} • {displayDate(season.air_date)}
                  </p>
                  {season.overview ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{season.overview}</p> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mx-auto max-w-7xl px-3 pb-10 sm:px-6">
        <Link to="/search" className="text-sm font-medium text-slate-400 hover:text-white">Back to discovery</Link>
      </div>
    </>
  )
}
