<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { ExternalLink } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { cinemaBranches, cinemaDateSelection, type CinemaId, type CinemaResponse } from '@/types/cinema'

const props = defineProps<{ movieId: number }>()
const storageKey = 'cinema:selected-branches'
const allIds = cinemaBranches.map((branch) => branch.id)
const selected = ref<CinemaId[]>([...allIds])
const ready = ref(false)

const initialDates = cinemaDateSelection(undefined)
const dates = ref(initialDates.dates)
const activeDate = ref(initialDates.activeDate)
let dateTimer: number | undefined

function refreshDates() {
  const next = cinemaDateSelection(activeDate.value)
  if (next.dates[0] !== dates.value[0]) dates.value = next.dates
  activeDate.value = next.activeDate
}

function refreshVisibleDates() {
  if (!document.hidden) refreshDates()
}

const activeCinemas = computed(() => allIds.filter((id) => selected.value.includes(id)))
const query = useQuery({
  queryKey: computed(() => ['cinema-showtimes', props.movieId, activeDate.value, activeCinemas.value]),
  enabled: computed(() => ready.value && activeCinemas.value.length > 0),
  retry: false,
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<CinemaResponse> => {
    const params = new URLSearchParams({ movieId: String(props.movieId), date: activeDate.value, cinemas: activeCinemas.value.join(',') })
    const response = await fetch(`/api/cinema-showtimes?${params}`)
    if (!response.ok) throw new Error('Cinema showtimes could not be loaded.')
    return response.json() as Promise<CinemaResponse>
  },
})

const results = computed(() => new Map(query.data.value?.results.map((result) => [result.id, result]) ?? []))

function toggle(id: CinemaId) {
  selected.value = selected.value.includes(id) ? selected.value.filter((item) => item !== id) : [...selected.value, id]
  try { localStorage.setItem(storageKey, JSON.stringify(selected.value)) } catch { /* Storage may be disabled. */ }
}

function dayLabel(date: string, index: number) {
  const label = new Intl.DateTimeFormat('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
  return index === 0 ? `Today · ${label}` : label
}

function checkedLabel(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg' }).format(new Date(value))
}

onMounted(() => {
  refreshDates()
  dateTimer = window.setInterval(refreshDates, 60_000)
  document.addEventListener('visibilitychange', refreshVisibleDates)
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as unknown
    if (Array.isArray(saved) && saved.every((id) => allIds.includes(id))) selected.value = [...new Set(saved)] as CinemaId[]
  } catch { /* Keep all branches selected. */ }
  ready.value = true
})

onUnmounted(() => {
  window.clearInterval(dateTimer)
  document.removeEventListener('visibilitychange', refreshVisibleDates)
})
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-labelledby="in-cinemas-title">
    <p class="brand-kicker">Cape Town</p>
    <h2 id="in-cinemas-title" class="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">In cinemas</h2>
    <p class="mt-2 text-sm text-[var(--text-secondary)]">Check screenings at your selected cinemas over the next seven days.</p>

    <fieldset class="mt-5">
      <legend class="mb-2 text-sm font-semibold text-[var(--text-primary)]">Cinemas</legend>
      <div class="flex flex-wrap gap-2">
        <label v-for="branch in cinemaBranches" :key="branch.id" class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
          <input type="checkbox" :checked="selected.includes(branch.id)" class="accent-[var(--accent-gold)]" @change="toggle(branch.id)" />
          {{ branch.name }}
        </label>
      </div>
    </fieldset>

    <div class="mt-5" role="group" aria-label="Screening date">
      <p class="mb-2 text-sm font-semibold text-[var(--text-primary)]">Date</p>
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button v-for="(date, index) in dates" :key="date" type="button" :aria-pressed="activeDate === date" class="shrink-0 rounded-xl border px-3 py-2 text-sm font-medium transition-colors" :class="activeDate === date ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[#071326]' : 'border-[var(--brand-border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'" @click="activeDate = date">
          {{ dayLabel(date, index) }}
        </button>
      </div>
    </div>

    <p v-if="!selected.length" class="mt-5 text-sm text-[var(--text-secondary)]">Select a cinema to check screenings.</p>
    <div v-else-if="!ready || query.isPending.value" class="mt-5 grid gap-4 md:grid-cols-3" aria-label="Loading cinema showtimes">
      <Skeleton v-for="branch in activeCinemas" :key="branch" class="h-36 rounded-xl" />
    </div>
    <div v-else-if="query.isError.value" class="mt-5">
      <ErrorState :error="query.error.value" :on-retry="() => query.refetch()" />
      <div class="mt-3 flex flex-wrap gap-4">
        <a v-for="branch in cinemaBranches.filter((item) => selected.includes(item.id))" :key="branch.id" :href="branch.siteUrl" target="_blank" rel="noreferrer" class="text-sm text-[var(--accent-gold)] hover:underline">{{ branch.name }} official site</a>
      </div>
    </div>
    <div v-else class="mt-5 grid gap-4 md:grid-cols-3">
      <article v-for="branch in cinemaBranches.filter((item) => selected.includes(item.id))" :key="branch.id" class="rounded-2xl border border-[var(--brand-border)] bg-[var(--surface)] p-5">
        <h3 class="text-base font-semibold text-[var(--text-primary)]">{{ branch.name }}</h3>
        <template v-if="results.get(branch.id)?.status === 'playing'">
          <ul class="mt-4 flex flex-wrap gap-2">
            <li v-for="(show, index) in results.get(branch.id)?.showtimes" :key="`${show.time}-${show.format}-${index}`" class="rounded-lg border border-[var(--brand-border)] px-3 py-2 text-sm text-[var(--text-primary)]">
              <span class="font-semibold">{{ show.time }}</span>
              <span class="ml-2 text-[var(--text-secondary)]">{{ show.format }}</span>
            </li>
          </ul>
        </template>
        <p v-else-if="results.get(branch.id)?.status === 'none'" class="mt-3 text-sm text-[var(--text-secondary)]">No screenings listed for this date.</p>
        <p v-else-if="results.get(branch.id)?.status === 'uncertain'" class="mt-3 text-sm text-[var(--text-secondary)]">A similar film is listed, but the match is uncertain. Check the cinema site.</p>
        <p v-else class="mt-3 text-sm text-[var(--text-secondary)]">This cinema’s listings could not be checked right now.</p>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <a :href="results.get(branch.id)?.bookingUrl || branch.siteUrl" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-gold)] hover:underline">
            {{ results.get(branch.id)?.status === 'playing' ? 'View film and book' : 'Check official site' }}
            <ExternalLink class="size-4" aria-hidden="true" />
          </a>
          <button v-if="results.get(branch.id)?.status === 'unavailable'" type="button" class="text-sm text-[var(--text-primary)] underline" @click="query.refetch()">Retry</button>
        </div>
        <p v-if="results.get(branch.id)?.checkedAt" class="mt-4 text-xs text-[var(--text-secondary)]">Checked {{ checkedLabel(results.get(branch.id)!.checkedAt) }}</p>
      </article>
    </div>
  </section>
</template>
