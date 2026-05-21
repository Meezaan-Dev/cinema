import { Timestamp } from 'firebase-admin/firestore'

import { cleanString, cleanStringArray, parseJsonRequestBody, type ApiRequest, type ApiResponse } from './serverUtils'
import { getFirebaseAdminServices, isMissingFirestoreDatabaseError } from './firebaseAdmin'

type AddWatchlistItemRequest = {
  watchlistId?: string
  movie?: {
    tmdbId?: unknown
    mediaType?: unknown
    title?: unknown
    overview?: unknown
    posterPath?: unknown
    backdropPath?: unknown
    releaseDate?: unknown
    voteAverage?: unknown
    genres?: unknown
  }
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

function sanitizeNullablePath(value: unknown) {
  const clean = cleanString(value, 200)
  return clean || null
}

function sanitizeVoteAverage(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.min(10, Math.max(0, numeric)) : 0
}

function normalizeMovie(body: AddWatchlistItemRequest) {
  const watchlistId = cleanString(body.watchlistId, 120)
  const movie = body.movie
  const tmdbId = Number(movie?.tmdbId)
  const title = cleanString(movie?.title, 180)

  if (!watchlistId || !Number.isInteger(tmdbId) || tmdbId <= 0 || !title) {
    return null
  }

  const mediaType: 'movie' | 'tv' = movie?.mediaType === 'tv' ? 'tv' : 'movie'

  return {
    watchlistId,
    tmdbId,
    mediaType,
    title,
    overview: cleanString(movie?.overview, 1200),
    posterPath: sanitizeNullablePath(movie?.posterPath),
    backdropPath: sanitizeNullablePath(movie?.backdropPath),
    releaseDate: cleanString(movie?.releaseDate, 40),
    voteAverage: sanitizeVoteAverage(movie?.voteAverage),
    genres: cleanStringArray(movie?.genres, 12, 60),
  }
}

function deterministicItemId(watchlistId: string, mediaType: 'movie' | 'tv', tmdbId: number) {
  return `${watchlistId}_${mediaType}_${tmdbId}`
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const parsedBody = parseJsonRequestBody<AddWatchlistItemRequest>(req.body)
  if (!parsedBody.ok) {
    res.status(parsedBody.status).json({ error: parsedBody.error })
    return
  }

  const input = normalizeMovie(parsedBody.data)
  if (!input) {
    res.status(400).json({ error: 'A valid watchlist and title payload is required.' })
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
      .doc(`${input.watchlistId}_${uid}`)
      .get()

    if (!membershipDoc.exists || membershipDoc.data()?.leftAt !== null) {
      res.status(403).json({ error: 'You are not a member of this watchlist.' })
      return
    }

    const itemId = deterministicItemId(input.watchlistId, input.mediaType, input.tmdbId)
    const itemRef = firebase.db.collection('watchlist_items').doc(itemId)
    const existingItem = await itemRef.get()
    const now = Timestamp.now()
    const existingCreatedAt = existingItem.exists ? existingItem.data()?.createdAt : null
    const createdAt =
      existingCreatedAt && typeof existingCreatedAt.toDate === 'function' ? existingCreatedAt : now
    const itemData = {
      id: itemId,
      watchlistId: input.watchlistId,
      tmdbId: input.tmdbId,
      mediaType: input.mediaType,
      title: input.title,
      overview: input.overview,
      posterPath: input.posterPath,
      backdropPath: input.backdropPath,
      releaseDate: input.releaseDate,
      voteAverage: input.voteAverage,
      genres: input.genres,
      addedBy: uid,
      createdAt,
      updatedAt: now,
    }
    const stateData = {
      itemId,
      userId: uid,
      status: 'to_watch',
      isFavourite: false,
      personalRating: null,
      notes: null,
      hiddenAt: null,
      updatedAt: now,
    }

    const batch = firebase.db.batch()
    batch.set(itemRef, itemData, { merge: true })
    batch.set(firebase.db.collection('watchlist_item_states').doc(`${itemId}_${uid}`), stateData, {
      merge: true,
    })
    batch.set(firebase.db.collection('watchlists').doc(input.watchlistId), { updatedAt: now }, { merge: true })
    await batch.commit()

    res.status(200).json({
      ...input,
      id: itemId,
      addedBy: uid,
      createdAt: createdAt.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
      state: {
        itemId,
        userId: uid,
        status: 'to_watch',
        isFavourite: false,
        updatedAt: now.toDate().toISOString(),
      },
    })
  } catch (error) {
    res.status(isMissingFirestoreDatabaseError(error) ? 503 : 500).json({
      error: isMissingFirestoreDatabaseError(error)
        ? 'Firestore is not enabled for this Firebase project. Create the default Firestore database in Firebase Console.'
        : 'Could not add this title.',
    })
  }
}
