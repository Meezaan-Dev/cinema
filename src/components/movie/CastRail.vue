<script setup lang="ts">
import { ChevronLeft, ChevronRight, User } from 'lucide-vue-next'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

import { imageUrl } from '@/lib/formatters'
import type { TmdbCastMember } from '@/types/tmdb'

defineProps<{
  cast: TmdbCastMember[]
  isLoading?: boolean
}>()

const rowRef = ref<HTMLDivElement | null>(null)

function scrollCast(direction: 'left' | 'right') {
  rowRef.value?.scrollBy({ left: direction === 'left' ? -420 : 420, behavior: 'smooth' })
}
</script>

<template>
  <div v-if="isLoading" class="cast-row cast-row-spotlight">
    <div v-for="index in 6" :key="index" class="aspect-[2/3] animate-pulse rounded-xl bg-[var(--surface)] p-3">
      <div class="h-full rounded-lg bg-white/10" />
    </div>
  </div>
  <p v-else-if="!cast.length" class="text-sm text-[var(--text-secondary)]">No cast information available.</p>
  <div v-else class="relative">
    <div class="mb-3 hidden justify-end gap-2 sm:flex">
      <button type="button" class="cast-nav-button" aria-label="Scroll cast left" title="Scroll cast left" @click="scrollCast('left')">
        <ChevronLeft class="size-4" aria-hidden="true" />
      </button>
      <button type="button" class="cast-nav-button" aria-label="Scroll cast right" title="Scroll cast right" @click="scrollCast('right')">
        <ChevronRight class="size-4" aria-hidden="true" />
      </button>
    </div>
    <div ref="rowRef" class="cast-row cast-row-spotlight">
      <RouterLink
        v-for="person in cast"
        :key="person.id"
        :to="`/person/${person.id}`"
        class="group relative aspect-[2/3] overflow-hidden rounded-xl border border-[var(--brand-border)] bg-[var(--surface)] transition hover:-translate-y-0.5 hover:border-[var(--accent-gold)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
      >
        <img
          v-if="imageUrl(person.profile_path, 'w342')"
          :src="imageUrl(person.profile_path, 'w342')!"
          :alt="person.name"
          class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div v-else class="grid h-full w-full place-items-center bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
          <User class="size-10" aria-hidden="true" />
        </div>
        <div class="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(7,19,38,.92)_32%,#071326)] p-3 pt-12">
          <p class="line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">{{ person.name }}</p>
          <p class="mt-1 line-clamp-2 text-xs leading-4 text-[var(--text-secondary)]">{{ person.character || 'Cast member' }}</p>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
