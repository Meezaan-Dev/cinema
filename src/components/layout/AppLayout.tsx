import { Film, LogIn, LogOut, Menu, Search, Sparkles, UserRoundCheck, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, ScrollRestoration } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Home', icon: Film },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/watchlists', label: 'Watchlists', icon: UserRoundCheck },
  { to: '/picker', label: 'Tonight', icon: Sparkles },
]

function getUserDisplayName(user: ReturnType<typeof useAuth>['user']) {
  if (!user) return ''

  if (user.displayName && user.displayName.trim()) return user.displayName
  if (user.email) return user.email
  return 'Signed-in user'
}

function getAvatarUrl(user: ReturnType<typeof useAuth>['user']) {
  return user?.photoURL ? user.photoURL : null
}

function getInitial(displayName: string) {
  return displayName.trim().charAt(0).toUpperCase() || 'U'
}

export function AppLayout() {
  const { authConfigured, user, signInWithGoogle, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const displayName = getUserDisplayName(user)
  const avatarUrl = getAvatarUrl(user)

  async function handleSignIn() {
    setMobileMenuOpen(false)
    await signInWithGoogle()
  }

  async function handleSignOut() {
    setMobileMenuOpen(false)
    await signOut()
  }

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05070c]/82 backdrop-blur-2xl">
        <nav className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <NavLink to="/" className="min-w-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300">
            <span className="font-semibold tracking-tight text-white">{APP_NAME}</span>
          </NavLink>
          <div className="hidden min-w-0 justify-center md:flex">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/[0.07] bg-white/[0.055] p-1 shadow-[0_18px_50px_rgba(0,0,0,.24)]">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300',
                      isActive && 'bg-white text-[#05070c] shadow-lg shadow-black/20 hover:bg-white hover:text-[#05070c]',
                    )
                  }
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="hidden md:inline">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
          <div className="hidden min-w-0 justify-end md:flex">
            {!authConfigured ? null : user ? (
              <div className="flex items-center justify-end gap-2">
                <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/[0.12] bg-white/[0.08]" title={displayName}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={`${displayName} profile`} className="size-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-sm font-semibold text-white">{getInitial(displayName)}</span>
                  )}
                </div>
                <Button type="button" variant="ghost" onClick={handleSignOut} aria-label="Sign out">
                  <LogOut className="size-4" aria-hidden="true" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button type="button" variant="primary" onClick={handleSignIn} aria-label="Sign in with Google">
                <LogIn className="size-4" aria-hidden="true" />
                <span>Sign in</span>
              </Button>
            )}
          </div>
          <div className="flex justify-end md:hidden">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </Button>
          </div>
        </nav>
        {mobileMenuOpen ? (
          <div id="mobile-navigation" className="border-t border-white/[0.06] px-4 pb-4 md:hidden">
            <div className="mx-auto max-w-7xl space-y-3">
              <div className="grid gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.055] p-2 shadow-[0_18px_50px_rgba(0,0,0,.24)]">
                {links.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300',
                        isActive && 'bg-white text-[#05070c] shadow-lg shadow-black/20 hover:bg-white hover:text-[#05070c]',
                      )
                    }
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    {label}
                  </NavLink>
                ))}
              </div>
              {authConfigured ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.055] p-3">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white/[0.12] bg-white/[0.08]">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={`${displayName} profile`} className="size-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-sm font-semibold text-white">{getInitial(displayName)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                          <p className="text-xs text-slate-500">Signed in</p>
                        </div>
                      </div>
                      <Button type="button" className="w-full" variant="secondary" onClick={handleSignOut}>
                        <LogOut className="size-4" aria-hidden="true" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" className="w-full" variant="primary" onClick={handleSignIn}>
                      <LogIn className="size-4" aria-hidden="true" />
                      Sign in
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
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
