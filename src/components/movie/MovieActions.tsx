import { Clapperboard, ExternalLink, Loader2, Plus, RefreshCw, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { RatingControl } from '@/components/ui/RatingControl'
import { getErrorCopy } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { AiSummary } from '@/types/ai'
import type { UserMovie } from '@/types/movie'

type GuideTab = 'bestFor' | 'skipIf' | 'tone' | 'pacing'

const guideTabs: Array<{ key: GuideTab; label: string }> = [
  { key: 'bestFor', label: 'Best for' },
  { key: 'skipIf', label: 'Skip if' },
  { key: 'tone', label: 'Tone' },
  { key: 'pacing', label: 'Pacing' },
]

type MovieActionsProps = {
  movie: UserMovie
  saved?: UserMovie
  onAdd: (movie: UserMovie) => void
  onRemove: (movie: UserMovie) => void
  onRate: (movie: UserMovie, rating?: number) => void
  magicLinkUrl?: string
  imdbUrl?: string
  aiSummary?: AiSummary
  isAiSummaryLoading?: boolean
  aiSummaryError?: unknown
  onAiSummaryRetry?: () => void
}

function UsherAvatar() {
  return (
    <div className="relative grid size-14 shrink-0 place-items-center rounded-2xl border border-sky-300/20 bg-[radial-gradient(circle_at_50%_18%,rgba(125,211,252,.22),rgba(255,255,255,.06)_54%,rgba(255,255,255,.03))] shadow-[0_18px_50px_rgba(0,0,0,.28)]">
      <div className="absolute -top-1.5 h-4 w-10 rounded-t-full border border-sky-300/20 bg-[#111827]" />
      <div className="absolute top-2 h-1.5 w-8 rounded-full bg-sky-300/70" />
      <div className="grid size-9 place-items-center rounded-full border border-white/15 bg-[#05070c]">
        <Clapperboard className="size-4.5 text-sky-200" aria-hidden="true" />
      </div>
      <Sparkles className="absolute -right-1 bottom-2 size-3.5 text-amber-200" aria-hidden="true" />
    </div>
  )
}

function GuideTabContent({ summary, activeTab }: { summary: AiSummary; activeTab: GuideTab }) {
  if (activeTab === 'tone') {
    return <p className="text-sm leading-6 text-slate-300">{summary.tone}</p>
  }

  if (activeTab === 'pacing') {
    return <p className="text-sm leading-6 text-slate-300">{summary.pacing}</p>
  }

  const items = activeTab === 'bestFor' ? summary.bestFor : summary.skipIf
  const fallback =
    activeTab === 'bestFor'
      ? 'Anyone who wants a spoiler-safe nudge before pressing play.'
      : 'Anyone who needs every plot beat explained upfront.'

  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-300">
      {(items.length ? items : [fallback]).map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-300" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function MovieDecisionGuide({
  summary,
  isLoading,
  error,
  onRetry,
}: {
  summary?: AiSummary
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
}) {
  const [activeTab, setActiveTab] = useState<GuideTab>('bestFor')
  const errorCopy = error ? getErrorCopy(error) : null

  return (
    <div className="mt-4 border-t border-white/[0.07] pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Spoiler-free assist</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Tiny usher's verdict</h2>
        </div>
        {error ? (
          <Button type="button" size="icon" variant="ghost" onClick={onRetry} aria-label="Retry AI summary">
            <RefreshCw className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <UsherAvatar />
        <div className="relative flex-1 rounded-2xl border border-white/[0.08] bg-[#0f1722]/90 p-4 sm:before:absolute sm:before:left-[-8px] sm:before:top-6 sm:before:size-4 sm:before:rotate-45 sm:before:border-b sm:before:border-l sm:before:border-white/[0.08] sm:before:bg-[#0f1722]">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Loader2 className="size-4 animate-spin text-sky-300" aria-hidden="true" />
              Checking the vibe without spoiling the ending...
            </div>
          ) : null}

          {errorCopy ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">The usher lost their notes. Try again?</p>
              <p className="text-sm leading-6 text-slate-400">{errorCopy.message}</p>
            </div>
          ) : null}

          {summary && !error ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-slate-200">{summary.takeaway}</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Spoiler-safe
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {summary && !error ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="AI decision guide sections">
            {guideTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'min-h-10 rounded-full border border-white/[0.08] px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300',
                  activeTab === tab.key && 'border-transparent bg-white text-[#05070c] hover:bg-white hover:text-[#05070c]',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="min-h-24 rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4" role="tabpanel">
            <GuideTabContent summary={summary} activeTab={activeTab} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function MovieActions({
  movie,
  saved,
  onAdd,
  onRemove,
  onRate,
  magicLinkUrl,
  imdbUrl,
  aiSummary,
  isAiSummaryLoading,
  aiSummaryError,
  onAiSummaryRetry,
}: MovieActionsProps) {
  const current = saved ?? movie

  return (
    <div className="rounded-3xl border border-white/[0.07] bg-white/[0.06] p-4 backdrop-blur-2xl">
      <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
        {saved ? (
          <Button variant="danger" type="button" onClick={() => onRemove(current)}>
            <Trash2 className="size-4" aria-hidden="true" />
            Remove
          </Button>
        ) : (
          <Button variant="primary" type="button" onClick={() => onAdd(movie)}>
            <Plus className="size-4" aria-hidden="true" />
            Watchlist
          </Button>
        )}
        {magicLinkUrl ? (
          <a className="button-link w-full" href={magicLinkUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" aria-hidden="true" />
            Magic Link
          </a>
        ) : null}
        {imdbUrl ? (
          <a className="button-link w-full" href={imdbUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" aria-hidden="true" />
            View on IMDb
          </a>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
        <span className="text-sm font-medium text-slate-300">Your rating</span>
        <RatingControl value={current.personalRating} onChange={(rating) => onRate(current, rating)} />
      </div>
      {(aiSummary || isAiSummaryLoading || aiSummaryError) ? (
        <MovieDecisionGuide
          summary={aiSummary}
          isLoading={isAiSummaryLoading}
          error={aiSummaryError}
          onRetry={onAiSummaryRetry}
        />
      ) : null}
    </div>
  )
}
