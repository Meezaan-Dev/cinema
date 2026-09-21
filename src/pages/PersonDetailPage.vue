<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { CalendarDays, Film, MapPin, Search, Star, Tv, User } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { getPersonCombinedCredits, getPersonDetails, queryKeys } from '@/api/tmdbEndpoints'
import MovieCard from '@/components/movie/MovieCard.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import StatusState from '@/components/ui/StatusState.vue'
import { formatRating, getYear, imageUrl } from '@/lib/formatters'
import { filterPersonCredits, groupPersonCredits, normalizePersonCredits } from '@/lib/personCredits'
import { parsePositiveIntegerParam } from '@/lib/routeParams'

const BIO_PREVIEW_LENGTH = 420
type FilmographyMediaFilter = 'movie' | 'tv'

function displayDate(date: string | null) {
  return date || 'Unknown'
}

const route = useRoute()
const personId = computed(() => (typeof route.params.personId === 'string' ? route.params.personId : ''))
const personTmdbId = computed(() => parsePositiveIntegerParam(personId.value))
const isValidPersonId = computed(() => personTmdbId.value !== null)

const details = useQuery({
  queryKey: computed(() => queryKeys.personDetail(personTmdbId.value ?? personId.value)),
  queryFn: () => getPersonDetails(personTmdbId.value ?? ''),
  enabled: isValidPersonId,
})
const credits = useQuery({
  queryKey: computed(() => queryKeys.personCredits(personTmdbId.value ?? personId.value)),
  queryFn: () => getPersonCombinedCredits(personTmdbId.value ?? ''),
  enabled: isValidPersonId,
})

const creditQuery = ref('')
const mediaFilter = ref<FilmographyMediaFilter>('movie')
const isBioExpanded = ref(false)

const person = computed(() => details.data.value)
const photo = computed(() => imageUrl(person.value?.profile_path, 'w780'))
const allCredits = computed(() => normalizePersonCredits(credits.data.value))
const filteredCredits = computed(() => filterPersonCredits(allCredits.value, creditQuery.value))
const groupedCredits = computed(() => groupPersonCredits(filteredCredits.value))
const visibleCredits = computed(() => (mediaFilter.value === 'movie' ? groupedCredits.value.movies : groupedCredits.value.shows))
const visibleTitle = computed(() => (mediaFilter.value === 'movie' ? 'Movies' : 'Shows'))
const hasCredits = computed(() => allCredits.value.length > 0)
const hasFilteredCredits = computed(() => filteredCredits.value.length > 0)

const biography = computed(() => person.value?.biography ?? '')
const isLongBio = computed(() => biography.value.length > BIO_PREVIEW_LENGTH)
const visibleBio = computed(() => {
  if (!biography.value) return ''
  if (!isLongBio.value || isBioExpanded.value) return biography.value
  return `${biography.value.slice(0, BIO_PREVIEW_LENGTH).trim()}...`
})
</script>

