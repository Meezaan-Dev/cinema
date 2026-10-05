<script setup lang="ts">
import UsherMascot from '@/components/brand/UsherMascot.vue'
import Button from '@/components/ui/Button.vue'

withDefaults(
  defineProps<{
    title: string
    message: string
    type?: 'empty' | 'error'
    onRetry?: () => void
    mascot?: 'brand' | 'guide' | 'corner'
  }>(),
  { type: 'empty', mascot: 'guide' },
)
</script>

<template>
  <div class="usher-panel relative overflow-hidden rounded-3xl p-8 text-center">
    <UsherMascot :variant="mascot" class="mb-4" />
    <p class="brand-kicker">{{ type === 'error' ? 'Projection booth' : 'Usher note' }}</p>
    <h2 class="mt-2 text-xl font-semibold text-[var(--text-primary)]">{{ title }}</h2>
    <p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{{ message }}</p>
    <Button v-if="onRetry" class="mt-5" type="button" @click="onRetry">
      Retry
    </Button>
  </div>
</template>
