<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { discoverSeries, getTvGenres, queryKeys, type DiscoverParams } from '@/api/tmdbEndpoints'
import MovieCard from '@/components/movie/MovieCard.vue'
import SearchFilters from '@/components/search/SearchFilters.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import MovieGridSkeleton from '@/components/ui/MovieGridSkeleton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { sanitizeGenre, sanitizeRating, sanitizeSortBy, sanitizeYear } from '@/lib/filterValidation'

const filters = ref<Required<Pick<DiscoverParams, 'genre' | 'year' | 'minRating' | 'sortBy'>>>({
  genre: '',
  year: '',
  minRating: '',
  sortBy: 'popularity.desc',
})

const genres = useQuery({ queryKey: queryKeys.tvGenres, queryFn: getTvGenres })

const safeFilters = computed(() => ({
  genre: sanitizeGenre(filters.value.genre, genres.data.value?.genres),
  year: filters.value.year.length === 4 ? sanitizeYear(filters.value.year) : '',
  minRating: sanitizeRating(filters.value.minRating),
  sortBy: sanitizeSortBy(filters.value.sortBy),
}))

const discover = useQuery({
  queryKey: computed(() => queryKeys.discoverSeries(safeFilters.value)),
  queryFn: () => discoverSeries(safeFilters.value),
})

function onFilterChange(updates: { genre?: string; year?: string; minRating?: string; sortBy?: string }) {
  filters.value = {
    ...filters.value,
    genre: updates.genre !== undefined ? sanitizeGenre(updates.genre, genres.data.value?.genres) : filters.value.genre,
    year: updates.year !== undefined ? sanitizeYear(updates.year) : filters.value.year,
    minRating: updates.minRating !== undefined ? sanitizeRating(updates.minRating) : filters.value.minRating,
    sortBy: updates.sortBy !== undefined ? sanitizeSortBy(updates.sortBy) : filters.value.sortBy,
  }
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div class="mb-6 max-w-3xl">
      <p class="text-xs font-medium uppercase tracking-[0.24em] text-[#99AABB]">Browse</p>
      <h1 class="mt-2 text-4xl font-bold tracking-tight text-white">TV Shows</h1>
      <p class="mt-3 text-base text-[#99AABB]">Discover trending and top-rated series.</p>
    </div>

    <SearchFilters
      :genres="genres.data.value?.genres ?? []"
      :genre="filters.genre"
      :year="filters.year"
      :min-rating="filters.minRating"
      :sort-by="filters.sortBy"
      @change="onFilterChange"
    />

    <div class="mt-8">
      <MovieGridSkeleton v-if="discover.isLoading.value" :count="15" />
      <ErrorState v-if="discover.isError.value" :error="discover.error.value" :on-retry="() => discover.refetch()" />
      <EmptyState
        v-if="!discover.isLoading.value && !discover.isError.value && discover.data.value?.results.length === 0"
        title="No shows found"
        message="Try adjusting your filters."
      />
      <div v-if="!discover.isLoading.value && !discover.isError.value && discover.data.value?.results.length" class="movie-grid">
        <MovieCard v-for="show in discover.data.value.results" :key="show.id" :movie="show" />
      </div>
    </div>
  </section>
</template>
