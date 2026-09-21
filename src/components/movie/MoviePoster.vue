<script setup lang="ts">
import { ImageOff } from 'lucide-vue-next'
import { computed } from 'vue'

import { imageUrl } from '@/lib/formatters'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    path?: string | null
    title: string
    class?: string
    size?: string
  }>(),
  { size: 'w500' },
)

const src = computed(() => imageUrl(props.path, props.size))
</script>

<template>
  <div
    v-if="!src"
    :class="cn('grid aspect-[2/3] place-items-center rounded-2xl bg-white/[0.07] text-slate-500', $props.class)"
  >
    <ImageOff class="size-9" aria-hidden="true" />
    <span class="sr-only">No poster available for {{ title }}</span>
  </div>
  <img
    v-else
    :src="src"
    :alt="`${title} poster`"
    :class="cn('aspect-[2/3] rounded-2xl bg-white/[0.055] object-contain', $props.class)"
    loading="lazy"
  />
</template>
