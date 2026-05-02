import { AlertTriangle, Clapperboard } from 'lucide-react'

import { getErrorCopy } from '@/lib/errors'
import { Button } from './Button'

type StatusStateProps = {
  title: string
  message: string
  type?: 'empty' | 'error'
  onRetry?: () => void
}

export function StatusState({ title, message, type = 'empty', onRetry }: StatusStateProps) {
  const Icon = type === 'error' ? AlertTriangle : Clapperboard

  return (
    <div className="rounded-3xl border border-white/[0.07] bg-white/[0.045] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,.28)]">
      <Icon className="mx-auto mb-4 size-10 text-sky-300" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{message}</p>
      {onRetry ? (
        <Button className="mt-5" onClick={onRetry} type="button">
          Retry
        </Button>
      ) : null}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const copy = getErrorCopy(error)
  return <StatusState type="error" title={copy.title} message={copy.message} onRetry={onRetry} />
}
