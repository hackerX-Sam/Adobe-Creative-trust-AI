import { useState } from 'react'
import { FileText, Download, Plus, MoreHorizontal } from 'lucide-react'
import AnalyticsChartCard from '../components/AnalyticsChartCard'
import ConfirmationModal from '../components/ConfirmationModal'
import { useToast } from '../components/ToastProvider'
import { EmptyState } from '../components/EmptyState'
import { fmtDate } from '../lib/types'
import { useWorkspace } from '../lib/store'
import type { Report } from '../lib/store'

export default function Reports() {
  const { toast } = useToast()
  const [modal, setModal] = useState<{ gen: boolean; del?: Report; scope?: boolean } | null>(null)
  const { state, addReport, removeReport } = useWorkspace()
  const reports = state.reports

  const generate = () => {
    const name = `Weekly Integrity Report — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    addReport({ name, scope: 'Brand Studio' })
    toast('info', 'Report generation started', `${name} — the server will mark it Ready in a few seconds.`)
    setModal(null)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-ink">Reports</h1>
          <p className="mt-1 text-body text-ink2">
            Scheduled and on-demand integrity reporting for stakeholders and compliance.
          </p>
        </div>
        <button className="btn-primary btn-md" onClick={() => setModal({ gen: true })}>
          <Plus className="h-4 w-4" />
          Generate Report
        </button>
      </header>

      <AnalyticsChartCard title="Report Library" subtitle="Generated artifacts available for export" minBodyHeight={0}>
        {reports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports yet" description="Generate your first workspace integrity report to get started." />
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-line text-micro font-semibold uppercase tracking-[0.07em] text-ink3">
                  <th className="px-3 py-2.5">Report</th>
                  <th className="px-3 py-2.5">Scope</th>
                  <th className="px-3 py-2.5">Created</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Size</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {reports.map((r) => (
                  <tr key={r.id} className="group transition-colors hover:bg-elevated2/60">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-dim text-accent">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-ink">{r.name}</p>
                          <p className="font-mono text-micro text-ink3">{r.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-ink2">{r.scope}</td>
                    <td className="tabular px-3 py-3 text-[13px] text-ink2">{fmtDate(r.created)}</td>
                    <td className="px-3 py-3">
                      {r.status === 'Ready' ? (
                        <span className="rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 text-tiny font-medium text-success">Ready</span>
                      ) : r.status === 'Generating' ? (
                        <span className="flex items-center gap-2 text-tiny text-[#6FB2F5]">
                          <span className="h-3 w-3 animate-dashRotate rounded-full border-2 border-[#6FB2F5]/30 border-t-[#6FB2F5]" />
                          Generating
                        </span>
                      ) : (
                        <span className="rounded-full border border-line bg-white/[0.06] px-2.5 py-0.5 text-tiny text-ink2">Scheduled</span>
                      )}
                    </td>
                    <td className="tabular px-3 py-3 font-mono text-[12px] text-ink2">{r.size}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn-ghost btn-sm h-7 px-2"
                          disabled={r.status !== 'Ready'}
                          onClick={() => toast('success', 'Download started', `${r.name} · PDF`)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="btn-ghost btn-sm h-7 w-7 p-0"
                          onClick={() => setModal({ gen: false, del: r })}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AnalyticsChartCard>

      {/* Scheduled digests */}
      <section className="card p-5">
        <h2 className="text-section font-semibold text-ink">Scheduled Digests</h2>
        <p className="mt-0.5 text-tiny text-ink3">Recurring summaries delivered on a fixed cadence.</p>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { name: 'Monday Morning Digest', cadence: 'Weekly · Mon 08:00', owner: 'Integrity team' },
            { name: 'Flagged-Asset Escalation', cadence: 'Real-time', owner: 'Analysts' },
            { name: 'Compliance Quarterly Pack', cadence: 'Quarterly · 1st', owner: 'Legal & Compliance' },
          ].map((d) => (
            <li key={d.name} className="rounded-xl border border-line bg-elevated p-4 transition-all hover:border-lineBright">
              <p className="text-body font-medium text-ink">{d.name}</p>
              <p className="mt-1 text-tiny text-ink2">{d.cadence}</p>
              <p className="mt-2.5 border-t border-line pt-2.5 text-micro text-ink3">Owner: {d.owner}</p>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmationModal
        open={!!modal?.gen}
        onClose={() => setModal(null)}
        onConfirm={generate}
        title="Generate workspace report?"
        description="A new integrity report will be compiled from the latest verification data in Brand Studio."
        confirmLabel="Generate"
        tone="accent"
      />
      <ConfirmationModal
        open={!!modal?.del}
        onClose={() => setModal(null)}
        onConfirm={() => {
          if (modal?.del) {
            removeReport(modal.del.id)
            toast('success', 'Report removed', modal.del.id)
          }
        }}
        title="Remove this report?"
        description="The generated artifact and its metadata will be removed from the report library."
        confirmLabel="Remove"
      />
    </div>
  )
}
