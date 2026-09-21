<script setup lang="ts">
import { Clapperboard, Film, Search, Tv } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import NavItem from '@/components/layout/NavItem.vue'
import RouteViewBoundary from '@/components/layout/RouteViewBoundary.vue'
import SuperSearch from '@/components/search/SuperSearch.vue'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const ui = useUiStore()

const isDetailPage = computed(() => /^\/(movie|tv|person)\//.test(route.path))
</script>

<template>
  <div class="min-h-svh bg-[#14181C] text-white">
    <header class="sticky top-0 z-40 border-b border-white/[0.08] bg-[#14181C]/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:hidden">
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
                'inline-flex shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]',
                isExactActive ? 'bg-[#00E054] text-[#14181C]' : 'text-[#99AABB] hover:bg-white/5 hover:text-white',
              )
            "
            @click="navigate"
          >
            Discovery
          </a>
        </RouterLink>
        <button
          type="button"
          class="inline-flex h-10 min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-[#1C2228] px-4 text-sm font-medium text-white transition hover:bg-[#202830] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]"
          aria-label="Open search"
          @click="ui.openSuperSearch()"
        >
          <Search class="size-4" aria-hidden="true" />
          <span>Search</span>
          <kbd class="hidden rounded-md border border-white/[0.08] bg-[#14181C] px-1.5 py-0.5 text-[11px] font-semibold text-[#99AABB] sm:inline">
            Cmd/Ctrl K
          </kbd>
        </button>
      </nav>
    </header>

    <aside class="group/sidebar fixed inset-y-0 left-0 z-50 hidden w-[76px] bg-[linear-gradient(90deg,#14181C_0%,rgba(20,24,28,0.96)_68%,rgba(20,24,28,0)_100%)] px-3 py-5 backdrop-blur-xl transition-[width,background] duration-300 ease-out hover:w-60 hover:bg-[linear-gradient(90deg,#14181C_0%,rgba(20,24,28,0.98)_72%,rgba(20,24,28,0)_100%)] focus-within:w-60 focus-within:bg-[linear-gradient(90deg,#14181C_0%,rgba(20,24,28,0.98)_72%,rgba(20,24,28,0)_100%)] md:block">
      <nav class="flex h-full flex-col justify-center gap-3" aria-label="Primary navigation">
        <RouterLink to="/" custom v-slot="{ href, navigate, isExactActive }">
          <a
            :href="href"
            :class="
              cn(
                'group/item relative flex h-12 w-full shrink-0 items-center gap-3 overflow-hidden rounded-2xl px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]',
                isExactActive
                  ? 'bg-[#00E054]/10 text-[#00E054] ring-1 ring-[#00E054]/25'
                  : 'text-[#99AABB] hover:bg-white/5 hover:text-white',
              )
            "
            @click="navigate"
          >
            <Clapperboard class="size-5 shrink-0" aria-hidden="true" />
            <span class="whitespace-nowrap opacity-0 transition duration-200 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:translate-x-0 group-focus-within/sidebar:opacity-100 md:-translate-x-1">
              Discovery
            </span>
          </a>
        </RouterLink>

        <NavItem to="/search" label="Search" :icon="Search" sidebar />

        <div class="mt-2 flex flex-col gap-3">
          <NavItem to="/movies" label="Movies" :icon="Film" sidebar />
          <NavItem to="/tv-shows" label="Shows" :icon="Tv" sidebar />
        </div>
      </nav>
    </aside>

    <main :class="cn('md:pl-[76px]', isDetailPage ? '' : 'pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0')">
      <RouteViewBoundary />
    </main>

    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#14181C]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      <div class="mx-auto flex min-h-16 max-w-lg items-stretch justify-around px-2">
        <NavItem to="/" label="Discover" :icon="Clapperboard" end mobile />
        <NavItem to="/movies" label="Movies" :icon="Film" mobile />
        <NavItem to="/tv-shows" label="Shows" :icon="Tv" mobile />
      </div>
    </nav>

    <footer class="hidden border-t border-white/[0.08] px-4 py-8 text-center text-sm text-[#99AABB] md:ml-[76px] md:block">
      Powered by TMDB data. No account required.
    </footer>
    <SuperSearch />
  </div>
</template>
