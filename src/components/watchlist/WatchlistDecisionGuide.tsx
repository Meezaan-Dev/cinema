import { useQuery } from '@tanstack/react-query'
import { Clapperboard, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { aiSummaryKeys, getAiSummary } from '@/api/aiSummaries'
import { Button } from '@/components/ui/Button'
import { getErrorCopy } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { AiSummaryRequest } from '@/types/ai'

type WatchlistDecisionGuideProps = {
  input: AiSummaryRequest
  layout?: 'block' | 'inline'
  trigger?: 'button' | 'icon'
}

export function WatchlistDecisionGuide({
  input,
  layout = 'block',
  trigger = 'button',
}: WatchlistDecisionGuideProps) {
  const isInline = layout === 'inline'
  const isIconTrigger = trigger === 'icon'
  const [isOpen, setIsOpen] = useState(false)
  const summary = useQuery({
    queryKey: aiSummaryKeys.summary(input.mediaType, input.tmdbId),
    queryFn: () => getAiSummary(input),
    enabled: isOpen,
    retry: false,
  })
  const errorCopy = summary.error ? getErrorCopy(summary.error) : null

  if (!isOpen) {
    if (isIconTrigger) {
      return (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="touch-manipulation"
          aria-label="Ask tiny usher"
          onClick={() => setIsOpen(true)}
        >
          <Sparkles className="size-4" aria-hidden="true" />
        </Button>
      )
    }

    return (
      <Button
        type="button"
        size="sm"
        variant={isInline ? 'ghost' : undefined}
        className={cn(
          'touch-manipulation',
          isInline ? 'mt-2 h-8 px-2 text-slate-400 hover:text-white' : 'mt-3 w-full min-h-11',
        )}
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="size-4" aria-hidden="true" />
        Ask tiny usher
      </Button>
    )
  }

  const panel = (
    <div
      className={cn(
        'rounded-2xl border border-sky-300/15 bg-sky-300/[0.06] p-3',
        isIconTrigger ? 'w-full basis-full' : isInline ? 'mt-2' : 'mt-3',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-sky-300/20 bg-[#05070c]">
          <Clapperboard className="size-5 text-sky-200" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">Tiny usher</p>
            <button
              type="button"
              className="min-h-11 rounded-full px-3 text-xs font-semibold text-slate-500 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 touch-manipulation sm:min-h-0 sm:px-2"
              onClick={() => setIsOpen(false)}
            >
              Hide
            </button>
          </div>

          {summary.isLoading ? (
            <p className="mt-2 flex items-center gap-2 text-sm leading-6 text-slate-300">
              <Loader2 className="size-4 animate-spin text-sky-300" aria-hidden="true" />
              Checking the vibe...
            </p>
          ) : null}

          {errorCopy ? (
            <div className="mt-2 space-y-2">
              <p className="text-sm leading-6 text-slate-300">The usher lost their notes. Try again?</p>
              <p className="text-xs leading-5 text-slate-500">{errorCopy.message}</p>
              <Button type="button" size="sm" variant="ghost" onClick={() => summary.refetch()}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Retry
              </Button>
            </div>
          ) : null}

          {summary.data && !summary.error ? (
            <div className="mt-2 space-y-3">
              <p className="text-sm leading-6 text-slate-200">{summary.data.takeaway}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-300">{summary.data.tone}</span>
                <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100">Spoiler-safe</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (isIconTrigger) {
    return (
      <>
        <Button
          type="button"
          size="icon"
          variant="primary"
          className="touch-manipulation"
          aria-label="Close tiny usher"
          onClick={() => setIsOpen(false)}
        >
          <Sparkles className="size-4" aria-hidden="true" />
        </Button>
        {panel}
      </>
    )
  }

  return panel
}
