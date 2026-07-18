import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import {
  HomePage,
  LazyRoute,
  MovieDetailPage,
  MoviesPage,
  NotFoundPage,
  PeoplePage,
  PersonDetailPage,
  SearchPage,
  SeriesDetailPage,
  TVShowsPage,
} from '@/routes/lazyPages'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LazyRoute><HomePage /></LazyRoute> },
      { path: 'movies', element: <LazyRoute><MoviesPage /></LazyRoute> },
      { path: 'tv-shows', element: <LazyRoute><TVShowsPage /></LazyRoute> },
      { path: 'people', element: <LazyRoute><PeoplePage /></LazyRoute> },
      { path: 'search', element: <LazyRoute><SearchPage /></LazyRoute> },
      { path: 'movie/:movieId', element: <LazyRoute><MovieDetailPage /></LazyRoute> },
      { path: 'tv/:seriesId', element: <LazyRoute><SeriesDetailPage /></LazyRoute> },
      { path: 'person/:personId', element: <LazyRoute><PersonDetailPage /></LazyRoute> },
      { path: '*', element: <LazyRoute><NotFoundPage /></LazyRoute> },
    ],
  },
])
