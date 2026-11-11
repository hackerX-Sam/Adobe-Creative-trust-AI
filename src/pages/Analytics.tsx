import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts'
import { Activity } from 'lucide-react'
import AnalyticsChartCard, { ChartTooltip } from '../components/AnalyticsChartCard'
import { WEEKLY_SCANS, RISK_TREND, PIPELINE_LOAD } from '../lib/data'
import { useWorkspace } from '../lib/store'
import { useTheme } from '../components/ThemeProvider'
import { RiskBadge, FileChip } from '../components/RiskBadge'

const SERVICE_COLORS: Record<string, string> = {
  Imaging: '#FF3B30',
  Video: '#FF6A00',
  Audio: '#F5B942',
  Docs: '#A1A1AA',
  Registry: '#32D583',
}

export default function Analytics() {
  const { state } = useWorkspace()
  const { palette } = useTheme()
  const scored = state.records.filter((r) => r.trustScore > 0)
  const avgTrust = Math.round(scored.reduce((s, r) => s + r.trustScore, 0) / (scored.length || 1))

  const radial = [{ name: 'Automation', value: 68, fill: '#FF3B30' }]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-page font-semibold text-ink">Analytics</h1>
        <p className="mt-1 text-body text-ink2">
          Operational intelligence for verification volume, automation and service health.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AnalyticsChartCard title="Weekly Scan Volume" subtitle="Manual investigator scans vs. automated pipeline scans">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_SCANS} margin={{ top: 6, right: 8, bottom: 0, left: -18 }} barGap={2}>
                  <CartesianGrid vertical={false} stroke={palette.grid} strokeDasharray="3 6" />
                  <XAxis dataKey="day" tick={{ fill: palette.tick, fontSize: 10 }} tickLine={false} axisLine={{ stroke: palette.axis }} />
                  <YAxis tick={{ fill: palette.tick, fontSize: 10 }} tickLine={false} axisLine={false} width={52} />
                  <ChartTooltip />
                  <Bar dataKey="scans" name="All scans" fill="#FF3B30" radius={[3, 3, 0, 0]} maxBarSize={22} animationDuration={700} />
                  <Bar dataKey="automated" name="Automated" fill="#FF6A00" radius={[3, 3, 0, 0]} maxBarSize={22} animationDuration={900} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsChartCard>
        </div>

        <AnalyticsChartCard title="Pipeline Automation" subtitle="Share of scans resolved without human touch">
          <div className="flex h-[260px] flex-col items-center">
            <div className="relative h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="66%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: palette.radialTrack }} animationDuration={900} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="tabular text-metric font-semibold text-ink">68%</p>
                <p className="text-micro text-ink3">automated</p>
              </div>
            </div>
            <p className="mt-2 border-t border-line pt-3 text-center text-micro text-ink3">
              Target: 75% by end of quarter · +4.2pts vs. last month
            </p>
          </div>
        </AnalyticsChartCard>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AnalyticsChartCard title="Suspicious-Content Trend" subtitle="Share of assets scored below trust threshold">
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={RISK_TREND} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
                  <CartesianGrid vertical={false} stroke={palette.grid} strokeDasharray="3 6" />
                  <XAxis dataKey="month" tick={{ fill: palette.tick, fontSize: 10 }} tickLine={false} axisLine={{ stroke: palette.axis }} />
                  <YAxis unit="%" tick={{ fill: palette.tick, fontSize: 10 }} tickLine={false} axisLine={false} width={46} domain={[0, 30]} />
                  <ChartTooltip formatter={(_v: number) => [`${_v}%`, 'Below threshold']} />
                  <Line type="monotone" dataKey="risk" stroke="#F5B942" strokeWidth={2.5} dot={{ r: 3, fill: '#F5B942', stroke: palette.sectorStroke }} activeDot={{ r: 4 }} animationDuration={800} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsChartCard>
        </div>

        <AnalyticsChartCard title="Service Load" subtitle="Pipeline utilization by service">
          <ul className="flex h-[230px] flex-col justify-around">
            {PIPELINE_LOAD.map((s) => (
              <li key={s.service}>
                <div className="mb-1.5 flex items-center justify-between text-tiny">
                  <span className="text-ink2">{s.service}</span>
                  <span className="tabular font-medium text-ink2">{s.cpu}%</span>
                </div>
                <div className="h-[7px] overflow-hidden rounded-full bg-base">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.cpu}%`, background: SERVICE_COLORS[s.service], opacity: 0.85 }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </AnalyticsChartCard>
      </section>

      {/* Top risky assets */}
      <AnalyticsChartCard title="Highest-Risk Recent Assets" subtitle="Lowest trust scores in the last 30 days" minBodyHeight={0}>
        <ul className="divide-y divide-line/70">
          {scored
            .sort((a, b) => a.trustScore - b.trustScore)
            .slice(0, 5)
            .map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0.5">
                <div className="flex items-center gap-3 md:w-48 md:shrink-0">
                  <FileChip type={r.fileType} />
                  <span className="truncate text-[13px] font-medium text-ink" title={r.asset}>{r.asset}</span>
                </div>
                <div className="ml-auto flex items-center gap-4">
                  <div className="tabular text-[13px] font-semibold text-danger">{r.trustScore}/100</div>
                  <RiskBadge risk={r.risk} size="sm" />
                  <span className="hidden text-micro text-ink3 sm:block">{r.id}</span>
                </div>
              </li>
            ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-micro text-ink3">
          <span>Average trust score (recent set): <span className="font-semibold text-ink2">{avgTrust}/100</span></span>
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-accent" />
            recomputes on every analysis run
          </span>
        </div>
      </AnalyticsChartCard>
    </div>
  )
}
