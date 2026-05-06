import { Cloud, Download, Heart, Loader2, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { MovieCard } from '@/components/movie/MovieCard'
import { Button } from '@/components/ui/Button'
import { RatingControl } from '@/components/ui/RatingControl'
import { ErrorState, StatusState } from '@/components/ui/StatusState'
import { WatchlistDecisionGuide } from '@/components/watchlist/WatchlistDecisionGuide'
import { useAuth } from '@/hooks/useAuth'
import { useCloudWatchlists } from '@/hooks/useCloudWatchlists'
import { getYear } from '@/lib/formatters'
import { useWatchlist } from '@/hooks/useWatchlist'

type WatchFilter = 'all' | 'watched' | 'unwatched'
type WatchSort = 'addedAt' | 'rating' | 'releaseDate'

const importDismissedKey = (userId: string) => `absolute-cinema-import-dismissed:${userId}`

export function WatchlistPage() {
  const { authConfigured, user, signInWithGoogle } = useAuth()
  const watchlist = useWatchlist()
  const cloud = useCloudWatchlists()
  const [filter, setFilter] = useState<WatchFilter>('all')
  const [sort, setSort] = useState<WatchSort>('addedAt')
  const [newListName, setNewListName] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [dismissedImports, setDismissedImports] = useState<Set<string>>(() => new Set())
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  const movies = useMemo(() => {
    return [...watchlist.movies]
      .filter((movie) => filter === 'all' || (filter === 'watched' ? movie.isWatched : !movie.isWatched))
      .sort((a, b) => {
        if (sort === 'rating') return (b.personalRating ?? b.voteAverage) - (a.personalRating ?? a.voteAverage)
        if (sort === 'releaseDate') return b.releaseDate.localeCompare(a.releaseDate)
        return b.addedAt.localeCompare(a.addedAt)
      })
  }, [filter, sort, watchlist.movies])
  const importDismissed = user
    ? dismissedImports.has(user.id) || window.localStorage.getItem(importDismissedKey(user.id)) === '1'
    : false
  const showImportPrompt = Boolean(user && watchlist.movies.length > 0 && !importDismissed)

  async function createWatchlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newListName.trim()) return
    await cloud.createWatchlist(newListName)
    setNewListName('')
  }

  async function deleteWatchlist(listId: string) {
    if (confirmingDeleteId !== listId) {
      setConfirmingDeleteId(listId)
      return
    }

    await cloud.deleteWatchlist(listId)
    setConfirmingDeleteId(null)
  }

  async function importLocal() {
    if (!user) return
    await cloud.importLocalMovies(watchlist.movies)
    window.localStorage.setItem(importDismissedKey(user.id), '1')
    setDismissedImports((current) => new Set(current).add(user.id))
  }

  function dismissImport() {
    if (!user) return
    window.localStorage.setItem(importDismissedKey(user.id), '1')
    setDismissedImports((current) => new Set(current).add(user.id))
  }

  async function signIn() {
    setIsSigningIn(true)
    try {
      await signInWithGoogle()
    } finally {
      setIsSigningIn(false)
    }
  }

  if (user) {
    return (
      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Collaborative shelves</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Watchlists</h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              Create playlist-style movie and series lists, share invite links, and keep your watched status personal.
            </p>
          </div>
          <form className="grid w-full gap-2 sm:grid-cols-[minmax(0,18rem)_auto] lg:w-auto" onSubmit={createWatchlist}>
            <input
              className="field min-h-12"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="Movie night shortlist"
              maxLength={80}
            />
            <Button type="submit" variant="primary" className="min-h-12 w-full whitespace-nowrap px-4 sm:w-auto" disabled={cloud.isCreating || !newListName.trim()}>
              {cloud.isCreating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
              New watchlist
            </Button>
          </form>
        </div>

        {showImportPrompt ? (
          <div className="mb-6 rounded-3xl border border-sky-300/15 bg-sky-300/10 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-white">Import this browser’s watchlist</h2>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  You have {watchlist.movies.length} local {watchlist.movies.length === 1 ? 'title' : 'titles'}. Import them into a private cloud list without deleting local data.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="primary" onClick={importLocal} disabled={cloud.isImporting}>
                  {cloud.isImporting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Cloud className="size-4" aria-hidden="true" />}
                  Import
                </Button>
                <Button type="button" variant="ghost" onClick={dismissImport}>Not now</Button>
              </div>
            </div>
          </div>
        ) : null}

        {cloud.isError ? <ErrorState error={cloud.error} onRetry={() => cloud.refetch()} /> : null}
        {cloud.isLoading ? <StatusState title="Loading watchlists" message="Fetching your shared shelves..." /> : null}
        {!cloud.isLoading && !cloud.isError && cloud.data?.length === 0 ? (
          <StatusState title="No cloud watchlists yet" message="Create a list, then add movies or series from search and detail pages." />
        ) : null}
        {!cloud.isLoading && !cloud.isError && cloud.data?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cloud.data.map((list) => {
              const isConfirmingDelete = confirmingDeleteId === list.id
              const isDeleting = cloud.deletingWatchlistId === list.id

              return (
                <article
                  key={list.id}
                  className="rounded-3xl border border-white/[0.07] bg-white/[0.045] p-5 transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <Link
                    to={`/watchlists/${list.id}`}
                    className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
                    onFocus={() => setConfirmingDeleteId(null)}
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{list.role}</p>
                    <h2 className="mt-2 line-clamp-2 text-2xl font-semibold tracking-tight text-white">{list.name}</h2>
                  </Link>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-400">
                      {list.itemCount} {list.itemCount === 1 ? 'title' : 'titles'} saved
                    </p>
                    {list.role === 'owner' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={isConfirmingDelete ? 'danger' : 'ghost'}
                        className="shrink-0"
                        onClick={() => deleteWatchlist(list.id)}
                        disabled={cloud.isDeleting}
                        aria-label={`Delete ${list.name}`}
                      >
                        {isDeleting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                        {isConfirmingDelete ? 'Confirm' : 'Delete'}
                      </Button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Personal shelf</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Local watchlist</h1>
          <p className="mt-2 text-slate-400">{watchlist.movies.length} saved movies, {watchlist.movies.filter((movie) => movie.isWatched).length} watched.</p>
        </div>
        <div className="grid w-full gap-3 sm:flex sm:w-auto sm:flex-wrap">
          <select className="field sm:w-auto" value={filter} onChange={(event) => setFilter(event.target.value as WatchFilter)} aria-label="Filter watchlist">
            <option value="all">All</option>
            <option value="watched">Watched</option>
            <option value="unwatched">Unwatched</option>
          </select>
          <select className="field sm:w-auto" value={sort} onChange={(event) => setSort(event.target.value as WatchSort)} aria-label="Sort watchlist">
            <option value="addedAt">Date added</option>
            <option value="rating">Rating</option>
            <option value="releaseDate">Release year</option>
          </select>
          <Button type="button" variant="primary" onClick={watchlist.exportCsv} disabled={watchlist.movies.length === 0}>
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>
          {authConfigured ? (
            <Button type="button" onClick={signIn} disabled={isSigningIn}>
              {isSigningIn ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Cloud className="size-4" aria-hidden="true" />}
              Cloud lists
            </Button>
          ) : null}
        </div>
      </div>

      {movies.length === 0 ? (
        <StatusState title="Your watchlist is waiting" message="Save movies from the home, search, or detail pages and they will stay here after refresh." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="movie-grid">
            {movies.map((movie) => <MovieCard key={`${movie.mediaType ?? 'movie'}-${movie.id}`} movie={movie} saved={movie} />)}
          </div>
          <aside className="space-y-3">
            {movies.slice(0, 6).map((movie) => (
              <div key={`${movie.mediaType ?? 'movie'}-${movie.id}`} className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-white">{movie.title}</h2>
                    <p className="text-sm text-slate-400">{getYear(movie.releaseDate)}</p>
                  </div>
                  <Button size="icon" variant={movie.isFavourite ? 'primary' : 'ghost'} type="button" onClick={() => watchlist.toggleFavourite(movie)} aria-label={`Toggle favourite for ${movie.title}`}>
                    <Heart className={movie.isFavourite ? 'size-4 fill-current' : 'size-4'} aria-hidden="true" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <Button size="sm" type="button" onClick={() => watchlist.toggleWatched(movie)}>
                    {movie.isWatched ? 'Watched' : 'Mark watched'}
                  </Button>
                  <RatingControl value={movie.personalRating} onChange={(rating) => watchlist.setRating(movie, rating)} />
                </div>
                <WatchlistDecisionGuide
                  input={{
                    mediaType: movie.mediaType ?? 'movie',
                    tmdbId: movie.id,
                    title: movie.title,
                    overview: movie.notes ?? '',
                    releaseDate: movie.releaseDate,
                    genres: movie.genres,
                  }}
                />
              </div>
            ))}
          </aside>
        </div>
      )}
    </section>
  )
}
