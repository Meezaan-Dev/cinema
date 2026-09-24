<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { AnimatePresence, motion } from 'motion-v'
import { Film, Search, SlidersHorizontal, Star, Tv, UserRound, Users, X } from 'lucide-vue-next'
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import { getTrendingAll, queryKeys, searchMovies, searchPeople, searchSeries } from '@/api/tmdbEndpoints'
import { useDebounce } from '@/composables/useDebounce'
import { imageUrl } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui'
import { normalizeSuperSearchResults, type SuperSearchResult } from '@/components/search/superSearchResults'

const ui = useUiStore()
const router = useRouter()

const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const previousFocusRef = ref<HTMLElement | null>(null)

const debouncedQuery = useDebounce(query, 250)
const hasPendingQuery = computed(() => query.value.trim() !== debouncedQuery.value.trim())
const trimmedQuery = computed(() => debouncedQuery.value.trim())
const hasMeaningfulQuery = computed(() => trimmedQuery.value.length >= 2)

const isOpen = computed(() => ui.isSuperSearchOpen)

const trending = useQuery({
  queryKey: queryKeys.trendingAll,
  queryFn: getTrendingAll,
  enabled: computed(() => isOpen.value && !trimmedQuery.value),
})

const search = useQuery({
  queryKey: computed(() => ['super-search', trimmedQuery.value]),
  queryFn: async () => {
    const q = trimmedQuery.value
    const [movies, series, people] = await Promise.all([searchMovies(q), searchSeries(q), searchPeople(q)])
    return normalizeSuperSearchResults({
      titles: [...movies.results, ...series.results],
      people: people.results,
    })
  },
  enabled: computed(() => isOpen.value && hasMeaningfulQuery.value),
})

const results = computed(() => {
  if (trimmedQuery.value) return hasMeaningfulQuery.value ? search.data.value ?? [] : []
  return normalizeSuperSearchResults({ titles: trending.data.value?.results ?? [] })
})

const isLoading = computed(() => hasPendingQuery.value || (hasMeaningfulQuery.value ? search.isLoading.value : !trimmedQuery.value && trending.isLoading.value))
const isError = computed(() => (hasMeaningfulQuery.value ? search.isError.value : !trimmedQuery.value && trending.isError.value))
const activeResult = computed(() => results.value[activeIndex.value] ?? results.value[0])

const quickActions = [
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/tv-shows', label: 'TV Shows', icon: Tv },
  { to: '/people', label: 'People', icon: Users },
  { to: '/search', label: 'Advanced search', icon: SlidersHorizontal },
]

function closeSearch() {
  query.value = ''
  activeIndex.value = 0
  ui.closeSuperSearch()
}

function openPath(path: string) {
  closeSearch()
  router.push(path)
}

function handleShortcut(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== 'k' || (!event.metaKey && !event.ctrlKey) || event.altKey || event.shiftKey) {
    return
  }
  event.preventDefault()
  if (isOpen.value) closeSearch()
  else ui.openSuperSearch()
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeSearch()
    return
  }
  if (!results.value.length) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % results.value.length
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + results.value.length) % results.value.length
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    if (!hasPendingQuery.value && activeResult.value) openPath(activeResult.value.to)
  }
}

function resultImageSrc(result: SuperSearchResult) {
  return imageUrl(result.imagePath, result.kind === 'person' ? 'w185' : 'w342')
}

watch(isOpen, (open) => {
  if (!open) return
  previousFocusRef.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
  window.setTimeout(() => inputRef.value?.focus(), 0)
})

watch(isOpen, (open, wasOpen) => {
  if (open || !wasOpen) return
  previousFocusRef.value?.focus()
})

function onQueryInput(event: Event) {
  query.value = (event.target as HTMLInputElement).value
  activeIndex.value = 0
}

onMounted(() => window.addEventListener('keydown', handleShortcut))
onUnmounted(() => window.removeEventListener('keydown', handleShortcut))
</script>

