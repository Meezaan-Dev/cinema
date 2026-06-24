import { Clapperboard, Loader2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { getErrorCopy } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { AiSummary } from '@/types/ai'

type GuideTab = 'bestFor' | 'skipIf' | 'special' | 'similar' | 'tone' | 'pacing'

const guideTabs: Array<{ key: GuideTab; label: string }> = [
  { key: 'bestFor', label: 'Is this for me?' },
  { key: 'skipIf', label: 'Avoid if' },
  { key: 'special', label: 'What makes it special' },
  { key: 'similar', label: 'Similar titles' },
  { key: 'tone', label: 'Tone' },
  { key: 'pacing', label: 'Pacing' },
]

type UsherCardProps = {
  summary?: AiSummary
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  onRequestSummary?: () => void
  compact?: boolean
}

function UsherAvatar() {
  return (
    <div className="relative grid size-14 shrink-0 place-items-center rounded-2xl border border-[#00E054]/20 bg-[radial-gradient(circle_at_50%_18%,rgba(0,224,84,.18),rgba(28,34,40,1)_54%)] shadow-[0_18px_50px_rgba(0,0,0,.32)]">
      <div className="absolute -top-1.5 h-4 w-10 rounded-t-full border border-[#00E054]/20 bg-[#1C2228]" />
      <div className="absolute top-2 h-1.5 w-8 rounded-full bg-[#00E054]/60" />
      <div className="grid size-9 place-items-center rounded-full border border-white/10 bg-[#14181C]">
        <Clapperboard className="size-4.5 text-[#00E054]" aria-hidden="true" />
      </div>
      <Sparkles className="absolute -right-1 bottom-2 size-3.5 text-[#00E054]" aria-hidden="true" />
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const pct = (score / 10) * 100
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid size-14 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#00E054 ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
        }}
      >
        <div className="grid size-11 place-items-center rounded-full bg-[#1C2228] text-sm font-bold text-white">
          {score}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#99AABB]">Usher score</p>
        <p className="text-sm text-white">out of 10</p>
      </div>
    </div>
  )
}

function GuideTabContent({ summary, activeTab }: { summary: AiSummary; activeTab: GuideTab }) {
  if (activeTab === 'tone') {
    return <p className="text-sm leading-7 text-[#99AABB]">{summary.tone}</p>
  }

  if (activeTab === 'pacing') {
    return <p className="text-sm leading-7 text-[#99AABB]">{summary.pacing}</p>
  }

  if (activeTab === 'special') {
    return (
      <p className="text-sm leading-7 text-[#99AABB]">
        {summary.whatMakesItSpecial || summary.takeaway}
      </p>
    )
  }

  if (activeTab === 'similar') {
    const titles = summary.similarTitles
    if (!titles.length) {
      return <p className="text-sm text-[#99AABB]">No similar titles suggested yet.</p>
    }
    return (
      <ul className="space-y-2 text-sm leading-7 text-[#99AABB]">
        {titles.map((title) => (
          <li key={title} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#00E054]" aria-hidden="true" />
            <span>{title}</span>
          </li>
        ))}
      </ul>
    )
  }

  const items = activeTab === 'bestFor' ? summary.bestFor : summary.skipIf
  const heading = activeTab === 'bestFor' ? 'Perfect if you enjoy' : 'Avoid if you prefer'
  const fallback =
    activeTab === 'bestFor'
      ? 'Anyone looking for a spoiler-safe nudge before pressing play.'
      : 'Anyone who needs every plot beat explained upfront.'

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#99AABB]">{heading}</p>
      <ul className="space-y-2 text-sm leading-7 text-[#99AABB]">
        {(items.length ? items : [fallback]).map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#00E054]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function UsherCard({ summary, isLoading, error, onRetry, onRequestSummary, compact }: UsherCardProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>('bestFor')
  const errorCopy = error ? getErrorCopy(error) : null

  if (!summary && !isLoading && !error && !onRequestSummary) return null

  return (
    <div className={cn('rounded-2xl border border-white/[0.08] bg-[#1C2228] p-5', compact && 'p-4')}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <UsherAvatar />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#99AABB]">Spoiler-free guidance</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Usher</h2>
            <p className="mt-1 text-sm text-[#99AABB]">A knowledgeable friend helping you decide.</p>
          </div>
        </div>
        {error ? (
          <Button type="button" size="icon" variant="ghost" onClick={onRetry} aria-label="Retry Usher summary">
            <RefreshCw className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      {!summary && !isLoading && !error && onRequestSummary ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#202830] p-4 text-center">
          <p className="text-sm text-[#99AABB]">
            Get a spoiler-free take on whether this is worth your time.
          </p>
          <Button className="mt-4" type="button" onClick={onRequestSummary}>
            Ask Usher
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#202830] p-4 text-sm text-[#99AABB]">
          <Loader2 className="size-4 animate-spin text-[#00E054]" aria-hidden="true" />
          Checking the vibe without spoiling the ending...
        </div>
      ) : null}

      {errorCopy ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#202830] p-4">
          <p className="text-sm font-semibold text-white">Usher lost the thread. Try again?</p>
          <p className="mt-1 text-sm leading-6 text-[#99AABB]">{errorCopy.message}</p>
        </div>
      ) : null}

      {summary && !error ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#202830] p-4">
            <p className="text-sm leading-7 text-white">{summary.takeaway}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00E054]/10 px-3 py-1 text-xs font-semibold text-[#00E054]">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Spoiler-safe
              </span>
              <ScoreRing score={summary.recommendationScore} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Usher guide sections">
            {guideTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'min-h-9 rounded-full border border-white/[0.08] px-3 text-sm font-medium text-[#99AABB] transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]',
                  activeTab === tab.key && 'border-transparent bg-[#00E054] text-[#14181C] hover:bg-[#00C94A] hover:text-[#14181C]',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-24 rounded-xl border border-white/[0.08] bg-[#202830] p-4" role="tabpanel">
            <GuideTabContent summary={summary} activeTab={activeTab} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
