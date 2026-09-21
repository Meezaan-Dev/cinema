<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

import Button from '@/components/ui/Button.vue'
import MovieGridSkeleton from '@/components/ui/MovieGridSkeleton.vue'
import StatusState from '@/components/ui/StatusState.vue'
import { getErrorCopy } from '@/lib/errors'

const routeError = ref<unknown>(null)

onErrorCaptured((error) => {
  routeError.value = error
  console.error('Route render error', error)
  return false
})

function clearError() {
  routeError.value = null
}
</script>

<template>
  <div v-if="routeError" class="mx-auto max-w-2xl px-4 py-16 sm:px-6">
    <StatusState type="error" :title="getErrorCopy(routeError).title" :message="getErrorCopy(routeError).message" />
    <div class="mt-5 flex justify-center">
      <RouterLink to="/" @click="clearError">
        <Button type="button" variant="primary">Return home</Button>
      </RouterLink>
    </div>
  </div>
  <RouterView v-else v-slot="{ Component }">
    <Suspense>
      <component :is="Component" />
      <template #fallback>
        <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <MovieGridSkeleton :count="6" />
        </div>
      </template>
    </Suspense>
  </RouterView>
</template>
