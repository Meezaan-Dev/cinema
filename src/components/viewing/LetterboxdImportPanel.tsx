import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Import, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { viewingQueryKeys } from '@/api/viewingsClient'
import { useAuth } from '@/auth/useAuth'
import type { LetterboxdImportProgress, LetterboxdImportSummary } from '@/api/letterboxdImportClient'

function progressLabel(progress: LetterboxdImportProgress | null) {
  if (!progress) return null
  if (progress.phase === 'parsing') return 'Reading your Letterboxd export…'
  if (progress.phase === 'done') return 'Import finished.'
  return `Processing ${progress.processed} of ${progress.total} diary entries…`
}

export function LetterboxdImportPanel() {
  const { user, signInWithGoogle } = useAuth()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<LetterboxdImportProgress | null>(null)
  const [summary, setSummary] = useState<LetterboxdImportSummary | null>(null)

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        await signInWithGoogle()
        throw new Error('Sign in to import your Letterboxd export.')
      }

      setSummary(null)
      const { importLetterboxdZipForUser } = await import('@/api/letterboxdImportClient')
      return importLetterboxdZipForUser(user.uid, file, setProgress)
    },
    onSuccess: async (result) => {
      if (!user) return
      setSummary(result)
      await queryClient.invalidateQueries({ queryKey: viewingQueryKeys.history(user.uid) })
    },
  })

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#14181C]/70 p-4">
      <Import className="size-5 text-[#00E054]" aria-hidden="true" />
      <h3 className="mt-3 text-base font-semibold text-white">Import Letterboxd data</h3>
      <p className="mt-2 text-sm leading-6 text-[#99AABB]">
        Upload the zip from Letterboxd Settings → Import &amp; Export. Rewind reads your diary and matches films to TMDB.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) importMutation.mutate(file)
          event.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={importMutation.isPending}
        onClick={() => inputRef.current?.click()}
        className="button-link mt-4 disabled:opacity-60"
      >
        <Upload className="size-4" aria-hidden="true" />
        {importMutation.isPending ? 'Importing…' : 'Choose Letterboxd zip'}
      </button>
      {progressLabel(progress) ? <p className="mt-3 text-sm text-[#99AABB]">{progressLabel(progress)}</p> : null}
      {importMutation.isError ? (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {importMutation.error instanceof Error ? importMutation.error.message : 'Import failed.'}
        </p>
      ) : null}
      {summary ? (
        <div className="mt-4 space-y-2 text-sm text-[#99AABB]">
          <p className="text-white">
            Imported {summary.imported} · Updated {summary.skipped} · Unresolved {summary.unresolved.length} · Ambiguous{' '}
            {summary.ambiguous.length}
          </p>
          {summary.unresolved.length ? (
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-white/[0.08] bg-black/20 p-3 text-xs">
              {summary.unresolved.slice(0, 12).map((item) => (
                <li key={`${item.title}-${item.watchedDate}`}>
                  {item.title} ({item.year ?? 'unknown year'}) — {item.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
