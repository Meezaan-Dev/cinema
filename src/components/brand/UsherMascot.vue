<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    variant?: 'brand' | 'guide' | 'corner'
    alt?: string
    class?: string
  }>(),
  {
    variant: 'brand',
    alt: '',
  },
)

const classes = computed(() =>
  cn(
    'select-none object-contain',
    props.variant === 'brand' && 'size-12 rounded-2xl shadow-[0_12px_32px_rgba(7,19,38,0.38)] ring-1 ring-[var(--brand-border)]',
    props.variant === 'guide' && 'mx-auto size-28 drop-shadow-[0_22px_44px_rgba(7,19,38,0.45)]',
    props.variant === 'corner' && 'pointer-events-none absolute -bottom-8 -right-7 size-40 opacity-90 drop-shadow-[0_24px_48px_rgba(7,19,38,0.5)] sm:size-48',
    props.class,
  ),
)
</script>

<template>
  <img src="/brand/usher-popcorn.png" :alt="alt" :class="classes" draggable="false" />
</template>
