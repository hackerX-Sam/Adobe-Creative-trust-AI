import { useState } from 'react'
import { Fingerprint, Copy, Radar, GitCompareArrows, Link2 } from 'lucide-react'
import AnalyticsChartCard from '../components/AnalyticsChartCard'
import { useToast } from '../components/ToastProvider'
import { EmptyState } from '../components/EmptyState'
import { fmtDate } from '../lib/types'
import { useWorkspace } from '../lib/store'
import { apiSweep } from '../lib/api'

const simColor = (v: number) => (v >= 97 ? 'bg-danger' : v >= 90 ? 'bg-warning' : v === 0 ? 'bg-ink3' : 'bg-success')
const simLabel = (v: number, matches: number) => {
  if (v === 0) return 'No matches'
  if (matches === 0) return 'Unique in registry'
  return `${matches} similar asset${matches === 1 ? '' : 's'} in registry`
}

export default function AssetFingerprints() {
  const { toast } = useToast()
  const { state } = useWorkspace()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [sweeping, setSweeping] = useState(false)
  const fingerprints = state.fingerprints

  const clusters = fingerprints.filter((f) => f.matches > 0).length
  const externalReuse = fingerprints.reduce((sum, f) => sum + f.matches, 0)

  const runSweep = async () => {
    setSweeping(true)
    try {
      await apiSweep()
      toast('success', 'Fingerprint sweep complete', 'Duplicate digests re-counted across the registry.')
    } catch {
      toast('error', 'Sweep failed', 'The registry could not be re-counted — try again.')
    } finally {
      setSweeping(false)
    }
  }

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard?.writeText(value)
      toast('success', 'Copied', `${value}`)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1400)
    } catch {
      toast('info', 'Clipboard unavailable', 'Copy to clipboard was blocked by the browser.')
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-ink">Asset Fingerprints</h1>
          <p className="mt-1 text-body text-ink2">
            Perceptual and cryptographic fingerprints used to trace re-use, derivatives and reposts.
          </p>
        </div>
        <button className="btn-primary btn-md" onClick={runSweep} disabled={sweeping}>
          <Radar className={`h-4 w-4 ${sweeping ? 'animate-spin' : ''}`} />
          {sweeping ? 'Sweeping…' : 'Run Duplicate Sweep'}
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Active fingerprints', value: fingerprints.length.toLocaleString('en-US'), icon: Fingerprint, tone: 'text-accent' },
          { label: 'Near-duplicate clusters', value: String(clusters), icon: GitCompareArrows, tone: 'text-ink2' },
          { label: 'Duplicate matches found', value: String(externalReuse), icon: Link2, tone: 'text-warning' },
        ].map((s) => (
          <div key={s.label} className="card hover-lift flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated">
              <s.icon className={`h-5 w-5 ${s.tone}`} />
            </div>
            <div>
              <p className="text-card-title font-medium text-ink2">{s.label}</p>
              <p className="tabular mt-1 text-metric font-semibold text-ink">{s.value}</p>
            </div>
          </div>
        ))}
      </section>

      <AnalyticsChartCard title="Fingerprint Registry" subtitle="Perceptual hashes (pHash) with crypto footprints" minBodyHeight={0}>
        <div className="space-y-2.5">
          {fingerprints.length === 0 ? (
            <EmptyState icon={Fingerprint} title="No fingerprints yet" description="Fingerprints are registered automatically whenever analysis runs." />
          ) : fingerprints.map((f) => (
            <div key={f.id} className="rounded-xl border border-line bg-elevated p-4 transition-all hover:border-lineBright">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-dim text-accent">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">{f.asset}</p>
                    <p className="font-mono text-micro text-ink3">{f.id} · last seen {fmtDate(f.lastSeen)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-micro text-ink3">Similarity</p>
                    <p className="tabular text-[13px] font-semibold text-ink">{f.similarity.toFixed(1)}%</p>
                  </div>
                  <div className="w-24">
                    <div className="h-1.5 overflow-hidden rounded-full bg-base">
                      <div className={`h-full rounded-full ${simColor(f.similarity)}`} style={{ width: `${Math.max(3, f.similarity)}%` }} />
                    </div>
                    <p className="mt-1 truncate text-micro text-ink3">{simLabel(f.similarity, f.matches)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line pt-3 font-mono text-micro text-ink2">
                <span className="flex items-center gap-1.5">
                  pHash: <span className="text-ink">{f.phash}</span>
                  <button
                    className="p-0.5 text-ink3 transition-colors hover:text-ink"
                    onClick={() => copy(f.id + '-phash', f.phash)}
                    aria-label="Copy perceptual hash"
                  >
                    <Copy className={`h-3 w-3 ${copiedId === f.id + '-phash' ? 'text-success' : ''}`} />
                  </button>
                </span>
                <span className="flex items-center gap-1.5">
                  SHA-256: <span className="text-ink">{f.sha256}</span>
                  <button className="p-0.5 text-ink3 transition-colors hover:text-ink" onClick={() => copy(f.id + '-sha', f.sha256)} aria-label="Copy SHA-256 digest">
                    <Copy className={`h-3 w-3 ${copiedId === f.id + '-sha' ? 'text-success' : ''}`} />
                  </button>
                </span>
                <span className="ml-auto text-ink3">matches: <span className="text-ink">{f.matches}</span></span>
              </div>
            </div>
          ))}
        </div>
      </AnalyticsChartCard>
    </div>
  )
}
