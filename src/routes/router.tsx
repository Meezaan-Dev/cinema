import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { CloudWatchlistDetailPage } from '@/pages/CloudWatchlistDetailPage'
import { HomePage } from '@/pages/HomePage'
import { JoinWatchlistPage } from '@/pages/JoinWatchlistPage'
import { MovieDetailPage } from '@/pages/MovieDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PickerPage } from '@/pages/PickerPage'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import { SearchPage } from '@/pages/SearchPage'
import { SeriesDetailPage } from '@/pages/SeriesDetailPage'
import { WatchlistPage } from '@/pages/WatchlistPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'movie/:movieId', element: <MovieDetailPage /> },
      { path: 'tv/:seriesId', element: <SeriesDetailPage /> },
      { path: 'watchlist', element: <Navigate to="/watchlists" replace /> },
      { path: 'watchlists', element: <WatchlistPage /> },
      { path: 'watchlists/:watchlistId', element: <CloudWatchlistDetailPage /> },
      { path: 'join/:inviteToken', element: <JoinWatchlistPage /> },
      { path: 'picker', element: <PickerPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
