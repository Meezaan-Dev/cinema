<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { Search, User } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { queryKeys, searchPeople } from '@/api/tmdbEndpoints'
import { useDebounce } from '@/composables/useDebounce'
import EmptyState from '@/components/ui/EmptyState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { imageUrl } from '@/lib/formatters'
import { sanitizeQuery } from '@/lib/filterValidation'
import type { TmdbPersonSearchResult } from '@/types/tmdb'

const route = useRoute()
const query = ref(sanitizeQuery(typeof route.query.q === 'string' ? route.query.q : ''))
const sanitizedQuery = computed(() => sanitizeQuery(query.value))
const debouncedQuery = useDebounce(sanitizedQuery)
const trimmedQuery = computed(() => debouncedQuery.value.trim())
const hasMeaningfulQuery = computed(() => trimmedQuery.value.length >= 2)

const people = useQuery({
  queryKey: computed(() => queryKeys.searchPeople(trimmedQuery.value)),
  queryFn: () => searchPeople(trimmedQuery.value),
  enabled: hasMeaningfulQuery,
})

const results = computed(() =>
  (people.data.value?.results ?? [])
    .filter((person) => person.name.trim())
    .sort((a, b) => b.popularity - a.popularity),
)

function knownFor(person: TmdbPersonSearchResult) {
  return person.known_for
    .slice(0, 3)
    .map((credit) => credit.title)
    .filter(Boolean)
    .join(', ')
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div class="mb-6 max-w-3xl">
      <p class="text-xs font-medium uppercase tracking-[0.24em] text-[#99AABB]">People</p>
      <h1 class="mt-2 text-4xl font-bold tracking-tight text-white">Find actors & directors</h1>
      <p class="mt-3 text-base text-[#99AABB]">Search TMDB profiles and explore filmographies across movies and TV.</p>
    </div>

    <label class="relative block rounded-2xl border border-white/[0.08] bg-[#1C2228] p-3">
      <span class="sr-only">Search people</span>
      <Search class="pointer-events-none absolute left-7 top-1/2 size-5 -translate-y-1/2 text-[#99AABB]" aria-hidden="true" />
      <input
        v-model="query"
        class="field h-14 w-full rounded-xl border-white/[0.08] bg-[#202830] !pl-12 !pr-4 text-base"
        placeholder="Search for Greta Gerwig, Denzel Washington, Bong Joon Ho..."
        autofocus
      />
    </label>

    <div class="mt-8">
      <div v-if="people.isLoading.value" class="grid gap-4 md:grid-cols-2">
        <div v-for="index in 8" :key="index" class="grid grid-cols-[92px_1fr] gap-4 rounded-xl border border-white/[0.08] bg-[#1C2228] p-3 sm:grid-cols-[116px_1fr]">
          <Skeleton class="aspect-[2/3] rounded-lg" />
          <div class="space-y-3 self-center">
            <Skeleton class="h-5 w-2/3" />
            <Skeleton class="h-4 w-1/3" />
            <Skeleton class="h-4 w-4/5" />
          </div>
        </div>
      </div>
      <ErrorState v-if="people.isError.value" :error="people.error.value" :on-retry="() => people.refetch()" />
      <EmptyState
        v-if="!hasMeaningfulQuery && !people.isLoading.value"
        title="Start typing to search"
        message="Enter at least 2 characters to search actors, directors, writers, and other film people."
      />
      <EmptyState
        v-if="!people.isLoading.value && !people.isError.value && hasMeaningfulQuery && results.length === 0"
        title="No people found"
        message="Try a broader name or check the spelling."
      />
      <div v-if="!people.isLoading.value && !people.isError.value && results.length > 0" class="grid gap-4 md:grid-cols-2">
        <RouterLink
          v-for="person in results"
          :key="person.id"
          :to="`/person/${person.id}`"
          class="grid grid-cols-[92px_1fr] gap-4 rounded-xl border border-white/[0.08] bg-[#1C2228] p-3 transition hover:-translate-y-0.5 hover:border-[#00E054]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054] sm:grid-cols-[116px_1fr]"
        >
          <div class="aspect-[2/3] overflow-hidden rounded-lg bg-[#202830]">
            <img
              v-if="imageUrl(person.profile_path, 'w342')"
              :src="imageUrl(person.profile_path, 'w342')!"
              :alt="person.name"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <div v-else class="grid h-full place-items-center text-[#99AABB]">
              <User class="size-8" aria-hidden="true" />
            </div>
          </div>
          <div class="min-w-0 self-center">
            <h2 class="line-clamp-2 text-lg font-semibold text-white">{{ person.name }}</h2>
            <p class="mt-1 text-sm text-[#99AABB]">{{ person.known_for_department || 'Film and TV' }}</p>
            <p v-if="knownFor(person)" class="mt-3 line-clamp-2 text-sm leading-6 text-[#99AABB]">Known for {{ knownFor(person) }}</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
