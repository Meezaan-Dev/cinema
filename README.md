# Absolute Cinema

Absolute Cinema is a dark-themed React app for discovering movies and TV series with TMDB, saving titles you care about, and deciding what to watch next—solo or with friends.

Browse trending and popular catalogs, dig into detail pages with cast and trailers, keep a personal watchlist in the browser, or sign in with Google to run collaborative lists where everyone shares the same titles but keeps their own watched status, favourites, and ratings.

## Screenshots

<img width="1467" height="954" alt="Screenshot 2026-05-06 at 12 34 21" src="https://github.com/user-attachments/assets/ac88ddce-8c06-43ec-82d7-50af77217227" />

## What you can do

### Discovery
- Home feed with trending, popular, and top-rated movies
- Search with genre, year, rating, and sort filters (movies and series)
- Movie and series detail pages: overview, genres, cast, similar titles, YouTube trailers
- Optional **Magic Link** buttons on detail pages (PlayIMDb) when TMDB provides an IMDb id

### Personal watchlist (no account)
- Add titles from home, search, or detail pages
- Persisted in `localStorage`
- Mark watched, favourite, and rate (1–5 stars)
- Filter, sort, and export to CSV

### Shared watchlists (Google sign-in + Firebase)
- Create named lists and share invite links (`/join/:token`)
- Members add movies and series to one shared catalog
- Per-member state: watched / to watch, favourite, personal rating, optional notes
- List owners can delete a whole list; active members can remove a title for everyone
- Import a local watchlist into the cloud after sign-in
- Detail UI aligned with movie detail pages: poster, metadata, actions panel, and **Tiny Usher** (spoiler-safe AI summaries)

### Tiny Usher (AI)
- On detail pages and shared watchlist rows, request a short spoiler-safe takeaway via Gemini
- Summaries are cached server-side in Firestore when Firebase is configured

## Routes

| Path | Purpose |
|------|---------|
| `/` | Home discovery |
| `/search` | Search and filter |
| `/movie/:id` | Movie detail |
| `/tv/:id` | Series detail |
| `/watchlists` | Local + cloud watchlist hub |
| `/watchlists/:id` | Shared watchlist detail |
| `/join/:token` | Accept an invite |

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS 4, Framer Motion
- **Data:** TMDB API (discovery and metadata)
- **Auth & cloud data:** Firebase Auth (Google) + Firestore
- **Server routes:** Vite dev middleware locally; Vercel-style `/api/*` handlers in production
- **AI:** Google Gemini (`/api/ai-summary`)
- **Local persistence:** `localStorage` for the personal shelf

## Project layout

```
api/                 Server handlers (watchlists, AI, TMDB-adjacent ops)
src/pages/           Route-level screens
src/components/      UI, movie cards, watchlist rows, layout
src/hooks/           Watchlist and auth hooks
src/api/             Client calls to /api and TMDB
FIREBASE_SETUP.md    Firestore schema, rules, and setup
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
# Required for discovery
VITE_TMDB_API_KEY=your_tmdb_v3_api_key
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p

# Server-side AI (optional; detail/watchlist usher)
GEMINI_API_KEY=your_server_side_gemini_key
GEMINI_MODEL=gemini-2.5-flash-lite

# Client Firebase (optional; shared watchlists + Google sign-in)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Server Firebase (optional; API routes)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

Restart the dev server after changing env vars. Never prefix `GEMINI_API_KEY` or `FIREBASE_SERVICE_ACCOUNT_KEY` with `VITE_`—they must stay on the server.

| Configuration | Works without it |
|---------------|------------------|
| TMDB key only | Browse, search, details, local watchlist, CSV export |
| + Gemini | Tiny Usher summaries |
| + Firebase client | Google sign-in, shared lists in the UI |
| + Firebase Admin | Invite joins, cloud CRUD, cached AI, item/list delete APIs |

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for Firestore collections, security rules, and setup.

## API routes

Server handlers under `/api` (wired in `vite.config.ts` for local dev):

| Route | Role |
|-------|------|
| `ai-summary` | Spoiler-safe Gemini summaries (cached) |
| `list-watchlists` | Lists for the signed-in user |
| `create-watchlist` | Create list + owner membership |
| `get-watchlist` | List metadata, items, and caller's per-item state |
| `add-watchlist-item` | Add a movie or series to a list |
| `delete-watchlist-item` | Remove a title from a list for all members |
| `delete-watchlist` | Delete a list (owner) |
| `join-watchlist` | Join or reactivate via invite token |

All watchlist routes expect a Firebase ID token (`Authorization: Bearer …`).

## Scripts

```bash
npm run dev      # Vite + local /api stubs
npm run build    # Typecheck + production bundle
npm run lint     # ESLint
npm run test     # Vitest (API route unit tests)
npm run preview  # Preview production build
```

## Operational notes

- **TMDB** is required for meaningful content; handle rate limits and network errors in the UI.
- **Firebase** is optional for solo use; shared lists and invite flows need client + Admin config. Deploy Firestore rules from [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).
- **Gemini** failures surface as recoverable usher errors with retry.
- **localStorage** can hit quota or be cleared by the user; cloud lists are the durable option when signed in.
- Third-party failure modes: TMDB rate limits, Gemini quota errors, Firebase misconfiguration, and browser storage limits. The UI should surface recoverable errors instead of crashing.

## Maintenance checklist

Before shipping or after a long pause:

```bash
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

Smoke-test:

- [ ] Search and filters (movie + series)
- [ ] Movie and series detail (trailer, similar, Magic Link if IMDb id exists)
- [ ] Local watchlist: add, rate, favourite, watched, export
- [ ] Sign in → create shared list → copy invite → join in another session
- [ ] Shared list: add title, toggle state, remove title, delete list (owner)
- [ ] Tiny Usher on a detail page and a shared list row