<template>
  <AnimatePresence>
    <motion.div
      v-if="isOpen"
      class="fixed inset-0 z-50 bg-black/65 px-3 py-4 backdrop-blur-md sm:px-6 sm:py-10"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0 }"
      :transition="{ duration: 0.18 }"
      @mousedown="(event: MouseEvent) => { if (event.target === event.currentTarget) closeSearch() }"
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="super-search-title"
        class="mx-auto flex max-h-[min(760px,calc(100svh-2rem))] max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#14181C] shadow-[0_28px_90px_rgba(0,0,0,0.58)]"
        :initial="{ opacity: 0, y: -18, scale: 0.98 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :exit="{ opacity: 0, y: -12, scale: 0.98 }"
        :transition="{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }"
        @mousedown.stop
      >
        <div class="border-b border-white/[0.08] p-3">
          <h2 id="super-search-title" class="sr-only">Super Search</h2>
          <label class="relative block">
            <Search class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#99AABB]" aria-hidden="true" />
            <input
              ref="inputRef"
              class="field h-14 rounded-xl border-white/[0.08] bg-[#202830] !pl-12 !pr-12 text-base"
              placeholder="Search movies, TV shows, and people..."
              :value="query"
              aria-controls="super-search-results"
              :aria-activedescendant="activeResult ? `super-search-result-${activeResult.key}` : undefined"
              role="combobox"
              aria-expanded="true"
              @input="onQueryInput"
              @keydown="handleKeyDown"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[#99AABB] transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]"
              aria-label="Close super search"
              @click="closeSearch"
            >
              <X class="size-4" aria-hidden="true" />
            </button>
          </label>
        </div>

        <div class="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-2 text-xs text-[#99AABB]">
          <span>{{ trimmedQuery ? 'Search results' : 'Trending now' }}</span>
          <span class="hidden sm:inline">Arrow keys to move • Enter to open • Esc to close</span>
        </div>

        <div class="border-b border-white/[0.08] p-2">
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              v-for="{ to, label, icon: Icon } in quickActions"
              :key="to"
              type="button"
              class="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-xs font-semibold text-[#99AABB] transition hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]"
              @click="openPath(to)"
            >
              <component :is="Icon" class="size-4 text-[#00E054]" aria-hidden="true" />
              <span class="truncate">{{ label }}</span>
            </button>
          </div>
        </div>

        <div id="super-search-results" role="listbox" class="min-h-72 overflow-y-auto p-2">
          <div v-if="isLoading" class="grid min-h-64 place-items-center text-sm text-[#99AABB]">Searching...</div>
          <div v-else-if="isError" class="grid min-h-64 place-items-center px-6 text-center text-sm text-[#99AABB]">
            The search service could not be reached. Try again in a moment.
          </div>
          <div v-else-if="results.length === 0" class="grid min-h-64 place-items-center px-6 text-center text-sm text-[#99AABB]">
            No matches found. Try a broader title or name.
          </div>
          <div v-else class="space-y-1">
            <button
              v-for="(result, index) in results"
              :id="`super-search-result-${result.key}`"
              :key="result.key"
              type="button"
              role="option"
              :aria-selected="index === activeIndex"
              :class="
                cn(
                  'grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl p-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]',
                  index === activeIndex ? 'bg-white/[0.09]' : 'hover:bg-white/[0.055]',
                )
              "
              @mouseenter="activeIndex = index"
              @click="openPath(result.to)"
            >
              <img
                v-if="resultImageSrc(result)"
                :src="resultImageSrc(result)!"
                alt=""
                :class="
                  cn(
                    'size-14 shrink-0 bg-white/[0.06] object-cover ring-1 ring-white/[0.08]',
                    result.kind === 'person' ? 'rounded-full' : 'rounded-lg',
                  )
                "
                loading="lazy"
              />
              <div
                v-else
                class="grid size-14 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-[#99AABB] ring-1 ring-white/[0.08]"
              >
                <UserRound v-if="result.kind === 'person'" class="size-5" aria-hidden="true" />
                <Search v-else class="size-5" aria-hidden="true" />
              </div>
              <span class="min-w-0">
                <span class="block truncate text-sm font-semibold text-white">{{ result.title }}</span>
                <span class="mt-0.5 block truncate text-xs text-[#99AABB]">{{ result.subtitle }}</span>
                <span v-if="result.description" class="mt-1 block truncate text-xs text-[#6F7F8F]">{{ result.description }}</span>
              </span>
              <span v-if="typeof result.rating === 'number'" class="inline-flex items-center gap-1 text-xs font-semibold text-white">
                <Star class="size-3 fill-[#00E054] text-[#00E054]" aria-hidden="true" />
                {{ result.rating.toFixed(1) }}
              </span>
              <span v-else class="text-xs font-semibold text-[#00E054]">Person</span>
            </button>
          </div>
        </div>
      </motion.section>
    </motion.div>
  </AnimatePresence>
</template>
