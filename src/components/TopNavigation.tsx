import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  ChevronDown,
  CircleUserRound,
  KeyRound,
  LogOut,
  ScanSearch,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { CURRENT_USER } from '../lib/data'
import { useWorkspace, relTime, clockTime } from '../lib/store'
import { FEED_ICONS } from './FeedIcons'
import { useToast } from './ToastProvider'

const ROUTES: Record<string, string> = {
  '/': 'Overview',
  '/analyze': 'Analyze Media',
  '/image-forensics': 'Image Forensics',
  '/video-intelligence': 'Video Intelligence',
  '/credentials': 'Content Credentials',
  '/fingerprints': 'Asset Fingerprints',
  '/history': 'Verification History',
  '/analytics': 'Analytics',
  '/reports': 'Reports',
  '/team': 'Team Management',
  '/settings': 'Settings',
}

function LiveClock() {
  const [time, setTime] = useState(clockTime())
  useEffect(() => {
    const iv = setInterval(() => setTime(clockTime()), 1000)
    return () => clearInterval(iv)
  }, [])
  return (
    <span className="tabular hidden items-center gap-2 rounded-lg border border-line bg-elevated px-2.5 py-1.5 font-mono text-[12px] text-ink2 lg:flex" title="Workspace local time">
      <span className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-success" />
      {time}
    </span>
  )
}

function useClickOutside(onOut: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOut()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onOut])
  return ref
}

function ThemeToggle() {
  const { mode, toggle } = useTheme()
  return (
    <button
      className="btn-ghost h-9 w-9 overflow-hidden p-0"
      onClick={toggle}
      aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="relative block h-[18px] w-[18px]">
        <Sun
          className={`absolute inset-0 h-[18px] w-[18px] transition-all duration-300 ${
            mode === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0'
          }`}
        />
        <Moon
          className={`absolute inset-0 h-[18px] w-[18px] transition-all duration-300 ${
            mode === 'light' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
          }`}
        />
      </span>
    </button>
  )
}

export default function TopNavigation({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const location = useLocation()
  const { toast } = useToast()
  const { state, markRead } = useWorkspace()
  const title = ROUTES[location.pathname] ?? 'Overview'
  const unread = state.feed.filter((f) => !f.read).length

  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const notifRef = useClickOutside(() => setNotifOpen(false))
  const userRef = useClickOutside(() => setUserOpen(false))

  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line px-4 lg:px-8">
      <button
        className="btn-ghost h-9 w-9 p-0 lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs */}
      <nav className="hidden min-w-0 items-center gap-1.5 text-tiny text-ink3 sm:flex" aria-label="Breadcrumb">
        <Link to="/" className="shrink-0 transition-colors hover:text-ink2">
          CreativeTrust AI
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-ink3/60" />
        <span className="truncate font-medium text-ink2">{title}</span>
      </nav>

      {/* Page title on mid screens */}
      <h1 className="truncate text-[15px] font-semibold text-ink sm:hidden">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <form
          className="relative hidden md:block"
          onSubmit={(e) => {
            e.preventDefault()
            if (query.trim()) {
              toast('info', `Searching for “${query.trim()}”`, 'Search is connected to your workspace index.')
              setQuery('')
            }
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets, reporters…"
            className="input-base w-64 pl-9 pr-16"
            aria-label="Search workspace"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px] text-ink3">
            ⌘K
          </kbd>
        </form>

        <LiveClock />

        <ThemeToggle />

        <Link to="/analyze" className="btn-primary btn-sm hidden lg:inline-flex">
          <ScanSearch className="h-4 w-4" />
          New Verification
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            className="btn-ghost relative h-9 w-9 p-0"
            onClick={() => {
              setNotifOpen((v) => !v)
              setUserOpen(false)
            }}
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="tabular absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white ring-2 ring-base">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="animate-popIn absolute right-0 top-full z-40 mt-2 w-[320px] rounded-xl border border-line bg-elevated shadow-pop">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-[13px] font-semibold text-ink">Live Notifications</span>
                <button
                  className="text-tiny text-ink3 transition-colors hover:text-ink disabled:cursor-not-allowed"
                  disabled={unread === 0}
                  onClick={() => {
                    markRead()
                    toast('success', 'All notifications marked as read')
                  }}
                >
                  Mark all read
                </button>
              </div>
              <ul className="max-h-80 divide-y divide-line overflow-y-auto scroll-thin">
                {state.feed.length === 0 ? (
                  <li className="px-4 py-8 text-center text-tiny text-ink3">
                    Workspace is quiet — new activity will appear here in real time.
                  </li>
                ) : (
                  state.feed.slice(0, 8).map((n) => {
                    const meta = FEED_ICONS[n.kind]
                    return (
                      <li key={n.id}>
                        <button
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-elevated2 ${n.read ? 'opacity-70' : ''}`}
                          onClick={() => markRead()}
                        >
                          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}>
                            <meta.icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-medium text-ink">{n.message}</span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-micro text-ink3">
                              {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                              {relTime(n.ts)}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          )}
        </div>

        {/* User */}
        <div className="relative" ref={userRef}>
          <button
            className="flex items-center gap-2 rounded-lg p-1 pr-1.5 transition-colors hover:bg-elevated"
            onClick={() => {
              setUserOpen((v) => !v)
              setNotifOpen(false)
            }}
            aria-label="Account menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated2 text-tiny font-semibold text-ink ring-1 ring-line">
              {CURRENT_USER.initials}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-ink3 sm:block" />
          </button>
          {userOpen && (
            <div className="animate-popIn absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-line bg-elevated p-1.5 shadow-pop">
              <div className="border-b border-line px-3 py-2.5">
                <p className="text-[13px] font-semibold text-ink">{CURRENT_USER.name}</p>
                <p className="truncate text-micro text-ink3">{CURRENT_USER.email}</p>
              </div>
              <div className="p-1">
                <Link
                  to="/settings"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-ink2 transition-colors hover:bg-elevated2 hover:text-ink"
                >
                  <CircleUserRound className="h-4 w-4" /> Profile & preferences
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-ink2 transition-colors hover:bg-elevated2 hover:text-ink"
                >
                  <KeyRound className="h-4 w-4" /> API keys
                </Link>
                <button
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-ink2 transition-colors hover:bg-elevated2 hover:text-ink"
                  onClick={() => {
                    setUserOpen(false)
                    toast('info', 'Session ended (demo)', 'This is a conceptual prototype — sign-out is simulated.')
                  }}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
