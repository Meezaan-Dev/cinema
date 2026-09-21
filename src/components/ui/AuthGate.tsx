import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type AuthGateProps = {
  icon: LucideIcon
  title: string
  message: string
  actionLabel: string
  onAction: () => void
  children?: ReactNode
}

export function AuthGate({ icon: Icon, title, message, actionLabel, onAction, children }: AuthGateProps) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#1C2228]/70 p-6">
      <Icon className="size-8 text-[#00E054]" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#99AABB]">{message}</p>
      {children ? <div className="mt-4">{children}</div> : null}
      <button type="button" onClick={onAction} className="button-link button-link-accent mt-5">
        {actionLabel}
      </button>
    </div>
  )
}
