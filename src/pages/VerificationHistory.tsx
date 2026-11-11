import { History, FileClock, CircleCheck, ScanSearch } from 'lucide-react'
import VerificationTable from '../components/VerificationTable'
import { useWorkspace } from '../lib/store'

export default function VerificationHistory() {
  const { state } = useWorkspace()
  const records = state.records
  const total = records.length
  const flagged = records.filter((r) => r.status === 'Flagged').length
  const verified = records.filter((r) => r.status === 'Verified').length

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-page font-semibold text-ink">Verification History</h1>
        <p className="mt-1 text-body text-ink2">
          Every analysis run in this workspace — searchable, filterable and exportable.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total analyses', value: String(total), icon: History },
          { label: 'Verified', value: String(verified), icon: CircleCheck },
          { label: 'Flagged for review', value: String(flagged), icon: FileClock },
        ].map((s) => (
          <div key={s.label} className="card hover-lift flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated text-accent">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-card-title font-medium text-ink2">{s.label}</p>
              <p className="tabular mt-1 text-metric font-semibold text-ink">{s.value}</p>
            </div>
          </div>
        ))}
      </section>

      <VerificationTable records={records} pageLimit={9} />

      <section className="card flex flex-col items-center gap-3 p-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-elevated">
          <ScanSearch className="h-5 w-5 text-accent" />
        </div>
        <p className="text-body font-semibold text-ink">Need a new analysis?</p>
        <p className="max-w-md text-tiny text-ink2">
          Verification history is immutable. To evaluate a new media variant, start a fresh analysis from the workspace.
        </p>
      </section>
    </div>
  )
}
