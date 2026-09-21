<script setup lang="ts">
import { cn } from '@/lib/utils'

defineProps<{
  class?: string
}>()
</script>

<template>
  <div :class="cn('animate-pulse rounded-2xl bg-white/[0.075]', $props.class)" />
</template>
