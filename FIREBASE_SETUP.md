# Firebase Setup

Absolute Cinema uses Firebase for Google sign-in, shared watchlists, invite links, and cached AI summaries. Browsing, local watchlists, CSV export, and TMDB-backed detail pages still work without Firebase configuration.

## Project Setup

1. Create a Firebase project in the Firebase Console.
2. Enable Authentication and add the Google sign-in provider.
3. Create the default Firestore database.
4. Add the web app configuration to `.env`.
5. Add Firebase Admin credentials anywhere `/api/*` routes run.

## Environment Variables

Client Firebase variables are exposed to Vite and must use the `VITE_` prefix:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Server Firebase variables are used by API routes and must stay unprefixed:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

The server also accepts these credential alternatives:

```env
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=base64_encoded_service_account_json
FIREBASE_SERVICE_ACCOUNT_FILE=/absolute/path/to/service-account.json
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

Restart the dev server after changing environment variables.

## Firestore Collections

The app uses these collections:

- `watchlists`: shared list metadata, owner ID, invite token, and timestamps.
- `watchlist_members`: membership rows keyed as `{watchlistId}_{userId}`.
- `watchlist_items`: shared movie or TV entries keyed as `{watchlistId}_{mediaType}_{tmdbId}`.
- `watchlist_item_states`: per-user watch status, favourites, ratings, notes, and hidden state.
- `ai_summaries`: cached spoiler-safe AI summaries keyed as `{mediaType}_{tmdbId}`.

## API Routes

Firebase Admin is used by these server routes:

- `POST /api/create-watchlist`: creates a watchlist and owner membership.
- `GET /api/list-watchlists`: lists active memberships for the signed-in user.
- `POST /api/get-watchlist`: returns a watchlist and visible items for a member.
- `POST /api/add-watchlist-item`: adds or updates a shared item and user state.
- `POST /api/delete-watchlist`: deletes a watchlist and related members, items, and item states for the owner.
- `POST /api/join-watchlist`: validates an invite token and creates or reactivates membership.
- `POST /api/ai-summary`: caches Gemini summaries in Firestore when Firebase Admin is configured.

## Firestore Security Rules

Deploy rules like these for production. Server API routes use Firebase Admin and are not restricted by client rules.

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ai_summaries/{document=**} {
      allow read: if true;
      allow write: if false;
    }

    match /users/{uid} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == uid;
    }

    match /watchlists/{listId} {
      allow read: if hasWatchlistAccess(listId);
      allow create: if request.resource.data.ownerId == request.auth.uid;
      allow update: if resource.data.ownerId == request.auth.uid;
      allow delete: if resource.data.ownerId == request.auth.uid;
    }

    match /watchlist_members/{document=**} {
      allow read: if resource.data.userId == request.auth.uid || isWatchlistOwner(document);
      allow write: if isWatchlistOwner(document);
    }

    match /watchlist_items/{itemId} {
      allow read: if canReadItem();
      allow create: if hasWatchlistAccess(request.resource.data.watchlistId);
      allow update: if canReadItem();
      allow delete: if isItemOwner();
    }

    match /watchlist_item_states/{stateId} {
      allow read: if resource.data.userId == request.auth.uid || isStateItemOwner(resource.data.itemId);
      allow create: if request.resource.data.userId == request.auth.uid;
      allow update: if resource.data.userId == request.auth.uid;
      allow delete: if resource.data.userId == request.auth.uid || isStateItemOwner(resource.data.itemId);
    }

    function hasWatchlistAccess(listId) {
      return exists(/databases/{database}/documents/watchlist_members/$(listId)_$(request.auth.uid));
    }

    function isWatchlistOwner(docId) {
      let listId = docId.split('_')[0];
      let ownerId = get(/databases/{database}/documents/watchlists/$(listId)).data.ownerId;
      return ownerId == request.auth.uid;
    }

    function canReadItem() {
      return hasWatchlistAccess(resource.data.watchlistId);
    }

    function isItemOwner() {
      return get(/databases/{database}/documents/watchlists/$(resource.data.watchlistId)).data.ownerId == request.auth.uid;
    }

    function isStateItemOwner(itemId) {
      let item = get(/databases/{database}/documents/watchlist_items/$(itemId)).data;
      return get(/databases/{database}/documents/watchlists/$(item.watchlistId)).data.ownerId == request.auth.uid;
    }
  }
}
```

## Local Emulator

The client can connect to Firebase emulators when these variables are set:

```env
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099
VITE_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
```

Run the emulators with the Firebase CLI if you use local Firebase services:

```bash
firebase emulators:start --project=your-project-id
```
