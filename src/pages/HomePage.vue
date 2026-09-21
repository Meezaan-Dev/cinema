<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight, Star } from 'lucide-vue-next'
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
import MovieSection from '@/components/movie/MovieSection.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { formatRating, getYear, imageUrl } from '@/lib/formatters'

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
    <div class="absolute inset-0 bg-[linear-gradient(90deg,#14181C_0%,rgba(20,24,28,.85)_40%,rgba(20,24,28,.3)_70%,rgba(20,24,28,.9)_100%)]" />
    <div class="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#14181C] to-transparent" />
    <div class="relative mx-auto flex min-h-[70svh] max-w-7xl flex-col justify-end px-4 py-16 sm:px-6">
      <div v-if="hero" class="max-w-5xl">
        <p class="text-xs font-medium uppercase tracking-[0.24em] text-[#99AABB]">Featured</p>
        <h1 class="mt-3 text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:whitespace-nowrap">{{ hero.title }}</h1>
        <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#99AABB]">
          <span>{{ getYear(hero.release_date) }}</span>
          <template v-if="heroGenres?.length">
            <span aria-hidden="true">·</span>
            <span>{{ heroGenres.join(', ') }}</span>
          </template>
          <span class="inline-flex items-center gap-1 rounded-md bg-[#00E054]/10 px-2 py-0.5 font-semibold text-[#00E054]">
            <Star class="size-3.5 fill-current" aria-hidden="true" />
            {{ formatRating(hero.vote_average) }}
          </span>
        </div>
        <p v-if="hero.overview" class="mt-5 max-w-xl text-base leading-7 text-[#99AABB] line-clamp-3">{{ hero.overview }}</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <RouterLink :to="heroPath" class="button-link button-link-accent">
            View details
            <ArrowRight class="size-4" aria-hidden="true" />
          </RouterLink>
          <RouterLink to="/search" class="button-link">Search titles</RouterLink>
        </div>
      </div>
      <div v-else-if="trending.isLoading.value" class="h-48 animate-pulse rounded-2xl bg-[#1C2228]" />
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
