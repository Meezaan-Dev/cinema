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
```

Restart the dev server after changing environment variables. `GEMINI_API_KEY` is intentionally not prefixed with `VITE_`; it must stay server-side and is used by the `/api/ai-recommendation` endpoint.

The AI endpoint is implemented as a serverless API route and Vite dev middleware. Get a Gemini API key from Google AI Studio, add it to `.env`, then restart `npm run dev`.

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
