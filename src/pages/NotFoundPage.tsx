import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { StatusState } from '@/components/ui/StatusState'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-7xl px-3 py-16 sm:px-6">
      <StatusState
        title="Page not found"
        message="That screen is not part of Absolute Cinema. Head home or search for a movie instead."
      />
      <div className="mt-5 flex justify-center">
        <Link to="/">
          <Button type="button" variant="primary">Return home</Button>
        </Link>
      </div>
    </section>
  )
}
