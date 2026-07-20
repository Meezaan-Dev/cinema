import { Clapperboard, Film, Search, Tv } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { SuperSearch } from '@/components/search/SuperSearch'

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
  const [isSuperSearchOpen, setIsSuperSearchOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#14181C] text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#14181C]/90 backdrop-blur-xl">
        <nav className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:px-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'inline-flex justify-self-start rounded-full px-3.5 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]',
                isActive ? 'bg-[#00E054] text-[#14181C]' : 'text-[#99AABB] hover:bg-white/5 hover:text-white',
              )
            }
          >
            Discovery
          </NavLink>
          <button
            type="button"
            onClick={() => setIsSuperSearchOpen(true)}
            className="inline-flex h-10 items-center gap-2 justify-self-center rounded-full border border-white/[0.08] bg-[#1C2228] px-4 text-sm font-medium text-white transition hover:bg-[#202830] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]"
            aria-label="Open search"
          >
            <Search className="size-4" aria-hidden="true" />
            <span>Search</span>
            <kbd className="hidden rounded-md border border-white/[0.08] bg-[#14181C] px-1.5 py-0.5 text-[11px] font-semibold text-[#99AABB] sm:inline">
              Cmd/Ctrl K
            </kbd>
          </button>
          <div className="flex justify-self-end gap-1">
            <NavItem to="/movies" label="Movies" icon={Film} />
            <NavItem to="/tv-shows" label="Shows" icon={Tv} />
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
          <NavItem to="/" label="Discover" icon={Clapperboard} end mobile />
          <button
            type="button"
            onClick={() => setIsSuperSearchOpen(true)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E054]',
              isSuperSearchOpen ? 'text-[#00E054]' : 'text-[#99AABB] hover:text-white',
            )}
          >
            <Search className="size-5" aria-hidden="true" />
            <span>Search</span>
          </button>
          <NavItem to="/movies" label="Movies" icon={Film} mobile />
          <NavItem to="/tv-shows" label="Shows" icon={Tv} mobile />
        </div>
      </nav>

      <footer className="hidden border-t border-white/[0.08] px-4 py-8 text-center text-sm text-[#99AABB] md:block">
        Powered by TMDB data. No account required.
      </footer>
      <SuperSearch
        isOpen={isSuperSearchOpen}
        onOpen={() => setIsSuperSearchOpen(true)}
        onClose={() => setIsSuperSearchOpen(false)}
      />
      <ScrollRestoration />
    </div>
  )
}
