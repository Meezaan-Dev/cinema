import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Film, Search, SlidersHorizontal, Star, Tv, UserRound, Users, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { getTrendingAll, queryKeys, searchMovies, searchPeople, searchSeries } from '@/api/tmdbEndpoints'
import { imageUrl } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { normalizeSuperSearchResults, type SuperSearchResult } from './superSearchResults'

type SuperSearchProps = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

const quickActions = [
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/tv-shows', label: 'TV Shows', icon: Tv },
  { to: '/people', label: 'People', icon: Users },
  { to: '/search', label: 'Advanced search', icon: SlidersHorizontal },
]

function ResultImage({ result }: { result: SuperSearchResult }) {
  const src = imageUrl(result.imagePath, result.kind === 'person' ? 'w185' : 'w342')

  if (!src) {
    return (
      <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-[#99AABB] ring-1 ring-white/[0.08]">
        {result.kind === 'person' ? <UserRound className="size-5" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className={cn(
        'size-14 shrink-0 bg-white/[0.06] object-cover ring-1 ring-white/[0.08]',
        result.kind === 'person' ? 'rounded-full' : 'rounded-lg',
      )}
      loading="lazy"
    />
  )
}

export function SuperSearch({ isOpen, onOpen, onClose }: SuperSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const debouncedQuery = useDebounce(query, 250)
  const hasPendingQuery = query.trim() !== debouncedQuery.trim()
  const trimmedQuery = debouncedQuery.trim()

  const trending = useQuery({
    queryKey: queryKeys.trendingAll,
    queryFn: getTrendingAll,
    enabled: isOpen && !trimmedQuery,
  })

  const search = useQuery({
    queryKey: ['super-search', trimmedQuery],
    queryFn: async () => {
      const [movies, series, people] = await Promise.all([
        searchMovies(trimmedQuery),
        searchSeries(trimmedQuery),
        searchPeople(trimmedQuery),
      ])

      return normalizeSuperSearchResults({
        titles: [...movies.results, ...series.results],
        people: people.results,
      })
    },
    enabled: isOpen && Boolean(trimmedQuery),
  })

  const results = useMemo(() => {
    if (trimmedQuery) return search.data ?? []
    return normalizeSuperSearchResults({ titles: trending.data?.results ?? [] })
  }, [search.data, trending.data?.results, trimmedQuery])

  const isLoading = hasPendingQuery || (trimmedQuery ? search.isLoading : trending.isLoading)
  const isError = trimmedQuery ? search.isError : trending.isError
  const activeResult = results[activeIndex] ?? results[0]

  const closeSearch = useCallback(() => {
    setQuery('')
    setActiveIndex(0)
    onClose()
  }, [onClose])

  useEffect(() => {
    function handleShortcut(event: globalThis.KeyboardEvent) {
      if (event.key.toLowerCase() !== 'k' || (!event.metaKey && !event.ctrlKey) || event.altKey || event.shiftKey) {
        return
      }

      event.preventDefault()
      if (isOpen) {
        closeSearch()
      } else {
        onOpen()
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [closeSearch, isOpen, onOpen])

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    window.setTimeout(() => inputRef.current?.focus(), 0)

    return () => {
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  function openPath(path: string) {
    closeSearch()
    navigate(path)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeSearch()
      return
    }

    if (!results.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % results.length)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (current - 1 + results.length) % results.length)
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (!hasPendingQuery && activeResult) openPath(activeResult.to)
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 bg-black/65 px-3 py-4 backdrop-blur-md sm:px-6 sm:py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSearch()
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="super-search-title"
            className="mx-auto flex max-h-[min(760px,calc(100svh-2rem))] max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#14181C] shadow-[0_28px_90px_rgba(0,0,0,0.58)]"
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/[0.08] p-3">
              <h2 id="super-search-title" className="sr-only">Super Search</h2>
              <label className="relative block">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#99AABB]"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  className="field h-14 rounded-xl border-white/[0.08] bg-[#202830] !pl-12 !pr-12 text-base"
                  placeholder="Search movies, TV shows, and people..."
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setActiveIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  aria-controls="super-search-results"
                  aria-activedescendant={activeResult ? `super-search-result-${activeResult.key}` : undefined}
                  role="combobox"
                  aria-expanded="true"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[#99AABB] transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]"
                  onClick={closeSearch}
                  aria-label="Close super search"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-2 text-xs text-[#99AABB]">
              <span>{trimmedQuery ? 'Search results' : 'Trending now'}</span>
              <span className="hidden sm:inline">Arrow keys to move • Enter to open • Esc to close</span>
            </div>

            <div className="border-b border-white/[0.08] p-2">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quickActions.map(({ to, label, icon: Icon }) => (
                  <button
                    key={to}
                    type="button"
                    onClick={() => openPath(to)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-xs font-semibold text-[#99AABB] transition hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]"
                  >
                    <Icon className="size-4 text-[#00E054]" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div id="super-search-results" role="listbox" className="min-h-72 overflow-y-auto p-2">
              {isLoading ? (
                <div className="grid min-h-64 place-items-center text-sm text-[#99AABB]">Searching...</div>
              ) : null}

              {isError ? (
                <div className="grid min-h-64 place-items-center px-6 text-center text-sm text-[#99AABB]">
                  The search service could not be reached. Try again in a moment.
                </div>
              ) : null}

              {!isLoading && !isError && results.length === 0 ? (
                <div className="grid min-h-64 place-items-center px-6 text-center text-sm text-[#99AABB]">
                  No matches found. Try a broader title or name.
                </div>
              ) : null}

              {!isLoading && !isError && results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result, index) => {
                    const isActive = index === activeIndex

                    return (
                      <button
                        key={result.key}
                        id={`super-search-result-${result.key}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={cn(
                          'grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl p-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]',
                          isActive ? 'bg-white/[0.09]' : 'hover:bg-white/[0.055]',
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => openPath(result.to)}
                      >
                        <ResultImage result={result} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-white">{result.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-[#99AABB]">{result.subtitle}</span>
                          {result.description ? (
                            <span className="mt-1 block truncate text-xs text-[#6F7F8F]">{result.description}</span>
                          ) : null}
                        </span>
                        {typeof result.rating === 'number' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-white">
                            <Star className="size-3 fill-[#00E054] text-[#00E054]" aria-hidden="true" />
                            {result.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-[#00E054]">Person</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
