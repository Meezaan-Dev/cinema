import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { AppError } from '@/lib/errors'
import { getFirebaseDB } from '@/lib/firebaseClient'
import type { UserMovie } from '@/types/movie'
import {
  type CloudWatchlist,
  type CloudWatchlistDetail,
  type CloudWatchlistItem,
  type CloudWatchlistItemState,
  type WatchStatus,
  type WatchlistMovieInput,
  type WatchlistRole,
  toWatchlistMovieInput,
} from '@/types/watchlist'

type FirestoreWatchlist = {
  id: string
  name: string
  description: string | null
  ownerId: string
  inviteToken: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

type FirestoreMembership = {
  watchlistId: string
  userId: string
  role: WatchlistRole
  joinedAt: Timestamp
  leftAt: Timestamp | null
}

type FirestoreItem = {
  id: string
  watchlistId: string
  tmdbId: number
  mediaType: 'movie' | 'tv'
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  releaseDate: string
  voteAverage: number
  genres: string[] | null
  addedBy: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

type FirestoreState = {
  itemId: string
  userId: string
  status: WatchStatus
  isFavourite: boolean
  personalRating: number | null
  notes: string | null
  hiddenAt: string | null
  updatedAt: Timestamp
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function generateInviteToken(): string {
  return Math.random().toString(36).substr(2, 12)
}

function requireUser(userId: string | undefined): string {
  if (!userId) {
    throw new AppError('auth', 'Sign in with Google to use shared watchlists.')
  }
  return userId
}

function toCloudError(error: Error | null | undefined, fallback: string) {
  if (!error) return
  throw new AppError('http', error.message ? `${fallback} ${error.message}` : fallback)
}

function sanitizeListName(name: string): string {
  const cleanName = name.trim().replace(/\s+/g, ' ').slice(0, 80)
  if (!cleanName) {
    throw new AppError('invalid-data', 'Give this watchlist a name first.')
  }
  return cleanName
}

function sanitizeText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : ''
}

function sanitizeNullablePath(value: unknown): string | null {
  const clean = sanitizeText(value, 200)
  return clean || null
}

function sanitizeVoteAverage(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.min(10, Math.max(0, numeric)) : 0
}

function sanitizeGenres(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const genres: string[] = []

  for (const item of value.slice(0, 12)) {
    const genre = sanitizeText(item, 60)
    if (!genre || seen.has(genre)) continue
    seen.add(genre)
    genres.push(genre)
  }

  return genres
}

function sanitizeWatchStatus(value: unknown): WatchStatus {
  return value === 'watched' ? 'watched' : 'to_watch'
}

function sanitizePersonalRating(value: unknown): number | null {
  if (value === undefined || value === null) return null
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric >= 1 && numeric <= 5 ? numeric : null
}

function mapWatchlist(
  data: FirestoreWatchlist,
  role: WatchlistRole,
  itemCount = 0,
): CloudWatchlist {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
    inviteToken: data.inviteToken,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
    role,
    itemCount,
  }
}

function mapState(data: FirestoreState): CloudWatchlistItemState {
  return {
    itemId: data.itemId,
    userId: data.userId,
    status: data.status,
    isFavourite: data.isFavourite,
    personalRating: data.personalRating ?? undefined,
    notes: data.notes ?? undefined,
    hiddenAt: data.hiddenAt ?? undefined,
    updatedAt: data.updatedAt.toDate().toISOString(),
  }
}

function mapItem(data: FirestoreItem, state?: CloudWatchlistItemState): CloudWatchlistItem {
  return {
    id: data.id,
    watchlistId: data.watchlistId,
    tmdbId: data.tmdbId,
    mediaType: data.mediaType,
    title: data.title,
    overview: data.overview,
    posterPath: data.posterPath,
    backdropPath: data.backdropPath,
    releaseDate: data.releaseDate,
    voteAverage: Number(data.voteAverage),
    genres: data.genres ?? [],
    addedBy: data.addedBy,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
    state,
  }
}

function itemPayload(watchlistId: string, movie: WatchlistMovieInput, userId: string) {
  const tmdbId = Number(movie.tmdbId)
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    throw new AppError('invalid-data', 'This title is missing a valid TMDB ID.')
  }

  const title = sanitizeText(movie.title, 180)
  if (!title) {
    throw new AppError('invalid-data', 'This title is missing a name.')
  }

  return {
    watchlistId,
    tmdbId,
    mediaType: movie.mediaType === 'tv' ? 'tv' : ('movie' as const),
    title,
    overview: sanitizeText(movie.overview, 1200),
    posterPath: sanitizeNullablePath(movie.posterPath),
    backdropPath: sanitizeNullablePath(movie.backdropPath),
    releaseDate: sanitizeText(movie.releaseDate, 40),
    voteAverage: sanitizeVoteAverage(movie.voteAverage),
    genres: sanitizeGenres(movie.genres),
    addedBy: userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
}

function statePayload(itemId: string, userId: string, state: Partial<CloudWatchlistItemState>) {
  return {
    itemId,
    userId,
    status: sanitizeWatchStatus(state.status),
    isFavourite: state.isFavourite ?? false,
    personalRating: sanitizePersonalRating(state.personalRating),
    notes: state.notes === undefined || state.notes === null ? null : sanitizeText(state.notes, 1000),
    hiddenAt: state.hiddenAt ? sanitizeText(state.hiddenAt, 40) : null,
    updatedAt: Timestamp.now(),
  }
}

export const cloudWatchlistKeys = {
  lists: (userId?: string) => ['cloud-watchlists', userId] as const,
  detail: (watchlistId?: string, userId?: string) => ['cloud-watchlist', watchlistId, userId] as const,
  presence: (userId: string | undefined, mediaType: string, tmdbId: number) =>
    ['cloud-watchlist-presence', userId, mediaType, tmdbId] as const,
}

export async function listCloudWatchlists(userId: string | undefined): Promise<CloudWatchlist[]> {
  const currentUserId = requireUser(userId)
  const db = getFirebaseDB()

  try {
    const membershipsQuery = query(
      collection(db, 'watchlist_members'),
      where('userId', '==', currentUserId),
      where('leftAt', '==', null),
    )

    const membershipSnapshots = await getDocs(membershipsQuery)
    const memberships = membershipSnapshots.docs.map((doc) => doc.data() as FirestoreMembership)
    const watchlistIds = memberships.map((m) => m.watchlistId)

    if (watchlistIds.length === 0) return []

    const watchlists: CloudWatchlist[] = []

    for (const watchlistId of watchlistIds) {
      const watchlistDoc = await getDoc(doc(db, 'watchlists', watchlistId))
      if (!watchlistDoc.exists()) continue

      const watchlistData = watchlistDoc.data() as FirestoreWatchlist
      const membership = memberships.find((m) => m.watchlistId === watchlistId)

      const itemsQuery = query(
        collection(db, 'watchlist_items'),
        where('watchlistId', '==', watchlistId),
      )
      const itemSnapshots = await getDocs(itemsQuery)
      const itemCount = itemSnapshots.size

      watchlists.push(mapWatchlist(watchlistData, membership?.role ?? 'editor', itemCount))
    }

    return watchlists.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  } catch (error) {
    toCloudError(error instanceof Error ? error : null, 'Could not load your watchlists.')
    return []
  }
}

export async function createCloudWatchlist(name: string, userId: string | undefined): Promise<CloudWatchlist> {
  const currentUserId = requireUser(userId)
  const db = getFirebaseDB()

  try {
    const watchlistId = generateId()
    const inviteToken = generateInviteToken()

    const watchlistData: FirestoreWatchlist = {
      id: watchlistId,
      name: sanitizeListName(name),
      description: null,
      ownerId: currentUserId,
      inviteToken,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(doc(db, 'watchlists', watchlistId), watchlistData)

    // Add owner as member
    await setDoc(doc(db, 'watchlist_members', `${watchlistId}_${currentUserId}`), {
      watchlistId,
      userId: currentUserId,
      role: 'owner' as const,
      joinedAt: Timestamp.now(),
      leftAt: null,
    })

    return mapWatchlist(watchlistData, 'owner')
  } catch (error) {
    toCloudError(error instanceof Error ? error : null, 'Could not create the watchlist.')
    throw error
  }
}

export async function deleteCloudWatchlist(
  watchlistId: string | undefined,
  userId: string | undefined,
): Promise<void> {
  const currentUserId = requireUser(userId)
  if (!watchlistId) {
    throw new AppError('not-found', 'Choose a watchlist first.')
  }

  const db = getFirebaseDB()

  try {
    const watchlistDoc = await getDoc(doc(db, 'watchlists', watchlistId))

    if (!watchlistDoc.exists()) {
      throw new AppError('not-found', 'This watchlist does not exist.')
    }

    const watchlistData = watchlistDoc.data() as FirestoreWatchlist

    if (watchlistData.ownerId !== currentUserId) {
      throw new AppError('http', 'Only the owner can delete this watchlist.')
    }

    await deleteDoc(doc(db, 'watchlists', watchlistId))
  } catch (error) {
    if (error instanceof AppError) throw error
    toCloudError(error instanceof Error ? error : null, 'Could not delete this watchlist.')
  }
}

export async function getCloudWatchlistDetail(
  watchlistId: string | undefined,
  userId: string | undefined,
): Promise<CloudWatchlistDetail> {
  const currentUserId = requireUser(userId)
  if (!watchlistId) {
    throw new AppError('not-found', 'Choose a watchlist first.')
  }

  const db = getFirebaseDB()

  try {
    const watchlistDoc = await getDoc(doc(db, 'watchlists', watchlistId))

    if (!watchlistDoc.exists()) {
      throw new AppError('not-found', 'This watchlist does not exist.')
    }

    const watchlistData = watchlistDoc.data() as FirestoreWatchlist

    const membershipDoc = await getDoc(
      doc(db, 'watchlist_members', `${watchlistId}_${currentUserId}`),
    )

    if (!membershipDoc.exists() || (membershipDoc.data() as FirestoreMembership).leftAt !== null) {
      throw new AppError('http', 'You are not a member of this watchlist.')
    }

    const membership = membershipDoc.data() as FirestoreMembership

    const itemsQuery = query(
      collection(db, 'watchlist_items'),
      where('watchlistId', '==', watchlistId),
      orderBy('createdAt', 'desc'),
    )

    const itemSnapshots = await getDocs(itemsQuery)
    const items = itemSnapshots.docs.map((d) => d.data() as FirestoreItem)
    const itemIds = items.map((item) => item.id)

    const statesByItem = new Map<string, CloudWatchlistItemState>()

    if (itemIds.length > 0) {
      const statesQuery = query(
        collection(db, 'watchlist_item_states'),
        where('userId', '==', currentUserId),
      )

      const stateSnapshots = await getDocs(statesQuery)
      const states = stateSnapshots.docs
        .map((d) => d.data() as FirestoreState)
        .filter((state) => itemIds.includes(state.itemId))

      for (const state of states) {
        statesByItem.set(state.itemId, mapState(state))
      }
    }

    const visibleItems = items
      .map((item) => mapItem(item, statesByItem.get(item.id)))
      .filter((item) => !item.state?.hiddenAt)

    return {
      ...mapWatchlist(watchlistData, membership.role, visibleItems.length),
      items: visibleItems,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    toCloudError(error instanceof Error ? error : null, 'Could not load this watchlist.')
    throw error
  }
}

export async function getCloudMoviePresence(
  userId: string | undefined,
  movie: WatchlistMovieInput,
): Promise<Set<string>> {
  const currentUserId = requireUser(userId)
  const db = getFirebaseDB()

  try {
    const lists = await listCloudWatchlists(currentUserId)
    const watchlistIds = lists.map((list) => list.id)
    if (watchlistIds.length === 0) return new Set()

    const itemsQuery = query(
      collection(db, 'watchlist_items'),
      where('tmdbId', '==', movie.tmdbId),
      where('mediaType', '==', movie.mediaType),
    )

    const itemSnapshots = await getDocs(itemsQuery)
    const items = itemSnapshots.docs.map((d) => d.data() as FirestoreItem)

    return new Set(
      items.filter((item) => watchlistIds.includes(item.watchlistId)).map((item) => item.watchlistId),
    )
  } catch (error) {
    toCloudError(error instanceof Error ? error : null, 'Could not check where this title is saved.')
    return new Set()
  }
}

export async function addMovieToCloudWatchlist(
  watchlistId: string,
  movie: WatchlistMovieInput | UserMovie,
  userId: string | undefined,
): Promise<CloudWatchlistItem> {
  const currentUserId = requireUser(userId)
  const db = getFirebaseDB()

  try {
    const watchlistMovie = toWatchlistMovieInput(movie)
    const itemId = generateId()

    const itemData = {
      id: itemId,
      ...itemPayload(watchlistId, watchlistMovie, currentUserId),
    }

    await setDoc(doc(db, 'watchlist_items', itemId), itemData)

    const item = mapItem(itemData as FirestoreItem)
    await saveCloudItemState(item.id, currentUserId, {
      itemId: item.id,
      userId: currentUserId,
      status: 'to_watch',
      isFavourite: false,
      hiddenAt: undefined,
      updatedAt: new Date().toISOString(),
    })

    return item
  } catch (error) {
    if (error instanceof AppError) throw error
    toCloudError(error instanceof Error ? error : null, 'Could not add this title.')
    throw error
  }
}

export async function saveCloudItemState(
  itemId: string,
  userId: string | undefined,
  state: Partial<CloudWatchlistItemState>,
): Promise<CloudWatchlistItemState> {
  const currentUserId = requireUser(userId)
  const db = getFirebaseDB()

  try {
    const stateId = `${itemId}_${currentUserId}`
    const stateData = {
      ...statePayload(itemId, currentUserId, state),
    }

    await setDoc(doc(db, 'watchlist_item_states', stateId), stateData, { merge: true })

    return mapState(stateData as FirestoreState)
  } catch (error) {
    toCloudError(error instanceof Error ? error : null, 'Could not update your watch state.')
    throw error
  }
}

export async function hideCloudItemForUser(
  item: CloudWatchlistItem,
  userId: string | undefined,
): Promise<CloudWatchlistItemState> {
  return saveCloudItemState(item.id, userId, {
    itemId: item.id,
    userId: userId ?? '',
    status: item.state?.status ?? 'to_watch',
    isFavourite: item.state?.isFavourite ?? false,
    personalRating: item.state?.personalRating,
    notes: item.state?.notes,
    hiddenAt: new Date().toISOString(),
    updatedAt: item.state?.updatedAt ?? new Date().toISOString(),
  })
}

export async function deleteCloudWatchlistItem(itemId: string): Promise<void> {
  const db = getFirebaseDB()

  try {
    await deleteDoc(doc(db, 'watchlist_items', itemId))
  } catch (error) {
    toCloudError(error instanceof Error ? error : null, 'Could not remove this title for everyone.')
  }
}

export async function joinCloudWatchlist(inviteToken: string, userId: string | undefined): Promise<string> {
  const currentUserId = requireUser(userId)
  const db = getFirebaseDB()

  try {
    const watchlistsQuery = query(
      collection(db, 'watchlists'),
      where('inviteToken', '==', inviteToken),
    )

    const watchlistSnapshots = await getDocs(watchlistsQuery)

    if (watchlistSnapshots.empty) {
      throw new AppError('invalid-data', 'The invite link is invalid or has expired.')
    }

    const watchlistDoc = watchlistSnapshots.docs[0]
    const watchlistId = watchlistDoc.id

    // Add user as member
    await setDoc(
      doc(db, 'watchlist_members', `${watchlistId}_${currentUserId}`),
      {
        watchlistId,
        userId: currentUserId,
        role: 'editor' as const,
        joinedAt: Timestamp.now(),
        leftAt: null,
      },
      { merge: true },
    )

    return watchlistId
  } catch (error) {
    if (error instanceof AppError) throw error
    toCloudError(error instanceof Error ? error : null, 'Could not join this watchlist.')
    throw error
  }
}

export async function importLocalMoviesToCloud(
  userId: string | undefined,
  movies: UserMovie[],
): Promise<CloudWatchlist> {
  const watchlist = await createCloudWatchlist('Imported from this browser', userId)

  for (const movie of movies) {
    await addMovieToCloudWatchlist(watchlist.id, movie, userId)
  }

  return watchlist
}
