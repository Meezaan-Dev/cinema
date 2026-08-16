import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Play, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import {
  getMovieCredits,
  getMovieDetails,
  getMovieVideos,
  getSimilarMovies,
  queryKeys,
} from '@/api/tmdbEndpoints'
import { CastRail } from '@/components/movie/CastRail'
import { MoviePoster } from '@/components/movie/MoviePoster'
import { MovieSection } from '@/components/movie/MovieSection'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState, StatusState } from '@/components/ui/StatusState'
import { formatRating, formatRuntime, getYear, imageUrl } from '@/lib/formatters'
import { buildImdbUrl, buildMagicLinkUrl, sanitizeYoutubeKey } from '@/lib/sanitize'
import { parsePositiveIntegerParam } from '@/lib/routeParams'

export function MovieDetailPage() {
  const { movieId = '' } = useParams()
  const movieTmdbId = parsePositiveIntegerParam(movieId)
  const isValidMovieId = movieTmdbId !== null

  const details = useQuery({
    queryKey: queryKeys.detail(movieTmdbId ?? movieId),
    queryFn: () => getMovieDetails(movieTmdbId ?? ''),
    enabled: isValidMovieId,
  })
  const credits = useQuery({
    queryKey: queryKeys.credits(movieTmdbId ?? movieId),
    queryFn: () => getMovieCredits(movieTmdbId ?? ''),
    enabled: isValidMovieId,
  })
  const videos = useQuery({
    queryKey: queryKeys.videos(movieTmdbId ?? movieId),
    queryFn: () => getMovieVideos(movieTmdbId ?? ''),
    enabled: isValidMovieId,
  })
  const similar = useQuery({
    queryKey: queryKeys.similar(movieTmdbId ?? movieId),
    queryFn: () => getSimilarMovies(movieTmdbId ?? ''),
    enabled: isValidMovieId,
  })

  const movie = details.data
  const trailerCandidate =
    videos.data?.results.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ??
    videos.data?.results.find((video) => video.site === 'YouTube')
  const trailerKey = sanitizeYoutubeKey(trailerCandidate?.key)
  const backdrop = imageUrl(movie?.backdrop_path, 'original')
  const imdbUrl = buildImdbUrl(movie?.imdb_id)
  const magicLinkUrl = buildMagicLinkUrl(movie?.imdb_id)
  const detailItems = movie
    ? [
        { label: 'Release date', value: movie.release_date || 'Unknown' },
        { label: 'Status', value: movie.status || 'Unknown' },
        { label: 'Runtime', value: formatRuntime(movie.runtime) },
        { label: 'TMDB rating', value: `${formatRating(movie.vote_average)} / 10` },
      ]
    : []

  if (!isValidMovieId) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <StatusState title="Movie not found" message="Movie URLs need a valid TMDB movie ID." />
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

  if (details.isError || !movie) {
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
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-14 xl:grid-cols-[260px_minmax(0,1fr)]">
          <MoviePoster
            path={movie.poster_path}
            title={movie.title}
            className="w-full shadow-[0_24px_60px_rgba(0,0,0,.5)] sm:w-64 lg:w-full"
            size="w780"
          />
          <div className="min-w-0 self-end">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#99AABB]">
              {getYear(movie.release_date)} · {formatRuntime(movie.runtime)}
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl xl:text-[3.5rem]">
              {movie.title}
            </h1>
            {movie.tagline ? <p className="mt-3 text-lg italic text-[#99AABB]">{movie.tagline}</p> : null}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-white/[0.08] bg-[#1C2228] px-3 py-1 text-sm text-[#99AABB]"
                >
                  {genre.name}
                </span>
              ))}
              <span className="inline-flex items-center gap-1 rounded-full bg-[#00E054] px-3 py-1 text-sm font-semibold text-[#14181C]">
                <Star className="size-4 fill-current" aria-hidden="true" />
                {formatRating(movie.vote_average)}
              </span>
            </div>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#99AABB]">
              {movie.overview || 'No overview is available for this movie yet.'}
            </p>
            <dl className="mt-6 grid max-w-4xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {detailItems.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/[0.08] bg-[#1C2228]/85 p-4 backdrop-blur">
                  <dt className="text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-white">{item.value}</dd>
                </div>
              ))}
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
                title={`${movie.title} trailer`}
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

      <MovieSection
        title="Similar Movies"
        movies={similar.data?.results.slice(0, 10)}
        isLoading={similar.isLoading}
        isError={similar.isError}
        error={similar.error}
        onRetry={() => similar.refetch()}
      />

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <Link to="/" className="inline-block text-sm font-medium text-[#99AABB] hover:text-white">
          Back to Discover
        </Link>
      </section>
    </>
  )
}
