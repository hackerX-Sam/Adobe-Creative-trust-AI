import type { RiskLevel, AnalysisStatus } from '../lib/types'

// ─── Risk badge ───────────────────────────────────────────────────────────────

const RISK_STYLES: Record<RiskLevel, string> = {
  Authentic: 'bg-success/10 text-success border-success/25',
  Low: 'bg-success/10 text-success border-success/25',
  Moderate: 'bg-warning/10 text-warning border-warning/25',
  High: 'bg-danger/10 text-danger border-danger/25',
  Critical: 'bg-danger/15 text-danger border-danger/40',
}

export function RiskBadge({ risk, size = 'md' }: { risk: RiskLevel; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${RISK_STYLES[risk]} ${
        size === 'sm' ? 'px-2 py-px text-micro' : 'px-2.5 py-0.5 text-tiny'
      }`}
    >
      <span className="h-1 w-1 rounded-full bg-current opacity-80" />
      {risk}
    </span>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<AnalysisStatus, string> = {
  Verified: 'bg-success/10 text-success border-success/25',
  Flagged: 'bg-danger/10 text-danger border-danger/25',
  'In Review': 'bg-warning/10 text-warning border-warning/25',
  Processing: 'bg-[#6FB2F5]/10 text-[#6FB2F5] border-[#6FB2F5]/25',
  Failed: 'bg-white/[0.06] text-ink2 border-line',
}

const STATUS_DOT: Record<AnalysisStatus, string> = {
  Verified: 'bg-success',
  Flagged: 'bg-danger',
  'In Review': 'bg-warning',
  Processing: 'bg-[#6FB2F5] animate-pulseSoft',
  Failed: 'bg-ink3',
}

export function StatusBadge({ status }: { status: AnalysisStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-tiny font-medium ${STATUS_STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {status}
    </span>
  )
}

// ─── File-type chip ───────────────────────────────────────────────────────────

export function FileChip({ type }: { type: string }) {
  return (
    <span className="inline-flex h-6 min-w-[3rem] items-center justify-center rounded-md border border-line bg-elevated px-1.5 font-mono text-[11px] font-medium uppercase text-ink2">
      {type}
    </span>
  )
}
