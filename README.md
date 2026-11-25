# Cinema

Cinema is a focused movie and TV discovery experience powered by TMDB. Browse trending content, search titles, and explore detailed pages with cast and trailers.

No accounts. No watchlists. No setup beyond a TMDB key.

## What you can do

### Discovery
- Focused home feed: trending, popular movies, and popular shows
- One browse page for movies and shows, with genre, year, rating, sort, and South African streaming-service filters
- Quick search across titles and people, plus a separate title search with type and year filters
- Movie and TV detail pages: overview, genres, cast, trailers, similar titles, metadata
- South African watch options on movie and TV detail pages: streaming, free, ad-supported, rental, and purchase listings from TMDB/JustWatch
- Movie detail cinema times for Ster-Kinekor Blue Route, Nu Metro Canal Walk, and Nu Metro Cavendish Square; choose branches and browse the next seven days
- **Open on PlayIMDb** and **View on IMDb** when TMDB provides an IMDb ID

## Routes

| Path | Purpose |
|------|---------|
| `/` | Discover home |
| `/browse` | Browse movies and shows, optionally filtered to a South African streaming service |
| `/streaming`, `/movies`, `/tv-shows` | Redirect to the equivalent Browse view |
| `/people` | Search actors and directors |
| `/search` | Title search with type and year filters |
| `/movie/:id` | Movie detail |
| `/tv/:id` | TV series detail |
| `/person/:id` | Person profile and credits |

## Tech stack

- **Frontend:** Vue 3, TypeScript, Vite, Vue Router, Pinia, TanStack Vue Query, Tailwind CSS 4, motion-v
- **Data:** TMDB API

## Project layout

```
api/                 Server handlers
src/pages/           Route-level Vue views
src/components/      UI, movie cards, layout
src/composables/     Search and utility composables
src/router/          Vue Router config
src/stores/          Pinia UI state
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

```

Restart the dev server after changing env vars.  
**Security note:** `TMDB_API_KEY` and `TMDB_BASE_URL` must never be prefixed with `VITE_` — they must stay server-side only.

| Configuration | Works without it |
|---------------|------------------|
| TMDB key only | Browse, search, details, trailers |

## API routes

| Route | Role |
|-------|------|
| `tmdb` | Secure proxy for TMDB API requests (server-side only) |
| `cinema-showtimes` | Server-side checks of the three fixed Cape Town cinema branches |

## Scripts

```bash
npm run dev      # Vite + local /api stubs
npm run build    # Typecheck + production bundle
npm run lint     # ESLint
npm run test     # Vitest (API route unit tests)
npm run preview  # Preview production build
```

## Operational notes

- **TMDB** credentials are server-side only, proxied through `/api/tmdb`. The API key is never exposed to the browser.
- **TMDB** is required for meaningful content; handle rate limits and network errors in the UI.
- Watch listings are specific to South Africa and may change. TMDB provides a watch page link rather than direct streaming-platform links.
- Cinema listings are checked on the chains' public sites, cached for five minutes, and linked to the official film page when a match is confirmed. Branch choices are saved in this browser. If a site cannot be read or a title match is uncertain, the movie page says so and links to the official site.
- Third-party failure modes: TMDB rate limits. The UI surfaces recoverable errors instead of crashing.

## Maintenance checklist

```bash
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

Smoke-test:

- [ ] Discover home loads trending, popular movies, and popular shows
- [ ] Browse all titles, then filter by type, genre, and a South African streaming service
- [ ] Quick search titles and people; open title search with the query preserved
- [ ] Movie detail: watch options and cinema times before metadata, then trailer, cast, similar, PlayIMDb, IMDb
- [ ] TV detail: watch options before metadata, then seasons, cast, trailer, similar, PlayIMDb
- [ ] Movie and TV detail: South African watch options, empty state, TMDB link, JustWatch credit
- [ ] Movie detail: three cinema branches, date choices, showtimes, official links, and unavailable/uncertain states
