import { ImageOff } from 'lucide-react'

import { imageUrl } from '@/lib/formatters'
import { cn } from '@/lib/utils'

type MoviePosterProps = {
  path: string | null | undefined
  title: string
  className?: string
  size?: string
}

export function MoviePoster({ path, title, className, size = 'w500' }: MoviePosterProps) {
  const src = imageUrl(path, size)

  if (!src) {
    return (
      <div className={cn('grid aspect-[2/3] place-items-center rounded-2xl bg-white/[0.07] text-slate-500', className)}>
        <ImageOff className="size-9" aria-hidden="true" />
        <span className="sr-only">No poster available for {title}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`${title} poster`}
      className={cn('aspect-[2/3] rounded-2xl object-cover', className)}
      loading="lazy"
    />
  )
}
