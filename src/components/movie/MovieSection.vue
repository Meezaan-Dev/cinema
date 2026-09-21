<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import MovieCard from '@/components/movie/MovieCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import MovieGridSkeleton from '@/components/ui/MovieGridSkeleton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import type { TmdbMovie } from '@/types/tmdb'

const props = withDefaults(
  defineProps<{
    title: string
    eyebrow?: string
    movies?: TmdbMovie[]
    isLoading?: boolean
    isError?: boolean
    error?: unknown
    onRetry?: () => void
    horizontal?: boolean
    carousel?: boolean
    exploreTo?: string
  }>(),
  { exploreTo: '/search' },
)

const isHorizontal = computed(() => props.horizontal || props.carousel)
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-9 sm:px-6">
    <div class="mb-5 flex items-end justify-between gap-4">
      <div>
        <p v-if="eyebrow" class="text-xs font-medium uppercase tracking-[0.2em] text-[#99AABB]">{{ eyebrow }}</p>
        <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white">{{ title }}</h2>
      </div>
      <RouterLink
        :to="exploreTo"
        class="rounded-full px-3 py-1.5 text-sm font-medium text-[#99AABB] transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]"
      >
        Explore
      </RouterLink>
    </div>
    <MovieGridSkeleton v-if="isLoading" :count="isHorizontal ? 6 : 10" />
    <ErrorState v-if="isError" :error="error" :on-retry="onRetry" />
    <EmptyState
      v-if="!isLoading && !isError && movies?.length === 0"
      title="Nothing here yet"
      message="Check back soon for new titles."
    />
    <div v-if="!isLoading && !isError && movies?.length && carousel" class="carousel-row">
      <div class="carousel-track">
        <MovieCard
          v-for="movie in movies"
          :key="`${movie.media_type ?? 'movie'}-${movie.id}`"
          :movie="movie"
          compact
        />
        <div v-for="movie in movies" :key="`duplicate-${movie.media_type ?? 'movie'}-${movie.id}`" aria-hidden="true" inert>
          <MovieCard :movie="movie" compact />
        </div>
      </div>
    </div>
    <div v-if="!isLoading && !isError && movies?.length && !carousel" :class="isHorizontal ? 'scroll-row' : 'movie-grid'">
      <MovieCard
        v-for="movie in movies"
        :key="`${movie.media_type ?? 'movie'}-${movie.id}`"
        :movie="movie"
        :compact="isHorizontal"
      />
    </div>
  </section>
</template>
