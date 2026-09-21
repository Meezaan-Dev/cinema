import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore'

import { getDb } from '@/lib/firebase'
import { writeWatchlistCache } from '@/lib/queryLocalCache'

export type SavedMovie = {
  tmdbId: number
  title: string
  releaseYear: string | null
  posterPath: string | null
  savedAt: string | null
}

type SavedMovieDocument = {
  tmdbId?: unknown
  title?: unknown
  releaseYear?: unknown
  posterPath?: unknown
  savedAt?: Timestamp
}

export const watchlistQueryKeys = {
  all: (uid: string | undefined) => ['watchlist', uid] as const,
  movie: (uid: string | undefined, tmdbId: number | null) => ['watchlist', uid, tmdbId] as const,
}

function watchlistDoc(uid: string, tmdbId: number) {
  return doc(getDb(), 'users', uid, 'watchlist', String(tmdbId))
}

function mapSavedMovie(id: string, data: SavedMovieDocument): SavedMovie {
  return {
    tmdbId: typeof data.tmdbId === 'number' ? data.tmdbId : Number(id),
    title: typeof data.title === 'string' ? data.title : 'Untitled movie',
    releaseYear: typeof data.releaseYear === 'string' ? data.releaseYear : null,
    posterPath: typeof data.posterPath === 'string' ? data.posterPath : null,
    savedAt: data.savedAt?.toDate().toISOString() ?? null,
  }
}

export async function isMovieSaved(uid: string, tmdbId: number) {
  const snapshot = await getDoc(watchlistDoc(uid, tmdbId))
  return snapshot.exists()
}

export async function saveMovie(
  uid: string,
  movie: {
    tmdbId: number
    title: string
    releaseYear: string | null
    posterPath: string | null
  },
) {
  await setDoc(watchlistDoc(uid, movie.tmdbId), {
    tmdbId: movie.tmdbId,
    title: movie.title,
    releaseYear: movie.releaseYear,
    posterPath: movie.posterPath,
    savedAt: serverTimestamp(),
  })
}

export async function unsaveMovie(uid: string, tmdbId: number) {
  await deleteDoc(watchlistDoc(uid, tmdbId))
}

export async function getSavedMovies(uid: string) {
  const snapshot = await getDocs(
    query(collection(getDb(), 'users', uid, 'watchlist'), orderBy('savedAt', 'desc')),
  )
  const movies = snapshot.docs.map((item) => mapSavedMovie(item.id, item.data() as SavedMovieDocument))
  writeWatchlistCache(uid, movies)
  return movies
}
