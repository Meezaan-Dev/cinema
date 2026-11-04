<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { ExternalLink } from 'lucide-vue-next'
import { computed } from 'vue'

import { getWatchProviders, queryKeys } from '@/api/tmdbEndpoints'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { imageUrl } from '@/lib/formatters'
import { buildTmdbWatchUrl } from '@/lib/sanitize'

const props = defineProps<{
  mediaType: 'movie' | 'tv'
  id: number
}>()

const query = useQuery({
  queryKey: computed(() => queryKeys.watchProviders(props.mediaType, props.id)),
  queryFn: () => getWatchProviders(props.mediaType, props.id),
})

const availability = computed(() => query.data.value?.results.ZA)
const groups = computed(() => [
  { key: 'flatrate', label: 'Stream with a subscription', providers: availability.value?.flatrate ?? [] },
  { key: 'free', label: 'Watch free', providers: availability.value?.free ?? [] },
  { key: 'ads', label: 'Watch with ads', providers: availability.value?.ads ?? [] },
  { key: 'rent', label: 'Rent', providers: availability.value?.rent ?? [] },
  { key: 'buy', label: 'Buy', providers: availability.value?.buy ?? [] },
].filter((group) => group.providers.length > 0))
const watchUrl = computed(() => buildTmdbWatchUrl(availability.value?.link, props.mediaType, props.id))
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-labelledby="where-to-watch-title">
    <div class="mb-5">
      <p class="brand-kicker">South Africa</p>
      <h2 id="where-to-watch-title" class="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Where to watch</h2>
    </div>

    <div v-if="query.isPending.value" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading watch options">
      <Skeleton v-for="item in 3" :key="item" class="h-28 rounded-xl" />
    </div>
    <ErrorState v-else-if="query.isError.value" :error="query.error.value" :on-retry="() => query.refetch()" />
    <div v-else>
      <div v-if="groups.length" class="space-y-6">
        <div v-for="group in groups" :key="group.key">
          <h3 class="mb-3 text-base font-semibold text-[var(--text-primary)]">{{ group.label }}</h3>
          <ul class="flex flex-wrap gap-3">
            <li v-for="provider in group.providers" :key="provider.provider_id" class="flex items-center gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--surface)] px-3 py-2">
              <img v-if="provider.logo_path" :src="imageUrl(provider.logo_path, 'w92') ?? undefined" alt="" class="size-9 rounded-lg object-contain" loading="lazy" />
              <span class="text-sm font-medium text-[var(--text-primary)]">{{ provider.provider_name }}</span>
            </li>
          </ul>
        </div>
      </div>
      <p v-else class="text-sm text-[var(--text-secondary)]">No South African watch options listed by TMDB for this title.</p>
      <a v-if="watchUrl" class="button-link mt-5" :href="watchUrl" target="_blank" rel="noreferrer">
        See watch options on TMDB
        <ExternalLink class="size-4" aria-hidden="true" />
      </a>
    </div>

    <p class="mt-5 text-xs text-[var(--text-secondary)]">Data provided by JustWatch. Availability may change.</p>
  </section>
</template>
