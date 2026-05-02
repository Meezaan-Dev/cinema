import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-white text-[#05070c] shadow-[0_18px_50px_rgba(255,255,255,0.16)] hover:bg-slate-100',
        secondary: 'border border-white/[0.09] bg-white/10 text-white hover:bg-white/16',
        ghost: 'text-slate-200 hover:bg-white/10',
        danger: 'border border-rose-300/20 bg-rose-500/12 text-rose-100 hover:bg-rose-500/20',
      },
      size: {
        sm: 'h-9 px-3.5',
        md: 'h-11 px-5',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
