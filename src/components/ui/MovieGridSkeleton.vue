<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue'

withDefaults(
  defineProps<{
    count?: number
  }>(),
  { count: 10 },
)
</script>

<template>
  <div class="movie-grid">
    <div v-for="index in count" :key="index" class="space-y-3">
      <Skeleton class="aspect-[2/3]" />
      <Skeleton class="h-4 w-4/5" />
      <Skeleton class="h-3 w-2/5" />
    </div>
  </div>
</template>
