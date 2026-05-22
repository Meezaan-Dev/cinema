import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import {
  CloudWatchlistDetailPage,
  HomePage,
  JoinWatchlistPage,
  LazyRoute,
  MovieDetailPage,
  NotFoundPage,
  SearchPage,
  SeriesDetailPage,
  WatchlistPage,
} from '@/routes/lazyPages'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LazyRoute><HomePage /></LazyRoute> },
      { path: 'search', element: <LazyRoute><SearchPage /></LazyRoute> },
      { path: 'movie/:movieId', element: <LazyRoute><MovieDetailPage /></LazyRoute> },
      { path: 'tv/:seriesId', element: <LazyRoute><SeriesDetailPage /></LazyRoute> },
      { path: 'watchlist', element: <Navigate to="/watchlists" replace /> },
      { path: 'watchlists', element: <LazyRoute><WatchlistPage /></LazyRoute> },
      { path: 'watchlists/:watchlistId', element: <LazyRoute><CloudWatchlistDetailPage /></LazyRoute> },
      { path: 'join/:inviteToken', element: <LazyRoute><JoinWatchlistPage /></LazyRoute> },
      { path: '*', element: <LazyRoute><NotFoundPage /></LazyRoute> },
    ],
  },
])
