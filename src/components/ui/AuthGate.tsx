import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type AuthGateProps = {
  icon: LucideIcon
  title: string
  message: string
  actionLabel: string
  onAction: () => void
  actionDisabled?: boolean
  errorMessage?: string | null
  children?: ReactNode
}

export function AuthGate({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  actionDisabled,
  errorMessage,
  children,
}: AuthGateProps) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#1C2228]/70 p-6">
      <Icon className="size-8 text-[#00E054]" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#99AABB]">{message}</p>
      {errorMessage ? (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
      <button type="button" onClick={onAction} disabled={actionDisabled} className="button-link button-link-accent mt-5 disabled:opacity-60">
        {actionLabel}
      </button>
    </div>
  )
}
