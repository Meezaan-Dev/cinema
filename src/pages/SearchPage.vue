<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import type { DiscoverParams } from '@/api/tmdbEndpoints'
import MovieCard from '@/components/movie/MovieCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import MovieGridSkeleton from '@/components/ui/MovieGridSkeleton.vue'
import { useDebounce } from '@/composables/useDebounce'
import { useMovieSearch, type SearchMediaType } from '@/composables/useMovieSearch'
import { sanitizeQuery, sanitizeYear } from '@/lib/filterValidation'

const route = useRoute()
const query = ref(sanitizeQuery(typeof route.query.q === 'string' ? route.query.q : ''))
const year = ref('')
const mediaType = ref<SearchMediaType>('both')
const debouncedQuery = useDebounce(computed(() => sanitizeQuery(query.value)))
const hasQuery = computed(() => debouncedQuery.value.length >= 2)
const filters = computed<DiscoverParams>(() => ({ year: year.value.length === 4 ? sanitizeYear(year.value) : '' }))
const search = useMovieSearch(debouncedQuery, filters, mediaType, { enabled: hasQuery })

watch(() => route.query.q, (value) => {
  query.value = sanitizeQuery(typeof value === 'string' ? value : '')
})
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
    <div class="mb-6">
      <p class="brand-kicker">Search titles</p>
      <h1 class="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Find a movie or show</h1>
      <p class="mt-2 text-sm text-[var(--text-secondary)]">Search by title. Use Browse to explore genres and South African streaming services.</p>
    </div>

    <label class="relative block max-w-2xl">
      <span class="sr-only">Search movies and TV shows</span>
      <Search class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--accent-gold)]" aria-hidden="true" />
      <input v-model="query" class="field h-14 !pl-12 text-base" placeholder="Search for Breaking Bad, Dune, Parasite..." autofocus />
    </label>

    <div class="mt-4 flex flex-wrap items-end gap-4">
      <div class="flex gap-2" role="group" aria-label="Search title type">
        <button
          v-for="option in [{ value: 'both', label: 'All' }, { value: 'movie', label: 'Movies' }, { value: 'series', label: 'Shows' }] as const"
          :key="option.value"
          type="button"
          :aria-pressed="mediaType === option.value"
          :class="['button-link', mediaType === option.value && 'button-link-accent']"
          @click="mediaType = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <label class="text-sm font-medium text-[var(--text-secondary)]">
        <span>Release year</span>
        <input :value="year" class="field mt-2 w-32" inputmode="numeric" maxlength="4" placeholder="Any year" @input="year = sanitizeYear(($event.target as HTMLInputElement).value)" />
      </label>
    </div>

    <div class="mt-8" aria-live="polite">
      <MovieGridSkeleton v-if="search.isLoading.value" :count="12" />
      <ErrorState v-else-if="search.isError.value" :error="search.error.value" :on-retry="() => search.refetch()" />
      <EmptyState v-else-if="!hasQuery" title="Search for a title" message="Enter at least two characters to see matching movies and shows." />
      <EmptyState v-else-if="!search.data.value?.results.length" title="No matches found" message="Try another title, year, or title type." />
      <div v-else class="movie-grid">
        <MovieCard v-for="title in search.data.value.results" :key="`${title.media_type ?? 'movie'}-${title.id}`" :movie="title" />
      </div>
    </div>
  </section>
</template>
