# Absolute Cinema

Absolute Cinema is a polished React SPA for discovering movies with the real TMDB API. It combines trending, popular, search, detail, watchlist, personal ratings, favourites, CSV export, and AI-powered decision summaries.

## Screenshots

<img width="1467" height="954" alt="Screenshot 2026-05-06 at 12 34 21" src="https://github.com/user-attachments/assets/ac88ddce-8c06-43ec-82d7-50af77217227" />


## Tech Stack

- React 19 with Vite and TypeScript
- React Router
- TanStack Query
- Tailwind CSS
- shadcn-style UI primitives
- Framer Motion
- TMDB API
- Firebase Auth and Firestore for shared watchlists
- Gemini API for server-side AI summaries
- localStorage
- Custom CSV export utility

## Features

- Browse trending, popular, and top-rated movies
- Search movies with genre, year, rating, and sort filters
- See what is new across movies and series
- View movie details with cast, trailers, and recommendations
- Add or remove movies from a persistent watchlist
- Mark movies watched, favourite movies, and add personal ratings
- Filter and sort the watchlist
- Export watchlist data to CSV
- Generate spoiler-safe AI decision summaries on detail pages
- Sign in with Google to create shareable, collaborative watchlists
- Keep watched/to-watch status, favourites, and ratings personal inside shared lists
- Loading, empty, error, retry, and image fallback states

## Setup

```bash
npm install
npm run dev
```

## Environment

Create a `.env` file in the project root:

```env
VITE_TMDB_API_KEY=your_tmdb_v3_api_key
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
GEMINI_API_KEY=your_server_side_gemini_key
GEMINI_MODEL=gemini-2.5-flash-lite

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Server-side Firebase (for API routes)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

Restart the dev server after changing environment variables. `GEMINI_API_KEY` and `FIREBASE_SERVICE_ACCOUNT_KEY` are intentionally not prefixed with `VITE_`; they must stay server-side.

The AI endpoints are implemented as serverless API routes. Get a Gemini API key from Google AI Studio and add it to `.env`.

Firebase is optional for browsing and local watchlists. Add the Firebase variables to enable Google auth, cloud watchlists, invite links, collaboration, and cached AI summaries. See [FIREBASE_MIGRATION.md](./FIREBASE_MIGRATION.md) for detailed setup instructions.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run preview
```

## Operational Notes

- `VITE_TMDB_API_KEY` is required for movie and series discovery. The TMDB base URL and image base URL have safe defaults, but can be overridden with `VITE_TMDB_BASE_URL` and `VITE_TMDB_IMAGE_BASE_URL`.
- Firebase is optional. Without Firebase variables, browsing, local watchlists, CSV export, and TMDB-backed detail pages still work. Add client Firebase variables for shared watchlists and Google auth; add server Firebase variables for invite joins and cached AI summaries.
- Set up Firebase project, enable Firestore and Google Auth. Deploy Firestore security rules from [FIREBASE_MIGRATION.md](./FIREBASE_MIGRATION.md).
- API routes live in `/api/ai-summary`, `/api/add-watchlist-item`, `/api/create-watchlist`, `/api/delete-watchlist`, `/api/delete-watchlist-item`, `/api/get-watchlist`, `/api/join-watchlist`, and `/api/list-watchlists`. They keep `GEMINI_API_KEY` and Firebase service account credentials server-side only.
- Third-party failure modes to expect: TMDB network/rate-limit errors, Gemini quota or key errors, Firebase auth misconfiguration, and browser storage quota/security failures. The app should show recoverable UI states for these instead of crashing.

## Maintenance Checklist

Before leaving the code untouched for a while, run:

```bash
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

Smoke-test these flows locally or in a preview deploy:

- Search and filter movies/series
- Movie and series detail pages
- Local watchlist add/remove/rate/export
- Cloud watchlist create/delete/import
- Invite link join flow
- AI summary on detail pages
