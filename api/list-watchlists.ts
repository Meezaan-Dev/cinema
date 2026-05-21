import { type Timestamp } from 'firebase-admin/firestore'

import { type ApiRequest, type ApiResponse } from './serverUtils'
import { getFirebaseAdminServices, isMissingFirestoreDatabaseError } from './firebaseAdmin'

type FirestoreWatchlist = {
  id: string
  name: string
  description: string | null
  ownerId: string
  inviteToken: string
  createdAt: Timestamp
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

function mapWatchlist(data: FirestoreWatchlist, role: string, itemCount: number) {
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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
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
    const membershipsSnapshot = await firebase.db
      .collection('watchlist_members')
      .where('userId', '==', uid)
      .where('leftAt', '==', null)
      .get()

    const lists = await Promise.all(
      membershipsSnapshot.docs.map(async (membershipDoc) => {
        const membership = membershipDoc.data()
        const watchlistId = typeof membership.watchlistId === 'string' ? membership.watchlistId : ''
        if (!watchlistId) return null

        const watchlistDoc = await firebase.db.collection('watchlists').doc(watchlistId).get()
        if (!watchlistDoc.exists) return null

        const itemsSnapshot = await firebase.db
          .collection('watchlist_items')
          .where('watchlistId', '==', watchlistId)
          .get()

        return mapWatchlist(
          watchlistDoc.data() as FirestoreWatchlist,
          membership.role === 'owner' ? 'owner' : 'editor',
          itemsSnapshot.size,
        )
      }),
    )

    res.status(200).json({
      watchlists: lists
        .filter((list): list is ReturnType<typeof mapWatchlist> => Boolean(list))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    })
  } catch (error) {
    res.status(isMissingFirestoreDatabaseError(error) ? 503 : 500).json({
      error: isMissingFirestoreDatabaseError(error)
        ? 'Firestore is not enabled for this Firebase project. Create the default Firestore database in Firebase Console.'
        : 'Could not load your watchlists.',
    })
  }
}
