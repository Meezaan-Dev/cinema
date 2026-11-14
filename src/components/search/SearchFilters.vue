<script setup lang="ts">
import type { TmdbGenre } from '@/types/tmdb'
import { STREAMING_PLATFORM_LIST } from '@/lib/streamingPlatforms'

withDefaults(
  defineProps<{
    genres: TmdbGenre[]
    genre: string
    year: string
    minRating: string
    sortBy: string
    platform?: string
    showPlatform?: boolean
  }>(),
  {
    platform: '',
    showPlatform: true,
  },
)

const emit = defineEmits<{
  change: [filters: { genre?: string; year?: string; minRating?: string; sortBy?: string; platform?: string }]
}>()

const sortOptions = [
  { value: 'popularity.desc', label: 'Popularity' },
  { value: 'vote_average.desc', label: 'Rating' },
  { value: 'primary_release_date.desc', label: 'Release date' },
]
</script>

<template>
  <div
    :class="[
      'usher-panel grid gap-3 rounded-3xl p-4 sm:grid-cols-2',
      showPlatform ? 'lg:grid-cols-5' : 'lg:grid-cols-4',
    ]"
  >
    <label v-if="showPlatform" class="space-y-2 text-sm font-medium text-[var(--text-secondary)]">
      <span>Platform</span>
      <select class="field" :value="platform" @change="emit('change', { platform: ($event.target as HTMLSelectElement).value })">
        <option value="">Any platform</option>
        <option v-for="plat in STREAMING_PLATFORM_LIST" :key="plat.id" :value="plat.id">{{ plat.name }}</option>
      </select>
    </label>
    <label class="space-y-2 text-sm font-medium text-[var(--text-secondary)]">
      <span>Genre</span>
      <select class="field" :value="genre" @change="emit('change', { genre: ($event.target as HTMLSelectElement).value })">
        <option value="">Any genre</option>
        <option v-for="item in genres" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
    </label>
    <label class="space-y-2 text-sm font-medium text-[var(--text-secondary)]">
      <span>Year</span>
      <input
        class="field"
        inputmode="numeric"
        maxlength="4"
        placeholder="2026"
        :value="year"
        @input="emit('change', { year: ($event.target as HTMLInputElement).value })"
      />
    </label>
    <label class="space-y-2 text-sm font-medium text-[var(--text-secondary)]">
      <span>Minimum rating</span>
      <select class="field" :value="minRating" @change="emit('change', { minRating: ($event.target as HTMLSelectElement).value })">
        <option value="">Any rating</option>
        <option value="6">6+</option>
        <option value="7">7+</option>
        <option value="8">8+</option>
      </select>
    </label>
    <label class="space-y-2 text-sm font-medium text-[var(--text-secondary)]">
      <span>Sort by</span>
      <select class="field" :value="sortBy" @change="emit('change', { sortBy: ($event.target as HTMLSelectElement).value })">
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </label>
  </div>
</template>
