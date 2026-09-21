<script setup lang="ts">
import StatusState from '@/components/ui/StatusState.vue'

defineProps<{
  title: string
  message: string
}>()
</script>

<template>
  <StatusState :title="title" :message="message" />
</template>
