import { Timestamp, type DocumentReference, type Firestore } from 'firebase-admin/firestore'

import { type ApiRequest, type ApiResponse, cleanString, parseJsonRequestBody } from './serverUtils.js'
import { getFirebaseAdminServices, isMissingFirestoreDatabaseError } from './firebaseAdmin.js'

type DeleteWatchlistItemRequest = {
  itemId?: string
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

async function deleteRefsInBatches(db: Firestore, refs: DocumentReference[]) {
  const batchSize = 450

  for (let index = 0; index < refs.length; index += batchSize) {
    const batch = db.batch()
    for (const ref of refs.slice(index, index + batchSize)) {
      batch.delete(ref)
    }
    await batch.commit()
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const parsedBody = parseJsonRequestBody<DeleteWatchlistItemRequest>(req.body)
  if (!parsedBody.ok) {
    res.status(parsedBody.status).json({ error: parsedBody.error })
    return
  }

  const itemId = cleanString(parsedBody.data.itemId, 160)
  if (!itemId) {
    res.status(400).json({ error: 'Choose a title first.' })
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
    const itemRef = firebase.db.collection('watchlist_items').doc(itemId)
    const itemDoc = await itemRef.get()

    if (!itemDoc.exists) {
      res.status(404).json({ error: 'This title is no longer in the watchlist.' })
      return
    }

    const itemData = itemDoc.data() as { watchlistId?: unknown } | undefined
    const watchlistId = typeof itemData?.watchlistId === 'string' ? itemData.watchlistId : ''

    if (!watchlistId) {
      res.status(500).json({ error: 'Could not remove this title.' })
      return
    }

    const membershipDoc = await firebase.db
      .collection('watchlist_members')
      .doc(`${watchlistId}_${uid}`)
      .get()

    if (!membershipDoc.exists || membershipDoc.data()?.leftAt !== null) {
      res.status(403).json({ error: 'You are not a member of this watchlist.' })
      return
    }

    const statesSnapshot = await firebase.db
      .collection('watchlist_item_states')
      .where('itemId', '==', itemId)
      .get()

    await deleteRefsInBatches(firebase.db, [
      itemRef,
      ...statesSnapshot.docs.map((stateDoc) => stateDoc.ref),
    ])

    await firebase.db.collection('watchlists').doc(watchlistId).set(
      { updatedAt: Timestamp.now() },
      { merge: true },
    )

    res.status(200).json({ ok: true })
  } catch (error) {
    res.status(isMissingFirestoreDatabaseError(error) ? 503 : 500).json({
      error: isMissingFirestoreDatabaseError(error)
        ? 'Firestore is not enabled for this Firebase project. Create the default Firestore database in Firebase Console.'
        : 'Could not remove this title.',
    })
  }
}
