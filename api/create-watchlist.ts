import { randomBytes } from 'node:crypto'
import { Timestamp } from 'firebase-admin/firestore'

import { cleanString, parseJsonRequestBody, type ApiRequest, type ApiResponse } from './serverUtils'
import { getFirebaseAdminServices, isMissingFirestoreDatabaseError } from './firebaseAdmin'

type CreateWatchlistRequest = {
  name?: string
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

function generateId() {
  return randomBytes(8).toString('hex')
}

function generateInviteToken() {
  return randomBytes(12).toString('hex')
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const parsedBody = parseJsonRequestBody<CreateWatchlistRequest>(req.body)
  if (!parsedBody.ok) {
    res.status(parsedBody.status).json({ error: parsedBody.error })
    return
  }

  const name = cleanString(parsedBody.data.name, 80)
  if (!name) {
    res.status(400).json({ error: 'Give this watchlist a name first.' })
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

  const now = Timestamp.now()
  const watchlistId = generateId()
  const watchlistData = {
    id: watchlistId,
    name,
    description: null,
    ownerId: uid,
    inviteToken: generateInviteToken(),
    createdAt: now,
    updatedAt: now,
  }

  try {
    const batch = firebase.db.batch()
    batch.set(firebase.db.collection('watchlists').doc(watchlistId), watchlistData)
    batch.set(firebase.db.collection('watchlist_members').doc(`${watchlistId}_${uid}`), {
      watchlistId,
      userId: uid,
      role: 'owner',
      joinedAt: now,
      leftAt: null,
    })
    await batch.commit()
  } catch (error) {
    res.status(isMissingFirestoreDatabaseError(error) ? 503 : 500).json({
      error: isMissingFirestoreDatabaseError(error)
        ? 'Firestore is not enabled for this Firebase project. Create the default Firestore database in Firebase Console.'
        : 'Could not create the watchlist.',
    })
    return
  }

  res.status(200).json({
    id: watchlistId,
    name,
    description: null,
    ownerId: uid,
    inviteToken: watchlistData.inviteToken,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
    role: 'owner',
    itemCount: 0,
  })
}
