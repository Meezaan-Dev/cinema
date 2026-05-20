import { type Timestamp } from 'firebase-admin/firestore'

import { cleanString, parseJsonRequestBody, type ApiRequest, type ApiResponse } from './serverUtils'
import { getFirebaseAdminServices, isMissingFirestoreDatabaseError } from './firebaseAdmin'

type GetWatchlistRequest = {
  watchlistId?: string
}

type FirestoreWatchlist = {
  id: string
  name: string
  description: string | null
  ownerId: string
  inviteToken: string
  createdAt: Timestamp
  updatedAt: Timestamp
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
  genres: string[]
  addedBy: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

type FirestoreState = {
  itemId: string
  userId: string
  status: 'to_watch' | 'watched'
  isFavourite: boolean
  personalRating?: number | null
  notes?: string | null
  hiddenAt?: Timestamp | string | null
  updatedAt: Timestamp
}

function getAuthorizationHeader(req: ApiRequest) {
  const value = req.headers?.authorization ?? req.headers?.Authorization
  return Array.isArray(value) ? value[0] : value
}

function getBearerToken(req: ApiRequest) {
  const authorization = getAuthorizationHeader(req)
  if (typeof authorization !== 'string') return null

  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

function toIso(value: Timestamp | string | null | undefined) {
  if (typeof value === 'string') return value || undefined
  return value && typeof value.toDate === 'function' ? value.toDate().toISOString() : undefined
}

function toMillis(value: Timestamp | string | null | undefined) {
  if (typeof value === 'string') {
    const millis = new Date(value).getTime()
    return Number.isFinite(millis) ? millis : 0
  }

  return value && typeof value.toMillis === 'function' ? value.toMillis() : 0
}

function mapWatchlist(data: FirestoreWatchlist, role: 'owner' | 'editor', itemCount: number) {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
    inviteToken: data.inviteToken,
    createdAt: toIso(data.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(data.updatedAt) ?? new Date(0).toISOString(),
    role,
    itemCount,
  }
}

function mapState(data: FirestoreState) {
  return {
    itemId: data.itemId,
    userId: data.userId,
    status: data.status === 'watched' ? 'watched' : 'to_watch',
    isFavourite: Boolean(data.isFavourite),
    personalRating: data.personalRating ?? undefined,
    notes: data.notes ?? undefined,
    hiddenAt: toIso(data.hiddenAt),
    updatedAt: toIso(data.updatedAt) ?? new Date(0).toISOString(),
  }
}

function mapItem(data: FirestoreItem, state?: ReturnType<typeof mapState>) {
  return {
    id: data.id,
    watchlistId: data.watchlistId,
    tmdbId: data.tmdbId,
    mediaType: data.mediaType === 'tv' ? 'tv' : 'movie',
    title: data.title,
    overview: data.overview,
    posterPath: data.posterPath,
    backdropPath: data.backdropPath,
    releaseDate: data.releaseDate,
    voteAverage: data.voteAverage,
    genres: Array.isArray(data.genres) ? data.genres : [],
    addedBy: data.addedBy ?? null,
    createdAt: toIso(data.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(data.updatedAt) ?? new Date(0).toISOString(),
    state,
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const parsedBody = parseJsonRequestBody<GetWatchlistRequest>(req.body)
  if (!parsedBody.ok) {
    res.status(parsedBody.status).json({ error: parsedBody.error })
    return
  }

  const watchlistId = cleanString(parsedBody.data.watchlistId, 120)
  if (!watchlistId) {
    res.status(400).json({ error: 'Choose a watchlist first.' })
    return
  }

  const idToken = getBearerToken(req)
  if (!idToken) {
    res.status(401).json({ error: 'Sign in with Google to use shared watchlists.' })
    return
  }

  const firebase = getFirebaseAdminServices()
  if (!firebase) {
    res.status(501).json({ error: 'Firebase Admin is not configured on the server.' })
    return
  }

  let uid: string
  try {
    const decodedToken = await firebase.auth.verifyIdToken(idToken)
    uid = decodedToken.uid
  } catch {
    res.status(401).json({ error: 'Sign in with Google to use shared watchlists.' })
    return
  }

  try {
    const membershipDoc = await firebase.db
      .collection('watchlist_members')
      .doc(`${watchlistId}_${uid}`)
      .get()

    if (!membershipDoc.exists || membershipDoc.data()?.leftAt !== null) {
      res.status(403).json({ error: 'You are not a member of this watchlist.' })
      return
    }

    const watchlistDoc = await firebase.db.collection('watchlists').doc(watchlistId).get()
    if (!watchlistDoc.exists) {
      res.status(404).json({ error: 'This watchlist does not exist.' })
      return
    }

    const itemsSnapshot = await firebase.db
      .collection('watchlist_items')
      .where('watchlistId', '==', watchlistId)
      .get()
    const items = itemsSnapshot.docs
      .map((itemDoc) => itemDoc.data() as FirestoreItem)
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    const itemIds = new Set(items.map((item) => item.id))
    const statesByItem = new Map<string, ReturnType<typeof mapState>>()

    if (itemIds.size > 0) {
      const statesSnapshot = await firebase.db
        .collection('watchlist_item_states')
        .where('userId', '==', uid)
        .get()

      for (const stateDoc of statesSnapshot.docs) {
        const state = stateDoc.data() as FirestoreState
        if (itemIds.has(state.itemId)) {
          statesByItem.set(state.itemId, mapState(state))
        }
      }
    }

    const visibleItems = items
      .map((item) => mapItem(item, statesByItem.get(item.id)))
      .filter((item) => !item.state?.hiddenAt)

    res.status(200).json({
      ...mapWatchlist(
        watchlistDoc.data() as FirestoreWatchlist,
        membershipDoc.data()?.role === 'owner' ? 'owner' : 'editor',
        visibleItems.length,
      ),
      items: visibleItems,
    })
  } catch (error) {
    console.error('get-watchlist route failed', error)
    res.status(isMissingFirestoreDatabaseError(error) ? 503 : 500).json({
      error: isMissingFirestoreDatabaseError(error)
        ? 'Firestore is not enabled for this Firebase project. Create the default Firestore database in Firebase Console.'
        : 'Could not load this watchlist.',
    })
  }
}
