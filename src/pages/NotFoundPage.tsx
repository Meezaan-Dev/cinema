import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { StatusState } from '@/components/ui/StatusState'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <StatusState
        title="Page not found"
        message="That screen is not part of Cinema. Head home or search for a title instead."
      />
      <div className="mt-5 flex justify-center gap-3">
        <Link to="/">
          <Button type="button" variant="primary">Discover</Button>
        </Link>
        <Link to="/search">
          <Button type="button" variant="secondary">Search</Button>
        </Link>
      </div>
    </section>
  )
}
