<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { ExternalLink, Play, Star } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import {
  getMovieCredits,
  getMovieDetails,
  getMovieVideos,
  getSimilarMovies,
  queryKeys,
} from '@/api/tmdbEndpoints'
import CastRail from '@/components/movie/CastRail.vue'
import MoviePoster from '@/components/movie/MoviePoster.vue'
import MovieSection from '@/components/movie/MovieSection.vue'
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
  queryFn: () => getMovieDetails(movieTmdbId.value ?? ''),
  enabled: isValidMovieId,
})
const credits = useQuery({
  queryKey: computed(() => queryKeys.credits(movieTmdbId.value ?? movieId.value)),
  queryFn: () => getMovieCredits(movieTmdbId.value ?? ''),
  enabled: isValidMovieId,
})
const videos = useQuery({
  queryKey: computed(() => queryKeys.videos(movieTmdbId.value ?? movieId.value)),
  queryFn: () => getMovieVideos(movieTmdbId.value ?? ''),
  enabled: isValidMovieId,
})
const similar = useQuery({
  queryKey: computed(() => queryKeys.similar(movieTmdbId.value ?? movieId.value)),
  queryFn: () => getSimilarMovies(movieTmdbId.value ?? ''),
  enabled: isValidMovieId,
})

const movie = computed(() => details.data.value)
const trailerKey = computed(() => {
  const candidate =
    videos.data.value?.results.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ??
    videos.data.value?.results.find((video) => video.site === 'YouTube')
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
        { label: 'TMDB rating', value: `${formatRating(movie.value.vote_average)} / 10` },
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
      <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,24,28,.4),#14181C_90%)]" />
      <div class="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-14 xl:grid-cols-[260px_minmax(0,1fr)]">
        <MoviePoster :path="movie.poster_path" :title="movie.title" class="w-full shadow-[0_24px_60px_rgba(0,0,0,.5)] sm:w-64 lg:w-full" size="w780" />
        <div class="min-w-0 self-end">
          <p class="text-sm font-medium uppercase tracking-[0.2em] text-[#99AABB]">{{ getYear(movie.release_date) }} · {{ formatRuntime(movie.runtime) }}</p>
          <h1 class="mt-3 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl xl:text-[3.5rem]">{{ movie.title }}</h1>
          <p v-if="movie.tagline" class="mt-3 text-lg italic text-[#99AABB]">{{ movie.tagline }}</p>
          <div class="mt-5 flex flex-wrap items-center gap-2">
            <span v-for="genre in movie.genres" :key="genre.id" class="rounded-full border border-white/[0.08] bg-[#1C2228] px-3 py-1 text-sm text-[#99AABB]">{{ genre.name }}</span>
            <span class="inline-flex items-center gap-1 rounded-full bg-[#00E054] px-3 py-1 text-sm font-semibold text-[#14181C]">
              <Star class="size-4 fill-current" aria-hidden="true" />
              {{ formatRating(movie.vote_average) }}
            </span>
          </div>
          <p class="mt-6 max-w-2xl text-base leading-7 text-[#99AABB]">{{ movie.overview || 'No overview is available for this movie yet.' }}</p>
          <dl class="mt-6 grid max-w-4xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div v-for="item in detailItems" :key="item.label" class="rounded-xl border border-white/[0.08] bg-[#1C2228]/85 p-4 backdrop-blur">
              <dt class="text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">{{ item.label }}</dt>
              <dd class="mt-1 text-sm font-semibold text-white">{{ item.value }}</dd>
            </div>
          </dl>
          <div class="mt-6 flex flex-wrap gap-3">
            <a v-if="magicLinkUrl" class="button-link button-link-accent" :href="magicLinkUrl" target="_blank" rel="noreferrer">
              <ExternalLink class="size-4" aria-hidden="true" />
              Magic Link
            </a>
            <a v-if="imdbUrl" class="button-link" :href="imdbUrl" target="_blank" rel="noreferrer">
              <ExternalLink class="size-4" aria-hidden="true" />
              View on IMDb
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h2 class="text-2xl font-semibold text-white">Cast</h2>
      <div class="mt-4">
        <CastRail :cast="credits.data.value?.cast.slice(0, 12) ?? []" :is-loading="credits.isLoading.value" />
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h2 class="text-2xl font-semibold text-white">Trailer</h2>
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
      <p v-else class="mt-3 text-sm text-[#99AABB]">No trailer is available from TMDB yet.</p>
    </section>

    <MovieSection
      title="Similar Movies"
      :movies="similar.data.value?.results.slice(0, 10)"
      :is-loading="similar.isLoading.value"
      :is-error="similar.isError.value"
      :error="similar.error.value"
      :on-retry="() => similar.refetch()"
    />

    <section class="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <RouterLink to="/" class="inline-block text-sm font-medium text-[#99AABB] hover:text-white">Back to Discover</RouterLink>
    </section>
  </template>
</template>
