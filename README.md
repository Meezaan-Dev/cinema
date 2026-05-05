# Absolute Cinema

Absolute Cinema is a polished React SPA for discovering movies with the real TMDB API. It combines trending, popular, search, detail, watchlist, personal ratings, favourites, CSV export, and a “What Should I Watch Tonight?” picker into a portfolio-ready dark cinematic product.

## Screenshots

Add screenshots here after running the app locally.

## Tech Stack

- React 19 with Vite and TypeScript
- React Router
- TanStack Query
- Tailwind CSS
- shadcn-style UI primitives
- Framer Motion
- TMDB API
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
- Use the Tonight Picker to get a focused recommendation
- Use Gemini-powered vibe search, for example: “I want to watch a movie with the same vibe as Top Gun”
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
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_server_side_supabase_service_role_key
```

Restart the dev server after changing environment variables. `GEMINI_API_KEY` is intentionally not prefixed with `VITE_`; it must stay server-side and is used by the `/api/ai-recommendation` endpoint.

The AI endpoints are implemented as serverless API routes and Vite dev middleware. Get a Gemini API key from Google AI Studio, add it to `.env`, then restart `npm run dev`.

Supabase is optional for browsing, local watchlists, and AI summaries. Add the Supabase variables and run the SQL in `supabase/migrations/001_core_watchlists.sql` to enable Google auth, cloud watchlists, invite links, collaboration, and cached AI summaries.

### Supabase auth redirects

In Supabase, open Authentication > URL Configuration:

- Set Site URL to the production app URL, for example `https://your-domain.com`.
- Add Redirect URLs for every app origin that can start auth:
  - `https://your-domain.com/**`
  - `https://*-your-vercel-team.vercel.app/**` for Vercel previews
  - `http://localhost:5173/**` and `http://127.0.0.1:5173/**` for local Vite dev

If Vite starts on another port, for example `5174`, add that exact localhost/127.0.0.1 port as well.

If Google sign-in sends production users to `localhost`, Supabase is falling back to the Site URL or rejecting the app-provided redirect URL because the production URL is not allow-listed.

In Google Cloud OAuth settings, keep the authorized redirect URI as the Supabase callback URL from Authentication > Sign In / Providers > Google, for example `https://your-project.supabase.co/auth/v1/callback`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Future Improvements

- User accounts and multi-device sync
- Notes and custom lists
- More nuanced recommendation scoring
- Import/export backups
- Playwright visual smoke tests
