import { Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { getYear, formatRating } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { TmdbMovie } from '@/types/tmdb'
import { MoviePoster } from './MoviePoster'

type MovieCardProps = {
  movie: TmdbMovie
  compact?: boolean
}

export function MovieCard({ movie, compact }: MovieCardProps) {
  const mediaType = movie.media_type ?? 'movie'
  const detailsPath = mediaType === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '80px' }}
      transition={{ duration: 0.35 }}
      className="group"
    >
      <Link
        to={detailsPath}
        className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00E054]"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#1C2228] shadow-[0_12px_40px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.06] transition duration-300 group-hover:-translate-y-1 group-hover:ring-[#00E054]/30">
          <MoviePoster
            path={movie.poster_path}
            title={movie.title}
            className="w-full transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Star className="mr-0.5 inline size-3 fill-[#00E054] text-[#00E054]" aria-hidden="true" />
            {formatRating(movie.vote_average)}
          </div>
          {mediaType === 'tv' ? (
            <div className="absolute bottom-2 left-2 rounded-md bg-[#00E054] px-2 py-0.5 text-xs font-semibold text-[#14181C]">
              TV
            </div>
          ) : null}
        </div>
      </Link>
      <div className={cn('mt-2.5 space-y-0.5', compact && 'mt-2')}>
        <h3 className="line-clamp-2 min-h-9 text-sm font-medium leading-snug text-white">{movie.title}</h3>
        <p className="text-xs text-[#99AABB]">{getYear(movie.release_date)}</p>
      </div>
    </motion.article>
  )
}
