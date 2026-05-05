import { useContext } from 'react'

import { WatchlistPickerContext } from '@/lib/watchlistPickerContext'

export function useWatchlistPicker() {
  const context = useContext(WatchlistPickerContext)

  if (!context) {
    throw new Error('useWatchlistPicker must be used inside WatchlistPickerProvider')
  }

  return context
}
