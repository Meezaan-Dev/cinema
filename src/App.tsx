import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from '@/components/auth/AuthProvider'
import { WatchlistPickerProvider } from '@/components/watchlist/WatchlistPickerProvider'
import { AppError } from '@/lib/errors'
import { router } from '@/routes/router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: (failureCount, error) => {
        if (error instanceof AppError) {
          return error.code === 'network' && failureCount < 1
        }
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WatchlistPickerProvider>
          <RouterProvider router={router} />
        </WatchlistPickerProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
