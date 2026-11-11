import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  ScanSearch,
  Aperture,
  Clapperboard,
  BadgeCheck,
  Fingerprint,
  History,
  BarChart3,
  FileText,
  Users,
  Settings,
  ChevronsUpDown,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { WORKSPACES, CURRENT_USER } from '../lib/data'

interface NavItem {
  label: string
  icon: LucideIcon
  to: string
  end?: boolean
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Workspace',
    items: [{ label: 'Overview', icon: LayoutDashboard, to: '/', end: true }],
  },
  {
    title: 'Analysis',
    items: [
      { label: 'Analyze Media', icon: ScanSearch, to: '/analyze' },
      { label: 'Image Forensics', icon: Aperture, to: '/image-forensics' },
      { label: 'Video Intelligence', icon: Clapperboard, to: '/video-intelligence' },
      { label: 'Content Credentials', icon: BadgeCheck, to: '/credentials' },
      { label: 'Asset Fingerprints', icon: Fingerprint, to: '/fingerprints' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Verification History', icon: History, to: '/history' },
      { label: 'Analytics', icon: BarChart3, to: '/analytics' },
      { label: 'Reports', icon: FileText, to: '/reports' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Team Management', icon: Users, to: '/team' },
      { label: 'Settings', icon: Settings, to: '/settings' },
    ],
  },
]

function BrandMark() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] border border-accent/25 bg-accent/10 shadow-card">
      <svg width="23" height="23" viewBox="0 0 32 32">
        <path d="M19 5.5h7.5v21zM12.5 5.5H5v21zM15.75 12.3l5.9 12.2h-3.9l-1.65-4.3a3.6 3.6 0 0 0-2.7 0l-1.65 4.3H9.85z" fill="#FF3B30" />
      </svg>
    </div>
  )
}

export default function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [wsOpen, setWsOpen] = useState(false)
  const [ws, setWs] = useState(WORKSPACES[0])

  return (
    <aside className="flex h-full w-[250px] shrink-0 flex-col border-r border-line bg-sidebar">
      {/* Brand */}
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-line px-4">
        <BrandMark />
        <div className="min-w-0">
          <p className="text-micro font-bold uppercase leading-[11px] tracking-[0.18em] text-ink3">
            Adobe
          </p>
          <p className="truncate text-[15.5px] font-semibold leading-5 tracking-[-0.01em] text-ink">
            CreativeTrust <span className="text-accent">AI</span>
          </p>
        </div>
      </div>

      {/* Workspace selector */}
      <div className="relative shrink-0 px-3 pt-3">
        <button
          onClick={() => setWsOpen((v) => !v)}
          className="group flex w-full items-center gap-2.5 rounded-lg border border-line bg-elevated px-2.5 py-2 text-left transition-colors hover:border-lineBright"
          aria-expanded={wsOpen}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-dim font-mono text-[11px] font-semibold text-accent">
            {ws.name.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium leading-4 text-ink">{ws.name}</span>
            <span className="block text-micro text-ink3">{ws.plan} · {ws.seats} seats</span>
          </span>
          <ChevronsUpDown className={`h-3.5 w-3.5 text-ink3 transition-transform duration-200 ${wsOpen ? 'rotate-180' : ''}`} />
        </button>

        {wsOpen && (
          <div className="animate-popIn absolute inset-x-3 top-full z-20 mt-1 rounded-lg border border-line bg-elevated p-1 shadow-pop">
            {WORKSPACES.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setWs(w)
                  setWsOpen(false)
                }}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
                  w.id === ws.id ? 'bg-base text-ink' : 'text-ink2 hover:bg-elevated2 hover:text-ink'
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-dim font-mono text-[11px] font-semibold text-accent">
                  {w.name.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{w.name}</span>
                  <span className="block text-micro text-ink3">{w.plan}</span>
                </span>
                {w.id === ws.id && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-4" aria-label="Primary">
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-5 last:mb-2">
            <p className="px-2 pb-2 text-micro font-semibold uppercase tracking-[0.09em] text-ink3">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-accent-dim text-ink'
                          : 'text-ink2 hover:bg-elevated hover:text-ink'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-full bg-accent transition-opacity duration-150 ${
                            isActive ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <item.icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive ? 'text-accent' : 'text-ink3 group-hover:text-ink2'
                          }`}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / storage + user */}
      <div className="shrink-0 border-t border-line p-3">
        <div className="mb-3 rounded-lg border border-line bg-elevated p-3">
          <div className="flex items-center justify-between text-micro">
            <span className="font-medium text-ink2">Scan credits</span>
            <span className="text-ink3">7,420 / 10k</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-base">
            <div className="h-full w-[74%] rounded-full bg-gradient-to-r from-accent to-accent2" />
          </div>
        </div>
        <Link
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-elevated"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-elevated2 text-tiny font-semibold text-ink ring-1 ring-line">
            {CURRENT_USER.initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium leading-4 text-ink">{CURRENT_USER.name}</span>
            <span className="block truncate text-micro text-ink3">{CURRENT_USER.role}</span>
          </span>
          <Settings className="h-3.5 w-3.5 text-ink3" />
        </Link>
      </div>
    </aside>
  )
}
