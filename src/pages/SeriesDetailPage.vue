<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { CalendarDays, ExternalLink, ListVideo, Play, Star } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import {
  getSeriesDetailsBundle,
  queryKeys,
} from '@/api/tmdbEndpoints'
import CastRail from '@/components/movie/CastRail.vue'
import MoviePoster from '@/components/movie/MoviePoster.vue'
import MovieSection from '@/components/movie/MovieSection.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import StatusState from '@/components/ui/StatusState.vue'
import { formatRating, getYear, imageUrl } from '@/lib/formatters'
import { parsePositiveIntegerParam } from '@/lib/routeParams'
import { buildImdbUrl, buildMagicLinkUrl, sanitizeYoutubeKey } from '@/lib/sanitize'

function displayDate(date: string) {
  return date || 'TBA'
}

const route = useRoute()
const seriesId = computed(() => (typeof route.params.seriesId === 'string' ? route.params.seriesId : ''))
const seriesTmdbId = computed(() => parsePositiveIntegerParam(seriesId.value))
const isValidSeriesId = computed(() => seriesTmdbId.value !== null)

const details = useQuery({
  queryKey: computed(() => queryKeys.seriesDetail(seriesTmdbId.value ?? seriesId.value)),
  queryFn: () => getSeriesDetailsBundle(seriesTmdbId.value ?? ''),
  enabled: isValidSeriesId,
})

const series = computed(() => details.data.value)
const backdrop = computed(() => imageUrl(series.value?.backdrop_path, 'original'))
const imdbUrl = computed(() => buildImdbUrl(series.value?.external_ids.imdb_id))
const magicLinkUrl = computed(() => buildMagicLinkUrl(series.value?.external_ids.imdb_id))
const trailerKey = computed(() => {
  const candidate =
    series.value?.videos.results.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ??
    series.value?.videos.results.find((video) => video.site === 'YouTube')
  return sanitizeYoutubeKey(candidate?.key)
})
</script>

<template>
  <section v-if="!isValidSeriesId" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <StatusState title="Series not found" message="Series URLs need a valid TMDB series ID." />
  </section>

  <section v-else-if="details.isLoading.value" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <Skeleton class="h-[420px] w-full rounded-2xl" />
  </section>

  <section v-else-if="details.isError.value || !series" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <ErrorState :error="details.error.value" :on-retry="() => details.refetch()" />
  </section>

  <template v-else>
    <section class="relative overflow-hidden">
      <img v-if="backdrop" :src="backdrop" alt="" class="absolute inset-0 h-full w-full object-cover opacity-35" />
      <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,24,28,.4),#14181C_90%)]" />
      <div class="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr] lg:py-14">
        <MoviePoster :path="series.poster_path" :title="series.name" class="w-full shadow-[0_24px_60px_rgba(0,0,0,.5)] sm:w-64 lg:w-full" size="w780" />
        <div class="max-w-3xl self-end">
          <p class="text-sm font-medium uppercase tracking-[0.2em] text-[#99AABB]">{{ getYear(series.first_air_date) }} · {{ series.status || 'Status unknown' }}</p>
          <h1 class="mt-3 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">{{ series.name }}</h1>
          <div class="mt-5 flex flex-wrap items-center gap-2">
            <span v-for="genre in series.genres" :key="genre.id" class="rounded-full border border-white/[0.08] bg-[#1C2228] px-3 py-1 text-sm text-[#99AABB]">{{ genre.name }}</span>
            <span class="inline-flex items-center gap-1 rounded-full bg-[#00E054] px-3 py-1 text-sm font-semibold text-[#14181C]">
              <Star class="size-4 fill-current" aria-hidden="true" />
              {{ formatRating(series.vote_average) }}
            </span>
          </div>
          <p class="mt-6 max-w-2xl text-base leading-7 text-[#99AABB]">{{ series.overview || 'No overview is available for this series yet.' }}</p>
          <dl class="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-white/[0.08] bg-[#1C2228] p-4">
              <dt class="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">
                <CalendarDays class="size-4" aria-hidden="true" />
                First aired
              </dt>
              <dd class="mt-2 text-lg font-semibold text-white">{{ displayDate(series.first_air_date) }}</dd>
            </div>
            <div class="rounded-xl border border-white/[0.08] bg-[#1C2228] p-4">
              <dt class="text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">Seasons</dt>
              <dd class="mt-2 text-lg font-semibold text-white">{{ series.number_of_seasons }}</dd>
            </div>
            <div class="rounded-xl border border-white/[0.08] bg-[#1C2228] p-4">
              <dt class="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">
                <ListVideo class="size-4" aria-hidden="true" />
                Episodes
              </dt>
              <dd class="mt-2 text-lg font-semibold text-white">{{ series.number_of_episodes }}</dd>
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
        <CastRail :cast="series.credits.cast.slice(0, 12)" :is-loading="details.isLoading.value" />
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h2 class="text-2xl font-semibold text-white">Trailer</h2>
      <div v-if="trailerKey" class="mt-4">
        <div class="aspect-video max-w-3xl overflow-hidden rounded-xl bg-black">
          <iframe
            class="h-full w-full"
            :src="`https://www.youtube.com/embed/${trailerKey}`"
            :title="`${series.name} trailer`"
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

    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div class="mb-5">
        <p class="text-xs font-medium uppercase tracking-[0.2em] text-[#99AABB]">Episode guide</p>
        <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white">Seasons</h2>
      </div>
      <StatusState v-if="series.seasons.length === 0" title="No seasons listed" message="TMDB does not have season information for this series yet." />
      <div v-else class="grid gap-4 md:grid-cols-2">
        <article
          v-for="season in series.seasons"
          :key="season.id"
          class="grid grid-cols-[92px_1fr] gap-4 rounded-xl border border-white/[0.08] bg-[#1C2228] p-3 sm:grid-cols-[116px_1fr]"
        >
          <MoviePoster :path="season.poster_path" :title="season.name" class="w-full rounded-lg" size="w342" />
          <div class="min-w-0 py-1">
            <h3 class="line-clamp-2 text-base font-semibold text-white">{{ season.name }}</h3>
            <p class="mt-1 text-sm text-[#99AABB]">
              {{ season.episode_count }} {{ season.episode_count === 1 ? 'episode' : 'episodes' }} · {{ displayDate(season.air_date) }}
            </p>
            <p v-if="season.overview" class="mt-3 line-clamp-3 text-sm leading-6 text-[#99AABB]">{{ season.overview }}</p>
          </div>
        </article>
      </div>
    </section>

    <MovieSection
      title="Similar Shows"
      :movies="series.recommendations.results.slice(0, 10)"
      :is-loading="details.isLoading.value"
      :is-error="details.isError.value"
      :error="details.error.value"
      :on-retry="() => details.refetch()"
      explore-to="/tv-shows"
    />

    <div class="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <RouterLink to="/" class="text-sm font-medium text-[#99AABB] hover:text-white">Back to Discover</RouterLink>
    </div>
  </template>
</template>
