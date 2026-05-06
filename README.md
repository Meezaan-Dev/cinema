# Absolute Cinema

Absolute Cinema is a polished React SPA for discovering movies with the real TMDB API. It combines trending, popular, search, detail, watchlist, personal ratings, favourites, CSV export, and a “What Should I Watch Tonight?” picker.

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
- Supabase Auth and Postgres for shared watchlists
- Gemini API for server-side AI recommendations and summaries
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
npm run test
npm run preview
```

## Operational Notes

- `VITE_TMDB_API_KEY` is required for movie and series discovery. The TMDB base URL and image base URL have safe defaults, but can be overridden with `VITE_TMDB_BASE_URL` and `VITE_TMDB_IMAGE_BASE_URL`.
- Supabase is optional. Without Supabase variables, browsing, local watchlists, CSV export, and TMDB-backed detail pages still work. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to enable shared watchlists, Google auth, invite links, and cached AI summaries.
- Run the SQL migrations in `supabase/migrations/` when provisioning a new Supabase project. `001_core_watchlists.sql` creates the core schema, RLS policies, auth/profile hooks, invite RPC, and AI summary cache. `002_owner_read_policy.sql` keeps owner read access explicit.
- AI routes live in `/api/ai-recommendation` and `/api/ai-summary`. They use `GEMINI_API_KEY` server-side only, validate Gemini JSON before returning it, and degrade with user-safe errors when quota, auth, or malformed output occurs.
- Third-party failure modes to expect: TMDB network/rate-limit errors, Gemini quota or key errors, Supabase auth redirect misconfiguration, and browser storage quota/security failures. The app should show recoverable UI states for these instead of crashing.

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
- AI recommendation from the picker/search experience
