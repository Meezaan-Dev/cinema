import { Check, Heart, Loader2, Star, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { MoviePoster } from '@/components/movie/MoviePoster'
import { Button } from '@/components/ui/Button'
import { RatingControl } from '@/components/ui/RatingControl'
import { WatchlistDecisionGuide } from '@/components/watchlist/WatchlistDecisionGuide'
import { formatRating, getYear } from '@/lib/formatters'
import type { AiSummaryRequest } from '@/types/ai'
import type { CloudWatchlistItem } from '@/types/watchlist'

type SharedWatchlistItemRowProps = {
  item: CloudWatchlistItem
  detailsPath: string
  watched: boolean
  favourite: boolean
  isConfirmingRemove: boolean
  isRemoving: boolean
  isSaving: boolean
  onToggleFavourite: () => void
  onToggleStatus: () => void
  onSetRating: (rating?: number) => void
  onRemove: () => void
}

function StatusBadges({ watched, favourite }: { watched: boolean; favourite: boolean }) {
  if (!watched && !favourite) return null

  return (
    <div className="absolute left-2 top-2 flex gap-1">
      {watched ? (
        <span className="rounded-full bg-sky-300/95 p-0.5 text-slate-950 shadow-lg shadow-black/25" aria-label="Watched">
          <Check className="size-3.5" aria-hidden="true" />
        </span>
      ) : null}
      {favourite ? (
        <span className="rounded-full bg-fuchsia-300/95 p-0.5 text-slate-950 shadow-lg shadow-black/25" aria-label="Favourite">
          <Heart className="size-3.5 fill-current" aria-hidden="true" />
        </span>
      ) : null}
    </div>
  )
}

type SharedWatchlistActionsProps = Pick<
  SharedWatchlistItemRowProps,
  | 'item'
  | 'detailsPath'
  | 'watched'
  | 'favourite'
  | 'isConfirmingRemove'
  | 'isRemoving'
  | 'isSaving'
  | 'onToggleFavourite'
  | 'onToggleStatus'
  | 'onSetRating'
  | 'onRemove'
> & {
  removeLabel: string
  usherInput: AiSummaryRequest
}

function SharedWatchlistActions({
  item,
  detailsPath,
  watched,
  favourite,
  isConfirmingRemove,
  isRemoving,
  isSaving,
  removeLabel,
  usherInput,
  onToggleFavourite,
  onToggleStatus,
  onSetRating,
  onRemove,
}: SharedWatchlistActionsProps) {
  return (
    <div className="mt-8 rounded-3xl border border-white/[0.07] bg-white/[0.06] p-4 backdrop-blur-2xl">
      <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
        <Button
          variant={favourite ? 'primary' : 'secondary'}
          type="button"
          className="min-h-11 w-full touch-manipulation"
          onClick={onToggleFavourite}
          disabled={isSaving}
        >
          <Heart className={favourite ? 'size-4 fill-current' : 'size-4'} aria-hidden="true" />
          {favourite ? 'Favourited' : 'Favourite'}
        </Button>
        <Button
          type="button"
          variant={watched ? 'primary' : 'secondary'}
          className="min-h-11 w-full touch-manipulation"
          onClick={onToggleStatus}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
          {watched ? 'Watched' : 'To watch'}
        </Button>
        <Button
          type="button"
          variant={isConfirmingRemove ? 'danger' : 'ghost'}
          className="min-h-11 w-full"
          onClick={onRemove}
          disabled={isRemoving || isSaving}
          aria-label={removeLabel}
        >
          {isRemoving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
          {isConfirmingRemove ? 'Confirm remove' : 'Remove'}
        </Button>
        <Link to={detailsPath} className="button-link min-h-11 w-full">
          View details
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
        <span className="text-sm font-medium text-slate-300">Your rating</span>
        <RatingControl value={item.state?.personalRating} onChange={onSetRating} disabled={isSaving} />
      </div>
      <WatchlistDecisionGuide layout="block" input={usherInput} />
    </div>
  )
}

export function SharedWatchlistItemRow({
  item,
  detailsPath,
  watched,
  favourite,
  isConfirmingRemove,
  isRemoving,
  isSaving,
  onToggleFavourite,
  onToggleStatus,
  onSetRating,
  onRemove,
}: SharedWatchlistItemRowProps) {
  const removeLabel = isConfirmingRemove ? `Confirm remove ${item.title}` : `Remove ${item.title} from list`
  const mediaLabel = item.mediaType === 'tv' ? 'Series' : 'Movie'
  const usherInput = {
    mediaType: item.mediaType,
    tmdbId: item.tmdbId,
    title: item.title,
    overview: item.overview,
    releaseDate: item.releaseDate,
    genres: item.genres,
  }

  return (
    <div className="px-3 py-6 transition hover:bg-white/[0.03] sm:px-6 lg:py-8">
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[220px_1fr] lg:items-start">
        <Link
          to={detailsPath}
          className="relative block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 sm:w-72 lg:w-full"
        >
          <MoviePoster
            path={item.posterPath}
            title={item.title}
            className="w-full shadow-[0_24px_70px_rgba(0,0,0,.48)]"
            size="w500"
          />
          <StatusBadges watched={watched} favourite={favourite} />
        </Link>

        <div className="min-w-0 max-w-4xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            {getYear(item.releaseDate)} • {mediaLabel}
          </p>
          <Link
            to={detailsPath}
            className="mt-3 block text-4xl font-semibold leading-tight tracking-tight text-white transition hover:text-sky-100 sm:text-5xl lg:text-3xl"
          >
            {item.title}
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {item.genres.slice(0, 4).map((genre) => (
              <span key={genre} className="rounded-full border border-white/[0.08] bg-white/[0.08] px-3 py-1 text-sm text-slate-200">
                {genre}
              </span>
            ))}
            <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#05070c]">
              <Star className="mr-1 inline size-4 fill-current" aria-hidden="true" />
              {formatRating(item.voteAverage)} TMDB
            </span>
          </div>
          <p className="mt-6 text-base leading-7 text-slate-200">
            {item.overview || 'No overview is available for this title yet.'}
          </p>

          <SharedWatchlistActions
            item={item}
            detailsPath={detailsPath}
            watched={watched}
            favourite={favourite}
            isConfirmingRemove={isConfirmingRemove}
            isRemoving={isRemoving}
            isSaving={isSaving}
            removeLabel={removeLabel}
            usherInput={usherInput}
            onToggleFavourite={onToggleFavourite}
            onToggleStatus={onToggleStatus}
            onSetRating={onSetRating}
            onRemove={onRemove}
          />
        </div>
      </div>
    </div>
  )
}
