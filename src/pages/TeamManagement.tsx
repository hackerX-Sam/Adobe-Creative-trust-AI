import { useState } from 'react'
import { Users, MailPlus, Search, CircleCheck, CirclePause, Send, ShieldCheck, Pencil, Eye } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import AnalyticsChartCard from '../components/AnalyticsChartCard'
import ConfirmationModal from '../components/ConfirmationModal'
import { useToast } from '../components/ToastProvider'
import { EmptyState } from '../components/EmptyState'
import { useWorkspace } from '../lib/store'
import type { WorkspaceMember } from '../lib/types'

const ROLE_META: Record<WorkspaceMember['role'], { icon: LucideIcon; cls: string }> = {
  Administrator: { icon: ShieldCheck, cls: 'text-accent bg-accent-dim border-accent/25' },
  Analyst: { icon: Pencil, cls: 'text-warning bg-warning/10 border-warning/25' },
  Editor: { icon: Pencil, cls: 'text-[#6FB2F5] bg-[#6FB2F5]/10 border-[#6FB2F5]/25' },
  Viewer: { icon: Eye, cls: 'text-ink2 bg-white/[0.06] border-line' },
}

const STATUS_META: Record<WorkspaceMember['status'], { icon: LucideIcon; cls: string }> = {
  Active: { icon: CircleCheck, cls: 'text-success' },
  Invited: { icon: Send, cls: 'text-[#6FB2F5]' },
  Suspended: { icon: CirclePause, cls: 'text-ink3' },
}

export default function TeamManagement() {
  const { toast } = useToast()
  const { state, addMember } = useWorkspace()
  const [query, setQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<WorkspaceMember['role']>('Viewer')

  const team = state.team
  const filtered = team.filter(
    (m) => m.name.toLowerCase().includes(query.toLowerCase()) || m.email.toLowerCase().includes(query.toLowerCase()),
  )

  const admins = team.filter((m) => m.role === 'Administrator').length
  const invited = team.filter((m) => m.status === 'Invited').length
  const suspended = team.filter((m) => m.status === 'Suspended').length

  const sendInvite = () => {
    const name = inviteName.trim() || 'New Invitee'
    addMember({ name, role: inviteRole })
    setInviteName('')
    setInviteRole('Viewer')
    toast('success', 'Invitation sent', `A join invitation for ${name} is registered in the workspace.`)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-ink">Team Management</h1>
          <p className="mt-1 text-body text-ink2">
            Manage members, roles and access to forensic capabilities.
          </p>
        </div>
        <button className="btn-primary btn-md" onClick={() => setInviteOpen(true)}>
          <MailPlus className="h-4 w-4" />
          Invite Member
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: 'Members', value: String(team.length) },
          { label: 'Administrators', value: String(admins) },
          { label: 'Pending invites', value: String(invited) },
          { label: 'Suspended', value: String(suspended) },
        ].map((s) => (
          <div key={s.label} className="card hover-lift p-4">
            <p className="text-card-title font-medium text-ink2">{s.label}</p>
            <p className="tabular mt-1.5 text-metric font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </section>

      <AnalyticsChartCard title="Workspace Members" subtitle="Role-based access to CreativeTrust capabilities" minBodyHeight={0}>
        <div className="relative mb-4 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink3" />
          <input
            className="input-base h-8 pl-8 text-[13px]"
            placeholder="Filter by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter members"
          />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No members match" description="Try a different name or email fragment." />
        ) : (
          <ul className="divide-y divide-line/70">
            {filtered.map((m) => {
              const r = ROLE_META[m.role]
              const s = STATUS_META[m.status]
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-elevated2 text-tiny font-semibold text-ink ring-1 ring-line">
                    {m.initials}
                  </span>
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-[13px] font-medium text-ink">{m.name}</p>
                    <p className="truncate text-micro text-ink3">{m.email}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-micro font-medium ${r.cls}`}>
                    <r.icon className="h-3 w-3" />
                    {m.role}
                  </span>
                  <span className={`flex items-center gap-1.5 text-micro ${s.cls}`}>
                    <s.icon className="h-3.5 w-3.5" />
                    {m.status}
                  </span>
                  <span className="hidden w-24 text-micro text-ink3 sm:block">{m.lastActive}</span>
                </li>
              )
            })}
          </ul>
        )}
      </AnalyticsChartCard>

      <ConfirmationModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onConfirm={sendInvite}
        title="Send workspace invitation?"
        description="The invitee will receive a single-use, expiring link granting workspace access with the role selected below."
        confirmLabel="Send invite"
        tone="accent"
      >
        <div className="space-y-3 border-t border-line pt-4">
          <div>
            <label className="text-micro font-medium text-ink2" htmlFor="invite-name">Full name</label>
            <input
              id="invite-name"
              className="input-base mt-1.5"
              placeholder="e.g. Jordan Reyes"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-micro font-medium text-ink2" htmlFor="invite-role">Role</label>
            <select
              id="invite-role"
              className="select-base mt-1.5 w-full text-[13px]"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as WorkspaceMember['role'])}
            >
              <option>Viewer</option>
              <option>Analyst</option>
              <option>Editor</option>
              <option>Administrator</option>
            </select>
          </div>
        </div>
      </ConfirmationModal>
    </div>
  )
}
