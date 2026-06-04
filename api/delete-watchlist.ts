import { type DocumentReference, type Firestore } from 'firebase-admin/firestore'

import { type ApiRequest, type ApiResponse, cleanString, parseJsonRequestBody } from './serverUtils.js'
import { getFirebaseAdminServices, isMissingFirestoreDatabaseError } from './firebaseAdmin.js'

type DeleteWatchlistRequest = {
    watchlistId?: string
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

    const parsedBody = parseJsonRequestBody<DeleteWatchlistRequest>(req.body)
    if (!parsedBody.ok) {
        res.status(parsedBody.status).json({ error: parsedBody.error })
        return
    }

    const watchlistId = cleanString(parsedBody.data.watchlistId, 80)
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
        const watchlistRef = firebase.db.collection('watchlists').doc(watchlistId)
        const watchlistDoc = await watchlistRef.get()

        if (!watchlistDoc.exists) {
            res.status(404).json({ error: 'This watchlist does not exist.' })
            return
        }

        const watchlistData = watchlistDoc.data() as { ownerId?: string } | undefined
        if (!watchlistData || watchlistData.ownerId !== uid) {
            res.status(403).json({ error: 'Only the owner can delete this watchlist.' })
            return
        }

        const [membersSnapshot, itemsSnapshot] = await Promise.all([
            firebase.db.collection('watchlist_members').where('watchlistId', '==', watchlistId).get(),
            firebase.db.collection('watchlist_items').where('watchlistId', '==', watchlistId).get(),
        ])

        const refsToDelete = [
            watchlistRef,
            ...membersSnapshot.docs.map((doc) => doc.ref),
            ...itemsSnapshot.docs.map((doc) => doc.ref),
        ]

        const itemIds = itemsSnapshot.docs.map((doc) => doc.id)
        for (const itemId of itemIds) {
            const statesSnapshot = await firebase.db
                .collection('watchlist_item_states')
                .where('itemId', '==', itemId)
                .get()
            refsToDelete.push(...statesSnapshot.docs.map((doc) => doc.ref))
        }

        await deleteRefsInBatches(firebase.db, refsToDelete)

        res.status(200).json({ ok: true })
    } catch (error) {
        res.status(isMissingFirestoreDatabaseError(error) ? 503 : 500).json({
            error: isMissingFirestoreDatabaseError(error)
                ? 'Firestore is not enabled for this Firebase project. Create the default Firestore database in Firebase Console.'
                : 'Could not delete this watchlist.',
        })
    }
}
