# Cinema

Cinema is a focused movie and TV discovery experience powered by TMDB. Browse trending content, search titles, explore detailed pages with cast and trailers, and get spoiler-free AI guidance from **Usher** — a knowledgeable companion that helps you decide what to watch.

No accounts. No watchlists. No setup beyond a TMDB key.

## What you can do

### Discovery
- Letterboxd-inspired home feed: featured hero, trending rail, popular movies & TV, top rated, coming soon
- Dedicated browse pages for movies and TV shows with genre, year, rating, and sort filters
- Unified search across movies and TV with instant debounced results
- Movie and TV detail pages: overview, genres, cast, trailers, similar titles, metadata
- **Magic Link** (PlayIMDb) and **View on IMDb** when TMDB provides an IMDb ID

### Usher (AI)
- On movie and TV detail pages, get spoiler-free viewing guidance via Gemini
- Includes: summary, who would enjoy it, what to avoid, tone & pacing, similar titles, and a recommendation score

## Routes

| Path | Purpose |
|------|---------|
| `/` | Discover home |
| `/movies` | Browse movies |
| `/tv-shows` | Browse TV series |
| `/search` | Unified search |
| `/movie/:id` | Movie detail |
| `/tv/:id` | TV series detail |

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS 4, Framer Motion
- **Data:** TMDB API
- **AI:** Google Gemini (`/api/ai-summary`)

## Project layout

```
api/                 Server handlers (AI summaries)
src/pages/           Route-level screens
src/components/      UI, movie cards, Usher, layout
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
# Required for discovery
VITE_TMDB_API_KEY=your_tmdb_v3_api_key
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p

# Server-side AI (optional; Usher on detail pages)
GEMINI_API_KEY=your_server_side_gemini_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

Restart the dev server after changing env vars. Never prefix `GEMINI_API_KEY` with `VITE_` — it must stay on the server.

| Configuration | Works without it |
|---------------|------------------|
| TMDB key only | Browse, search, details, trailers |
| + Gemini | Usher AI summaries on detail pages |

## API routes

| Route | Role |
|-------|------|
| `ai-summary` | Spoiler-free Gemini summaries via Usher |

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
- **Gemini** failures surface as recoverable Usher errors with retry.
- Third-party failure modes: TMDB rate limits and Gemini quota errors. The UI surfaces recoverable errors instead of crashing.

## Maintenance checklist

```bash
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

Smoke-test:

- [ ] Discover home loads trending, popular, and coming soon sections
- [ ] Search movies and TV with filters
- [ ] Movie detail: trailer, cast, similar, Magic Link, IMDb link, Usher
- [ ] TV detail: seasons, cast, trailer, similar, Magic Link, Usher
