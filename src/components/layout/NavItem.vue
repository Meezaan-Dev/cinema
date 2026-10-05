<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'

import { cn } from '@/lib/utils'

defineProps<{
  to: string
  label: string
  icon: Component
  end?: boolean
  mobile?: boolean
  sidebar?: boolean
}>()
</script>

<template>
  <RouterLink
    :to="to"
    custom
    v-slot="{ href, navigate, isActive, isExactActive }"
  >
    <a
      :href="href"
      :aria-current="(end ? isExactActive : isActive) ? 'page' : undefined"
      :class="
        cn(
          mobile
            ? 'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium'
            : sidebar
              ? 'group/item relative flex h-12 w-full shrink-0 items-center gap-3 overflow-hidden rounded-2xl px-3 text-sm font-semibold transition'
              : 'inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition',
          (end ? isExactActive : isActive)
            ? mobile
              ? 'text-[var(--accent-gold)]'
              : sidebar
                ? 'bg-[var(--accent-cream)]/12 text-[var(--accent-cream)] ring-1 ring-[var(--accent-gold)]/35'
                : 'bg-[var(--accent-cream)] text-[#071326]'
            : mobile
              ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              : sidebar
                ? 'text-[var(--text-secondary)] hover:bg-white/[0.08] hover:text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]',
          !mobile && 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]',
        )
      "
      @click="navigate"
    >
      <component :is="icon" :class="mobile ? 'size-5' : sidebar ? 'size-5 shrink-0' : 'size-4'" aria-hidden="true" />
      <span
        :class="
          cn(
            sidebar &&
              'whitespace-nowrap opacity-0 transition duration-200 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:translate-x-0 group-focus-within/sidebar:opacity-100 md:-translate-x-1',
          )
        "
      >
        {{ label }}
      </span>
    </a>
  </RouterLink>
</template>
