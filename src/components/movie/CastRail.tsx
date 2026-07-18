import { User } from 'lucide-react'
import { Link } from 'react-router-dom'

import { imageUrl } from '@/lib/formatters'
import type { TmdbCastMember } from '@/types/tmdb'

type CastRailProps = {
  cast: TmdbCastMember[]
  isLoading?: boolean
}

export function CastRail({ cast, isLoading }: CastRailProps) {
  if (isLoading) {
    return (
      <div className="cast-row">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-xl bg-[#1C2228] p-3">
            <div className="mx-auto size-16 rounded-full bg-white/10" />
            <div className="mx-auto mt-2 h-3 w-20 rounded bg-white/10" />
          </div>
        ))}
      </div>
    )
  }

  if (!cast.length) {
    return <p className="text-sm text-[#99AABB]">No cast information available.</p>
  }

  return (
    <div className="cast-row">
      {cast.map((person) => {
        const photo = imageUrl(person.profile_path, 'w185')
        return (
          <Link
            key={person.id}
            to={`/person/${person.id}`}
            className="rounded-xl border border-white/[0.08] bg-[#1C2228] p-3 text-center transition hover:-translate-y-0.5 hover:border-[#00E054]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]"
          >
            {photo ? (
              <img
                src={photo}
                alt={person.name}
                className="mx-auto size-16 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#202830] text-[#99AABB]">
                <User className="size-6" aria-hidden="true" />
              </div>
            )}
            <p className="mt-2 line-clamp-2 text-sm font-medium text-white">{person.name}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-[#99AABB]">{person.character}</p>
          </Link>
        )
      })}
    </div>
  )
}
