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
              ? 'text-[#00E054]'
              : sidebar
                ? 'bg-[#00E054]/10 text-[#00E054] ring-1 ring-[#00E054]/25'
                : 'bg-[#00E054] text-[#14181C]'
            : mobile
              ? 'text-[#99AABB] hover:text-white'
              : sidebar
                ? 'text-[#99AABB] hover:bg-white/[0.08] hover:text-white'
                : 'text-[#99AABB] hover:bg-white/5 hover:text-white',
          !mobile && 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]',
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
