type StaleRefreshBannerProps = {
  onRetry: () => void
}

export function StaleRefreshBanner({ onRetry }: StaleRefreshBannerProps) {
  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
      role="status"
    >
      <p>Couldn&apos;t refresh from the server. Showing your last saved copy.</p>
      <button type="button" onClick={onRetry} className="button-link text-amber-100 underline-offset-2 hover:underline">
        Retry
      </button>
    </div>
  )
}
