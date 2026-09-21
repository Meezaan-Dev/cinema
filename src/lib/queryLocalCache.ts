import type { SavedMovie } from '@/api/watchlistClient'
import type { RewindViewing } from '@/types/viewing'

function watchlistKey(uid: string) {
  return `rewind:watchlist:${uid}`
}

function historyKey(uid: string) {
  return `rewind:history:${uid}`
}

function readJson<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return undefined
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore quota errors; network fetch remains source of truth.
  }
}

export function readWatchlistCache(uid: string) {
  return readJson<SavedMovie[]>(watchlistKey(uid))
}

export function writeWatchlistCache(uid: string, movies: SavedMovie[]) {
  writeJson(watchlistKey(uid), movies)
}

export function readHistoryCache(uid: string) {
  return readJson<RewindViewing[]>(historyKey(uid))
}

export function writeHistoryCache(uid: string, viewings: RewindViewing[]) {
  writeJson(historyKey(uid), viewings)
}

export function clearUserQueryCache(uid: string) {
  localStorage.removeItem(watchlistKey(uid))
  localStorage.removeItem(historyKey(uid))
}
