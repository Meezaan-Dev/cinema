import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore'
import { AppError } from '@/lib/errors'
import { getAuth_Client, getFirebaseDB } from '@/lib/firebaseClient'
import type { UserMovie } from '@/types/movie'
import {
  type CloudWatchlist,
  type CloudWatchlistDetail,
  type CloudWatchlistItem,
  type CloudWatchlistItemState,
  type WatchStatus,
  type WatchlistMovieInput,
  toWatchlistMovieInput,
} from '@/types/watchlist'

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

function deterministicItemId(watchlistId: string, mediaType: 'movie' | 'tv', tmdbId: number): string {
  return `${watchlistId}_${mediaType}_${tmdbId}`
}

async function deleteRefsInBatches(db: Firestore, refs: DocumentReference[]) {
  const batchSize = 450

  for (let index = 0; index < refs.length; index += batchSize) {
    const batch = writeBatch(db)
    for (const ref of refs.slice(index, index + batchSize)) {
      batch.delete(ref)
    }
    await batch.commit()
  }
}

function requireUser(userId: string | undefined): string {
  if (!userId) {
    throw new AppError('auth', 'Sign in with Google to use shared watchlists.')
  }
  return userId
}

function toCloudError(error: Error | null | undefined, fallback: string) {
  if (!error) return
  throw new AppError('watchlist', error.message ? `${fallback} ${error.message}` : fallback)
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

function sanitizeWatchStatus(value: unknown): WatchStatus {
  return value === 'watched' ? 'watched' : 'to_watch'
}

function sanitizePersonalRating(value: unknown): number | null {
  if (value === undefined || value === null) return null
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric >= 1 && numeric <= 5 ? numeric : null
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
  requireUser(userId)

  try {
    const auth = getAuth_Client()
    const idToken = await auth.currentUser?.getIdToken()

    if (!idToken) {
      throw new AppError('auth', 'Sign in with Google to use shared watchlists.')
    }

    const response = await fetch('/api/list-watchlists', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    })

    const payload = (await response.json().catch(() => null)) as { watchlists?: unknown; error?: unknown } | null

    if (!response.ok) {
      const message = typeof payload?.error === 'string' ? payload.error : 'Could not load your watchlists.'
      throw new AppError(response.status === 401 ? 'auth' : 'configuration', message)
    }

    if (!Array.isArray(payload?.watchlists)) {
      throw new AppError('invalid-data', 'The watchlist list returned an unexpected response.')
    }

    return payload.watchlists as CloudWatchlist[]
  } catch (error) {
    if (error instanceof AppError) throw error
    toCloudError(error instanceof Error ? error : null, 'Could not load your watchlists.')
    return []
  }
}

export async function createCloudWatchlist(name: string, userId: string | undefined): Promise<CloudWatchlist> {
  requireUser(userId)

  try {
    const cleanName = sanitizeListName(name)
    const auth = getAuth_Client()
    const idToken = await auth.currentUser?.getIdToken()

    if (!idToken) {
      throw new AppError('auth', 'Sign in with Google to use shared watchlists.')
    }

    const response = await fetch('/api/create-watchlist', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: cleanName }),
    })

    const payload = (await response.json().catch(() => null)) as Partial<CloudWatchlist> & { error?: unknown } | null

    if (!response.ok) {
      const message = typeof payload?.error === 'string' ? payload.error : 'Could not create the watchlist.'
      throw new AppError(response.status === 401 ? 'auth' : 'watchlist', message)
    }

    if (
      !payload ||
      typeof payload.id !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.ownerId !== 'string' ||
      typeof payload.inviteToken !== 'string' ||
      typeof payload.createdAt !== 'string' ||
      typeof payload.updatedAt !== 'string'
    ) {
      throw new AppError('invalid-data', 'The watchlist returned an unexpected response.')
    }

    return {
      id: payload.id,
      name: payload.name,
      description: payload.description ?? null,
      ownerId: payload.ownerId,
      inviteToken: payload.inviteToken,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      role: payload.role ?? 'owner',
      itemCount: payload.itemCount ?? 0,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
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

    const watchlistData = watchlistDoc.data() as { ownerId?: string }

    if (watchlistData.ownerId !== currentUserId) {
      throw new AppError('watchlist', 'Only the owner can delete this watchlist.')
    }

    const membersQuery = query(
      collection(db, 'watchlist_members'),
      where('watchlistId', '==', watchlistId),
    )
    const itemsQuery = query(
      collection(db, 'watchlist_items'),
      where('watchlistId', '==', watchlistId),
    )

    const [memberSnapshots, itemSnapshots] = await Promise.all([
      getDocs(membersQuery),
      getDocs(itemsQuery),
    ])
    const itemIds = itemSnapshots.docs.map((itemDoc) => itemDoc.id)
    const refsToDelete: DocumentReference[] = [
      watchlistDoc.ref,
      ...memberSnapshots.docs.map((memberDoc) => memberDoc.ref),
      ...itemSnapshots.docs.map((itemDoc) => itemDoc.ref),
    ]

    for (const itemId of itemIds) {
      const statesQuery = query(
        collection(db, 'watchlist_item_states'),
        where('itemId', '==', itemId),
      )
      const stateSnapshots = await getDocs(statesQuery)
      refsToDelete.push(...stateSnapshots.docs.map((stateDoc) => stateDoc.ref))
    }

    await deleteRefsInBatches(db, refsToDelete)
  } catch (error) {
    if (error instanceof AppError) throw error
    toCloudError(error instanceof Error ? error : null, 'Could not delete this watchlist.')
  }
}

