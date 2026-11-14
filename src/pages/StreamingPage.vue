<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { ChevronLeft, ChevronRight, Film, Tv, TvMinimalPlay } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  getGenres,
  getPlatformCatalog,
  getPlatformNew,
  getPlatformTrending,
  getTvGenres,
  queryKeys,
  type DiscoverParams,
} from '@/api/tmdbEndpoints'
import UsherMascot from '@/components/brand/UsherMascot.vue'
import PlatformLogo from '@/components/brand/PlatformLogo.vue'
import MovieCard from '@/components/movie/MovieCard.vue'
import MovieSection from '@/components/movie/MovieSection.vue'
import SearchFilters from '@/components/search/SearchFilters.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import MovieGridSkeleton from '@/components/ui/MovieGridSkeleton.vue'
import { sanitizeGenre, sanitizePlatform, sanitizeRating, sanitizeSortBy, sanitizeYear } from '@/lib/filterValidation'
import {
  STREAMING_PLATFORM_LIST,
  getPlatformById,
  type StreamingPlatformId,
} from '@/lib/streamingPlatforms'
import { cn } from '@/lib/utils'

type MediaType = 'all' | 'movie' | 'tv'

const route = useRoute()
const router = useRouter()

const initialPlatform = sanitizePlatform(typeof route.query.platform === 'string' ? route.query.platform : '') || 'netflix'
const selectedPlatformId = ref<StreamingPlatformId>(initialPlatform as StreamingPlatformId)

const activePlatform = computed(() => getPlatformById(selectedPlatformId.value))

watch(
  () => route.query.platform,
  (param) => {
    const valid = sanitizePlatform(typeof param === 'string' ? param : '')
    if (valid && valid !== selectedPlatformId.value) {
      selectedPlatformId.value = valid as StreamingPlatformId
    }
  },
)

function setPlatform(id: StreamingPlatformId) {
  selectedPlatformId.value = id
  page.value = 1
  router.replace({ query: { ...route.query, platform: id } })
}

const mediaType = ref<MediaType>('all')

const movieGenres = useQuery({ queryKey: queryKeys.genres, queryFn: getGenres })
const tvGenres = useQuery({ queryKey: queryKeys.tvGenres, queryFn: getTvGenres })

