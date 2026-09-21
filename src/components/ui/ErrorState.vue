<script setup lang="ts">
import { computed } from 'vue'

import StatusState from '@/components/ui/StatusState.vue'
import { getErrorCopy } from '@/lib/errors'

const props = defineProps<{
  error: unknown
  onRetry?: () => void
}>()

const copy = computed(() => getErrorCopy(props.error))
</script>

<template>
  <StatusState type="error" :title="copy.title" :message="copy.message" :on-retry="onRetry" />
</template>
