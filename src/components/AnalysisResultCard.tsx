import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'

export type FindingTone = 'positive' | 'uncertain' | 'suspicious' | 'neutral'

const TONE_STYLES: Record<FindingTone, { badge: string; icon: string; bar: string }> = {
  positive: { badge: 'bg-success/10 text-success border-success/25', icon: 'text-success', bar: 'bg-success' },
  uncertain: { badge: 'bg-warning/10 text-warning border-warning/25', icon: 'text-warning', bar: 'bg-warning' },
  suspicious: { badge: 'bg-danger/10 text-danger border-danger/25', icon: 'text-danger', bar: 'bg-danger' },
  neutral: { badge: 'bg-white/[0.06] text-ink2 border-line', icon: 'text-ink3', bar: 'bg-ink3' },
}

export interface AnalysisBar {
  label: string
  value: number // 0-100
}

export interface AnalysisDetailRow {
  key: string
  value: string
  mono?: boolean
}

export default function AnalysisResultCard({
  icon: Icon,
  title,
  tone,
  badge,
  summary,
  bars,
  details,
  footnote,
  defaultOpen = false,
}: {
  icon: LucideIcon
  title: string
  tone: FindingTone
  badge: string
  summary: string
  bars?: AnalysisBar[]
  details: AnalysisDetailRow[]
  footnote?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const t = TONE_STYLES[tone]

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card transition-colors hover:border-lineBright">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated ${t.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
              <span className={`rounded-full border px-2 py-px text-micro font-medium ${t.badge}`}>{badge}</span>
            </div>
            <p className="mt-1.5 text-tiny leading-relaxed text-ink2">{summary}</p>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="btn-ghost h-7 w-7 shrink-0 p-0"
            aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${title} details`}
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {bars && bars.length > 0 && (
          <div className="mt-3.5 space-y-2">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="mb-1 flex items-center justify-between text-micro">
                  <span className="text-ink2">{b.label}</span>
                  <span className="tabular font-medium text-ink3">{b.value}%</span>
                </div>
                <div className="h-[5px] overflow-hidden rounded-full bg-base">
                  <div
                    className={`h-full rounded-full ${t.bar} transition-all duration-700 ease-out`}
                    style={{ width: `${b.value}%`, opacity: 0.85 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="animate-fadeIn border-t border-line bg-elevated/60 px-4 py-3.5">
          <dl className="space-y-1.5">
            {details.map((d) => (
              <div key={d.key} className="flex items-baseline justify-between gap-4 text-tiny">
                <dt className="shrink-0 text-ink3">{d.key}</dt>
                <dd className={`truncate text-right ${d.mono ? 'font-mono text-[11px]' : ''} text-ink2`} title={d.value}>
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
          {footnote && (
            <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-micro leading-relaxed text-ink3">
              <span className="text-ink3">ⓘ</span>
              {footnote}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
