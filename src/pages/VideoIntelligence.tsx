import { Clapperboard, ScanLine, TriangleAlert, ShieldCheck, Play, Download, Flag, Search } from 'lucide-react'
import AnalyticsChartCard from '../components/AnalyticsChartCard'
import { useToast } from '../components/ToastProvider'
import { StatusBadge } from '../components/RiskBadge'
import { useWorkspace } from '../lib/store'
import { apiQueueVerification } from '../lib/api'

type SegmentTone = 'ok' | 'warn' | 'bad'

const TONE_BG: Record<SegmentTone, string> = {
  ok: 'bg-success',
  warn: 'bg-warning',
  bad: 'bg-danger',
}

const SEGMENTS: { tone: SegmentTone; start: number; width: number }[] = [
  { tone: 'ok', start: 0, width: 18 },
  { tone: 'ok', start: 18.4, width: 22 },
  { tone: 'warn', start: 40.8, width: 8 },
  { tone: 'ok', start: 49.2, width: 15 },
  { tone: 'bad', start: 64.6, width: 12 },
  { tone: 'ok', start: 77, width: 10.5 },
  { tone: 'warn', start: 87.9, width: 5 },
  { tone: 'ok', start: 93.3, width: 6.7 },
]

const FINDINGS: { t: string; frame: number; severity: string; note: string; status: 'Verified' | 'Flagged' | 'In Review'; tone: 'ok' | 'warn' | 'bad' }[] = [
  { t: '00:41', frame: 1024, severity: 'Moderate', note: 'Frame cadence anomaly — re-timed segment detected.', status: 'In Review', tone: 'warn' },
  { t: '01:04', frame: 1616, severity: 'High', note: 'Face region rejects camera-derived PRNU pattern.', status: 'Flagged', tone: 'bad' },
  { t: '01:32', frame: 2300, severity: 'Moderate', note: 'Sustained diffusion-suspect frequency texture.', status: 'In Review', tone: 'warn' },
  { t: '02:13', frame: 3325, severity: 'Low', note: 'Minor watermark compression near lower third.', status: 'Verified', tone: 'ok' },
]

export default function VideoIntelligence() {
  const { toast } = useToast()
  const { state } = useWorkspace()

  // a real queue action: creates a 'Processing' record that the server completes a few seconds later
  const queueFullScan = async () => {
    try {
      await apiQueueVerification('press-conference_wide.mp4', 'MP4', '486 MB', 'Marcus Lee')
      toast('info', 'Scan queued', 'Full-frame scan queued on the video pipeline — watch Verification History.')
    } catch {
      toast('error', 'Queue failed', 'The pipeline is unreachable right now.')
    }
  }
  const queued = state.records.filter((r) => r.status === 'Processing').length

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-ink">Video Intelligence</h1>
          <p className="mt-1 text-body text-ink2">
            Scene-level integrity timeline, face-region forensics and generative-video detection.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button className="btn-secondary btn-md" onClick={() => toast('info', 'Demo asset loaded', 'press-conference_wide.mp4 loaded into the timeline.')}>
            <Play className="h-4 w-4" />
            Load Demo Asset
          </button>
          <button className="btn-primary btn-md" onClick={queueFullScan}>
            <ScanLine className="h-4 w-4" />
            Queue Full Scan{queued > 0 ? ` (${queued} in queue)` : ''}
          </button>
        </div>
      </header>

      {/* Stat strip */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Scenes analyzed', value: '142', icon: Clapperboard, tone: 'text-ink2' },
          { label: 'Frames sampled', value: '3,940', icon: Search, tone: 'text-ink2' },
          { label: 'Consistent segments', value: '5 of 8', icon: ShieldCheck, tone: 'text-success' },
          { label: 'Integrity alerts', value: '3', icon: TriangleAlert, tone: 'text-warning' },
        ].map((s) => (
          <div key={s.label} className="card hover-lift p-4">
            <div className="flex items-center justify-between">
              <p className="text-card-title font-medium text-ink2">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.tone}`} />
            </div>
            <p className="tabular mt-2 text-metric font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </section>

      {/* Timeline */}
      <AnalyticsChartCard
        title="Integrity Timeline"
        subtitle="press-conference_wide.mp4 · 02:24 · segment-level consensus"
        headerRight={<span className="font-mono text-micro text-ink3">PRNU · C2PA · CG-detect</span>}
      >
        <div className="select-none">
          <div className="relative h-9 overflow-hidden rounded-lg border border-line bg-base">
            {SEGMENTS.map((s, i) => (
              <div
                key={i}
                className={`absolute top-0 h-full ${TONE_BG[s.tone]} first:rounded-l-md last:rounded-r-md`}
                style={{
                  left: `${s.start}%`,
                  width: `calc(${s.width}% - 2px)`,
                  opacity: s.tone === 'ok' ? 0.75 : 0.95,
                  margin: '2px 0',
                }}
                title={`${s.start.toFixed(0)}% → ${(s.start + s.width).toFixed(0)}%`}
              />
            ))}
            <div className="absolute left-[46%] top-0 h-full w-px bg-white/30" />
            <div className="absolute left-[46%] top-[calc(100%+2px)] font-mono text-micro text-ink3">01:04 · playhead</div>
          </div>
          <div className="mt-6 flex justify-between font-mono text-micro text-ink3">
            {['00:00', '00:30', '01:00', '01:30', '02:00', '02:24'].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 border-t border-line pt-3.5 text-micro text-ink2">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Consistent</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Partial deviation</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Corrupted / re-generated</span>
          </div>
        </div>
      </AnalyticsChartCard>

      {/* Findings table */}
      <section className="card overflow-hidden">
        <header className="flex items-center justify-between border-b border-line p-4">
          <div>
            <h2 className="text-section font-semibold text-ink">Segment Findings</h2>
            <p className="mt-0.5 text-tiny text-ink3">Timestamped anomalies from the current scan</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost btn-sm" onClick={() => toast('success', 'Findings exported', 'CSV downloaded for press-conference_wide.mp4.')}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button className="btn-secondary btn-sm" onClick={() => toast('warning', 'Escalated', 'Findings were added to your review queue.')}>
              <Flag className="h-3.5 w-3.5" />
              Escalate
            </button>
          </div>
        </header>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-line text-micro font-semibold uppercase tracking-[0.07em] text-ink3">
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Frame</th>
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5">Finding</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {FINDINGS.map((f) => (
                <tr key={f.t} className="transition-colors hover:bg-elevated2/60">
                  <td className="px-4 py-3 font-mono text-[13px] font-medium text-ink">{f.t}</td>
                  <td className="tabular px-4 py-3 font-mono text-[12px] text-ink2">{f.frame}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-tiny font-medium ${
                        f.tone === 'bad'
                          ? 'border-danger/25 bg-danger/10 text-danger'
                          : f.tone === 'warn'
                            ? 'border-warning/25 bg-warning/10 text-warning'
                            : 'border-success/25 bg-success/10 text-success'
                      }`}
                    >
                      {f.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-ink2">{f.note}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={f.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
