<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { Search } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { getGenres, queryKeys, type DiscoverParams } from '@/api/tmdbEndpoints'
import MovieCard from '@/components/movie/MovieCard.vue'
import SearchFilters from '@/components/search/SearchFilters.vue'
import { useDebounce } from '@/composables/useDebounce'
import { useMovieSearch, type SearchMediaType } from '@/composables/useMovieSearch'
import EmptyState from '@/components/ui/EmptyState.vue'
import MovieGridSkeleton from '@/components/ui/MovieGridSkeleton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { sanitizeGenre, sanitizeQuery, sanitizeRating, sanitizeSortBy, sanitizeYear } from '@/lib/filterValidation'

const mediaTypeOptions: Array<{ value: SearchMediaType; label: string }> = [
  { value: 'both', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'TV Shows' },
]

const route = useRoute()
const query = ref(sanitizeQuery(typeof route.query.q === 'string' ? route.query.q : ''))
const mediaType = ref<SearchMediaType>('both')
const hasFilterIntent = ref(false)
const filters = ref<Required<Pick<DiscoverParams, 'genre' | 'year' | 'minRating' | 'sortBy'>>>({
  genre: '',
  year: '',
  minRating: '',
  sortBy: 'popularity.desc',
})

const sanitizedQuery = computed(() => sanitizeQuery(query.value))
const debouncedQuery = useDebounce(sanitizedQuery)
const hasMeaningfulQuery = computed(() => debouncedQuery.value.trim().length >= 2)

const genres = useQuery({ queryKey: queryKeys.genres, queryFn: getGenres })

const safeFilters = computed(() => ({
  genre: sanitizeGenre(filters.value.genre, genres.data.value?.genres),
  year: filters.value.year.length === 4 ? sanitizeYear(filters.value.year) : '',
  minRating: sanitizeRating(filters.value.minRating),
  sortBy: sanitizeSortBy(filters.value.sortBy),
}))

const canRunSearch = computed(() => hasMeaningfulQuery.value || (!debouncedQuery.value.trim() && hasFilterIntent.value))
const search = useMovieSearch(debouncedQuery, safeFilters, mediaType, { enabled: canRunSearch })

const movies = computed(() => {
  const results = search.data.value?.results ?? []
  if (!hasMeaningfulQuery.value) return results
  return results
    .filter((movie) => (safeFilters.value.minRating ? movie.vote_average >= Number(safeFilters.value.minRating) : true))
    .filter((movie) => (safeFilters.value.genre ? movie.genre_ids?.includes(Number(safeFilters.value.genre)) : true))
    .sort((a, b) => {
      if (safeFilters.value.sortBy === 'vote_average.desc') return b.vote_average - a.vote_average
      if (safeFilters.value.sortBy === 'primary_release_date.desc') return b.release_date.localeCompare(a.release_date)
      return b.popularity - a.popularity
    })
})

const showEmptyPrompt = computed(() => !canRunSearch.value && !search.isLoading.value)

function onFilterChange(updates: { genre?: string; year?: string; minRating?: string; sortBy?: string }) {
  hasFilterIntent.value = true
  filters.value = {
    ...filters.value,
    genre: updates.genre !== undefined ? sanitizeGenre(updates.genre, genres.data.value?.genres) : filters.value.genre,
    year: updates.year !== undefined ? sanitizeYear(updates.year) : filters.value.year,
    minRating: updates.minRating !== undefined ? sanitizeRating(updates.minRating) : filters.value.minRating,
    sortBy: updates.sortBy !== undefined ? sanitizeSortBy(updates.sortBy) : filters.value.sortBy,
  }
}

function setMediaType(value: SearchMediaType) {
  mediaType.value = value
  if (!debouncedQuery.value.trim()) {
    hasFilterIntent.value = true
  }
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div class="mb-6 max-w-3xl">
      <p class="text-xs font-medium uppercase tracking-[0.24em] text-[#99AABB]">Search</p>
      <h1 class="mt-2 text-4xl font-bold tracking-tight text-white">Find movies & TV shows</h1>
      <p class="mt-3 text-base text-[#99AABB]">Instant search across TMDB with filters and suggestions.</p>
    </div>

    <div class="space-y-4">
      <div class="grid gap-3 rounded-2xl border border-white/[0.08] bg-[#1C2228] p-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <label class="relative block">
          <span class="sr-only">Search movies and TV shows</span>
          <Search class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#99AABB]" aria-hidden="true" />
          <input
            v-model="query"
            class="field h-14 w-full rounded-xl border-white/[0.08] bg-[#202830] !pl-12 !pr-4 text-base"
            placeholder="Search for Breaking Bad, Dune, Parasite..."
            autofocus
          />
        </label>
        <div class="flex rounded-xl border border-white/[0.08] bg-[#14181C] p-1" aria-label="Search media type">
          <button
            v-for="option in mediaTypeOptions"
            :key="option.value"
            type="button"
            :class="`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054] lg:flex-none ${
              mediaType === option.value ? 'bg-[#00E054] text-[#14181C]' : 'text-[#99AABB] hover:bg-white/5 hover:text-white'
            }`"
            @click="setMediaType(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <p v-if="debouncedQuery.trim()" class="text-sm text-[#99AABB]">
        Showing results for <span class="font-medium text-white">&ldquo;{{ debouncedQuery }}&rdquo;</span>
      </p>

      <SearchFilters
        :genres="genres.data.value?.genres ?? []"
        :genre="filters.genre"
        :year="filters.year"
        :min-rating="filters.minRating"
        :sort-by="filters.sortBy"
        @change="onFilterChange"
      />
    </div>

    <div class="mt-8">
      <MovieGridSkeleton v-if="search.isLoading.value" :count="12" />
      <ErrorState v-if="search.isError.value" :error="search.error.value" :on-retry="() => search.refetch()" />
      <EmptyState
        v-if="showEmptyPrompt && !search.isError.value"
        title="Start typing to search"
        message="Enter at least 2 characters, or use filters to browse."
      />
      <EmptyState
        v-if="!search.isLoading.value && !search.isError.value && hasMeaningfulQuery && movies.length === 0"
        title="No matches"
        message="Try a broader search, switch between movies and TV shows, or lower the rating filter."
      />
      <div v-if="!search.isLoading.value && !search.isError.value && movies.length > 0" class="movie-grid">
        <MovieCard v-for="movie in movies" :key="`${movie.media_type ?? 'movie'}-${movie.id}`" :movie="movie" />
      </div>
    </div>
  </section>
</template>
