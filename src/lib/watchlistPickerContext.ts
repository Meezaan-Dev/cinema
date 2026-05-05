import { createContext } from 'react'

import type { UserMovie } from '@/types/movie'
import type { WatchlistMovieInput } from '@/types/watchlist'

export type WatchlistPickerContextValue = {
  open: (movie: UserMovie | WatchlistMovieInput) => void
}

export const WatchlistPickerContext = createContext<WatchlistPickerContextValue | null>(null)
