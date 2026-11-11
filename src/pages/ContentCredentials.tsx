import { BadgeCheck, ShieldCheck, ShieldAlert, ShieldX, Download, Copy, QrCode } from 'lucide-react'
import AnalyticsChartCard from '../components/AnalyticsChartCard'
import { useToast } from '../components/ToastProvider'
import { EmptyState } from '../components/EmptyState'
import { fmtDate } from '../lib/types'
import { useWorkspace } from '../lib/store'

const INTEGRITY_STYLES: Record<string, string> = {
  Valid: 'border-success/25 bg-success/10 text-success',
  'Tamper Detected': 'border-danger/25 bg-danger/10 text-danger',
  Removed: 'border-line bg-white/[0.06] text-ink2',
}

export default function ContentCredentials() {
  const { toast } = useToast()
  const { state } = useWorkspace()
  const credentials = state.credentials
  const valid = credentials.filter((c) => c.integrity === 'Valid').length
  const full = credentials.filter((c) => c.depth === 'Full').length

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-ink">Content Credentials</h1>
          <p className="mt-1 text-body text-ink2">
            C2PA provenance manifests attached to workspace assets — capture, edit and export history.
          </p>
        </div>
        <button className="btn-primary btn-md" onClick={() => toast('success', 'Manifests exported', 'All credential manifests packaged and signed for download.')}>
          <Download className="h-4 w-4" />
          Export Manifests
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Credentials on record', value: String(credentials.length), icon: BadgeCheck, tone: 'text-ink2' },
          { label: 'Chains valid', value: String(valid), icon: ShieldCheck, tone: 'text-success' },
          { label: 'Full provenance depth', value: String(full), icon: QrCode, tone: 'text-accent' },
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

      <AnalyticsChartCard title="Credential Registry" subtitle="Signed manifests ordered by last signing event" minBodyHeight={0}>
        {credentials.length === 0 ? (
          <EmptyState icon={BadgeCheck} title="No credentials on record" description="Credentials appear here as analysis runs discover C2PA manifests." />
        ) : (
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-line text-micro font-semibold uppercase tracking-[0.07em] text-ink3">
                <th className="px-3 py-2.5">ID</th>
                <th className="px-3 py-2.5">Asset</th>
                <th className="px-3 py-2.5">Issuer</th>
                <th className="px-3 py-2.5">Kind</th>
                <th className="px-3 py-2.5">Depth</th>
                <th className="px-3 py-2.5">Signed</th>
                <th className="px-3 py-2.5">Integrity</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {credentials.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-elevated2/60">
                  <td className="px-3 py-3 font-mono text-[12px] text-ink2">{c.id}</td>
                  <td className="px-3 py-3 text-[13px] font-medium text-ink">{c.asset}</td>
                  <td className="px-3 py-3 text-[13px] text-ink2">{c.issuer}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-md border border-line bg-elevated px-2 py-0.5 text-micro text-ink2">{c.kind}</span>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-ink2">{c.depth}</td>
                  <td className="tabular px-3 py-3 text-[13px] text-ink2">{fmtDate(c.signedAt)}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-tiny font-medium ${INTEGRITY_STYLES[c.integrity]}`}>
                      {c.integrity === 'Valid' ? <ShieldCheck className="h-3 w-3" /> : c.integrity === 'Tamper Detected' ? <ShieldAlert className="h-3 w-3" /> : <ShieldX className="h-3 w-3" />}
                      {c.integrity}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      className="btn-ghost btn-sm h-7 px-2"
                      title="Copy manifest URI"
                      onClick={() => {
                        navigator.clipboard?.writeText(`c2pa://registry.adobe-ct.ai/${c.id}`)
                          .then(() => toast('success', 'Manifest URI copied', `c2pa://registry.adobe-ct.ai/${c.id}`))
                          .catch(() => toast('info', 'Clipboard unavailable', 'Copy to clipboard was blocked by the browser.'))
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        <p className="mt-3 border-t border-line pt-3 text-micro text-ink3">
          Manifests follow the C2PA technical specification. “Partial” depth indicates a valid chain anchored at a later edit event.
        </p>
      </AnalyticsChartCard>
    </div>
  )
}
