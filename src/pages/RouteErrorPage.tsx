import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { StatusState } from '@/components/ui/StatusState'
import { getErrorCopy } from '@/lib/errors'

export function RouteErrorPage() {
  const error = useRouteError()
  const copy = isRouteErrorResponse(error)
    ? {
        title: error.status === 404 ? 'Page not found' : 'Route error',
        message: error.statusText || 'The app could not render this route.',
      }
    : getErrorCopy(error)

  if (!isRouteErrorResponse(error) && error) {
    console.error('Route render error', error)
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#05070c] px-4 text-slate-100">
      <div className="w-full max-w-2xl">
        <StatusState title={copy.title} message={copy.message} type="error" />
        <div className="mt-5 flex justify-center">
          <Link to="/">
            <Button type="button" variant="primary">Return home</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
