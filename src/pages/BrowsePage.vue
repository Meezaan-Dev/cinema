<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { Search, SlidersHorizontal } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getGenres, getTvGenres, queryKeys } from '@/api/tmdbEndpoints'
import MovieCard from '@/components/movie/MovieCard.vue'
import SearchFilters from '@/components/search/SearchFilters.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import MovieGridSkeleton from '@/components/ui/MovieGridSkeleton.vue'
import { useMovieSearch, type SearchMediaType } from '@/composables/useMovieSearch'
import { browseDiscoverFilters, browsePlatform, browseType, type BrowseType } from '@/lib/browse'
import { sanitizeGenre, sanitizeRating, sanitizeSortBy, sanitizeYear } from '@/lib/filterValidation'
import { STREAMING_PLATFORM_LIST } from '@/lib/streamingPlatforms'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const type = computed(() => browseType(route.query.type))
const platform = computed(() => browsePlatform(route.query.platform))
const mediaType = computed<SearchMediaType>(() => type.value === 'tv' ? 'series' : type.value === 'movie' ? 'movie' : 'both')
const emptyQuery = ref('')
const showMoreFilters = ref(false)
const page = ref(1)
const defaultFilters = { genre: '', year: '', minRating: '', sortBy: 'popularity.desc' }
const localFilters = ref({ ...defaultFilters })
const activeFilterCount = computed(() => Number(type.value !== 'all' && !!localFilters.value.genre) + Number(!!localFilters.value.year) + Number(!!localFilters.value.minRating) + Number(localFilters.value.sortBy !== defaultFilters.sortBy))

const movieGenres = useQuery({ queryKey: queryKeys.genres, queryFn: getGenres })
const tvGenres = useQuery({ queryKey: queryKeys.tvGenres, queryFn: getTvGenres })
const genres = computed(() => type.value === 'tv' ? tvGenres.data.value?.genres ?? [] : movieGenres.data.value?.genres ?? [])
const filters = computed(() => ({ ...browseDiscoverFilters(type.value, platform.value, localFilters.value, genres.value), page: page.value }))
const titles = useMovieSearch(emptyQuery, filters, mediaType)
const totalPages = computed(() => Math.min(titles.data.value?.total_pages ?? 1, 500))

watch([type, platform], () => { page.value = 1 })

function updateRoute(nextType: BrowseType, nextPlatform: string) {
  router.replace({
    path: '/browse',
    query: {
      ...(nextType === 'all' ? {} : { type: nextType }),
      ...(nextPlatform ? { platform: nextPlatform } : {}),
    },
  })
}

function setType(nextType: BrowseType) {
  localFilters.value.genre = ''
  updateRoute(nextType, platform.value)
}

function onFilterChange(updates: { genre?: string; year?: string; minRating?: string; sortBy?: string }) {
  page.value = 1
  localFilters.value = {
    genre: updates.genre !== undefined ? sanitizeGenre(updates.genre, genres.value) : localFilters.value.genre,
    year: updates.year !== undefined ? sanitizeYear(updates.year) : localFilters.value.year,
    minRating: updates.minRating !== undefined ? sanitizeRating(updates.minRating) : localFilters.value.minRating,
    sortBy: updates.sortBy !== undefined ? sanitizeSortBy(updates.sortBy) : localFilters.value.sortBy,
  }
}

function changePage(nextPage: number) {
  page.value = nextPage
  document.getElementById('browse-results')?.scrollIntoView({ block: 'start' })
}

function clearFilters() {
  localFilters.value = { ...defaultFilters }
  page.value = 1
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="brand-kicker">Find something to watch</p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Browse titles</h1>
        <p class="mt-2 text-sm text-[var(--text-secondary)]">Explore all titles, or choose a service to see its South African catalog.</p>
      </div>
      <button type="button" class="button-link" @click="ui.openSuperSearch()">
        <Search class="size-4" aria-hidden="true" /> Search a title
      </button>
    </div>

    <div class="mb-5 flex flex-wrap gap-2" role="group" aria-label="Title type">
      <button
        v-for="option in [{ value: 'all', label: 'All' }, { value: 'movie', label: 'Movies' }, { value: 'tv', label: 'Shows' }] as const"
        :key="option.value"
        type="button"
        :aria-pressed="type === option.value"
        :class="['button-link', type === option.value && 'button-link-accent']"
        @click="setType(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <label class="block max-w-sm text-sm font-medium text-[var(--text-secondary)]">
      <span>Streaming service in South Africa</span>
      <select class="field mt-2" :value="platform" @change="updateRoute(type, ($event.target as HTMLSelectElement).value)">
        <option value="">Any service · all titles</option>
        <option v-for="item in STREAMING_PLATFORM_LIST" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
    </label>

    <div class="mt-5 flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="button-link"
        :aria-expanded="showMoreFilters"
        aria-controls="browse-more-filters"
        @click="showMoreFilters = !showMoreFilters"
      >
        <SlidersHorizontal class="size-4" aria-hidden="true" /> More filters{{ activeFilterCount ? ` (${activeFilterCount})` : '' }}
      </button>
      <button v-if="activeFilterCount" type="button" class="text-sm text-[var(--accent-gold)] underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]" @click="clearFilters">Clear filters</button>
    </div>
    <div v-if="showMoreFilters" id="browse-more-filters" class="mt-4">
      <SearchFilters
        :genres="genres"
        :genre="localFilters.genre"
        :year="localFilters.year"
        :min-rating="localFilters.minRating"
        :sort-by="localFilters.sortBy"
        :show-genre="type !== 'all'"
        @change="onFilterChange"
      />
    </div>

    <div id="browse-results" class="mt-8 scroll-mt-6" aria-live="polite">
      <MovieGridSkeleton v-if="titles.isLoading.value" :count="12" />
      <ErrorState v-else-if="titles.isError.value" :error="titles.error.value" :on-retry="() => titles.refetch()" />
      <EmptyState v-else-if="!titles.data.value?.results.length" title="No titles found" message="Try another service or fewer filters." />
      <div v-else class="movie-grid">
        <MovieCard v-for="title in titles.data.value.results" :key="`${title.media_type ?? 'movie'}-${title.id}`" :movie="title" />
      </div>
      <nav v-if="!titles.isLoading.value && !titles.isError.value && titles.data.value?.results.length && totalPages > 1" class="mt-8 flex items-center justify-center gap-4" aria-label="Browse pages">
        <button type="button" class="button-link" :disabled="page === 1" @click="changePage(page - 1)">Previous</button>
        <span class="text-sm text-[var(--text-secondary)]">Page {{ page }} of {{ totalPages }}</span>
        <button type="button" class="button-link" :disabled="page >= totalPages" @click="changePage(page + 1)">Next</button>
      </nav>
    </div>
  </section>
</template>
