import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  MoreHorizontal,
  Eye,
  Flag,
  Trash2,
  FileSearch,
} from 'lucide-react'
import type { VerificationRecord, RiskLevel } from '../lib/types'
import { fmtDate } from '../lib/types'
import { RiskBadge, StatusBadge, FileChip } from './RiskBadge'
import ConfirmationModal from './ConfirmationModal'
import { useToast } from './ToastProvider'
import { EmptyState } from './EmptyState'
import { useWorkspace } from '../lib/store'

const RISKS: (RiskLevel | 'All')[] = ['All', 'Authentic', 'Low', 'Moderate', 'High', 'Critical']

function scoreColor(score: number): string {
  if (score === 0) return 'text-ink3'
  if (score >= 80) return 'text-success'
  if (score >= 55) return 'text-warning'
  return 'text-danger'
}

function scoreBarColor(score: number): string {
  if (score === 0) return 'bg-ink3/40'
  if (score >= 80) return 'bg-success'
  if (score >= 55) return 'bg-warning'
  return 'bg-danger'
}

export default function VerificationTable({
  records,
  pageLimit = 6,
  compact = false,
}: {
  records: VerificationRecord[]
  pageLimit?: number
  compact?: boolean
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { deleteRecord, flagRecord } = useWorkspace()

  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState<RiskLevel | 'All'>('All')
  const [page, setPage] = useState(1)
  const [sortDesc, setSortDesc] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<VerificationRecord | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)

  // close any open row menu when clicking outside of it
  useEffect(() => {
    if (menuFor === null) return
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-row-menu]')) setMenuFor(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuFor])

  const filtered = useMemo(() => {
    let out = records
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      out = out.filter(
        (r) => r.asset.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.analyst.toLowerCase().includes(q),
      )
    }
    if (risk !== 'All') out = out.filter((r) => r.risk === risk)
    const sorted = [...out].sort((a, b) =>
      sortDesc ? b.analyzed.localeCompare(a.analyzed) : a.analyzed.localeCompare(b.analyzed),
    )
    return sorted
  }, [records, query, risk, sortDesc])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageLimit))
  const safePage = Math.min(page, totalPages)
  const rowStart = (safePage - 1) * pageLimit
  const visible = filtered.slice(rowStart, rowStart + pageLimit)

  const resetPage = () => setPage(1)

  return (
    <section className="card hover-lift overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        <div>
          <h2 className="text-section font-semibold text-ink">{compact ? 'Recent Verifications' : 'All Verifications'}</h2>
          <p className="mt-0.5 text-tiny text-ink3">
            {filtered.length} asset{filtered.length === 1 ? '' : 's'} · updated continuously
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink3" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                resetPage()
              }}
              placeholder="Search assets…"
              className="input-base h-8 w-52 pl-8 text-[13px]"
              aria-label="Search verification records"
            />
          </div>
          <select
            value={risk}
            onChange={(e) => {
              setRisk(e.target.value as RiskLevel | 'All')
              resetPage()
            }}
            className="select-base h-8 text-[13px]"
            aria-label="Filter by risk level"
          >
            {RISKS.map((r) => (
              <option key={r} value={r}>
                {r === 'All' ? 'All risk levels' : r}
              </option>
            ))}
          </select>
          <button
            className="btn-ghost btn-sm"
            onClick={() => setSortDesc((v) => !v)}
            title="Toggle date order"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            {sortDesc ? 'Newest' : 'Oldest'}
          </button>
        </div>
      </header>

      {visible.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No records match your filters"
          description="Try a different search term or clear the risk-level filter to see all verifications."
          action={
            <button
              className="btn-secondary btn-sm"
              onClick={() => {
                setQuery('')
                setRisk('All')
                resetPage()
              }}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-micro font-semibold uppercase tracking-[0.07em] text-ink3">
                <th className="px-4 py-2.5 font-semibold">Asset</th>
                <th className="px-4 py-2.5 font-semibold">File Type</th>
                <th className="px-4 py-2.5 font-semibold">Trust Score</th>
                <th className="px-4 py-2.5 font-semibold">Risk Level</th>
                <th className="px-4 py-2.5 font-semibold">Analysis Date</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {visible.map((r) => (
                <tr key={r.id} className="group transition-colors hover:bg-elevated2/60">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate('/image-forensics')}
                      className="block max-w-[230px] truncate text-[13px] font-medium text-ink transition-colors hover:text-accent"
                      title={r.asset}
                    >
                      {r.asset}
                    </button>
                    <span className="mt-0.5 block font-mono text-micro text-ink3">{r.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <FileChip type={r.fileType} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`tabular w-7 text-[13px] font-semibold ${scoreColor(r.trustScore)}`}>
                        {r.trustScore === 0 ? '—' : r.trustScore}
                      </span>
                      <span className="h-1 w-16 overflow-hidden rounded-full bg-base">
                        <span
                          className={`block h-full rounded-full ${scoreBarColor(r.trustScore)}`}
                          style={{ width: `${r.trustScore}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge risk={r.risk} size="sm" />
                  </td>
                  <td className="tabular px-4 py-3 text-[13px] text-ink2">{fmtDate(r.analyzed)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="relative inline-block" data-row-menu>
                      <button
                        className="btn-ghost h-8 w-8 p-0 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                        onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}
                        aria-label={`Actions for ${r.asset}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuFor === r.id && (
                        <div className="animate-popIn absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-line bg-elevated p-1 shadow-pop">
                          <button
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-ink2 transition-colors hover:bg-elevated2 hover:text-ink"
                            onClick={() => {
                              setMenuFor(null)
                              navigate('/image-forensics')
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" /> View report
                          </button>
                          <button
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-ink2 transition-colors hover:bg-elevated2 hover:text-ink"
                            onClick={() => {
                              setMenuFor(null)
                              flagRecord(r.id)
                              toast('warning', 'Asset flagged', `${r.id} was escalated to your integrity queue.`)
                            }}
                          >
                            <Flag className="h-3.5 w-3.5" /> Flag asset
                          </button>
                          <button
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-danger transition-colors hover:bg-elevated2"
                            onClick={() => {
                              setMenuFor(null)
                              setConfirmDelete(r)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
        <p className="text-tiny text-ink3">
          Showing {filtered.length === 0 ? 0 : rowStart + 1}–{Math.min(rowStart + pageLimit, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            className="btn-secondary btn-sm px-2"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`btn-sm btn h-8 w-8 px-0 ${
                safePage === i + 1 ? 'bg-accent-dim text-accent' : 'text-ink2 hover:bg-elevated hover:text-ink'
              }`}
            >
              {i + 1}
            </button>
          ))}
          {totalPages > 5 && <span className="px-1 text-ink3">…</span>}
          <button
            className="btn-secondary btn-sm px-2"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </footer>

      <ConfirmationModal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteRecord(confirmDelete.id)
            toast('success', 'Record deleted', `${confirmDelete.id} was removed from verification history.`)
          }
        }}
        title="Delete verification record?"
        description={`This will permanently remove ${confirmDelete?.asset ?? 'the asset'} from your history. This action cannot be undone.`}
        confirmLabel="Delete record"
      />
    </section>
  )
}
