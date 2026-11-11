import type { ReactNode } from 'react'

/** Consistent shell for Recharts cards: title row + legend slot + chart body. */
export default function AnalyticsChartCard({
  title,
  subtitle,
  headerRight,
  children,
  minBodyHeight = 280,
}: {
  title: string
  subtitle?: string
  headerRight?: ReactNode
  children: ReactNode
  minBodyHeight?: number
}) {
  return (
    <section className="card hover-lift flex flex-col p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-section font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-tiny text-ink3">{subtitle}</p>}
        </div>
        {headerRight && <div className="flex shrink-0 items-center gap-2">{headerRight}</div>}
      </header>
      <div className="mt-5 w-full" style={{ minHeight: minBodyHeight }}>
        {children}
      </div>
    </section>
  )
}

/** Shared custom Recharts tooltip styled to the design system. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number | string; color?: string; colorKey?: unknown }>
  label?: string | number
  formatter?: (_num: number, _series: string) => [string, string]
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="chart-tip rounded-lg border border-line px-3 py-2.5 shadow-pop backdrop-blur-sm">
      {label !== undefined && (
        <p className="mb-1.5 text-micro font-semibold uppercase tracking-wide text-ink3">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => {
          const value = typeof p.value === 'number' ? p.value : Number(p.value ?? 0)
          const [display, name] =
            formatter && p.name ? formatter(value, p.name) : [String(value), p.name ?? '']
          return (
            <div key={i} className="flex items-center gap-2 text-tiny">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              <span className="text-ink2">{name}</span>
              <span className="tabular ml-auto pl-4 font-semibold text-ink">{display}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
