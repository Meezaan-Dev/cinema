import { useMutation, useQuery } from '@tanstack/react-query'
import { Brain } from 'lucide-react'
import { useState } from 'react'

import { getAiRecommendationPlan } from '@/api/aiRecommendations'
import {
  discoverMovies,
  discoverSeries,
  getGenres,
  getSimilarMovies,
  queryKeys,
  searchMovies,
} from '@/api/tmdbEndpoints'
import { PickerControls } from '@/components/picker/PickerControls'
import { MovieCard } from '@/components/movie/MovieCard'
import { Button } from '@/components/ui/Button'
import { MovieGridSkeleton } from '@/components/ui/Skeleton'
import { StatusState } from '@/components/ui/StatusState'
import { moodProfiles, type MoodKey } from '@/lib/constants'
import { getErrorCopy } from '@/lib/errors'
import {
  sanitizeGenre,
  sanitizeMood,
  sanitizeRating,
  sanitizeRuntime,
  sanitizeWatchPreference,
} from '@/lib/filterValidation'
import { useWatchlist } from '@/hooks/useWatchlist'
import type { WatchPreference } from '@/types/movie'

const recommendedSearches = [
  'I want to watch a movie with the same vibe as Top Gun',
  'Give me a tense prestige series with mystery and great characters',
  'Find a new feel-good adventure movie for tonight',
]

