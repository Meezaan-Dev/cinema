import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Play, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { aiSummaryKeys, getAiSummary } from '@/api/aiSummaries'
import { getMovieCredits, getMovieDetails, getMovieVideos, getSimilarMovies, queryKeys } from '@/api/tmdbEndpoints'
import { MovieActions } from '@/components/movie/MovieActions'
import { MoviePoster } from '@/components/movie/MoviePoster'
import { MovieSection } from '@/components/movie/MovieSection'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState, StatusState } from '@/components/ui/StatusState'
import { formatRating, formatRuntime, getYear, imageUrl } from '@/lib/formatters'
import { parsePositiveIntegerParam } from '@/lib/routeParams'
import { useAuth } from '@/hooks/useAuth'
import { useWatchlist } from '@/hooks/useWatchlist'
import { useWatchlistPicker } from '@/hooks/useWatchlistPicker'
import { toUserMovie } from '@/types/movie'

export function MovieDetailPage() {
  const { movieId = '' } = useParams()
  const movieTmdbId = parsePositiveIntegerParam(movieId)
  const isValidMovieId = movieTmdbId !== null
  const { user } = useAuth()
  const watchlist = useWatchlist()
  const watchlistPicker = useWatchlistPicker()
  const details = useQuery({ queryKey: queryKeys.detail(movieTmdbId ?? movieId), queryFn: () => getMovieDetails(movieTmdbId ?? ''), enabled: isValidMovieId })
  const credits = useQuery({ queryKey: queryKeys.credits(movieTmdbId ?? movieId), queryFn: () => getMovieCredits(movieTmdbId ?? ''), enabled: isValidMovieId })
  const videos = useQuery({ queryKey: queryKeys.videos(movieTmdbId ?? movieId), queryFn: () => getMovieVideos(movieTmdbId ?? ''), enabled: isValidMovieId })
  const similar = useQuery({ queryKey: queryKeys.similar(movieTmdbId ?? movieId), queryFn: () => getSimilarMovies(movieTmdbId ?? ''), enabled: isValidMovieId })
  const movie = details.data
  const aiSummary = useQuery({
    queryKey: aiSummaryKeys.summary('movie', movieTmdbId ?? movieId),
    queryFn: () =>
      getAiSummary({
        mediaType: 'movie',
        tmdbId: movie?.id ?? 0,
        title: movie?.title ?? '',
        overview: movie?.overview ?? '',
        releaseDate: movie?.release_date ?? '',
        genres: movie?.genres.map((genre) => genre.name) ?? [],
        runtime: movie?.runtime,
      }),
    enabled: Boolean(movie),
    retry: false,
  })

  const saved = movie && !user ? watchlist.getSaved(movie) : undefined
  const trailer = videos.data?.results.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ?? videos.data?.results.find((video) => video.site === 'YouTube')
  const backdrop = imageUrl(movie?.backdrop_path, 'original')

  if (!isValidMovieId) {
    return (
      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
        <StatusState title="Movie not found" message="Movie URLs need a valid TMDB movie ID." />
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

  if (details.isError || !movie) {
    return (
      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
        <ErrorState error={details.error} onRetry={() => details.refetch()} />
      </section>
    )
  }

  const userMovie = toUserMovie(movie)
  const imdbUrl = movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}/` : undefined
  const magicLinkUrl = movie.imdb_id ? `https://www.playimdb.com/title/${movie.imdb_id}/` : undefined

  return (
    <>
      <section className="relative overflow-hidden">
        {backdrop ? <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-48" /> : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,12,.5),#05070c_88%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-6 px-3 py-8 sm:gap-8 sm:px-6 lg:grid-cols-[320px_1fr] lg:py-16">
          <MoviePoster path={movie.poster_path} title={movie.title} className="w-full shadow-[0_24px_70px_rgba(0,0,0,.48)] sm:w-72 lg:w-full" size="w780" />
          <div className="max-w-4xl self-end">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">{getYear(movie.release_date)} • {formatRuntime(movie.runtime)}</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">{movie.title}</h1>
            {movie.tagline ? <p className="mt-3 text-lg italic text-slate-300">{movie.tagline}</p> : null}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {movie.genres.map((genre) => <span key={genre.id} className="rounded-full border border-white/[0.08] bg-white/[0.08] px-3 py-1 text-sm text-slate-200">{genre.name}</span>)}
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#05070c]">
                <Star className="mr-1 inline size-4 fill-current" aria-hidden="true" />
                {formatRating(movie.vote_average)} TMDB
              </span>
            </div>
            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-200">{movie.overview || 'No overview is available for this movie yet.'}</p>
            <div className="mt-8 max-w-3xl">
              <MovieActions
                movie={userMovie}
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

      <section className="mx-auto grid max-w-7xl gap-6 px-3 py-8 sm:gap-8 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-2xl font-semibold text-white">Cast</h2>
          {credits.isLoading ? <Skeleton className="mt-4 h-28" /> : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {credits.data?.cast.slice(0, 8).map((person) => (
              <div key={person.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4">
                <p className="font-semibold text-white">{person.name}</p>
                <p className="mt-1 text-sm text-slate-400">{person.character}</p>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4">
          <h2 className="text-xl font-semibold text-white">Trailer</h2>
          {trailer ? (
            <>
              <div className="mt-4 aspect-video overflow-hidden rounded-2xl bg-black">
                <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${trailer.key}`} title={`${movie.title} trailer`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
              <a className="button-link mt-4 w-full" href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer">
                <Play className="size-4" aria-hidden="true" />
                Open trailer
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No trailer is available from TMDB yet.</p>
          )}
        </aside>
      </section>

      <MovieSection title="Similar recommendations" movies={similar.data?.results.slice(0, 10)} isLoading={similar.isLoading} isError={similar.isError} error={similar.error} onRetry={() => similar.refetch()} savedByKey={user ? undefined : watchlist.byKey} onAdd={watchlistPicker.open} />
      <div className="mx-auto max-w-7xl px-3 pb-10 sm:px-6">
        <Link to="/search" className="text-sm font-medium text-slate-400 hover:text-white">Back to discovery</Link>
      </div>
    </>
  )
}
