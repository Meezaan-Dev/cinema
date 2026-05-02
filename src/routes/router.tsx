import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { MovieDetailPage } from '@/pages/MovieDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PickerPage } from '@/pages/PickerPage'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import { SearchPage } from '@/pages/SearchPage'
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
      { path: 'watchlist', element: <WatchlistPage /> },
      { path: 'picker', element: <PickerPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
