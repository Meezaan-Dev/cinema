<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight, Star, TvMinimalPlay } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import {
  getGenres,
  getPopularMovies,
  getPopularSeries,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
  queryKeys,
} from '@/api/tmdbEndpoints'
import UsherMascot from '@/components/brand/UsherMascot.vue'
import PlatformLogo from '@/components/brand/PlatformLogo.vue'
import MovieSection from '@/components/movie/MovieSection.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { formatRating, getYear, imageUrl } from '@/lib/formatters'
import { STREAMING_PLATFORM_LIST } from '@/lib/streamingPlatforms'

const genresQuery = useQuery({ queryKey: queryKeys.genres, queryFn: getGenres })
const trending = useQuery({ queryKey: queryKeys.trending, queryFn: getTrendingMovies })
const popular = useQuery({ queryKey: queryKeys.popular, queryFn: getPopularMovies })
const popularSeries = useQuery({ queryKey: queryKeys.popularSeries, queryFn: getPopularSeries })
const topRated = useQuery({ queryKey: queryKeys.topRated, queryFn: getTopRatedMovies })
const upcoming = useQuery({ queryKey: queryKeys.upcoming, queryFn: getUpcomingMovies })

const hero = computed(() => trending.data.value?.results[0])
const heroImage = computed(() => imageUrl(hero.value?.backdrop_path, 'original'))
const heroGenres = computed(() =>
  hero.value?.genre_ids
    ?.map((id) => genresQuery.data.value?.genres.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3),
)
const heroPath = computed(() => {
  if (!hero.value) return '/'
  return hero.value.media_type === 'tv' ? `/tv/${hero.value.id}` : `/movie/${hero.value.id}`
})
</script>

<template>
  <section class="relative overflow-hidden">
    <img v-if="heroImage" :src="heroImage" alt="" class="absolute inset-0 h-full w-full object-cover opacity-40" />
    <div class="absolute inset-0 bg-[linear-gradient(90deg,#071326_0%,rgba(7,19,38,.9)_42%,rgba(7,19,38,.34)_72%,rgba(7,19,38,.94)_100%)]" />
    <div class="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[var(--bg)] to-transparent" />
    <div class="relative mx-auto flex min-h-[70svh] max-w-7xl flex-col justify-end px-4 py-16 sm:px-6">
      <div v-if="hero" class="max-w-5xl">
        <div class="mb-5 flex max-w-xl items-center gap-3 rounded-3xl border border-[var(--brand-border)] bg-[#071326]/70 p-3 backdrop-blur-xl">
          <UsherMascot variant="brand" class="size-12 shrink-0" />
          <div>
            <p class="brand-kicker">Now cueing</p>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">I found tonight's feature from the latest reels.</p>
          </div>
        </div>
        <p class="brand-kicker">Featured screening</p>
        <h1 class="mt-3 text-4xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-6xl lg:whitespace-nowrap">{{ hero.title }}</h1>
        <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
          <span>{{ getYear(hero.release_date) }}</span>
          <template v-if="heroGenres?.length">
            <span aria-hidden="true">·</span>
            <span>{{ heroGenres.join(', ') }}</span>
          </template>
          <span class="inline-flex items-center gap-1 rounded-md bg-[var(--accent-gold)]/15 px-2 py-0.5 font-semibold text-[var(--accent-gold)]">
            <Star class="size-3.5 fill-current" aria-hidden="true" />
            {{ formatRating(hero.vote_average) }}
          </span>
        </div>
        <p v-if="hero.overview" class="mt-5 max-w-xl text-base leading-7 text-[var(--text-secondary)] line-clamp-3">{{ hero.overview }}</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <RouterLink :to="heroPath" class="button-link button-link-accent">
            View details
            <ArrowRight class="size-4" aria-hidden="true" />
          </RouterLink>
          <RouterLink to="/search" class="button-link">Search titles</RouterLink>
        </div>
      </div>
      <div v-else-if="trending.isLoading.value" class="h-48 animate-pulse rounded-2xl bg-[var(--surface)]" />
    </div>
  </section>

  <section v-if="trending.isError.value" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <ErrorState :error="trending.error.value" :on-retry="() => trending.refetch()" />
  </section>

  <MovieSection
    title="Trending Now"
    eyebrow="This week"
    :movies="trending.data.value?.results.slice(0, 12)"
    :is-loading="trending.isLoading.value"
    :is-error="trending.isError.value"
    :error="trending.error.value"
    :on-retry="() => trending.refetch()"
    carousel
  />

  <!-- Streaming Platforms Spotlight -->
  <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <div class="relative overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[linear-gradient(135deg,rgba(255,241,199,0.06),rgba(13,27,47,0.85))] p-6 sm:p-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--accent-gold)]">
            <TvMinimalPlay class="size-3.5" aria-hidden="true" />
            <span>Platform Screenings</span>
          </div>
          <h2 class="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Stream by Platform
          </h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
            Explore dedicated hubs for What's New, Trending Now, and Top Rated on your favorite services.
          </p>
        </div>
        <RouterLink to="/streaming" class="button-link shrink-0">
          Open Streaming Hub
          <ArrowRight class="size-4" aria-hidden="true" />
        </RouterLink>
      </div>

      <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RouterLink
          v-for="platform in STREAMING_PLATFORM_LIST"
          :key="platform.id"
          :to="`/streaming?platform=${platform.id}`"
          :class="[
            'group flex flex-col justify-between rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]',
            platform.borderClass,
            'bg-[var(--surface)]/70 hover:bg-[var(--surface)]',
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex h-7 items-center">
              <PlatformLogo
                :platform="platform.id"
                :variant="platform.id === 'netflix' ? 'icon' : 'full'"
                class="h-5 w-auto max-w-[80px]"
              />
            </div>
            <ArrowRight class="size-4 text-[var(--text-secondary)] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true" />
          </div>
          <div class="mt-4">
            <p class="font-bold text-[var(--text-primary)]">{{ platform.name }}</p>
            <p class="mt-0.5 text-xs text-[var(--text-secondary)]">What's New & Trending</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
  <MovieSection
    title="Popular Movies"
    eyebrow="Browse"
    :movies="popular.data.value?.results.slice(0, 10)"
    :is-loading="popular.isLoading.value"
    :is-error="popular.isError.value"
    :error="popular.error.value"
    :on-retry="() => popular.refetch()"
    explore-to="/movies"
  />
  <MovieSection
    title="Popular TV Shows"
    eyebrow="Series"
    :movies="popularSeries.data.value?.results.slice(0, 10)"
    :is-loading="popularSeries.isLoading.value"
    :is-error="popularSeries.isError.value"
    :error="popularSeries.error.value"
    :on-retry="() => popularSeries.refetch()"
    explore-to="/tv-shows"
  />
  <MovieSection
    title="Top Rated"
    eyebrow="Critics & audiences"
    :movies="topRated.data.value?.results.slice(0, 10)"
    :is-loading="topRated.isLoading.value"
    :is-error="topRated.isError.value"
    :error="topRated.error.value"
    :on-retry="() => topRated.refetch()"
    explore-to="/movies"
  />
  <MovieSection
    title="Coming Soon"
    eyebrow="Up next"
    :movies="upcoming.data.value?.results.slice(0, 10)"
    :is-loading="upcoming.isLoading.value"
    :is-error="upcoming.isError.value"
    :error="upcoming.error.value"
    :on-retry="() => upcoming.refetch()"
    explore-to="/movies"
  />
</template>