const currentGenres = computed(() => {
  if (mediaType.value === 'movie') return movieGenres.data.value?.genres ?? []
  if (mediaType.value === 'tv') return tvGenres.data.value?.genres ?? []
  const map = new Map<number, string>()
  for (const g of movieGenres.data.value?.genres ?? []) map.set(g.id, g.name)
  for (const g of tvGenres.data.value?.genres ?? []) map.set(g.id, g.name)
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

// Section 1: What's New
const whatsNewQuery = useQuery({
  queryKey: computed(() => queryKeys.platformSection(selectedPlatformId.value, 'new', mediaType.value)),
  queryFn: () => getPlatformNew(activePlatform.value.providerId, mediaType.value),
})

// Section 2: Trending
const trendingQuery = useQuery({
  queryKey: computed(() => queryKeys.platformSection(selectedPlatformId.value, 'trending', mediaType.value)),
  queryFn: () => getPlatformTrending(activePlatform.value.providerId, mediaType.value),
})

// Section 3: Overall Catalog & Top Rated
const page = ref(1)

const filters = ref({
  genre: '',
  year: '',
  minRating: '',
  sortBy: 'vote_average.desc',
})

const safeFilters = computed<DiscoverParams>(() => ({
  genre: sanitizeGenre(filters.value.genre, currentGenres.value),
  year: filters.value.year.length === 4 ? sanitizeYear(filters.value.year) : '',
  minRating: sanitizeRating(filters.value.minRating),
  sortBy: sanitizeSortBy(filters.value.sortBy),
  page: page.value,
}))

const catalogQuery = useQuery({
  queryKey: computed(() =>
    queryKeys.platformSection(
      selectedPlatformId.value,
      'catalog',
      mediaType.value,
      { ...safeFilters.value, page: page.value },
    ),
  ),
  queryFn: () =>
    getPlatformCatalog(activePlatform.value.providerId, mediaType.value, safeFilters.value),
})

const totalPages = computed(() => Math.min(catalogQuery.data.value?.total_pages ?? 1, 500))

function onFilterChange(updates: { genre?: string; year?: string; minRating?: string; sortBy?: string }) {
  filters.value = {
    genre: updates.genre !== undefined ? sanitizeGenre(updates.genre, currentGenres.value) : filters.value.genre,
    year: updates.year !== undefined ? sanitizeYear(updates.year) : filters.value.year,
    minRating: updates.minRating !== undefined ? sanitizeRating(updates.minRating) : filters.value.minRating,
    sortBy: updates.sortBy !== undefined ? sanitizeSortBy(updates.sortBy) : filters.value.sortBy,
  }
  page.value = 1
}

function onMediaTypeChange(type: MediaType) {
  mediaType.value = type
  page.value = 1
}
</script>

<template>
  <div class="relative min-h-screen">
    <!-- Header Hero Banner with Dynamic Platform Glow -->
    <section class="relative overflow-hidden border-b border-[var(--brand-border)]">
      <div
        :class="cn('pointer-events-none absolute inset-0 bg-gradient-to-b opacity-40 transition-colors duration-500', activePlatform.bgGlowClass)"
      />
      <UsherMascot variant="corner" />
      <div class="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div class="max-w-2xl">
            <div class="mb-4 flex max-w-xl items-center gap-4 rounded-2xl border border-[var(--brand-border)] bg-[#071326]/75 p-3.5 backdrop-blur-xl">
              <PlatformLogo :platform="activePlatform.id" variant="full" class="h-8 w-auto shrink-0 max-w-[140px]" />
              <div class="border-l border-[var(--brand-border)] pl-3.5">
                <p class="brand-kicker">{{ activePlatform.heroKicker }}</p>
                <p class="mt-0.5 text-xs text-[var(--text-secondary)]">{{ activePlatform.tagline }}</p>
              </div>
            </div>
            <h1 class="mt-3 text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
              Streaming Hub
            </h1>
            <p class="mt-2 text-sm text-[var(--text-secondary)]">
              Discover what's freshly released, currently trending, and top-rated across major streaming platforms.
            </p>
          </div>

          <!-- Media Type Segmented Switcher -->
          <div class="flex shrink-0 items-center rounded-2xl border border-[var(--brand-border)] bg-[var(--surface)]/80 p-1.5 backdrop-blur">
            <button
              type="button"
              :class="
                cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition',
                  mediaType === 'all'
                    ? 'bg-[var(--accent-cream)] text-[#071326] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                )
              "
              @click="onMediaTypeChange('all')"
            >
              <TvMinimalPlay class="size-3.5" aria-hidden="true" />
              All
            </button>
            <button
              type="button"
              :class="
                cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition',
                  mediaType === 'movie'
                    ? 'bg-[var(--accent-cream)] text-[#071326] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                )
              "
              @click="onMediaTypeChange('movie')"
            >
              <Film class="size-3.5" aria-hidden="true" />
              Movies
            </button>
            <button
              type="button"
              :class="
                cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition',
                  mediaType === 'tv'
                    ? 'bg-[var(--accent-cream)] text-[#071326] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                )
              "
              @click="onMediaTypeChange('tv')"
            >
              <Tv class="size-3.5" aria-hidden="true" />
              TV Shows
            </button>
          </div>
        </div>

        <!-- Platform Tabs -->
        <div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            v-for="platform in STREAMING_PLATFORM_LIST"
            :key="platform.id"
            type="button"
            :class="
              cn(
                'group relative flex flex-col items-start rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]',
                selectedPlatformId === platform.id
                  ? platform.activeTabClass
                  : 'border-[var(--brand-border)] bg-[var(--surface)]/60 text-[var(--text-secondary)] hover:border-white/20 hover:bg-[var(--surface)] hover:text-[var(--text-primary)]',
              )
            "
            @click="setPlatform(platform.id)"
          >
            <div class="flex w-full items-center justify-between">
              <div class="flex h-8 items-center">
                <PlatformLogo
                  :platform="platform.id"
                  :variant="platform.id === 'netflix' ? 'icon' : 'full'"
                  class="h-6 w-auto max-w-[90px]"
                />
              </div>
              <span
                v-if="selectedPlatformId === platform.id"
                class="size-2 rounded-full bg-[var(--accent-gold)] shadow-[0_0_8px_var(--accent-gold)]"
                aria-hidden="true"
              />
            </div>
            <span class="mt-3 block text-base font-bold tracking-tight text-[var(--text-primary)]">
              {{ platform.name }}
            </span>
            <span class="mt-0.5 block text-xs text-[var(--text-secondary)]">
              {{ platform.shortName }} Catalog
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- Section 1: What's New on Platform -->
    <MovieSection
      :title="`What's New on ${activePlatform.name}`"
      eyebrow="Fresh arrivals"
      :movies="whatsNewQuery.data.value?.results"
      :is-loading="whatsNewQuery.isLoading.value"
      :is-error="whatsNewQuery.isError.value"
      :error="whatsNewQuery.error.value"
      :on-retry="() => whatsNewQuery.refetch()"
      horizontal
      explore-to="#platform-catalog"
    />

    <!-- Section 2: Trending on Platform -->
    <MovieSection
      :title="`Trending on ${activePlatform.name}`"
      eyebrow="Most watched"
      :movies="trendingQuery.data.value?.results"
      :is-loading="trendingQuery.isLoading.value"
      :is-error="trendingQuery.isError.value"
      :error="trendingQuery.error.value"
      :on-retry="() => trendingQuery.refetch()"
      carousel
      explore-to="#platform-catalog"
    />

    <!-- Section 3: Overall Platform Catalog & Top Rated -->
    <section id="platform-catalog" class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="brand-kicker">Explore the vault</p>
          <h2 class="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Overall on {{ activePlatform.name }}
          </h2>
        </div>
        <p class="text-xs text-[var(--text-secondary)]">
          Page {{ page }} of {{ totalPages }} · {{ catalogQuery.data.value?.total_results?.toLocaleString() ?? 0 }} titles
        </p>
      </div>

      <!-- Catalog Filters (without the Platform select, since platform is selected above) -->
      <SearchFilters
        :genres="currentGenres"
        :genre="filters.genre"
        :year="filters.year"
        :min-rating="filters.minRating"
        :sort-by="filters.sortBy"
        :show-platform="false"
        @change="onFilterChange"
      />

      <div class="mt-8">
        <MovieGridSkeleton v-if="catalogQuery.isLoading.value" :count="15" />
        <ErrorState
          v-if="catalogQuery.isError.value"
          :error="catalogQuery.error.value"
          :on-retry="() => catalogQuery.refetch()"
        />
        <EmptyState
          v-if="!catalogQuery.isLoading.value && !catalogQuery.isError.value && catalogQuery.data.value?.results.length === 0"
          title="No titles match your filters"
          message="Try loosening your genre, year, or rating filters."
        />
        <div
          v-if="!catalogQuery.isLoading.value && !catalogQuery.isError.value && catalogQuery.data.value?.results.length"
          class="movie-grid"
        >
          <MovieCard
            v-for="movie in catalogQuery.data.value.results"
            :key="`${movie.media_type ?? 'movie'}-${movie.id}`"
            :movie="movie"
          />
        </div>

        <!-- Pagination Controls -->
        <div v-if="!catalogQuery.isLoading.value && totalPages > 1" class="mt-10 flex items-center justify-center gap-4">
          <button
            type="button"
            :disabled="page <= 1"
            class="button-link inline-flex items-center gap-1.5"
            @click="page = Math.max(1, page - 1)"
          >
            <ChevronLeft class="size-4" aria-hidden="true" />
            Previous
          </button>
          <span class="rounded-xl border border-[var(--brand-border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)]">
            Page {{ page }} of {{ totalPages }}
          </span>
          <button
            type="button"
            :disabled="page >= totalPages"
            class="button-link inline-flex items-center gap-1.5"
            @click="page = Math.min(totalPages, page + 1)"
          >
            Next
            <ChevronRight class="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
