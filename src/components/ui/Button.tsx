import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E054] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[#00E054] text-[#14181C] hover:bg-[#00C94A]',
        secondary: 'border border-white/[0.08] bg-[#1C2228] text-white hover:bg-[#202830]',
        ghost: 'text-[#99AABB] hover:bg-white/5 hover:text-white',
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