export async function getCloudWatchlistDetail(
  watchlistId: string | undefined,
  userId: string | undefined,
): Promise<CloudWatchlistDetail> {
  requireUser(userId)
  if (!watchlistId) {
    throw new AppError('not-found', 'Choose a watchlist first.')
  }

  try {
    const auth = getAuth_Client()
    const idToken = await auth.currentUser?.getIdToken()

    if (!idToken) {
      throw new AppError('auth', 'Sign in with Google to use shared watchlists.')
    }

    const response = await fetch('/api/get-watchlist', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ watchlistId }),
    })

    const payload = (await response.json().catch(() => null)) as Partial<CloudWatchlistDetail> & { error?: unknown } | null

    if (!response.ok) {
      const message = typeof payload?.error === 'string' ? payload.error : 'Could not load this watchlist.'
      throw new AppError(
        response.status === 401 ? 'auth' : response.status === 404 ? 'not-found' : 'watchlist',
        message,
      )
    }

    if (
      !payload ||
      typeof payload.id !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.ownerId !== 'string' ||
      typeof payload.inviteToken !== 'string' ||
      typeof payload.createdAt !== 'string' ||
      typeof payload.updatedAt !== 'string' ||
      !Array.isArray(payload.items)
    ) {
      throw new AppError('invalid-data', 'The watchlist returned an unexpected response.')
    }

    return payload as CloudWatchlistDetail
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

    const tmdbId = Number(movie.tmdbId)
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) return new Set()

    const mediaType = movie.mediaType === 'tv' ? 'tv' : 'movie'
    const presence = new Set<string>()

    await Promise.all(
      watchlistIds.map(async (watchlistId) => {
        const itemDoc = await getDoc(
          doc(db, 'watchlist_items', deterministicItemId(watchlistId, mediaType, tmdbId)),
        )
        if (itemDoc.exists()) {
          presence.add(watchlistId)
        }
      }),
    )

    return presence
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
  requireUser(userId)

  try {
    const watchlistMovie = toWatchlistMovieInput(movie)
    const auth = getAuth_Client()
    const idToken = await auth.currentUser?.getIdToken()

    if (!idToken) {
      throw new AppError('auth', 'Sign in with Google to use shared watchlists.')
    }

    const response = await fetch('/api/add-watchlist-item', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ watchlistId, movie: watchlistMovie }),
    })

    const payload = (await response.json().catch(() => null)) as Partial<CloudWatchlistItem> & { error?: unknown } | null

    if (!response.ok) {
      const message = typeof payload?.error === 'string' ? payload.error : 'Could not add this title.'
      throw new AppError(response.status === 401 ? 'auth' : 'watchlist', message)
    }

    if (
      !payload ||
      typeof payload.id !== 'string' ||
      typeof payload.watchlistId !== 'string' ||
      typeof payload.tmdbId !== 'number' ||
      typeof payload.title !== 'string' ||
      typeof payload.createdAt !== 'string' ||
      typeof payload.updatedAt !== 'string'
    ) {
      throw new AppError('invalid-data', 'The added title returned an unexpected response.')
    }

    return payload as CloudWatchlistItem
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
    const statesQuery = query(
      collection(db, 'watchlist_item_states'),
      where('itemId', '==', itemId),
    )
    const stateSnapshots = await getDocs(statesQuery)
    await deleteRefsInBatches(db, [
      doc(db, 'watchlist_items', itemId),
      ...stateSnapshots.docs.map((stateDoc) => stateDoc.ref),
    ])
  } catch (error) {
    toCloudError(error instanceof Error ? error : null, 'Could not remove this title for everyone.')
  }
}

export async function joinCloudWatchlist(inviteToken: string, userId: string | undefined): Promise<string> {
  requireUser(userId)

  try {
    const auth = getAuth_Client()
    const idToken = await auth.currentUser?.getIdToken()

    if (!idToken) {
      throw new AppError('auth', 'Sign in before joining this watchlist.')
    }

    const response = await fetch('/api/join-watchlist', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inviteToken }),
    })

    const payload = (await response.json().catch(() => null)) as { watchlistId?: unknown; error?: unknown } | null

    if (!response.ok) {
      const message = typeof payload?.error === 'string' ? payload.error : 'Could not join this watchlist.'
      throw new AppError(response.status === 401 ? 'auth' : 'watchlist', message)
    }

    if (typeof payload?.watchlistId !== 'string') {
      throw new AppError('invalid-data', 'The invite link returned an unexpected response.')
    }

    return payload.watchlistId
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
