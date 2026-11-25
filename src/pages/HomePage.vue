<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight, Search, Star } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { getPopularMovies, getPopularSeries, getTrendingMovies, queryKeys } from '@/api/tmdbEndpoints'
import MovieSection from '@/components/movie/MovieSection.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { formatRating, getYear, imageUrl } from '@/lib/formatters'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const trending = useQuery({ queryKey: queryKeys.trending, queryFn: getTrendingMovies })
const popular = useQuery({ queryKey: queryKeys.popular, queryFn: getPopularMovies })
const popularSeries = useQuery({ queryKey: queryKeys.popularSeries, queryFn: getPopularSeries })
const hero = computed(() => trending.data.value?.results[0])
const heroImage = computed(() => imageUrl(hero.value?.backdrop_path, 'original'))
const heroPath = computed(() => hero.value?.media_type === 'tv' ? `/tv/${hero.value.id}` : `/movie/${hero.value?.id}`)
</script>

<template>
  <section class="relative overflow-hidden border-b border-[var(--brand-border)]">
    <img v-if="heroImage" :src="heroImage" alt="" class="absolute inset-0 size-full object-cover opacity-30" />
    <div class="absolute inset-0 bg-[linear-gradient(90deg,#071326_0%,rgba(7,19,38,.88)_60%,rgba(7,19,38,.65)_100%)]" />
    <div class="relative mx-auto flex max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
      <p class="brand-kicker">Find something to watch</p>
      <h1 class="mt-2 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">Your next movie or show starts here</h1>
      <p class="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">Explore titles, then check where they are available in South Africa.</p>
      <div class="mt-5 flex flex-wrap gap-3">
        <RouterLink to="/browse" class="button-link button-link-accent">Browse titles <ArrowRight class="size-4" aria-hidden="true" /></RouterLink>
        <button type="button" class="button-link" @click="ui.openSuperSearch()"><Search class="size-4" aria-hidden="true" /> Search a title</button>
      </div>
      <div v-if="hero" class="mt-8 max-w-xl border-t border-[var(--brand-border)] pt-4">
        <p class="text-xs font-semibold uppercase tracking-widest text-[var(--accent-gold)]">Trending this week</p>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <RouterLink :to="heroPath" class="text-lg font-semibold hover:underline">{{ hero.title }}</RouterLink>
          <span class="text-sm text-[var(--text-secondary)]">{{ getYear(hero.release_date) }}</span>
          <span v-if="hero.vote_count > 0 && hero.vote_average > 0" class="inline-flex items-center gap-1 text-sm text-[var(--accent-gold)]"><Star class="size-3.5 fill-current" aria-hidden="true" />{{ formatRating(hero.vote_average) }}</span>
        </div>
      </div>
    </div>
  </section>

  <section v-if="trending.isError.value" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <ErrorState :error="trending.error.value" :on-retry="() => trending.refetch()" />
  </section>
  <MovieSection title="Trending Now" :movies="trending.data.value?.results.slice(0, 12)" :is-loading="trending.isLoading.value" :is-error="trending.isError.value" :error="trending.error.value" :on-retry="() => trending.refetch()" carousel explore-to="/browse" />
  <MovieSection title="Popular Movies" :movies="popular.data.value?.results.slice(0, 10)" :is-loading="popular.isLoading.value" :is-error="popular.isError.value" :error="popular.error.value" :on-retry="() => popular.refetch()" explore-to="/browse?type=movie" />
  <MovieSection title="Popular Shows" :movies="popularSeries.data.value?.results.slice(0, 10)" :is-loading="popularSeries.isLoading.value" :is-error="popularSeries.isError.value" :error="popularSeries.error.value" :on-retry="() => popularSeries.refetch()" explore-to="/browse?type=tv" />
</template>