<template>
  <section v-if="!isValidPersonId" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <StatusState title="Person not found" message="Person URLs need a valid TMDB person ID." />
  </section>

  <section v-else-if="details.isLoading.value" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <Skeleton class="h-[420px] w-full rounded-2xl" />
  </section>

  <section v-else-if="details.isError.value || !person" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <ErrorState :error="details.error.value" :on-retry="() => details.refetch()" />
  </section>

  <template v-else>
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,34,40,.65),#14181C_90%)]" />
      <div class="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr] lg:py-14">
        <div class="aspect-[2/3] overflow-hidden rounded-2xl bg-[#1C2228] shadow-[0_24px_60px_rgba(0,0,0,.5)] ring-1 ring-white/[0.08] sm:w-64 lg:w-full">
          <img v-if="photo" :src="photo" :alt="person.name" class="h-full w-full object-cover" />
          <div v-else class="grid h-full place-items-center text-[#99AABB]">
            <User class="size-16" aria-hidden="true" />
          </div>
        </div>
        <div class="max-w-3xl self-end">
          <p class="text-sm font-medium uppercase tracking-[0.2em] text-[#99AABB]">{{ person.known_for_department || 'Film and TV' }}</p>
          <h1 class="mt-3 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">{{ person.name }}</h1>
          <div class="mt-5 flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1 rounded-full bg-[#00E054] px-3 py-1 text-sm font-semibold text-[#14181C]">
              <Star class="size-4 fill-current" aria-hidden="true" />
              {{ formatRating(person.popularity) }}
            </span>
            <span v-if="person.birthday" class="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#1C2228] px-3 py-1 text-sm text-[#99AABB]">
              <CalendarDays class="size-4" aria-hidden="true" />
              Born {{ getYear(person.birthday) }}
            </span>
            <span v-if="person.place_of_birth" class="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#1C2228] px-3 py-1 text-sm text-[#99AABB]">
              <MapPin class="size-4" aria-hidden="true" />
              {{ person.place_of_birth }}
            </span>
          </div>
          <p v-if="!biography" class="mt-6 max-w-3xl text-base leading-7 text-[#99AABB]">No biography is available from TMDB yet.</p>
          <div v-else class="mt-6 max-w-3xl">
            <p class="text-base leading-7 text-[#99AABB]">{{ visibleBio }}</p>
            <button
              v-if="isLongBio"
              type="button"
              class="mt-3 text-sm font-semibold text-[#00E054] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]"
              @click="isBioExpanded = !isBioExpanded"
            >
              {{ isBioExpanded ? 'Show less' : 'Show more' }}
            </button>
          </div>
          <dl class="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-white/[0.08] bg-[#1C2228] p-4">
              <dt class="text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">Born</dt>
              <dd class="mt-1 text-sm text-white">{{ displayDate(person.birthday) }}</dd>
            </div>
            <div class="rounded-xl border border-white/[0.08] bg-[#1C2228] p-4">
              <dt class="text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">Died</dt>
              <dd class="mt-1 text-sm text-white">{{ displayDate(person.deathday) }}</dd>
            </div>
            <div class="rounded-xl border border-white/[0.08] bg-[#1C2228] p-4">
              <dt class="text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">Credits</dt>
              <dd class="mt-1 text-sm text-white">{{ allCredits.length }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <section v-if="credits.isLoading.value" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Skeleton class="h-64 w-full rounded-2xl" />
    </section>
    <section v-else-if="credits.isError.value" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ErrorState :error="credits.error.value" :on-retry="() => credits.refetch()" />
    </section>
    <section v-else-if="!hasCredits" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <EmptyState title="No filmography found" message="TMDB does not have movie or TV credits for this person yet." />
    </section>

    <template v-else>
      <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div class="grid gap-4 lg:grid-cols-[1fr_auto_360px] lg:items-end">
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.2em] text-[#99AABB]">Filmography</p>
            <h2 class="mt-1 text-2xl font-semibold text-white">Movies & Shows</h2>
          </div>
          <div class="inline-grid grid-cols-2 rounded-xl border border-white/[0.08] bg-[#1C2228] p-1" aria-label="Filter filmography by media type" role="radiogroup">
            <button
              type="button"
              role="radio"
              :aria-checked="mediaFilter === 'movie'"
              :class="`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054] ${
                mediaFilter === 'movie' ? 'bg-[#00E054] text-[#14181C]' : 'text-[#99AABB] hover:bg-white/5 hover:text-white'
              }`"
              @click="mediaFilter = 'movie'"
            >
              <Film class="size-4" aria-hidden="true" />
              Movies
            </button>
            <button
              type="button"
              role="radio"
              :aria-checked="mediaFilter === 'tv'"
              :class="`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054] ${
                mediaFilter === 'tv' ? 'bg-[#00E054] text-[#14181C]' : 'text-[#99AABB] hover:bg-white/5 hover:text-white'
              }`"
              @click="mediaFilter = 'tv'"
            >
              <Tv class="size-4" aria-hidden="true" />
              Shows
            </button>
          </div>
          <label class="relative block">
            <span class="sr-only">Search this filmography</span>
            <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#99AABB]" aria-hidden="true" />
            <input v-model="creditQuery" class="field h-12 w-full rounded-xl border-white/[0.08] bg-[#202830] !pl-11 !pr-4 text-sm" placeholder="Search this filmography..." />
          </label>
        </div>
        <div v-if="creditQuery.trim() && !hasFilteredCredits" class="mt-6">
          <EmptyState title="No matching credits" message="Try a broader title search for this person." />
        </div>
      </section>

      <section v-if="hasFilteredCredits" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div class="mb-5 flex items-end justify-between gap-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.2em] text-[#99AABB]">Filmography</p>
            <h2 class="mt-1 text-2xl font-semibold text-white">{{ visibleTitle }}</h2>
          </div>
          <p class="text-sm text-[#99AABB]">{{ visibleCredits.length }} credits</p>
        </div>
        <div v-if="visibleCredits.length" class="movie-grid">
          <div v-for="credit in visibleCredits" :key="`${credit.media_type ?? 'movie'}-${credit.id}`" class="space-y-2">
            <MovieCard :movie="credit" compact />
            <p class="line-clamp-2 text-xs leading-5 text-[#99AABB]">{{ credit.creditLabels.join(' · ') }}</p>
          </div>
        </div>
        <p v-else class="mt-3 text-sm text-[#99AABB]">No {{ visibleTitle.toLowerCase() }} credits match the current search.</p>
      </section>
    </template>

    <div class="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <RouterLink to="/people" class="text-sm font-medium text-[#99AABB] hover:text-white">Back to People</RouterLink>
    </div>
  </template>
</template>
