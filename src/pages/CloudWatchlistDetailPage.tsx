import { Copy, Download, Loader2, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { ErrorState, StatusState } from '@/components/ui/StatusState'
import { SharedWatchlistItemRow } from '@/components/watchlist/SharedWatchlistItemRow'
import { useAuth } from '@/hooks/useAuth'
import { useCloudWatchlistDetail } from '@/hooks/useCloudWatchlists'
import { downloadCsv } from '@/lib/csv'
import { getErrorCopy } from '@/lib/errors'
import { cloudItemToUserMovie, type CloudWatchlistItem } from '@/types/watchlist'

type CloudFilter = 'all' | 'watched' | 'to_watch'
type CloudSort = 'addedAt' | 'rating' | 'releaseDate'

function itemStatus(item: CloudWatchlistItem) {
  return item.state?.status ?? 'to_watch'
}

function itemDetailsPath(item: CloudWatchlistItem) {
  return item.mediaType === 'tv' ? `/tv/${item.tmdbId}` : `/movie/${item.tmdbId}`
}

function roleLabel(role: string) {
  return role === 'owner' ? 'Owner' : 'Member'
}

export function CloudWatchlistDetailPage() {
  const { watchlistId = '' } = useParams()
  const navigate = useNavigate()
  const { authConfigured, user, signInWithGoogle } = useAuth()
  const detail = useCloudWatchlistDetail(watchlistId)
  const [filter, setFilter] = useState<CloudFilter>('all')
  const [sort, setSort] = useState<CloudSort>('addedAt')
  const [copyState, setCopyState] = useState('Copy link')
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null)
  const list = detail.data
  const isInitialLoading = detail.isLoading && !list
  const hasBlockingError = detail.hasBlockingError
  const actionErrorCopy = detail.actionError ? getErrorCopy(detail.actionError) : null

  const items = useMemo(() => {
    return [...(list?.items ?? [])]
      .filter((item) => filter === 'all' || itemStatus(item) === filter)
      .sort((a, b) => {
        if (sort === 'rating') {
          return (b.state?.personalRating ?? b.voteAverage) - (a.state?.personalRating ?? a.voteAverage)
        }
        if (sort === 'releaseDate') return b.releaseDate.localeCompare(a.releaseDate)
        return b.createdAt.localeCompare(a.createdAt)
      })
  }, [filter, list?.items, sort])

  if (!authConfigured) {
    return (
      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
        <StatusState title="Cloud watchlists need Firebase" message="Add Firebase environment variables to use shared watchlists." />
      </section>
    )
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
        <StatusState title="Sign in to open this watchlist" message="Shared watchlists use Google sign-in so each person can keep their own watched state." />
        <div className="mt-5 flex justify-center">
          <Button type="button" variant="primary" onClick={signInWithGoogle}>Continue with Google</Button>
        </div>
      </section>
    )
  }

  async function copyInviteLink() {
    if (!list) return
    const shareUrl = `${window.location.origin}/join/${list.inviteToken}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyState('Copied')
    } catch {
      setCopyState('Copy failed')
    }
    window.setTimeout(() => setCopyState('Copy link'), 1800)
  }

  async function toggleStatus(item: CloudWatchlistItem) {
    try {
      await detail.saveState({
        item,
        state: {
          status: itemStatus(item) === 'watched' ? 'to_watch' : 'watched',
        },
      })
    } catch {
      // React Query stores the error for display.
    }
  }

  async function toggleFavourite(item: CloudWatchlistItem) {
    try {
      await detail.saveState({
        item,
        state: {
          isFavourite: !(item.state?.isFavourite ?? false),
        },
      })
    } catch {
      // React Query stores the error for display.
    }
  }

  async function setRating(item: CloudWatchlistItem, personalRating?: number) {
    try {
      await detail.saveState({
        item,
        state: {
          personalRating,
        },
      })
    } catch {
      // React Query stores the error for display.
    }
  }

  async function removeItem(item: CloudWatchlistItem) {
    if (confirmingRemoveId !== item.id) {
      setConfirmingRemoveId(item.id)
      return
    }

    try {
      await detail.removeGlobally(item.id)
      setConfirmingRemoveId(null)
    } catch {
      // React Query stores the error for display.
    }
  }

  async function deleteWatchlist() {
    if (!list || list.role !== 'owner') return
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true)
      return
    }

    try {
      await detail.deleteWatchlist()
      navigate('/watchlists')
    } catch {
      // React Query stores the error for display.
    }
  }

  function exportCsv() {
    if (!list) return
    downloadCsv(items.map(cloudItemToUserMovie), `${list.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'watchlist'}.csv`)
  }

  return (
    <section className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-8 lg:max-w-7xl">
      <div className="mb-5 flex flex-col gap-4 sm:mb-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Shared watchlist</p>
          <h1 className="mt-2 line-clamp-2 text-2xl font-semibold tracking-tight text-white sm:text-4xl">{list?.name ?? 'Watchlist'}</h1>
          {list ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-300">
                {list.itemCount} {list.itemCount === 1 ? 'title' : 'titles'}
              </span>
              <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-xs font-medium capitalize text-slate-400">
                {roleLabel(list.role)}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-slate-400">Loading titles...</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-1.5 sm:flex sm:w-fit sm:items-center sm:gap-2 sm:p-1">
            <select
              className="field min-h-11 w-full border-0 bg-transparent py-2 touch-manipulation"
              value={filter}
              onChange={(event) => setFilter(event.target.value as CloudFilter)}
              aria-label="Filter shared watchlist"
            >
              <option value="all">All</option>
              <option value="to_watch">To watch</option>
              <option value="watched">Watched</option>
            </select>
            <select
              className="field min-h-11 w-full border-0 bg-transparent py-2 touch-manipulation"
              value={sort}
              onChange={(event) => setSort(event.target.value as CloudSort)}
              aria-label="Sort shared watchlist"
            >
              <option value="addedAt">Date added</option>
              <option value="rating">Rating</option>
              <option value="releaseDate">Release year</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto sm:flex-wrap">
            <Button type="button" variant="secondary" className="min-h-11 w-full touch-manipulation" onClick={exportCsv} disabled={!items.length}>
              <Download className="size-4" aria-hidden="true" />
              Export
            </Button>
            <Button type="button" variant="secondary" className="min-h-11 w-full touch-manipulation" onClick={copyInviteLink} disabled={!list}>
              <Copy className="size-4" aria-hidden="true" />
              {copyState}
            </Button>
            {list?.role === 'owner' ? (
              <Button
                type="button"
                variant="danger"
                className="col-span-2 min-h-11 w-full touch-manipulation sm:col-span-1 sm:w-auto"
                onClick={deleteWatchlist}
                disabled={detail.isDeletingWatchlist}
              >
                {detail.isDeletingWatchlist ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                {isConfirmingDelete ? 'Confirm delete' : 'Delete list'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {isInitialLoading ? <StatusState title="Loading watchlist" message="Getting the shared titles and your personal states." /> : null}
      {detail.isRefreshing ? (
        <div className="mb-5 rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm text-sky-100">
          Refreshing shared watchlist...
        </div>
      ) : null}
      {actionErrorCopy && !hasBlockingError ? (
        <div className="mb-5 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          <span className="font-semibold">{actionErrorCopy.title}:</span> {actionErrorCopy.message}
        </div>
      ) : null}
      {hasBlockingError ? <ErrorState error={detail.error} onRetry={() => detail.refetch()} /> : null}
      {!isInitialLoading && !hasBlockingError && items.length === 0 ? (
        <StatusState title="No visible titles" message="Add titles from search or detail pages, or switch filters to see more." />
      ) : null}
      {!isInitialLoading && !hasBlockingError && items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.045] divide-y divide-white/[0.07]">
          {items.map((item) => {
            const watched = itemStatus(item) === 'watched'
            const favourite = item.state?.isFavourite ?? false
            const isConfirmingRemove = confirmingRemoveId === item.id
            const isRemoving = detail.removingItemId === item.id

            return (
              <SharedWatchlistItemRow
                key={item.id}
                item={item}
                detailsPath={itemDetailsPath(item)}
                watched={watched}
                favourite={favourite}
                isConfirmingRemove={isConfirmingRemove}
                isRemoving={isRemoving}
                isSaving={detail.isUpdating}
                onToggleFavourite={() => toggleFavourite(item)}
                onToggleStatus={() => toggleStatus(item)}
                onSetRating={(rating) => setRating(item, rating)}
                onRemove={() => removeItem(item)}
              />
            )
          })}
        </div>
      ) : null}
      <div className="mt-8">
        <Link to="/watchlists" className="text-sm font-medium text-slate-400 hover:text-white">Back to watchlists</Link>
      </div>
    </section>
  )
}
