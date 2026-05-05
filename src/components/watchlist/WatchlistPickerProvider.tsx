import { useMemo, useState, type ReactNode } from 'react'

import { AddToWatchlistDialog } from '@/components/watchlist/AddToWatchlistDialog'
import type { UserMovie } from '@/types/movie'
import type { WatchlistMovieInput } from '@/types/watchlist'
import { toWatchlistMovieInput } from '@/types/watchlist'
import { WatchlistPickerContext } from '@/lib/watchlistPickerContext'

export function WatchlistPickerProvider({ children }: { children: ReactNode }) {
  const [movie, setMovie] = useState<WatchlistMovieInput | null>(null)
  const value = useMemo(
    () => ({
      open: (nextMovie: UserMovie | WatchlistMovieInput) => setMovie(toWatchlistMovieInput(nextMovie)),
    }),
    [],
  )

  return (
    <WatchlistPickerContext.Provider value={value}>
      {children}
      <AddToWatchlistDialog movie={movie} onClose={() => setMovie(null)} />
    </WatchlistPickerContext.Provider>
  )
}
