import { FieldValue } from 'firebase-admin/firestore'

import { cleanString, parseJsonRequestBody, type ApiRequest, type ApiResponse } from './serverUtils.js'
import { getFirebaseAdminServices, isMissingFirestoreDatabaseError } from './firebaseAdmin.js'

type JoinWatchlistRequest = {
  inviteToken?: string
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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const parsedBody = parseJsonRequestBody<JoinWatchlistRequest>(req.body)
  if (!parsedBody.ok) {
    res.status(parsedBody.status).json({ error: parsedBody.error })
    return
  }

  const inviteToken = cleanString(parsedBody.data.inviteToken, 120)
  if (!inviteToken) {
    res.status(400).json({ error: 'A valid invite token is required.' })
    return
  }

  const idToken = getBearerToken(req)
  if (!idToken) {
    res.status(401).json({ error: 'Sign in before joining this watchlist.' })
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
    res.status(401).json({ error: 'Sign in before joining this watchlist.' })
    return
  }

  try {
    const watchlistSnapshot = await firebase.db
      .collection('watchlists')
      .where('inviteToken', '==', inviteToken)
      .limit(1)
      .get()

    if (watchlistSnapshot.empty) {
      res.status(404).json({ error: 'The invite link is invalid or has expired.' })
      return
    }

    const watchlistDoc = watchlistSnapshot.docs[0]
    const watchlistId = watchlistDoc.id
    const memberRef = firebase.db.collection('watchlist_members').doc(`${watchlistId}_${uid}`)
    const memberDoc = await memberRef.get()
    const existingRole = memberDoc.exists ? memberDoc.data()?.role : null

    await memberRef.set(
      {
        watchlistId,
        userId: uid,
        role: existingRole === 'owner' ? 'owner' : 'editor',
        joinedAt: memberDoc.exists
          ? memberDoc.data()?.joinedAt ?? FieldValue.serverTimestamp()
          : FieldValue.serverTimestamp(),
        leftAt: null,
      },
      { merge: true },
    )

    res.status(200).json({ watchlistId })
  } catch (error) {
    res.status(isMissingFirestoreDatabaseError(error) ? 503 : 500).json({
      error: isMissingFirestoreDatabaseError(error)
        ? 'Firestore is not enabled for this Firebase project. Create the default Firestore database in Firebase Console.'
        : 'Could not join this watchlist.',
    })
  }
}
