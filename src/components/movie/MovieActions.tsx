import { Check, Heart, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { RatingControl } from '@/components/ui/RatingControl'
import type { UserMovie } from '@/types/movie'

type MovieActionsProps = {
  movie: UserMovie
  saved?: UserMovie
  onAdd: (movie: UserMovie) => void
  onRemove: (movie: UserMovie) => void
  onWatched: (movie: UserMovie) => void
  onFavourite: (movie: UserMovie) => void
  onRate: (movie: UserMovie, rating?: number) => void
}

export function MovieActions({ movie, saved, onAdd, onRemove, onWatched, onFavourite, onRate }: MovieActionsProps) {
  const current = saved ?? movie

  return (
    <div className="rounded-3xl border border-white/[0.07] bg-white/[0.06] p-4 backdrop-blur-2xl">
      <div className="grid gap-3 sm:grid-cols-3">
        {saved ? (
          <Button variant="danger" type="button" onClick={() => onRemove(current)}>
            <Trash2 className="size-4" aria-hidden="true" />
            Remove
          </Button>
        ) : (
          <Button variant="primary" type="button" onClick={() => onAdd(movie)}>
            <Plus className="size-4" aria-hidden="true" />
            Watchlist
          </Button>
        )}
        <Button variant={current.isWatched ? 'primary' : 'secondary'} type="button" onClick={() => onWatched(current)}>
          <Check className="size-4" aria-hidden="true" />
          {current.isWatched ? 'Watched' : 'Unwatched'}
        </Button>
        <Button variant={current.isFavourite ? 'primary' : 'secondary'} type="button" onClick={() => onFavourite(current)}>
          <Heart className={current.isFavourite ? 'size-4 fill-current' : 'size-4'} aria-hidden="true" />
          Favourite
        </Button>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-4">
        <span className="text-sm font-medium text-slate-300">Your rating</span>
        <RatingControl value={current.personalRating} onChange={(rating) => onRate(current, rating)} />
      </div>
    </div>
  )
}
