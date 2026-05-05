import { Check, Heart, Plus, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { getYear, formatRating } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { TmdbGenre, TmdbMovie } from '@/types/tmdb'
import type { UserMovie } from '@/types/movie'
import { toUserMovie } from '@/types/movie'
import { MoviePoster } from './MoviePoster'

type MovieCardProps = {
  movie: TmdbMovie | UserMovie
  genres?: TmdbGenre[]
  saved?: UserMovie
  onAdd?: (movie: UserMovie) => void
  compact?: boolean
}

function isUserMovie(movie: TmdbMovie | UserMovie): movie is UserMovie {
  return 'posterPath' in movie
}

export function MovieCard({ movie, genres = [], saved, onAdd, compact }: MovieCardProps) {
  const userMovie = isUserMovie(movie) ? movie : saved
  const title = movie.title
  const posterPath = isUserMovie(movie) ? movie.posterPath : movie.poster_path
  const releaseDate = isUserMovie(movie) ? movie.releaseDate : movie.release_date
  const voteAverage = isUserMovie(movie) ? movie.voteAverage : movie.vote_average
  const mediaType = isUserMovie(movie) ? movie.mediaType ?? 'movie' : movie.media_type ?? 'movie'
  const detailsPath = mediaType === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '80px' }}
      transition={{ duration: 0.35 }}
      className="group"
    >
      <Link to={detailsPath} className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300">
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-white/[0.055] shadow-[0_16px_48px_rgba(0,0,0,0.32)] ring-1 ring-white/[0.055] transition duration-300 group-hover:-translate-y-1 group-hover:ring-white/20">
          <MoviePoster path={posterPath} title={title} className="w-full transition duration-500 group-hover:scale-[1.035]" />
          <div className="absolute left-2 top-2 flex gap-1">
            {userMovie?.isWatched ? (
              <span className="rounded-full bg-sky-300/95 p-1 text-slate-950 shadow-lg shadow-black/25" aria-label="Watched">
                <Check className="size-4" aria-hidden="true" />
              </span>
            ) : null}
            {userMovie?.isFavourite ? (
              <span className="rounded-full bg-fuchsia-300/95 p-1 text-slate-950 shadow-lg shadow-black/25" aria-label="Favourite">
                <Heart className="size-4 fill-current" aria-hidden="true" />
              </span>
            ) : null}
          </div>
          <div className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Star className="mr-1 inline size-3 fill-white text-white" aria-hidden="true" />
            {formatRating(voteAverage)}
          </div>
          {mediaType === 'tv' ? (
            <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-[#05070c] backdrop-blur-md">
              Series
            </div>
          ) : null}
        </div>
      </Link>
      <div className={cn('mt-3 space-y-1', compact && 'mt-2')}>
        <h3 className="line-clamp-2 min-h-9 text-sm font-medium leading-snug text-white">{title}</h3>
        <p className="text-xs text-slate-500">{getYear(releaseDate)}</p>
        {onAdd && !saved && !isUserMovie(movie) ? (
          <Button
            className="mt-2 w-full"
            size="sm"
            type="button"
            onClick={() => onAdd(toUserMovie(movie, genres))}
          >
            <Plus className="size-4" aria-hidden="true" />
            Watchlist
          </Button>
        ) : null}
      </div>
    </motion.article>
  )
}
