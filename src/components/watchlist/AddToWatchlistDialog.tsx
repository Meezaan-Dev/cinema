import { Check, Cloud, Loader2, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/StatusState'
import { useAddToCloudWatchlist } from '@/hooks/useCloudWatchlists'
import { useAuth } from '@/hooks/useAuth'
import { useWatchlist } from '@/hooks/useWatchlist'
import { watchlistMovieToUserMovie, type WatchlistMovieInput } from '@/types/watchlist'

type AddToWatchlistDialogProps = {
  movie: WatchlistMovieInput | null
  onClose: () => void
}

export function AddToWatchlistDialog({ movie, onClose }: AddToWatchlistDialogProps) {
  if (!movie) return null

  return <AddToWatchlistDialogContent key={`${movie.mediaType}-${movie.tmdbId}`} movie={movie} onClose={onClose} />
}

function AddToWatchlistDialogContent({ movie, onClose }: { movie: WatchlistMovieInput; onClose: () => void }) {
  const { authConfigured, user, signInWithGoogle } = useAuth()
  const localWatchlist = useWatchlist()
  const cloud = useAddToCloudWatchlist(movie)
  const [newListName, setNewListName] = useState('')
  const [message, setMessage] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const localMovie = useMemo(() => watchlistMovieToUserMovie(movie), [movie])
  const localSaved = localWatchlist.isSaved(localMovie)

  async function saveLocally() {
    localWatchlist.addMovie(localMovie)
    setMessage('Saved in this browser.')
  }

  async function signIn() {
    setIsSigningIn(true)
    try {
      await signInWithGoogle()
    } finally {
      setIsSigningIn(false)
    }
  }

  async function createList() {
    if (!newListName.trim() || !movie) return
    await cloud.createListWithMovie({ name: newListName, targetMovie: movie })
    setNewListName('')
    setMessage('Created a new watchlist and added this title.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4" role="presentation">
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="add-watchlist-title"
        className="max-h-[92svh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#0b0f18] p-4 shadow-[0_24px_80px_rgba(0,0,0,.56)] sm:p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Save title</p>
            <h2 id="add-watchlist-title" className="mt-1 line-clamp-2 text-2xl font-semibold tracking-tight text-white">
              {movie.title}
            </h2>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close add to watchlist">
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        {message ? <p className="mt-4 rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}

        {!user ? (
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4">
              <h3 className="font-semibold text-white">Save locally</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Keep this title in this browser. You can import local titles into cloud lists after sign-in.
              </p>
              <Button type="button" className="mt-4 w-full" variant="primary" onClick={saveLocally} disabled={localSaved}>
                {localSaved ? <Check className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                {localSaved ? 'Already saved locally' : 'Save locally'}
              </Button>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4">
              <h3 className="font-semibold text-white">Use collaborative lists</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Google sign-in unlocks shared watchlists and invite links.
              </p>
              {authConfigured ? (
                <Button type="button" className="mt-4 w-full" onClick={signIn} disabled={isSigningIn}>
                  {isSigningIn ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Cloud className="size-4" aria-hidden="true" />}
                  Continue with Google
                </Button>
              ) : (
                <p className="mt-4 rounded-2xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  Add Supabase environment variables to enable cloud watchlists.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {cloud.error ? <ErrorState error={cloud.error} /> : null}
            <div className="space-y-2">
              {cloud.isLoading ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4 text-sm text-slate-400">
                  Loading your watchlists...
                </div>
              ) : null}
              {!cloud.isLoading && cloud.lists.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4 text-sm text-slate-400">
                  Create your first cloud watchlist below.
                </div>
              ) : null}
              {cloud.lists.map((list) => {
                const added = cloud.presence.has(list.id)
                return (
                  <div key={list.id} className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">{list.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {list.itemCount} {list.itemCount === 1 ? 'title' : 'titles'} - {list.role}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={added ? 'primary' : 'secondary'}
                      onClick={() => cloud.addToList({ watchlistId: list.id, targetMovie: movie })}
                      disabled={added || cloud.isSaving}
                    >
                      {added ? <Check className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                      {added ? 'Added' : 'Add'}
                    </Button>
                  </div>
                )
              })}
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4">
              <label className="text-sm font-medium text-slate-300" htmlFor="new-watchlist-name">
                New watchlist
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="new-watchlist-name"
                  className="field"
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                  placeholder="Weekend picks"
                  maxLength={80}
                />
                <Button type="button" variant="primary" onClick={createList} disabled={cloud.isSaving || !newListName.trim()}>
                  {cloud.isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
