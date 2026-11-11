import { Link } from 'react-router-dom'
import {
  ScanSearch,
  Aperture,
  Layers,
  Grid3x3,
  Waves,
  Binary,
  Globe2,
  ArrowUpRight,
  CircleDot,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import ForensicHeatmap from '../components/ForensicHeatmap'
import AnalyticsChartCard from '../components/AnalyticsChartCard'
import { StatusBadge } from '../components/RiskBadge'
import { useToast } from '../components/ToastProvider'
import { useWorkspace } from '../lib/store'

const TOOLS: { icon: LucideIcon; name: string; desc: string; status: string; tone: 'success' | 'warning' | 'neutral' }[] = [
  { icon: Layers, name: 'Error-Level Analysis', desc: 'Re-compression deltas reveal spliced or overwritten regions.', status: 'GA', tone: 'success' },
  { icon: Waves, name: 'PRNU Noise Fingerprint', desc: 'Sensor-pattern correlation against reference devices.', status: 'GA', tone: 'success' },
  { icon: Grid3x3, name: 'Clone-Detection Grid', desc: 'Duplicate-region matching with affine tolerance.', status: 'GA', tone: 'success' },
  { icon: Binary, name: 'Double-JPEG Detection', desc: 'DCT history across prior compression generations.', status: 'Beta', tone: 'warning' },
  { icon: CircleDot, name: 'Shadow & Geometry Audit', desc: 'Lighting direction and vanishing-point consistency.', status: 'Beta', tone: 'warning' },
  { icon: Globe2, name: 'Reverse Provenance Search', desc: 'Earliest-known-appearance crawl across partner registries.', status: 'GA', tone: 'success' },
]

export default function ImageForensics() {
  const { toast } = useToast()
  const { state } = useWorkspace()

  // live sessions derived from the real verification registry (updates in real time)
  const sessions = state.records
    .filter((r) => r.status !== 'Verified' || r.trustScore >= 82)
    .slice(0, 4)
    .map((r) => ({
      id: r.id,
      asset: r.asset,
      tool: r.fileType === 'MP4' || r.fileType === 'MOV' ? 'Frame sampling' : r.trustScore >= 82 ? 'ELA + Clone-Grid' : 'ELA + PRNU',
      score: r.trustScore,
      status: r.status,
      date: r.analyzed,
    }))

  const demoRegions = [
    { x: 22, y: 18, w: 24, h: 20, intensity: 0.86 },
    { x: 58, y: 44, w: 18, h: 22, intensity: 0.55 },
    { x: 10, y: 62, w: 16, h: 14, intensity: 0.38 },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-ink">Image Forensics</h1>
          <p className="mt-1 text-body text-ink2">
            Dedicated forensic toolchain for tampering, splicing and sensor-level analysis.
          </p>
        </div>
        <Link to="/analyze" className="btn-primary btn-md">
          <ScanSearch className="h-4 w-4" />
          Open Analysis Workspace
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Tool catalog */}
        <div className="xl:col-span-2">
          <AnalyticsChartCard title="Forensic Capabilities" subtitle="Modules available to your workspace plan" minBodyHeight={0}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TOOLS.map((t) => (
                <div key={t.name} className="group rounded-xl border border-line bg-elevated p-4 transition-all hover:border-lineBright hover:bg-elevated2">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card ${t.tone === 'success' ? 'text-ink2' : 'text-warning'}`}>
                      <t.icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-micro font-medium ${
                        t.tone === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-warning/25 bg-warning/10 text-warning'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="mt-3 text-body font-medium text-ink">{t.name}</p>
                  <p className="mt-1 text-tiny leading-relaxed text-ink2">{t.desc}</p>
                </div>
              ))}
            </div>
          </AnalyticsChartCard>
        </div>

        {/* Heatmap demo */}
        <div className="space-y-4">
          <AnalyticsChartCard title="Region Inspector" subtitle="Output sample from session FX-5510" minBodyHeight={0}>
            <div className="stage relative flex h-52 items-center justify-center overflow-hidden rounded-lg border border-line">
              <Aperture className="h-9 w-9 text-ink3/60" />
              <span className="absolute bottom-2.5 left-2.5 rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-ink2">FX-5510 · ELA composite</span>
              {demoRegions.map((r, i) => (
                <div
                  key={i}
                  className="pointer-events-none absolute rounded"
                  style={{
                    left: `${r.x}%`,
                    top: `${r.y}%`,
                    width: `${r.w}%`,
                    height: `${r.h}%`,
                    border: `1.5px solid rgba(255,59,48,${r.intensity})`,
                    background: `radial-gradient(ellipse, rgba(255,59,48,${0.24 * r.intensity}), transparent 70%)`,
                  }}
                />
              ))}
            </div>
            <div className="mt-3">
              <ForensicHeatmap regions={demoRegions} />
            </div>
          </AnalyticsChartCard>
        </div>
      </div>

      {/* Sessions */}
      <section className="card overflow-hidden">
        <header className="flex items-center justify-between border-b border-line p-4">
          <div>
            <h2 className="text-section font-semibold text-ink">Recent Forensic Sessions</h2>
            <p className="mt-0.5 text-tiny text-ink3">Latest runs across the forensic module set</p>
          </div>
          <button
            className="btn-ghost btn-sm"
            onClick={() => toast('success', 'Sessions synced', 'Forensic session index is up to date.')}
          >
            Refresh
          </button>
        </header>
        <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-line text-micro font-semibold uppercase tracking-[0.07em] text-ink3">
                  <th className="px-4 py-2.5">Session</th>
                  <th className="px-4 py-2.5">Asset</th>
                  <th className="px-4 py-2.5">Modules</th>
                  <th className="px-4 py-2.5">Composite Score</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {sessions.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-elevated2/60">
                    <td className="px-4 py-3 font-mono text-[12px] text-ink2">{s.id}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-ink">{s.asset}</td>
                    <td className="px-4 py-3 text-[13px] text-ink2">{s.tool}</td>
                    <td className="tabular px-4 py-3 text-[13px] font-semibold text-ink">{s.score}/100</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/analyze" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-opacity hover:opacity-80">
                        Report <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        <p className="border-t border-line px-4 py-3 text-micro text-ink3">
          Sessions flow in live from the verification pipeline (SSE) — open the workspace in another tab and watch this table update.
        </p>
      </section>
    </div>
  )
}
