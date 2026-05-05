import { Check, Copy, Download, Heart, Loader2, Trash2, UserMinus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { MovieCard } from '@/components/movie/MovieCard'
import { Button } from '@/components/ui/Button'
import { RatingControl } from '@/components/ui/RatingControl'
import { ErrorState, StatusState } from '@/components/ui/StatusState'
import { WatchlistDecisionGuide } from '@/components/watchlist/WatchlistDecisionGuide'
import { useAuth } from '@/hooks/useAuth'
import { useCloudWatchlistDetail } from '@/hooks/useCloudWatchlists'
import { downloadCsv } from '@/lib/csv'
import { getYear } from '@/lib/formatters'
import { cloudItemToUserMovie, type CloudWatchlistItem } from '@/types/watchlist'

type CloudFilter = 'all' | 'watched' | 'to_watch'
type CloudSort = 'addedAt' | 'rating' | 'releaseDate'

function itemStatus(item: CloudWatchlistItem) {
  return item.state?.status ?? 'to_watch'
}

export function CloudWatchlistDetailPage() {
  const { watchlistId = '' } = useParams()
  const { authConfigured, user, signInWithGoogle } = useAuth()
  const detail = useCloudWatchlistDetail(watchlistId)
  const [filter, setFilter] = useState<CloudFilter>('all')
  const [sort, setSort] = useState<CloudSort>('addedAt')
  const [copyState, setCopyState] = useState('Copy link')
  const list = detail.data

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
        <StatusState title="Cloud watchlists need Supabase" message="Add Supabase environment variables to use shared watchlists." />
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
    await navigator.clipboard.writeText(shareUrl)
    setCopyState('Copied')
    window.setTimeout(() => setCopyState('Copy link'), 1800)
  }

  async function toggleStatus(item: CloudWatchlistItem) {
    await detail.saveState({
      item,
      state: {
        status: itemStatus(item) === 'watched' ? 'to_watch' : 'watched',
      },
    })
  }

  async function toggleFavourite(item: CloudWatchlistItem) {
    await detail.saveState({
      item,
      state: {
        isFavourite: !(item.state?.isFavourite ?? false),
      },
    })
  }

  async function setRating(item: CloudWatchlistItem, personalRating?: number) {
    await detail.saveState({
      item,
      state: {
        personalRating,
      },
    })
  }

  async function removeItem(item: CloudWatchlistItem) {
    if (list?.role === 'owner') {
      await detail.removeGlobally(item.id)
      return
    }

    await detail.hideForMe(item)
  }

  function exportCsv() {
    if (!list) return
    downloadCsv(items.map(cloudItemToUserMovie), `${list.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'watchlist'}.csv`)
  }

  return (
    <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Shared watchlist</p>
          <h1 className="mt-2 line-clamp-2 text-4xl font-semibold tracking-tight text-white">{list?.name ?? 'Watchlist'}</h1>
          <p className="mt-2 text-slate-400">
            {list ? `${list.itemCount} visible ${list.itemCount === 1 ? 'title' : 'titles'} - ${list.role}` : 'Loading titles...'}
          </p>
        </div>
        <div className="grid w-full gap-3 sm:flex sm:w-auto sm:flex-wrap">
          <select className="field sm:w-auto" value={filter} onChange={(event) => setFilter(event.target.value as CloudFilter)} aria-label="Filter shared watchlist">
            <option value="all">All</option>
            <option value="to_watch">To watch</option>
            <option value="watched">Watched</option>
          </select>
          <select className="field sm:w-auto" value={sort} onChange={(event) => setSort(event.target.value as CloudSort)} aria-label="Sort shared watchlist">
            <option value="addedAt">Date added</option>
            <option value="rating">Rating</option>
            <option value="releaseDate">Release year</option>
          </select>
          <Button type="button" onClick={exportCsv} disabled={!items.length}>
            <Download className="size-4" aria-hidden="true" />
            Export
          </Button>
          <Button type="button" variant="primary" onClick={copyInviteLink} disabled={!list}>
            <Copy className="size-4" aria-hidden="true" />
            {copyState}
          </Button>
        </div>
      </div>

      {detail.isLoading ? <StatusState title="Loading watchlist" message="Getting the shared titles and your personal states." /> : null}
      {detail.isError ? <ErrorState error={detail.error} onRetry={() => detail.refetch()} /> : null}
      {!detail.isLoading && !detail.isError && items.length === 0 ? (
        <StatusState title="No visible titles" message="Add titles from search or detail pages, or switch filters to see more." />
      ) : null}
      {!detail.isLoading && !detail.isError && items.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="movie-grid">
            {items.map((item) => {
              const movie = cloudItemToUserMovie(item)
              return <MovieCard key={item.id} movie={movie} saved={movie} />
            })}
          </div>
          <aside className="space-y-3">
            {items.map((item) => {
              const watched = itemStatus(item) === 'watched'
              const favourite = item.state?.isFavourite ?? false
              const removeCopy = list?.role === 'owner' ? 'Remove for everyone' : 'Remove for me'

              return (
                <div key={item.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 font-semibold text-white">{item.title}</h2>
                      <p className="mt-1 text-sm text-slate-400">{getYear(item.releaseDate)}</p>
                    </div>
                    <Button size="icon" variant={favourite ? 'primary' : 'ghost'} type="button" onClick={() => toggleFavourite(item)} aria-label={`Toggle favourite for ${item.title}`} disabled={detail.isUpdating}>
                      <Heart className={favourite ? 'size-4 fill-current' : 'size-4'} aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" variant={watched ? 'primary' : 'secondary'} type="button" onClick={() => toggleStatus(item)} disabled={detail.isUpdating}>
                      {detail.isUpdating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                      {watched ? 'Watched' : 'To watch'}
                    </Button>
                    <Button size="sm" variant="danger" type="button" onClick={() => removeItem(item)} disabled={detail.isUpdating}>
                      {list?.role === 'owner' ? <Trash2 className="size-4" aria-hidden="true" /> : <UserMinus className="size-4" aria-hidden="true" />}
                      {removeCopy}
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
                    <span className="text-sm font-medium text-slate-300">Your rating</span>
                    <RatingControl value={item.state?.personalRating} onChange={(rating) => setRating(item, rating)} />
                  </div>
                  <WatchlistDecisionGuide
                    input={{
                      mediaType: item.mediaType,
                      tmdbId: item.tmdbId,
                      title: item.title,
                      overview: item.overview,
                      releaseDate: item.releaseDate,
                      genres: item.genres,
                    }}
                  />
                </div>
              )
            })}
          </aside>
        </div>
      ) : null}
      <div className="mt-8">
        <Link to="/watchlists" className="text-sm font-medium text-slate-400 hover:text-white">Back to watchlists</Link>
      </div>
    </section>
  )
}
