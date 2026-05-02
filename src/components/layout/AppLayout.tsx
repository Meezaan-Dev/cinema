import { Film, Search, Sparkles, UserRoundCheck } from 'lucide-react'
import { NavLink, Outlet, ScrollRestoration } from 'react-router-dom'

import { APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Home', icon: Film },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/watchlist', label: 'Watchlist', icon: UserRoundCheck },
  { to: '/picker', label: 'Tonight', icon: Sparkles },
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05070c]/82 backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300">
            <span className="font-semibold tracking-tight text-white">{APP_NAME}</span>
          </NavLink>
          <div className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.055] p-1 shadow-[0_18px_50px_rgba(0,0,0,.24)]">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300',
                    isActive && 'bg-white text-[#05070c] shadow-lg shadow-black/20 hover:bg-white hover:text-[#05070c]',
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-white/[0.06] px-4 py-8 text-center text-sm text-slate-500">
        Built with TMDB data. Personal states stay in this browser.
      </footer>
      <ScrollRestoration />
    </div>
  )
}
