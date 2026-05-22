import { lazy, Suspense, type ReactNode } from 'react'

export const CloudWatchlistDetailPage = lazy(() =>
  import('@/pages/CloudWatchlistDetailPage').then((module) => ({ default: module.CloudWatchlistDetailPage })),
)
export const HomePage = lazy(() => import('@/pages/HomePage').then((module) => ({ default: module.HomePage })))
export const JoinWatchlistPage = lazy(() =>
  import('@/pages/JoinWatchlistPage').then((module) => ({ default: module.JoinWatchlistPage })),
)
export const MovieDetailPage = lazy(() =>
  import('@/pages/MovieDetailPage').then((module) => ({ default: module.MovieDetailPage })),
)
export const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
export const SearchPage = lazy(() => import('@/pages/SearchPage').then((module) => ({ default: module.SearchPage })))
export const SeriesDetailPage = lazy(() =>
  import('@/pages/SeriesDetailPage').then((module) => ({ default: module.SeriesDetailPage })),
)
export const WatchlistPage = lazy(() => import('@/pages/WatchlistPage').then((module) => ({ default: module.WatchlistPage })))

export function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-3 py-8 text-slate-400 sm:px-6">Loading...</div>}>
      {children}
    </Suspense>
  )
}
