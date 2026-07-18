import { Clapperboard, Film, Search, Tv, Users } from 'lucide-react'
import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom'

import { APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

const desktopLinks = [
  { to: '/', label: 'Discover', icon: Clapperboard, end: true },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/tv-shows', label: 'TV Shows', icon: Tv },
  { to: '/people', label: 'People', icon: Users },
  { to: '/search', label: 'Search', icon: Search },
]

const mobileLinks = [
  { to: '/', label: 'Discover', icon: Clapperboard, end: true },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/people', label: 'People', icon: Users },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/tv-shows', label: 'TV Shows', icon: Tv },
]

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  mobile,
}: {
  to: string
  label: string
  icon: typeof Clapperboard
  end?: boolean
  mobile?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          mobile
            ? 'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium'
            : 'inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition',
          isActive
            ? mobile
              ? 'text-[#00E054]'
              : 'bg-[#00E054] text-[#14181C]'
            : mobile
              ? 'text-[#99AABB] hover:text-white'
              : 'text-[#99AABB] hover:bg-white/5 hover:text-white',
          !mobile && 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]',
        )
      }
    >
      <Icon className={mobile ? 'size-5' : 'size-4'} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )
}

export function AppLayout() {
  const location = useLocation()
  const isDetailPage = /^\/(movie|tv|person)\//.test(location.pathname)

  return (
    <div className="min-h-screen bg-[#14181C] text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#14181C]/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink
            to="/"
            className="shrink-0 text-lg font-bold tracking-tight text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00E054]"
          >
            {APP_NAME}
          </NavLink>
          <div className="hidden items-center gap-1 md:flex">
            {desktopLinks.map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
          </div>
        </nav>
      </header>

      <main className={cn(isDetailPage ? '' : 'pb-20 md:pb-0')}>
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#14181C]/95 backdrop-blur-xl md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
          {mobileLinks.map((link) => (
            <NavItem key={link.to} {...link} mobile />
          ))}
        </div>
      </nav>

      <footer className="hidden border-t border-white/[0.08] px-4 py-8 text-center text-sm text-[#99AABB] md:block">
        Powered by TMDB data. No account required.
      </footer>
      <ScrollRestoration />
    </div>
  )
}
