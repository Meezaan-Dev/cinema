import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { ErrorState, StatusState } from '@/components/ui/StatusState'
import { useAuth } from '@/hooks/useAuth'
import { useJoinCloudWatchlist } from '@/hooks/useCloudWatchlists'

export function JoinWatchlistPage() {
  const { inviteToken = '' } = useParams()
  const { authConfigured, user, signInWithGoogle } = useAuth()
  const join = useJoinCloudWatchlist(inviteToken)
  const navigate = useNavigate()
  const attempted = useRef(false)

  useEffect(() => {
    if (!user || !inviteToken || attempted.current) return
    attempted.current = true
    join.mutate(undefined, {
      onSuccess: (watchlistId) => {
        navigate(`/watchlists/${watchlistId}`, { replace: true })
      },
    })
  }, [inviteToken, join, navigate, user])

  if (!authConfigured) {
    return (
      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
        <StatusState title="Cloud watchlists need Supabase" message="Add Supabase environment variables before invite links can be used." />
      </section>
    )
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
        <StatusState title="Sign in to join" message="Collaborative watchlists use Google sign-in so every person has their own watched state." />
        <div className="mt-5 flex justify-center">
          <Button type="button" variant="primary" onClick={signInWithGoogle}>Continue with Google</Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
      {join.isError ? <ErrorState error={join.error} /> : null}
      {!join.isError ? (
        <StatusState
          title="Joining watchlist"
          message="Adding you as a collaborator..."
        />
      ) : null}
    </section>
  )
}
