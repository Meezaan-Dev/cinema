import { createRouter, createWebHistory } from 'vue-router'

import AppLayout from '@/components/layout/AppLayout.vue'
import { legacyBrowseLocation } from '@/lib/browse'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', name: 'home', component: () => import('@/pages/HomePage.vue') },
        { path: 'browse', name: 'browse', component: () => import('@/pages/BrowsePage.vue') },
        { path: 'movies', redirect: (to) => legacyBrowseLocation(to.path, to.query) },
        { path: 'tv-shows', redirect: (to) => legacyBrowseLocation(to.path, to.query) },
        { path: 'streaming', redirect: (to) => legacyBrowseLocation(to.path, to.query) },
        { path: 'people', name: 'people', component: () => import('@/pages/PeoplePage.vue') },
        { path: 'search', name: 'search', component: () => import('@/pages/SearchPage.vue') },
        { path: 'movie/:movieId', name: 'movie-detail', component: () => import('@/pages/MovieDetailPage.vue') },
        { path: 'tv/:seriesId', name: 'series-detail', component: () => import('@/pages/SeriesDetailPage.vue') },
        { path: 'person/:personId', name: 'person-detail', component: () => import('@/pages/PersonDetailPage.vue') },
        { path: ':pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue') },
      ],
    },
  ],
})
