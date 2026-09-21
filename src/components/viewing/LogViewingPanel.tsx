import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, MapPin, RotateCcw, Star } from 'lucide-react'
import { useMemo, useState } from 'react'

import { upsertViewing, viewingQueryKeys } from '@/api/viewingsClient'
import { useAuth } from '@/auth/useAuth'
import { buildViewingId, buildViewingSourceKey, sanitizeViewingRating } from '@/lib/viewingDomain'
import type { ViewingLocation, ViewingMediaType } from '@/types/viewing'

type LogViewingPanelProps = {
  tmdbId: number
  mediaType: ViewingMediaType
  title: string
  releaseYear: number | null
}

const ratingOptions = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

function todayInputValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function LogViewingPanel({ tmdbId, mediaType, title, releaseYear }: LogViewingPanelProps) {
  const { user, uid, signInWithGoogle } = useAuth()
  const queryClient = useQueryClient()
  const [watchedDate, setWatchedDate] = useState(todayInputValue())
  const [rating, setRating] = useState<number | null>(null)
  const [location, setLocation] = useState<ViewingLocation>('home')
  const [rewatch, setRewatch] = useState(false)
  const [review, setReview] = useState('')
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const locationRequired = mediaType === 'movie'

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        await signInWithGoogle()
        return null
      }

      const firestoreUid = user.uid

      if (locationRequired && location !== 'cinema' && location !== 'home') {
        throw new Error('Choose whether you watched at home or in the cinema.')
      }

      const watchedAtIso = `${watchedDate}T12:00:00.000Z`
      const sourceKey = buildViewingSourceKey({
        source: 'rewind',
        title,
        year: releaseYear,
        watchedAt: watchedDate,
      })
      const viewingId = await buildViewingId(sourceKey)

      await upsertViewing(firestoreUid, viewingId, {
        tmdbId,
        mediaType,
        watchedAt: new Date(watchedAtIso),
        location: mediaType === 'movie' ? location : 'unknown',
        rating: sanitizeViewingRating(rating),
        rewatch,
        review: review.trim() ? review.trim() : null,
        tags: [],
        source: 'rewind',
        sourceUri: null,
        sourceKey,
        importTitle: title,
        importYear: releaseYear,
      })

      return firestoreUid
    },
    onSuccess: async (activeUid) => {
      if (!activeUid) return
      setSavedMessage('Saved to your history.')
      await queryClient.invalidateQueries({ queryKey: viewingQueryKeys.history(activeUid) })
      await queryClient.invalidateQueries({ queryKey: viewingQueryKeys.forTitle(activeUid, mediaType, tmdbId) })
    },
  })

  const ratingLabel = useMemo(() => (rating === null ? 'Not rated' : `${rating} / 5`), [rating])

  if (!uid) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-[#1C2228]/70 p-4">
        <h3 className="text-base font-semibold text-white">Log this {mediaType === 'movie' ? 'film' : 'show'}</h3>
        <p className="mt-2 text-sm text-[#99AABB]">Sign in to rate and save when you watched it.</p>
        <button type="button" onClick={() => void signInWithGoogle()} className="button-link button-link-accent mt-4">
          Sign in with Google
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#1C2228]/70 p-4">
      <h3 className="text-base font-semibold text-white">Log this {mediaType === 'movie' ? 'film' : 'show'}</h3>
      <p className="mt-1 text-sm text-[#99AABB]">Add a rating and watched date to your Rewind history.</p>

      <div className="mt-4 space-y-4">
        <label className="block text-sm text-[#99AABB]">
          <span className="mb-2 inline-flex items-center gap-1 font-medium text-white">
            <CalendarDays className="size-4" aria-hidden="true" />
            Watched date
          </span>
          <input
            type="date"
            value={watchedDate}
            onChange={(event) => setWatchedDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#14181C] px-3 py-2 text-sm text-white"
          />
        </label>

        <div>
          <p className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-white">
            <Star className="size-4 text-[#00E054]" aria-hidden="true" />
            Rating
            <span className="font-normal text-[#99AABB]">({ratingLabel})</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRating(null)}
              className={`rounded-md border px-2 py-1 text-xs ${rating === null ? 'border-[#00E054] text-[#00E054]' : 'border-white/[0.08] text-[#99AABB]'}`}
            >
              Clear
            </button>
            {ratingOptions.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`rounded-md border px-2 py-1 text-xs ${rating === value ? 'border-[#00E054] text-[#00E054]' : 'border-white/[0.08] text-[#99AABB]'}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {locationRequired ? (
          <div>
            <p className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-white">
              <MapPin className="size-4" aria-hidden="true" />
              Where did you watch?
            </p>
            <div className="flex flex-wrap gap-2">
              {(['home', 'cinema'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLocation(option)}
                  className={`rounded-md border px-3 py-1.5 text-sm capitalize ${location === option ? 'border-[#00E054] text-[#00E054]' : 'border-white/[0.08] text-[#99AABB]'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <label className="flex items-center gap-2 text-sm text-[#99AABB]">
          <input
            type="checkbox"
            checked={rewatch}
            onChange={(event) => setRewatch(event.target.checked)}
            className="size-4 rounded border-white/[0.2]"
          />
          <RotateCcw className="size-4" aria-hidden="true" />
          Rewatch
        </label>

        <label className="block text-sm text-[#99AABB]">
          <span className="mb-2 block font-medium text-white">Notes (optional)</span>
          <textarea
            value={review}
            onChange={(event) => setReview(event.target.value)}
            rows={3}
            maxLength={5000}
            className="w-full rounded-lg border border-white/[0.08] bg-[#14181C] px-3 py-2 text-sm text-white"
            placeholder="What stood out?"
          />
        </label>

        {saveMutation.isError ? (
          <p className="text-sm text-red-300" role="alert">
            {saveMutation.error instanceof Error ? saveMutation.error.message : 'Could not save this viewing.'}
          </p>
        ) : null}
        {savedMessage ? <p className="text-sm text-[#00E054]">{savedMessage}</p> : null}

        <button
          type="button"
          disabled={saveMutation.isPending || !watchedDate}
          onClick={() => {
            setSavedMessage(null)
            saveMutation.mutate()
          }}
          className="button-link button-link-accent disabled:opacity-60"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save to history'}
        </button>
      </div>
    </div>
  )
}
