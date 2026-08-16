import { useRef } from 'react'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'
import { Link } from 'react-router-dom'

import { imageUrl } from '@/lib/formatters'
import type { TmdbCastMember } from '@/types/tmdb'

type CastRailProps = {
  cast: TmdbCastMember[]
  isLoading?: boolean
}

export function CastRail({ cast, isLoading }: CastRailProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  function scrollCast(direction: 'left' | 'right') {
    rowRef.current?.scrollBy({ left: direction === 'left' ? -420 : 420, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="cast-row cast-row-spotlight">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="aspect-[2/3] animate-pulse rounded-xl bg-[#1C2228] p-3">
            <div className="h-full rounded-lg bg-white/10" />
          </div>
        ))}
      </div>
    )
  }

  if (!cast.length) {
    return <p className="text-sm text-[#99AABB]">No cast information available.</p>
  }

  return (
    <div className="relative">
      <div className="mb-3 hidden justify-end gap-2 sm:flex">
        <button
          type="button"
          className="cast-nav-button"
          onClick={() => scrollCast('left')}
          aria-label="Scroll cast left"
          title="Scroll cast left"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="cast-nav-button"
          onClick={() => scrollCast('right')}
          aria-label="Scroll cast right"
          title="Scroll cast right"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div ref={rowRef} className="cast-row cast-row-spotlight">
        {cast.map((person) => {
          const photo = imageUrl(person.profile_path, 'w342')
          return (
            <Link
              key={person.id}
              to={`/person/${person.id}`}
              className="group relative aspect-[2/3] overflow-hidden rounded-xl border border-white/[0.08] bg-[#1C2228] transition hover:-translate-y-0.5 hover:border-[#00E054]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]"
            >
              {photo ? (
                <img
                  src={photo}
                  alt={person.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-[#202830] text-[#99AABB]">
                  <User className="size-10" aria-hidden="true" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(20,24,28,.92)_32%,#14181C)] p-3 pt-12">
                <p className="line-clamp-2 text-sm font-semibold text-white">{person.name}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-4 text-[#99AABB]">
                  {person.character || 'Cast member'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
