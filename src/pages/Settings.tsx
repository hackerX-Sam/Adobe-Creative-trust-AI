import { useState } from 'react'
import {
  Settings as SettingsIcon,
  Shield,
  KeyRound,
  Copy,
  RefreshCw,
  Trash2,
  Save,
  RotateCcw,
} from 'lucide-react'
import AnalyticsChartCard from '../components/AnalyticsChartCard'
import ConfirmationModal from '../components/ConfirmationModal'
import { useToast } from '../components/ToastProvider'
import { useWorkspace } from '../lib/store'
import { useTheme } from '../components/ThemeProvider'
import { CURRENT_USER } from '../lib/data'

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (_v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-body font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-tiny text-ink2">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? 'bg-accent/80' : 'bg-elevated2 ring-1 ring-line'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: SettingsIcon },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'api', label: 'API Keys', icon: KeyRound },
] as const

type TabId = (typeof TABS)[number]['id']

export default function Settings() {
  const { toast } = useToast()
  const { state, resetWorkspace } = useWorkspace()
  const { mode, setMode } = useTheme()
  const [tab, setTab] = useState<TabId>('profile')
  const [confirmReset, setConfirmReset] = useState(false)

  const [name, setName] = useState(CURRENT_USER.name)
  const [autoScan, setAutoScan] = useState(true)
  const [strictMode, setStrictMode] = useState(false)
  const [digest, setDigest] = useState(true)
  const [publicRegistry, setPublicRegistry] = useState(false)
  const [mfa, setMfa] = useState(true)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-page font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-body text-ink2">Profile, security and workspace preferences.</p>
      </header>

      {/* Tabs */}
      <div className="inline-flex rounded-lg border border-line bg-elevated p-0.5" role="tablist" aria-label="Settings sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[13px] font-medium transition-all ${
              tab === t.id ? 'bg-accent-dim text-accent' : 'text-ink3 hover:text-ink2'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <AnalyticsChartCard title="Profile" subtitle="Identity visible to teammates" minBodyHeight={0}>
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-elevated2 text-xl font-semibold text-ink ring-1 ring-line">
                {CURRENT_USER.initials}
              </span>
              <div>
                <p className="text-body font-semibold text-ink">{CURRENT_USER.role}</p>
                <p className="text-tiny text-ink2">{CURRENT_USER.email}</p>
                <p className="mt-1 text-micro text-ink3">Workspace of record: Brand Studio · Enterprise plan</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 border-t border-line pt-4">
              <div>
                <label className="text-micro font-medium text-ink2" htmlFor="displayName">Display name</label>
                <input id="displayName" className="input-base mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-micro font-medium text-ink2" htmlFor="email">Work email</label>
                <input id="email" className="input-base mt-1.5 cursor-not-allowed opacity-60" value={CURRENT_USER.email} readOnly />
              </div>
              <button className="btn-primary btn-md mt-1" onClick={() => toast('success', 'Profile saved', 'Your display name has been updated.')}>
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </AnalyticsChartCard>

          <AnalyticsChartCard title="Analysis Preferences" subtitle="Defaults applied to new verification runs" minBodyHeight={0}>
            <div className="divide-y divide-line">
              <Toggle label="Auto-queue uploads" desc="Scan every imported asset on arrival" checked={autoScan} onChange={setAutoScan} />
              <Toggle label="Strict forensic mode" desc="Higher sensitivity, more manual review" checked={strictMode} onChange={setStrictMode} />
              <Toggle label="Weekly digest email" desc="Summary of flagged and verified assets" checked={digest} onChange={setDigest} />
              <Toggle label="Registry discoverability" desc="Allow fingerprints to be indexed by partner registries" checked={publicRegistry} onChange={setPublicRegistry} />
            </div>
          </AnalyticsChartCard>

          <AnalyticsChartCard title="Appearance & Localization" subtitle="Interface and reporting language" minBodyHeight={0}>
            <div className="space-y-3">
              <div>
                <p className="text-micro font-medium text-ink2">Interface theme</p>
                <div className="mt-2 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Interface theme">
                  <button
                    role="radio"
                    aria-checked={mode === 'dark'}
                    onClick={() => setMode('dark')}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      mode === 'dark' ? 'border-accent/60 bg-accent-dim ring-1 ring-accent/30' : 'border-line bg-elevated hover:border-lineBright'
                    }`}
                  >
                    <span
                      className="flex h-10 w-14 shrink-0 items-end justify-start gap-0.5 rounded-md border border-line p-1"
                      style={{ background: mode === 'dark' ? '#0B0B0D' : undefined }}
                    >
                      <span className="h-4 w-4 rounded-sm" style={{ background: mode === 'dark' ? '#17171C' : '#FFFFFF', border: mode === 'dark' ? 'none' : '1px solid #E4E4EA' }} />
                      <span className="h-2 w-2 rounded-sm" style={{ background: mode === 'dark' ? '#232329' : '#EBEBEE' }} />
                    </span>
                    <span>
                      <span className="block text-[13px] font-semibold text-ink">Dark</span>
                      <span className="block text-micro text-ink3">Graphite · default</span>
                    </span>
                  </button>
                  <button
                    role="radio"
                    aria-checked={mode === 'light'}
                    onClick={() => setMode('light')}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      mode === 'light' ? 'border-accent/60 bg-accent-dim ring-1 ring-accent/30' : 'border-line bg-elevated hover:border-lineBright'
                    }`}
                  >
                    <span
                      className="flex h-10 w-14 shrink-0 items-end justify-start gap-0.5 rounded-md border border-line p-1"
                      style={{ background: mode === 'light' ? '#FFFFFF' : undefined }}
                    >
                      <span className="h-4 w-4 rounded-sm" style={{ background: mode === 'light' ? '#FFFFFF' : '#17171C', border: mode === 'light' ? '1px solid #E4E4EA' : 'none' }} />
                      <span className="h-2 w-2 rounded-sm" style={{ background: mode === 'light' ? '#EBEBEE' : '#232329' }} />
                    </span>
                    <span>
                      <span className="block text-[13px] font-semibold text-ink">Light</span>
                      <span className="block text-micro text-ink3">Daylight · beta</span>
                    </span>
                  </button>
                </div>
                <p className="mt-2 text-micro text-ink3">Applied instantly and remembered across sessions. Prefer the sun/moon button in the top bar.</p>
              </div>
              <div>
                <label className="text-micro font-medium text-ink2" htmlFor="lang">Language</label>
                <select id="lang" className="select-base mt-1.5 w-full text-[13px]" value="English (US)" onChange={() => {}}>
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Deutsch</option>
                  <option>Français</option>
                  <option>日本語</option>
                </select>
              </div>
              <div>
                <label className="text-micro font-medium text-ink2" htmlFor="tz">Time zone</label>
                <select id="tz" className="select-base mt-1.5 w-full text-[13px]" value="UTC+04:00 — Gulf Standard" onChange={() => {}}>
                  <option>UTC+04:00 — Gulf Standard</option>
                  <option>UTC±00:00 — UTC</option>
                  <option>UTC-08:00 — Pacific Time</option>
                </select>
              </div>
            </div>
          </AnalyticsChartCard>
        </div>
      )}

      {tab === 'security' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AnalyticsChartCard title="Account Security" subtitle="Access-protection posture" minBodyHeight={0}>
            <div className="divide-y divide-line">
              <Toggle label="Multi-factor authentication" desc="TOTP app required for every sign-in" checked={mfa} onChange={(v) => { setMfa(v); toast(v ? 'success' : 'warning', v ? 'MFA enabled' : 'MFA disabled', v ? 'Authenticator confirmation was already on file.' : 'Workspace policy may override this for admins.') }} />
            </div>
            <ul className="mt-5 space-y-2.5 border-t border-line pt-4">
              {[
                { label: 'Last sign-in', value: 'Today, 09:12 · Abu Dhabi, AE' },
                { label: 'Session timeout', value: '30 minutes idle' },
                { label: 'Password rotation', value: 'Every 90 days (enterprise policy)' },
                { label: 'Active sessions', value: '2 devices' },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between text-tiny">
                  <span className="text-ink3">{row.label}</span>
                  <span className="font-medium text-ink2">{row.value}</span>
                </li>
              ))}
            </ul>
          </AnalyticsChartCard>

          <AnalyticsChartCard title="Danger Zone" subtitle="Irreversible workspace operations" minBodyHeight={0}>
            <div className="rounded-xl border border-danger/25 bg-danger/5 p-4">
              <p className="text-body font-semibold text-danger">Purge analysis cache</p>
              <p className="mt-1 text-tiny leading-relaxed text-ink2">
                Deletes cached ELA tiles, noise baselines and preview renders. Reports and verification history are retained.
              </p>
              <button
                className="btn-sm btn mt-3 bg-danger text-white hover:bg-[#FF6565]"
                onClick={() => toast('warning', 'Cache purge scheduled', 'Tile cache will be rebuilt on the next analysis run.')}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Purge Cache
              </button>
            </div>
            <div className="mt-3 rounded-xl border border-danger/25 bg-danger/5 p-4">
              <p className="text-body font-semibold text-danger">Reset demo workspace</p>
              <p className="mt-1 text-tiny leading-relaxed text-ink2">
                Clears all locally persisted state (records, team, reports, live counters) and re-seeds the workspace from scratch.
                The real-time engine keeps running.
              </p>
              <button className="btn-sm btn mt-3 bg-danger text-white hover:bg-[#FF6565]" onClick={() => setConfirmReset(true)}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Workspace Data
              </button>
            </div>
            <p className="mt-3 flex items-center justify-between border-t border-line pt-3 text-micro text-ink3">
              <span>Live engine status</span>
              <span className="flex items-center gap-1.5 font-medium text-success">
                <span className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-success" />
                streaming · {state.live.analyzed.toLocaleString('en-US')} assets analyzed
              </span>
            </p>
          </AnalyticsChartCard>
        </div>
      )}

      {tab === 'api' && (
        <AnalyticsChartCard title="API Keys" subtitle="Programmatic access to the verification API" minBodyHeight={0}>
          <ul className="space-y-2.5">
            {[
              { name: 'Production pipeline', key: 'ctai_prod_…47a1', created: '2026-09-02', lastUsed: '2 hours ago' },
              { name: 'Newsroom webhook', key: 'ctai_whc_…b288', created: '2026-10-05', lastUsed: '12 minutes ago' },
            ].map((k) => (
              <li key={k.name} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-elevated p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-dim text-accent">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="text-[13px] font-medium text-ink">{k.name}</p>
                  <p className="font-mono text-micro text-ink3">{k.key} · created {k.created}</p>
                </div>
                <span className="text-micro text-ink3">last used {k.lastUsed}</span>
                <button className="btn-ghost btn-sm h-7 px-2" onClick={() => navigator.clipboard?.writeText(k.key).catch(() => {})}>
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button className="btn-ghost btn-sm h-7 px-2" onClick={() => toast('info', 'Key revoked (demo)', `${k.name} would be rotated immediately in production.`)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-micro text-ink3">
            Keys are shown masked. Full secrets are never stored in plaintext by CreativeTrust.
          </p>
        </AnalyticsChartCard>
      )}

      <ConfirmationModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetWorkspace()
          toast('success', 'Workspace reset', 'All data re-seeded. The live engine continues streaming.')
        }}
        title="Reset workspace demo data?"
        description="All locally persisted state will be deleted and re-seeded. This cannot be undone."
        confirmLabel="Reset everything"
      />
    </div>
  )
}
