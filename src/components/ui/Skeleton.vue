<script setup lang="ts">
import { cn } from '@/lib/utils'

defineProps<{
  class?: string
}>()
</script>

<template>
  <div :class="cn('animate-pulse rounded-2xl bg-[var(--surface-elevated)]/80 ring-1 ring-[var(--brand-border)]', $props.class)" />
</template>