export function PickerPage() {
  const watchlist = useWatchlist()
  const [mood, setMood] = useState<MoodKey>('electric')
  const [genre, setGenre] = useState('')
  const [maxRuntime, setMaxRuntime] = useState('120')
  const [minRating, setMinRating] = useState('7')
  const [preference, setPreference] = useState<WatchPreference>('unwatched')
  const [aiPrompt, setAiPrompt] = useState('I want to watch a movie with the same vibe as Top Gun')
  const [aiPlan, setAiPlan] = useState<Awaited<ReturnType<typeof getAiRecommendationPlan>> | null>(null)

  const genres = useQuery({ queryKey: queryKeys.genres, queryFn: getGenres })
  const aiMutation = useMutation({
    mutationFn: (promptOverride?: string) =>
      getAiRecommendationPlan({
        prompt: promptOverride ?? aiPrompt,
        genres: genres.data?.genres ?? [],
        watchlistTitles: watchlist.movies.map((movie) => movie.title),
    }),
    onSuccess: (plan) => {
      setAiPlan(plan)
    },
  })
  const safeMood = sanitizeMood(mood)
  const safeGenre = sanitizeGenre(genre, genres.data?.genres)
  const safeMaxRuntime = sanitizeRuntime(maxRuntime)
  const safeMinRating = sanitizeRating(minRating) || '7'
  const safePreference = sanitizeWatchPreference(preference)
  const aiGenre = aiPlan?.genreIds.length ? aiPlan.genreIds.join('|') : ''
  const aiRuntime = aiPlan?.maxRuntime ? String(aiPlan.maxRuntime) : ''
  const aiRating = aiPlan ? String(Math.max(0, Math.min(10, aiPlan.minRating))) : ''
  const activeGenre = aiGenre || safeGenre || moodProfiles[safeMood].query
  const activeRuntime = aiRuntime || safeMaxRuntime
  const activeRating = aiRating || safeMinRating
  const activeSort = aiPlan?.sortBy ?? 'vote_average.desc'
  const activeMediaType =
    aiPlan?.mediaType === 'series' ? 'series' : 'movie'
  const referenceTitle = aiPlan?.referenceTitle?.trim() ?? ''
  const referenceSearch = useQuery({
    queryKey: queryKeys.referenceSearch(referenceTitle),
    queryFn: () => searchMovies(referenceTitle),
    enabled: Boolean(referenceTitle),
  })
  const referenceMovie = referenceSearch.data?.results[0]
  const referenceRecommendations = useQuery({
    queryKey: referenceMovie ? queryKeys.similar(referenceMovie.id) : ['movie', 'reference', 'recommendations', referenceTitle],
    queryFn: () => getSimilarMovies(referenceMovie?.id ?? ''),
    enabled: Boolean(referenceMovie?.id),
  })
  const discover = useQuery({
    queryKey:
      activeMediaType === 'series'
        ? queryKeys.discoverSeries({ genre: activeGenre, maxRuntime: activeRuntime, minRating: activeRating, sortBy: activeSort, page: 1 })
        : queryKeys.discover({ genre: activeGenre, maxRuntime: activeRuntime, minRating: activeRating, sortBy: activeSort, page: 1 }),
    queryFn: () =>
      activeMediaType === 'series'
        ? discoverSeries({ genre: activeGenre, maxRuntime: activeRuntime, minRating: activeRating, sortBy: activeSort, page: 1 })
        : discoverMovies({ genre: activeGenre, maxRuntime: activeRuntime, minRating: activeRating, sortBy: activeSort, page: 1 }),
  })

  const referenceResults = referenceRecommendations.data?.results ?? []
  const baseRecommendationResults = referenceResults.length > 0 ? referenceResults : discover.data?.results ?? []
  const recommendationResults = baseRecommendationResults.filter((movie) => {
    const savedMovie = watchlist.byId.get(movie.id)
    if (safePreference === 'watched' && !savedMovie?.isWatched) return false
    if (safePreference === 'unwatched' && savedMovie?.isWatched) return false
    return true
  })
  const aiErrorCopy = aiMutation.isError ? getErrorCopy(aiMutation.error) : null

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Smart recommendations</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-6xl">Describe the vibe. We’ll find the titles.</h1>
        <p className="mt-3 text-slate-300">Try “I want to watch a movie with the same vibe as Top Gun” or ask for a new series with a specific mood.</p>
      </div>
      <div className="mb-5 rounded-3xl border border-white/[0.07] bg-white/[0.045] p-4">
        <label className="text-sm font-medium text-slate-300" htmlFor="ai-vibe-search">
          AI vibe search
        </label>
        <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.055] p-2 focus-within:border-sky-300/70 focus-within:ring-4 focus-within:ring-sky-300/15 sm:flex-row sm:items-end">
          <textarea
            id="ai-vibe-search"
            className="min-h-24 flex-1 resize-none rounded-xl border-0 bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-slate-500 sm:min-h-14"
            value={aiPrompt}
            onChange={(event) => setAiPrompt(event.target.value.slice(0, 500))}
            placeholder="I want to watch a movie with the same vibe as Top Gun"
          />
          <Button
            type="button"
            variant="primary"
            className="shrink-0"
            onClick={() => aiMutation.mutate(aiPrompt)}
            disabled={aiMutation.isPending}
          >
            <Brain className="size-4" aria-hidden="true" />
            {aiMutation.isPending ? 'Thinking...' : 'Search'}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {recommendedSearches.map((search) => (
            <button
              key={search}
              type="button"
              onClick={() => {
                setAiPrompt(search)
                setAiPlan(null)
                aiMutation.mutate(search)
              }}
              className="rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/12 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
            >
              {search}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {aiPlan ? (
            <p className="text-sm text-slate-400">
              {aiPlan.reason} {aiPlan.referenceTitle ? `Reference: ${aiPlan.referenceTitle}.` : ''} {aiPlan.vibeTags.length ? `Tags: ${aiPlan.vibeTags.join(', ')}` : ''}
            </p>
          ) : null}
        </div>
        {aiErrorCopy ? (
          <p className="mt-3 text-sm text-slate-400">
            {aiErrorCopy.message}
          </p>
        ) : null}
      </div>
      <PickerControls
        genres={genres.data?.genres ?? []}
        mood={safeMood}
        genre={safeGenre}
        maxRuntime={safeMaxRuntime}
        minRating={safeMinRating}
        preference={safePreference}
        onChange={(updates) => {
          if (updates.mood) setMood(sanitizeMood(updates.mood))
          if (updates.genre !== undefined) setGenre(sanitizeGenre(updates.genre, genres.data?.genres))
          if (updates.maxRuntime !== undefined) setMaxRuntime(sanitizeRuntime(updates.maxRuntime))
          if (updates.minRating !== undefined) setMinRating(sanitizeRating(updates.minRating) || '7')
          if (updates.preference) setPreference(sanitizeWatchPreference(updates.preference))
        }}
      />

      <section className="mt-10">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              {aiPlan ? 'AI-matched results' : 'Current recommendation pool'}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              {aiPlan ? 'Similar titles for your search' : 'Titles matching your filters'}
            </h2>
          </div>
          {aiPlan ? (
            <p className="max-w-2xl text-sm text-slate-400">
              {aiPlan.reason} {aiPlan.vibeTags.length ? `Signals: ${aiPlan.vibeTags.join(', ')}` : ''}
            </p>
          ) : null}
        </div>
        {discover.isLoading || referenceRecommendations.isLoading || referenceSearch.isLoading ? <MovieGridSkeleton count={10} /> : null}
        {!discover.isLoading && !referenceRecommendations.isLoading && !referenceSearch.isLoading && recommendationResults.length === 0 ? (
          <StatusState title="No matching titles yet" message="Try a broader prompt, lower the rating, or choose any runtime." />
        ) : null}
        {!discover.isLoading && !referenceRecommendations.isLoading && !referenceSearch.isLoading && recommendationResults.length > 0 ? (
          <div className="movie-grid">
            {recommendationResults.slice(0, 15).map((movie) => (
              <MovieCard
                key={`${movie.media_type ?? 'movie'}-${movie.id}`}
                movie={movie}
                genres={genres.data?.genres}
                saved={watchlist.byId.get(movie.id)}
                onAdd={watchlist.addMovie}
              />
            ))}
          </div>
        ) : null}
      </section>
    </section>
  )
}
