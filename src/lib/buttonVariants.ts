import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--accent-gold)] text-[#071326] hover:bg-[#ffd77c]',
        secondary: 'border border-[var(--brand-border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]',
        ghost: 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]',
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
