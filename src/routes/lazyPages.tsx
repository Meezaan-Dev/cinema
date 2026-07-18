import { lazy, Suspense, type ReactNode } from 'react'

import { MovieGridSkeleton } from '@/components/ui/Skeleton'

export const HomePage = lazy(() => import('@/pages/HomePage').then((module) => ({ default: module.HomePage })))
export const MoviesPage = lazy(() => import('@/pages/MoviesPage').then((module) => ({ default: module.MoviesPage })))
export const PeoplePage = lazy(() => import('@/pages/PeoplePage').then((module) => ({ default: module.PeoplePage })))
export const TVShowsPage = lazy(() => import('@/pages/TVShowsPage').then((module) => ({ default: module.TVShowsPage })))
export const MovieDetailPage = lazy(() =>
  import('@/pages/MovieDetailPage').then((module) => ({ default: module.MovieDetailPage })),
)
export const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
export const PersonDetailPage = lazy(() =>
  import('@/pages/PersonDetailPage').then((module) => ({ default: module.PersonDetailPage })),
)
export const SearchPage = lazy(() => import('@/pages/SearchPage').then((module) => ({ default: module.SearchPage })))
export const SeriesDetailPage = lazy(() =>
  import('@/pages/SeriesDetailPage').then((module) => ({ default: module.SeriesDetailPage })),
)

export function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <MovieGridSkeleton count={6} />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
