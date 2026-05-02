import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

type RatingControlProps = {
  value?: number
  onChange: (value?: number) => void
}

export function RatingControl({ value, onChange }: RatingControlProps) {
  return (
    <div className="flex items-center gap-1" aria-label="Personal rating">
      {Array.from({ length: 5 }).map((_, index) => {
        const rating = index + 1
        const active = Boolean(value && value >= rating)
        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(value === rating ? undefined : rating)}
            className="rounded-full p-1 text-slate-500 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            aria-label={`Rate ${rating} out of 5`}
          >
            <Star
              className={cn('size-5', active && 'fill-white text-white')}
              aria-hidden="true"
            />
          </button>
        )
      })}
    </div>
  )
}
