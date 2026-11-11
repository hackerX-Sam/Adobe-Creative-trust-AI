import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Sparkline from './Sparkline'
import { fmtNum } from '../lib/types'

export interface MetricDef {
  title: string
  display: string
  icon: LucideIcon
  iconTone: string
  change: number | null
  spark: number[]
  sparkColor: string
  note: string
}

export default function DashboardMetricCard({ title, display, icon: Icon, iconTone, change, spark, sparkColor, note }: MetricDef) {
  const up = change !== null && change >= 0
  return (
    <article className="card hover-lift group p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-card-title font-medium text-ink2">{title}</p>
          <p className="tabular mt-2.5 text-metric font-semibold text-ink">{display}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line ${iconTone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {change !== null ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-micro font-semibold ${
                up ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}
            >
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {up ? '+' : ''}
              {change}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-micro font-semibold text-ink3">
              <Minus className="h-3 w-3" />
              Baseline
            </span>
          )}
          <p className="mt-1.5 truncate text-micro text-ink3">{note}</p>
        </div>
        <div className="shrink-0 opacity-90 transition-opacity group-hover:opacity-100">
          <Sparkline data={spark} color={sparkColor} width={92} height={30} />
        </div>
      </div>
    </article>
  )
}

// Convenience: format big numbers.
export function metricDisplay(value: number): string {
  return value >= 1000 ? fmtNum(value) : String(value)
}
