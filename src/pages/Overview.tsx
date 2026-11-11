import { Link, useNavigate } from 'react-router-dom'
import {
  ScanSearch,
  Images,
  ShieldAlert,
  Sparkles,
  Download,
  ArrowUpRight,
  Activity,
  Radio,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import DashboardMetricCard from '../components/DashboardMetricCard'
import AnalyticsChartCard, { ChartTooltip } from '../components/AnalyticsChartCard'
import VerificationTable from '../components/VerificationTable'
import { useToast } from '../components/ToastProvider'
import { useWorkspace, relTime } from '../lib/store'
import { FEED_ICONS } from '../components/FeedIcons'
import { useTheme } from '../components/ThemeProvider'
import { CURRENT_USER } from '../lib/data'

type PieDatum = { name: string; value: number; color: string }

export default function Overview() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { state, derived } = useWorkspace()
  const { palette } = useTheme()
  const { live, spark, weekly, dist } = state
  const change = derived.changePct

  const metrics = [
    {
      title: 'Total Assets Analyzed',
      display: live.analyzed.toLocaleString('en-US'),
      icon: Images,
      iconTone: 'text-ink2 bg-elevated2/60',
      change: change.analyzed,
      spark: spark.analyzed,
      sparkColor: '#A1A1AA',
      note: 'live counter · pipeline active',
    },
    {
      title: 'Verified Assets',
      display: live.verified.toLocaleString('en-US'),
      icon: ShieldAlert,
      iconTone: 'text-success bg-success/10',
      change: change.verified,
      spark: spark.verified,
      sparkColor: '#32D583',
      note: 'share of all workspace assets',
    },
    {
      title: 'Suspicious Assets',
      display: live.suspicious.toLocaleString('en-US'),
      icon: ScanSearch,
      iconTone: 'text-danger bg-danger/10',
      change: change.suspicious,
      spark: spark.suspicious,
      sparkColor: '#FF3B30',
      note: 'flagged + awaiting decision',
    },
    {
      title: 'AI-Generated Assets',
      display: live.aiGenerated.toLocaleString('en-US'),
      icon: Sparkles,
      iconTone: 'text-warning bg-warning/10',
      change: change.aiGenerated,
      spark: spark.aiGenerated,
      sparkColor: '#F5B942',
      note: 'confirmed diffusion artifacts',
    },
  ]

  const totalDist = dist.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-ink">
            Welcome back, <span className="text-accent">{CURRENT_USER.firstName}</span>
          </h1>
          <p className="mt-1 text-body text-ink2">
            Monitor digital content integrity across your workspace.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            className="btn-secondary btn-md"
            onClick={() => toast('success', 'Report scheduled', 'A workspace integrity summary will be emailed to you.')}
          >
            <Download className="h-4 w-4" />
            Export Summary
          </button>
          <Link to="/analyze" className="btn-primary btn-md">
            <ScanSearch className="h-4 w-4" />
            New Verification
          </Link>
        </div>
      </header>

      {/* Metric cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace key metrics">
        {metrics.map((m) => (
          <DashboardMetricCard
            key={m.title}
            title={m.title}
            display={m.display}
            icon={m.icon}
            iconTone={m.iconTone}
            change={m.change}
            spark={m.spark}
            sparkColor={m.sparkColor}
            note={m.note}
          />
        ))}
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5" aria-label="Workspace analytics">
        <div className="xl:col-span-3">
          <AnalyticsChartCard
            title="Media Verification Activity"
            subtitle="Verified vs. flagged assets · trailing 12 weeks"
            headerRight={
              <span className="flex items-center gap-1.5 rounded-full border border-line bg-elevated px-2.5 py-1 text-micro text-ink2">
                <Activity className="h-3 w-3 text-accent" />
                Live
              </span>
            }
          >
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekly} margin={{ top: 6, right: 8, bottom: 0, left: -14 }}>
                  <defs>
                    <linearGradient id="gVerified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#32D583" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#32D583" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gFlagged" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF3B30" stopOpacity={0.30} />
                      <stop offset="100%" stopColor="#FF3B30" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={palette.grid} strokeDasharray="3 6" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: palette.tick, fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: palette.axis }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: palette.tick, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <ChartTooltip />
                  <Area
                    type="monotone"
                    dataKey="verified"
                    name="Verified"
                    stroke="#32D583"
                    strokeWidth={2}
                    fill="url(#gVerified)"
                    activeDot={{ r: 3.5, fill: '#32D583', stroke: palette.sectorStroke }}
                    animationDuration={900}
                  />
                  <Area
                    type="monotone"
                    dataKey="flagged"
                    name="Flagged"
                    stroke="#FF3B30"
                    strokeWidth={2}
                    fill="url(#gFlagged)"
                    activeDot={{ r: 3.5, fill: '#FF3B30', stroke: palette.sectorStroke }}
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-micro text-ink2">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Verified <span className="tabular ml-1 font-semibold text-ink">{weekly.reduce((s, w) => s + w.verified, 0).toLocaleString('en-US')}</span></span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Flagged <span className="tabular ml-1 font-semibold text-ink">{weekly.reduce((s, w) => s + w.flagged, 0).toLocaleString('en-US')}</span></span>
            </div>
          </AnalyticsChartCard>
        </div>

        <div className="xl:col-span-2">
          <AnalyticsChartCard
            title="Authenticity Distribution"
            subtitle="Findings across the live asset pool"
          >
            <div className="relative h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip />
                  <Pie
                    data={dist as PieDatum[]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={3}
                    cornerRadius={4}
                    stroke={palette.sectorStroke}
                    strokeWidth={2}
                    animationDuration={500}
                  >
                    {dist.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
                <p className="tabular text-metric font-semibold text-ink">
                  {totalDist > 0 ? ((dist[0].value / totalDist) * 100).toFixed(1) : '0'}%
                </p>
                <p className="text-micro text-ink3">authentic</p>
              </div>
            </div>
            <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3">
              {dist.map((d) => (
                <li key={d.name} className="flex items-center gap-2 text-micro text-ink2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
                  <span className="truncate">{d.name}</span>
                  <span className="tabular ml-auto font-semibold text-ink">{d.value}</span>
                </li>
              ))}
            </ul>
          </AnalyticsChartCard>
        </div>
      </section>

      {/* Recent table + live activity feed */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <VerificationTable records={state.records.slice(0, 14)} pageLimit={6} compact />
        </div>

        {/* Live activity feed */}
        <div className="card hover-lift flex min-w-0 flex-col">
          <header className="flex items-center justify-between border-b border-line p-4">
            <div>
              <h2 className="text-section font-semibold text-ink">Live Activity</h2>
              <p className="mt-0.5 text-tiny text-ink3">Streaming from the verification pipeline</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-micro font-semibold text-success">
              <span className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-success" />
              LIVE
            </span>
          </header>
          <ul className="scroll-thin max-h-[420px] flex-1 divide-y divide-line/70 overflow-y-auto">
            {state.feed.length === 0 ? (
              <li className="px-4 py-10 text-center">
                <Radio className="mx-auto h-5 w-5 text-ink3" />
                <p className="mt-2.5 text-tiny text-ink3">Listening for workspace events…</p>
              </li>
            ) : (
              state.feed.map((n) => {
                const meta = FEED_ICONS[n.kind]
                return (
                  <li key={n.id} className="animate-slideIn flex items-start gap-3 px-4 py-3">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}>
                      <meta.icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-snug text-ink">{n.message}</p>
                      <p className="mt-0.5 text-micro text-ink3">{relTime(n.ts)}</p>
                    </div>
                  </li>
                )
              })
            )}
          </ul>
          <footer className="border-t border-line px-4 py-2.5 text-micro text-ink3">
            Pipeline heartbeat every ~4s · {state.records.filter((r) => r.status === 'Processing').length} processing now
          </footer>
        </div>
      </section>

      {/* Browse CTA */}
      <div className="flex justify-center pb-2">
        <button className="btn-secondary btn-md" onClick={() => navigate('/history')}>
          View full verification history
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

