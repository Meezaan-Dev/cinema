# Firebase Migration Guide

## Overview

This project has been migrated from Supabase (PostgreSQL + Auth) to Firebase (Firestore + Auth). This document describes the changes, setup requirements, and how to use the new Firebase-based system.

## What Changed

### Frontend
- **Authentication**: Supabase OAuth → Firebase Auth (Google Sign-In)
- **Database**: Supabase PostgreSQL → Firebase Firestore
- **User Objects**: `user.id` → `user.uid`, removed `user.user_metadata`
- **Profile Management**: Firestore `users` collection (auto-created on first login)

### Backend (API)
- **AI Summary Cache**: Supabase `ai_summaries` table → Firestore `ai_summaries` collection
- **Service Auth**: Supabase service role key → Firebase Admin SDK (service account JSON)

### Collections Structure

#### `users`
```
{
  uid: string (Firebase user ID)
  email: string
  displayName: string
  photoURL: string | null
  updatedAt: Timestamp
}
```

#### `watchlists`
```
{
  id: string
  name: string
  description: string | null
  ownerId: string (Firebase uid)
  inviteToken: string (for sharing)
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `watchlist_members`
```
{
  watchlistId: string
  userId: string (Firebase uid)
  role: 'owner' | 'editor'
  joinedAt: Timestamp
  leftAt: Timestamp | null (when user left)
}
```

#### `watchlist_items`
```
{
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
  addedBy: string (Firebase uid)
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `watchlist_item_states`
```
{
  itemId: string
  userId: string (Firebase uid)
  status: 'to_watch' | 'watched'
  isFavourite: boolean
  personalRating: number | null (1-5)
  notes: string | null
  hiddenAt: string | null (ISO timestamp)
  updatedAt: Timestamp
}
```

#### `ai_summaries`
```
{
  mediaType: 'movie' | 'tv'
  tmdbId: number
  title: string
  summary: { takeaway, bestFor, skipIf, tone, pacing, spoilerFree }
  model: string (e.g., 'gemini-2.5-flash-lite')
  updatedAt: Timestamp
}
```
Document ID: `{mediaType}_{tmdbId}`

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following:
   - **Authentication**: Google provider
   - **Firestore Database**: Create database (production or test mode)

### 2. Environment Variables

Copy `.env.example` and add Firebase config:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Server-side (for API routes)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 3. Get Firebase Credentials

**Frontend (Client):**
- Find in Firebase Console → Project Settings → Web apps

**Backend (Server):**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy the JSON content as `FIREBASE_SERVICE_ACCOUNT_KEY` env variable

### 4. Firestore Security Rules

Deploy these rules for production:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public collections (limited access)
    match /ai_summaries/{document=**} {
      allow read: if true;
      allow write: if false; // Only backend can write
    }

    // User profiles (read public, write own)
    match /users/{uid} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == uid;
    }

    // Watchlists (owner/editor access)
    match /watchlists/{listId} {
      allow read: if hasWatchlistAccess(listId);
      allow write: if resource.data.ownerId == request.auth.uid;
      allow delete: if resource.data.ownerId == request.auth.uid;
    }

    // Watchlist members
    match /watchlist_members/{document=**} {
      allow read: if canAccessWatchlist(document);
      allow write: if isWatchlistOwner(document);
    }

    // Watchlist items
    match /watchlist_items/{itemId} {
      allow read: if hasWatchlistAccess(itemId);
      allow write: if canEditWatchlist(itemId);
    }

    // Item states (user-specific)
    match /watchlist_item_states/{stateId} {
      allow read: if stateId.split('_')[1] == request.auth.uid;
      allow write: if stateId.split('_')[1] == request.auth.uid;
    }

    // Helper functions
    function hasWatchlistAccess(listId) {
      return exists(/databases/{database}/documents/watchlist_members/$(listId)_$(request.auth.uid));
    }

    function canAccessWatchlist(docId) {
      let listId = docId.split('_')[0];
      return hasWatchlistAccess(listId);
    }

    function isWatchlistOwner(docId) {
      let listId = docId.split('_')[0];
      let ownerId = get(/databases/{database}/documents/watchlists/$(listId)).data.ownerId;
      return ownerId == request.auth.uid;
    }

    function canEditWatchlist(itemId) {
      let item = get(/databases/{database}/documents/watchlist_items/$(itemId)).data;
      return hasWatchlistAccess(item.watchlistId);
    }
  }
}
```

### 5. Create Firestore Indexes (if needed)

Firestore will suggest indexes for complex queries. You can create them via:
- Firebase Console → Firestore → Indexes
- Or let Firestore auto-create them on first use

## API Changes

### Authentication

**Before (Supabase):**
```typescript
const { session, user } = useAuth()
const userId = user?.id
```

**After (Firebase):**
```typescript
const { user } = useAuth()
const userId = user?.uid // uid instead of id
```

### Cloud Watchlists

All functions in `src/api/cloudWatchlists.ts` remain the same interface but use Firestore internally:

```typescript
// These still work the same way
await listCloudWatchlists(userId)
await createCloudWatchlist(name, userId)
await getCloudWatchlistDetail(watchlistId, userId)
await addMovieToCloudWatchlist(watchlistId, movie, userId)
await saveCloudItemState(itemId, userId, state)
await joinCloudWatchlist(inviteToken, userId)
```

## Migration Checklist

- [x] Firebase project created
- [x] Firebase Auth setup (Google provider)
- [x] Firestore database created
- [x] Collections structure defined
- [x] Frontend client code migrated
- [x] Backend API code migrated
- [x] User ID references updated
- [x] Environment variables documented
- [ ] Data migrated from Supabase (if needed)
- [ ] Security rules deployed
- [ ] Firestore indexes created (as needed)
- [ ] Tested authentication flow
- [ ] Tested watchlist CRUD operations
- [ ] Tested watchlist sharing
- [ ] Tested AI summary caching
- [ ] Deployed to production

## Testing Locally

### Frontend
```bash
npm run dev
# Test Google Sign-In, watchlist creation, movie additions
```

### Backend (with emulator)
```bash
npm install -g firebase-tools
firebase emulators:start --project=your-project-id
# Set VITE_USE_FIREBASE_EMULATOR=true and VITE_FIREBASE_*_EMULATOR_* env vars
```

## Troubleshooting

### "Firebase is not configured"
- Ensure `VITE_FIREBASE_PROJECT_ID` and other env vars are set
- Check Firebase Console project settings for correct values

### "You are not a member of this watchlist"
- User may have been removed from `watchlist_members` collection
- Check membership record has `leftAt: null`

### AI summary not caching
- Verify `FIREBASE_SERVICE_ACCOUNT_KEY` is valid
- Check that API route can access Firestore
- Look for errors in server logs

### Permission denied errors
- Review Firestore security rules
- Ensure user is authenticated (has valid Firebase `uid`)
- Check that watchlist membership exists

## Data Migration (Optional)

If migrating from existing Supabase data, you can:

1. Export Supabase data as JSON
2. Transform to match Firestore structure
3. Use Firebase Admin SDK to batch import:

```typescript
const batch = db.batch()
// Add operations to batch
await batch.commit()
```

## Performance Considerations

### Firestore vs Supabase
- **Firestore**: Document-based, better for hierarchical data
- **Query limitations**: No complex JOINs (but users should be minimal)
- **Denormalization**: Some data is denormalized (e.g., movie titles in items)
- **Indexing**: Auto-created, but explicit indexes recommended for complex queries

### Cost
- Firestore: Charged per read/write operation
- Monitor usage in Firebase Console
- Consider implementing caching (React Query already included)

## Next Steps

1. Deploy Firestore security rules to production
2. Set up Firebase hosting (or keep Vercel)
3. Monitor Firestore usage and adjust rules if needed
4. Plan data migration strategy if coming from Supabase
5. Update deployment documentation

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/start)
