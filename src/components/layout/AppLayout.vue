<script setup lang="ts">
import { Clapperboard, Film, Search } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

import UsherMascot from '@/components/brand/UsherMascot.vue'
import NavItem from '@/components/layout/NavItem.vue'
import RouteViewBoundary from '@/components/layout/RouteViewBoundary.vue'
import SuperSearch from '@/components/search/SuperSearch.vue'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="min-h-svh bg-[var(--bg)] text-[var(--text-primary)]">
    <header class="sticky top-0 z-40 border-b border-[var(--brand-border)] bg-[var(--bg)]/92 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:hidden">
      <nav class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <RouterLink
          to="/"
          custom
          v-slot="{ href, navigate, isExactActive }"
        >
          <a
            :href="href"
            :class="
              cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]',
                isExactActive ? 'bg-[var(--accent-cream)] text-[#071326]' : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]',
              )
            "
            @click="navigate"
          >
            <UsherMascot variant="brand" class="size-8 rounded-xl" />
            Cinema
          </a>
        </RouterLink>
      </nav>
    </header>

    <aside class="group/sidebar fixed inset-y-0 left-0 z-50 hidden w-[84px] border-r border-[var(--brand-border)] bg-[linear-gradient(180deg,rgba(7,19,38,0.98),rgba(10,24,44,0.94))] px-3 py-5 shadow-[16px_0_60px_rgba(2,8,20,0.24)] backdrop-blur-xl transition-[width] duration-300 ease-out hover:w-64 focus-within:w-64 md:block">
      <nav class="flex h-full flex-col gap-4" aria-label="Primary navigation">
        <RouterLink to="/" custom v-slot="{ href, navigate, isExactActive }">
          <a
            :href="href"
            :class="
              cn(
                'group/item relative flex h-14 w-full shrink-0 items-center gap-3 overflow-hidden rounded-2xl px-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]',
                isExactActive
                  ? 'bg-[var(--accent-cream)]/12 text-[var(--accent-cream)] ring-1 ring-[var(--accent-gold)]/35'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]',
              )
            "
            @click="navigate"
          >
            <UsherMascot variant="brand" class="size-10 shrink-0 rounded-2xl" />
            <span class="min-w-0 whitespace-nowrap opacity-0 transition duration-200 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:translate-x-0 group-focus-within/sidebar:opacity-100 md:-translate-x-1">
              <span class="block text-[10px] uppercase tracking-[0.22em] text-[var(--accent-gold)]">Usher</span>
              <span class="block">Discover</span>
            </span>
          </a>
        </RouterLink>

        <div class="mt-auto flex flex-col gap-3 pb-3">
          <NavItem to="/browse" label="Browse" :icon="Film" sidebar />
          <button type="button" class="group/item flex h-12 w-full items-center gap-3 overflow-hidden rounded-2xl px-3 text-left text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-white/[0.08] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]" @click="ui.openSuperSearch()">
            <Search class="size-5 shrink-0" aria-hidden="true" />
            <span class="whitespace-nowrap opacity-0 transition duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">Search</span>
          </button>
        </div>
      </nav>
    </aside>

    <main class="pb-[calc(5rem+env(safe-area-inset-bottom))] md:pl-[84px] md:pb-0">
      <RouteViewBoundary />
    </main>

    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--brand-border)] bg-[var(--bg)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      <div class="mx-auto flex min-h-16 max-w-lg items-stretch justify-around px-2">
        <NavItem to="/" label="Discover" :icon="Clapperboard" end mobile />
        <NavItem to="/browse" label="Browse" :icon="Film" mobile />
        <button type="button" class="flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]" @click="ui.openSuperSearch()">
          <Search class="size-5" aria-hidden="true" />
          <span>Search</span>
        </button>
      </div>
    </nav>

    <footer class="hidden border-t border-[var(--brand-border)] px-4 py-8 text-center text-sm text-[var(--text-secondary)] md:ml-[84px] md:block">
      <span class="text-[var(--accent-cream)]">Cinema Usher</span> powered by TMDB data. No account required.
    </footer>
    <SuperSearch />
  </div>
</template>
