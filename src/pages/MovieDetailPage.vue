<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { ExternalLink, Play, Star } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import {
  getMovieDetailsBundle,
  queryKeys,
} from '@/api/tmdbEndpoints'
import CastRail from '@/components/movie/CastRail.vue'
import CinemaShowtimes from '@/components/movie/CinemaShowtimes.vue'
import MoviePoster from '@/components/movie/MoviePoster.vue'
import MovieSection from '@/components/movie/MovieSection.vue'
import WatchProviders from '@/components/movie/WatchProviders.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import StatusState from '@/components/ui/StatusState.vue'
import { formatRating, formatRuntime, getYear, imageUrl } from '@/lib/formatters'
import { parsePositiveIntegerParam } from '@/lib/routeParams'
import { buildImdbUrl, buildMagicLinkUrl, sanitizeYoutubeKey } from '@/lib/sanitize'

const route = useRoute()
const movieId = computed(() => (typeof route.params.movieId === 'string' ? route.params.movieId : ''))
const movieTmdbId = computed(() => parsePositiveIntegerParam(movieId.value))
const isValidMovieId = computed(() => movieTmdbId.value !== null)

const details = useQuery({
  queryKey: computed(() => queryKeys.detail(movieTmdbId.value ?? movieId.value)),
  queryFn: () => getMovieDetailsBundle(movieTmdbId.value ?? ''),
  enabled: isValidMovieId,
})

const movie = computed(() => details.data.value)
const trailerKey = computed(() => {
  const candidate =
    movie.value?.videos.results.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ??
    movie.value?.videos.results.find((video) => video.site === 'YouTube')
  return sanitizeYoutubeKey(candidate?.key)
})
const backdrop = computed(() => imageUrl(movie.value?.backdrop_path, 'original'))
const imdbUrl = computed(() => buildImdbUrl(movie.value?.imdb_id))
const magicLinkUrl = computed(() => buildMagicLinkUrl(movie.value?.imdb_id))
const detailItems = computed(() =>
  movie.value
    ? [
        { label: 'Release date', value: movie.value.release_date || 'Unknown' },
        { label: 'Status', value: movie.value.status || 'Unknown' },
        { label: 'Runtime', value: formatRuntime(movie.value.runtime) },
        { label: 'TMDB rating', value: movie.value.vote_count > 0 ? `${formatRating(movie.value.vote_average)} / 10` : 'Not rated' },
      ]
    : [],
)
</script>

<template>
  <section v-if="!isValidMovieId" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <StatusState title="Movie not found" message="Movie URLs need a valid TMDB movie ID." />
  </section>

  <section v-else-if="details.isLoading.value" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <Skeleton class="h-[420px] w-full rounded-2xl" />
  </section>

  <section v-else-if="details.isError.value || !movie" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <ErrorState :error="details.error.value" :on-retry="() => details.refetch()" />
  </section>

  <template v-else>
    <section class="relative overflow-hidden">
      <img v-if="backdrop" :src="backdrop" alt="" class="absolute inset-0 h-full w-full object-cover opacity-35" />
      <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,19,38,.48),#071326_90%)]" />
      <div class="relative mx-auto grid max-w-7xl grid-cols-[96px_minmax(0,1fr)] gap-4 px-4 py-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <MoviePoster :path="movie.poster_path" :title="movie.title" class="w-24 shadow-[0_24px_60px_rgba(0,0,0,.5)] sm:w-44 lg:w-full" size="w780" />
        <div class="min-w-0 self-end">
          <p class="text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent-gold)]">{{ getYear(movie.release_date) }} · {{ formatRuntime(movie.runtime) }}</p>
          <h1 class="mt-2 text-2xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-5xl xl:text-[3.5rem]">{{ movie.title }}</h1>
          <p v-if="movie.tagline" class="mt-3 text-lg italic text-[var(--text-secondary)]">{{ movie.tagline }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <span v-if="movie.vote_count > 0 && movie.vote_average > 0" class="inline-flex items-center gap-1 rounded-full bg-[var(--accent-gold)] px-3 py-1 text-sm font-semibold text-[#071326]">
              <Star class="size-4 fill-current" aria-hidden="true" />
              {{ formatRating(movie.vote_average) }}
            </span>
          </div>
        </div>
        <div class="col-span-2 min-w-0 lg:col-span-1 lg:col-start-2">
          <div class="flex flex-wrap items-center gap-2">
            <span v-for="genre in movie.genres" :key="genre.id" class="rounded-full border border-[var(--brand-border)] bg-[var(--surface)] px-3 py-1 text-sm text-[var(--text-secondary)]">{{ genre.name }}</span>
          </div>
          <p class="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">{{ movie.overview || 'No overview is available for this movie yet.' }}</p>
        </div>
      </div>
    </section>

    <WatchProviders media-type="movie" :id="movie.id" />
    <CinemaShowtimes :movie-id="movie.id" />

    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h2 class="text-2xl font-semibold text-[var(--text-primary)]">More details</h2>
      <dl class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="item in detailItems" :key="item.label" class="rounded-xl border border-[var(--brand-border)] bg-[var(--surface)] p-4">
          <dt class="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]">{{ item.label }}</dt>
          <dd class="mt-1 text-sm font-semibold text-[var(--text-primary)]">{{ item.value }}</dd>
        </div>
      </dl>
      <div class="mt-5 flex flex-wrap gap-3">
        <a v-if="magicLinkUrl" class="button-link" :href="magicLinkUrl" target="_blank" rel="noreferrer"><ExternalLink class="size-4" aria-hidden="true" /> Open on PlayIMDb</a>
        <a v-if="imdbUrl" class="button-link" :href="imdbUrl" target="_blank" rel="noreferrer"><ExternalLink class="size-4" aria-hidden="true" /> View on IMDb</a>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h2 class="text-2xl font-semibold text-[var(--text-primary)]">Cast</h2>
      <div class="mt-4">
        <CastRail :cast="movie.credits.cast.slice(0, 12)" :is-loading="details.isLoading.value" />
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h2 class="text-2xl font-semibold text-[var(--text-primary)]">Trailer</h2>
      <div v-if="trailerKey" class="mt-4">
        <div class="aspect-video max-w-3xl overflow-hidden rounded-xl bg-black">
          <iframe
            class="h-full w-full"
            :src="`https://www.youtube.com/embed/${trailerKey}`"
            :title="`${movie.title} trailer`"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          />
        </div>
        <a class="button-link mt-4" :href="`https://www.youtube.com/watch?v=${trailerKey}`" target="_blank" rel="noreferrer">
          <Play class="size-4" aria-hidden="true" />
          Open on YouTube
          <ExternalLink class="size-4" aria-hidden="true" />
        </a>
      </div>
      <p v-else class="mt-3 text-sm text-[var(--text-secondary)]">No trailer is available from TMDB yet.</p>
    </section>

    <MovieSection
      title="Similar Movies"
      :movies="movie.recommendations.results.slice(0, 10)"
      :is-loading="details.isLoading.value"
      :is-error="details.isError.value"
      :error="details.error.value"
      :on-retry="() => details.refetch()"
      explore-to="/browse?type=movie"
    />

    <section class="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <RouterLink to="/" class="inline-block text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Back to Discover</RouterLink>
    </section>
  </template>
</template>
