import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ExternalLink, ListVideo, Play, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import {
  getSeriesCredits,
  getSeriesDetails,
  getSeriesExternalIds,
  getSeriesVideos,
  getSimilarSeries,
  queryKeys,
} from '@/api/tmdbEndpoints'
import { CastRail } from '@/components/movie/CastRail'
import { MoviePoster } from '@/components/movie/MoviePoster'
import { MovieSection } from '@/components/movie/MovieSection'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState, StatusState } from '@/components/ui/StatusState'
import { formatRating, getYear, imageUrl } from '@/lib/formatters'
import { buildImdbUrl, buildMagicLinkUrl, sanitizeYoutubeKey } from '@/lib/sanitize'
import { parsePositiveIntegerParam } from '@/lib/routeParams'

function displayDate(date: string) {
  return date || 'TBA'
}

export function SeriesDetailPage() {
  const { seriesId = '' } = useParams()
  const seriesTmdbId = parsePositiveIntegerParam(seriesId)
  const isValidSeriesId = seriesTmdbId !== null

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
  const credits = useQuery({
    queryKey: queryKeys.seriesCredits(seriesTmdbId ?? seriesId),
    queryFn: () => getSeriesCredits(seriesTmdbId ?? ''),
    enabled: isValidSeriesId,
  })
  const videos = useQuery({
    queryKey: queryKeys.seriesVideos(seriesTmdbId ?? seriesId),
    queryFn: () => getSeriesVideos(seriesTmdbId ?? ''),
    enabled: isValidSeriesId,
  })
  const similar = useQuery({
    queryKey: queryKeys.similarSeries(seriesTmdbId ?? seriesId),
    queryFn: () => getSimilarSeries(seriesTmdbId ?? ''),
    enabled: isValidSeriesId,
  })

  const series = details.data
  const backdrop = imageUrl(series?.backdrop_path, 'original')
  const imdbUrl = buildImdbUrl(externalIds.data?.imdb_id)
  const magicLinkUrl = buildMagicLinkUrl(externalIds.data?.imdb_id)
  const trailerCandidate =
    videos.data?.results.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ??
    videos.data?.results.find((video) => video.site === 'YouTube')
  const trailerKey = sanitizeYoutubeKey(trailerCandidate?.key)

  if (!isValidSeriesId) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <StatusState title="Series not found" message="Series URLs need a valid TMDB series ID." />
      </section>
    )
  }

  if (details.isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </section>
    )
  }

  if (details.isError || !series) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <ErrorState error={details.error} onRetry={() => details.refetch()} />
      </section>
    )
  }

  return (
    <>
      <section className="relative overflow-hidden">
        {backdrop ? (
          <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,24,28,.4),#14181C_90%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr] lg:py-14">
          <MoviePoster
            path={series.poster_path}
            title={series.name}
            className="w-full shadow-[0_24px_60px_rgba(0,0,0,.5)] sm:w-64 lg:w-full"
            size="w780"
          />
          <div className="max-w-3xl self-end">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#99AABB]">
              {getYear(series.first_air_date)} · {series.status || 'Status unknown'}
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {series.name}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {series.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-white/[0.08] bg-[#1C2228] px-3 py-1 text-sm text-[#99AABB]"
                >
                  {genre.name}
                </span>
              ))}
              <span className="inline-flex items-center gap-1 rounded-full bg-[#00E054] px-3 py-1 text-sm font-semibold text-[#14181C]">
                <Star className="size-4 fill-current" aria-hidden="true" />
                {formatRating(series.vote_average)}
              </span>
            </div>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#99AABB]">
              {series.overview || 'No overview is available for this series yet.'}
            </p>
            <dl className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.08] bg-[#1C2228] p-4">
                <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  First aired
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">{displayDate(series.first_air_date)}</dd>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#1C2228] p-4">
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">Seasons</dt>
                <dd className="mt-2 text-lg font-semibold text-white">{series.number_of_seasons}</dd>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#1C2228] p-4">
                <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">
                  <ListVideo className="size-4" aria-hidden="true" />
                  Episodes
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">{series.number_of_episodes}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              {magicLinkUrl ? (
                <a className="button-link button-link-accent" href={magicLinkUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Magic Link
                </a>
              ) : null}
              {imdbUrl ? (
                <a className="button-link" href={imdbUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" aria-hidden="true" />
                  View on IMDb
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-semibold text-white">Cast</h2>
        <div className="mt-4">
          <CastRail cast={credits.data?.cast.slice(0, 12) ?? []} isLoading={credits.isLoading} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-semibold text-white">Trailer</h2>
        {trailerKey ? (
          <div className="mt-4">
            <div className="aspect-video max-w-3xl overflow-hidden rounded-xl bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${trailerKey}`}
                title={`${series.name} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <a
              className="button-link mt-4"
              href={`https://www.youtube.com/watch?v=${trailerKey}`}
              target="_blank"
              rel="noreferrer"
            >
              <Play className="size-4" aria-hidden="true" />
              Open on YouTube
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#99AABB]">No trailer is available from TMDB yet.</p>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#99AABB]">Episode guide</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">Seasons</h2>
        </div>
        {series.seasons.length === 0 ? (
          <StatusState title="No seasons listed" message="TMDB does not have season information for this series yet." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {series.seasons.map((season) => (
              <article
                key={season.id}
                className="grid grid-cols-[92px_1fr] gap-4 rounded-xl border border-white/[0.08] bg-[#1C2228] p-3 sm:grid-cols-[116px_1fr]"
              >
                <MoviePoster path={season.poster_path} title={season.name} className="w-full rounded-lg" size="w342" />
                <div className="min-w-0 py-1">
                  <h3 className="line-clamp-2 text-base font-semibold text-white">{season.name}</h3>
                  <p className="mt-1 text-sm text-[#99AABB]">
                    {season.episode_count} {season.episode_count === 1 ? 'episode' : 'episodes'} ·{' '}
                    {displayDate(season.air_date)}
                  </p>
                  {season.overview ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#99AABB]">{season.overview}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <MovieSection
        title="Similar Shows"
        movies={similar.data?.results.slice(0, 10)}
        isLoading={similar.isLoading}
        isError={similar.isError}
        error={similar.error}
        onRetry={() => similar.refetch()}
        exploreTo="/tv-shows"
      />

      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <Link to="/" className="text-sm font-medium text-[#99AABB] hover:text-white">
          Back to Discover
        </Link>
      </div>
    </>
  )
}
