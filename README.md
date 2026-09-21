# Rewind

Rewind is a personal movie companion powered by TMDB and your own viewing history. Browse trending content, search titles, explore detailed pages, and review what you have watched.

No authentication yet. Firestore stores personal viewing-history data through server-side APIs and the developer-side Letterboxd importer.

## What you can do

### Discovery
- Letterboxd-inspired home feed: featured hero, trending rail, popular movies & TV, top rated, coming soon
- Dedicated browse pages for movies and TV shows with genre, year, rating, and sort filters
- Unified search across movies and TV with instant debounced results
- Movie and TV detail pages: overview, genres, cast, trailers, similar titles, metadata
- **Magic Link** (PlayIMDb) and **View on IMDb** when TMDB provides an IMDb ID

### History
- Import Letterboxd diary exports with `npm run import:letterboxd -- <export.zip>`
- Store viewings in Firestore under `users/{ownerId}/viewings/{viewingId}`
- View personal history at `/history`

### Watchlist
- Sign in with Google
- Save movies from movie detail pages
- View saved movies at `/watchlist`

## Routes

| Path | Purpose |
|------|---------|
| `/` | Discover home |
| `/history` | Personal viewing history |
| `/watchlist` | Saved movies |
| `/movies` | Browse movies |
| `/tv-shows` | Browse TV series |
| `/search` | Unified search |
| `/movie/:id` | Movie detail |
| `/tv/:id` | TV series detail |

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS 4, Framer Motion
- **Data:** TMDB API

## Project layout

```
api/                 Server handlers
src/pages/           Route-level screens
src/components/      UI, movie cards, layout
src/hooks/           Search and utility hooks
src/api/             Client calls to /api and TMDB
```

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Environment

Create a `.env` file in the project root:

```env
# Server-side TMDB credentials — never prefix with VITE_
TMDB_API_KEY=your_tmdb_v3_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3

# Client-side TMDB image CDN (not a secret)
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p

# Server-side Firebase Admin configuration
FIREBASE_PROJECT_ID=rewind-video-club
FIRESTORE_DATABASE_ID=rewind-db
REWIND_OWNER_ID=personal

# Local development uses your existing `firebase login` credentials by default.
# Optional CI/service-account fallback:
FIREBASE_SERVICE_ACCOUNT_JSON=

```

Restart the dev server after changing env vars.  
**Security note:** `TMDB_API_KEY` and `TMDB_BASE_URL` must never be prefixed with `VITE_` — they must stay server-side only.

| Configuration | Works without it |
|---------------|------------------|
| TMDB key only | Browse, search, details, trailers |
| Firebase login or `FIREBASE_SERVICE_ACCOUNT_JSON` | Viewing history, Google sign-in, saved movies, and Letterboxd imports |

## API routes

| Route | Role |
|-------|------|
| `tmdb` | Secure proxy for TMDB API requests (server-side only) |
| `viewings` | Firestore-backed viewing-history API |

## Scripts

```bash
npm run dev      # Vite + local /api stubs
npm run import:letterboxd -- <export.zip>
npm run build    # Typecheck + production bundle
npm run lint     # ESLint
npm run test     # Vitest (API route unit tests)
npm run preview  # Preview production build
```

## Operational notes

- **TMDB** credentials are server-side only, proxied through `/api/tmdb`. The API key is never exposed to the browser.
- **Firestore** is accessed server-side through Firebase Admin. Local development uses your normal `firebase login` credentials; CI can use service-account credentials. Do not commit service-account credentials.
- **Firebase Auth** uses Google sign-in. Signed-in users can read/write only their own `users/{uid}` data through Firestore rules.
- **TMDB** is required for meaningful content; handle rate limits and network errors in the UI.
- Third-party failure modes: TMDB rate limits. The UI surfaces recoverable errors instead of crashing.

## Maintenance checklist

```bash
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

Smoke-test:

- [ ] Discover home loads trending, popular, and coming soon sections
- [ ] History loads imported Firestore viewings
- [ ] Google sign-in works and a movie can be saved to Watchlist
- [ ] Search movies and TV with filters
- [ ] Movie detail: trailer, cast, similar, Magic Link, IMDb link
- [ ] TV detail: seasons, cast, trailer, similar, Magic Link
