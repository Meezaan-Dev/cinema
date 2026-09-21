<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import { motion } from 'motion-v'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import MoviePoster from '@/components/movie/MoviePoster.vue'
import { getYear, formatRating } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { TmdbMovie } from '@/types/tmdb'

const props = defineProps<{
  movie: TmdbMovie
  compact?: boolean
}>()

const mediaType = computed(() => props.movie.media_type ?? 'movie')
const detailsPath = computed(() => (mediaType.value === 'tv' ? `/tv/${props.movie.id}` : `/movie/${props.movie.id}`))
</script>

<template>
  <motion.article
    :initial="{ opacity: 0, y: 18 }"
    :while-in-view="{ opacity: 1, y: 0 }"
    :viewport="{ once: true, margin: '80px' }"
    :transition="{ duration: 0.35 }"
    class="group"
  >
    <RouterLink
      :to="detailsPath"
      class="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00E054]"
    >
      <div class="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#1C2228] shadow-[0_12px_40px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.06] transition duration-300 group-hover:-translate-y-1 group-hover:ring-[#00E054]/30">
        <MoviePoster
          :path="movie.poster_path"
          :title="movie.title"
          class="w-full transition duration-500 group-hover:scale-[1.03]"
        />
        <div class="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
          <Star class="mr-0.5 inline size-3 fill-[#00E054] text-[#00E054]" aria-hidden="true" />
          {{ formatRating(movie.vote_average) }}
        </div>
        <div v-if="mediaType === 'tv'" class="absolute bottom-2 left-2 rounded-md bg-[#00E054] px-2 py-0.5 text-xs font-semibold text-[#14181C]">
          TV
        </div>
      </div>
    </RouterLink>
    <div :class="cn('mt-2.5 space-y-0.5', compact && 'mt-2')">
      <h3 class="line-clamp-2 min-h-9 text-sm font-medium leading-snug text-white">{{ movie.title }}</h3>
      <p class="text-xs text-[#99AABB]">{{ getYear(movie.release_date) }}</p>
    </div>
  </motion.article>
</template>
