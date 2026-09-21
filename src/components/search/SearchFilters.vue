<script setup lang="ts">
import type { TmdbGenre } from '@/types/tmdb'

defineProps<{
  genres: TmdbGenre[]
  genre: string
  year: string
  minRating: string
  sortBy: string
}>()

const emit = defineEmits<{
  change: [filters: { genre?: string; year?: string; minRating?: string; sortBy?: string }]
}>()

const sortOptions = [
  { value: 'popularity.desc', label: 'Popularity' },
  { value: 'vote_average.desc', label: 'Rating' },
  { value: 'primary_release_date.desc', label: 'Release date' },
]
</script>

<template>
  <div class="grid gap-3 rounded-3xl border border-white/[0.07] bg-white/[0.045] p-4 sm:grid-cols-2 lg:grid-cols-4">
    <label class="space-y-2 text-sm font-medium text-slate-300">
      <span>Genre</span>
      <select class="field" :value="genre" @change="emit('change', { genre: ($event.target as HTMLSelectElement).value })">
        <option value="">Any genre</option>
        <option v-for="item in genres" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
    </label>
    <label class="space-y-2 text-sm font-medium text-slate-300">
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
    <label class="space-y-2 text-sm font-medium text-slate-300">
      <span>Minimum rating</span>
      <select class="field" :value="minRating" @change="emit('change', { minRating: ($event.target as HTMLSelectElement).value })">
        <option value="">Any rating</option>
        <option value="6">6+</option>
        <option value="7">7+</option>
        <option value="8">8+</option>
      </select>
    </label>
    <label class="space-y-2 text-sm font-medium text-slate-300">
      <span>Sort by</span>
      <select class="field" :value="sortBy" @change="emit('change', { sortBy: ($event.target as HTMLSelectElement).value })">
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </label>
  </div>
</template>
