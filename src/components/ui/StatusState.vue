<script setup lang="ts">
import { AlertTriangle, Clapperboard } from 'lucide-vue-next'

import Button from '@/components/ui/Button.vue'

withDefaults(
  defineProps<{
    title: string
    message: string
    type?: 'empty' | 'error'
    onRetry?: () => void
  }>(),
  { type: 'empty' },
)
</script>

<template>
  <div class="rounded-3xl border border-white/[0.07] bg-white/[0.045] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,.28)]">
    <component :is="type === 'error' ? AlertTriangle : Clapperboard" class="mx-auto mb-4 size-10 text-sky-300" aria-hidden="true" />
    <h2 class="text-xl font-semibold text-white">{{ title }}</h2>
    <p class="mx-auto mt-2 max-w-xl text-sm text-slate-400">{{ message }}</p>
    <Button v-if="onRetry" class="mt-5" type="button" @click="onRetry">
      Retry
    </Button>
  </div>
</template>
