<script setup lang="ts">
import { RouterLink } from 'vue-router'

import Button from '@/components/ui/Button.vue'
import StatusState from '@/components/ui/StatusState.vue'
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6">
    <StatusState title="Page not found" message="That screen is not part of Cinema. Head home or search for a title instead." />
    <div class="mt-5 flex justify-center gap-3">
      <RouterLink to="/">
        <Button type="button" variant="primary">Discover</Button>
      </RouterLink>
      <RouterLink to="/search">
        <Button type="button" variant="secondary">Search</Button>
      </RouterLink>
    </div>
  </section>
</template>
