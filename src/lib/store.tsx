/**
 * Workspace store — now backed by the real API.
 *
 * • Initial data: GET /api/state (Neon Postgres)
 * • Live updates:  GET /api/stream (SSE) — every mutation from ANY browser is
 *   pushed back to all connected browsers within ~2 s.
 * • Mutations:     optimistic local apply + POST/DELETE to the API; the
 *   authoritative result arrives via SSE and is merged (idempotent by id).
 *
 * The public shape (WorkspaceApi) is unchanged, so pages keep working.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  VerificationRecord,
  WorkspaceMember,
  ContentCredential,
  AssetFingerprint,
} from './types'
import type { ActivityPoint } from './data'
import {
  apiReset,
  apiDeleteVerification,
  apiFlagVerification,
  apiAddMember,
  apiAddReport,
  apiRemoveReport,
} from './api'

// ─── Live-event types ─────────────────────────────────────────────────────────

export type FeedKind = 'verified' | 'flagged' | 'review' | 'credential' | 'team' | 'report'

export interface FeedItem {
  id: number
  ts: number
  kind: FeedKind
  asset?: string
  message: string
  read: boolean
}

export interface Report {
  id: string
  name: string
  scope: string
  created: string
  status: 'Ready' | 'Generating' | 'Scheduled'
  size: string
}

interface Snapshot {
  records: VerificationRecord[]
  team: WorkspaceMember[]
  reports: Report[]
  credentials: ContentCredential[]
  fingerprints: AssetFingerprint[]
  live: { analyzed: number; verified: number; suspicious: number; aiGenerated: number }
  weekly: ActivityPoint[]
  dist: { name: string; color: string; value: number }[]
  events: FeedItem[]
}

interface Patch {
  changed: VerificationRecord[]
  removed: string[]
  live?: Snapshot['live']
  weekly?: ActivityPoint[]
  dist?: { name: string; color: string; value: number }[]
  fingerprints?: AssetFingerprint[]
  credentials?: ContentCredential[]
}

export interface WorkspaceState extends Snapshot {
  feed: FeedItem[]
  unread: number
  baseline: {
    analyzed: number
    verified: number
    suspicious: number
    aiGenerated: number
  }
  spark: {
    analyzed: number[]
    verified: number[]
    suspicious: number[]
    aiGenerated: number[]
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FEED_MAX = 40
const SPARK_LEN = 12
/** value each metric had at t0 — used to derive live change-% */
const P0 = { analyzed: 12.4, verified: 9.8, suspicious: -6.2, aiGenerated: 21.7 } as const

const READ_KEY = 'creativertrust-read-through-v2'

function loadLastRead(): number {
  try {
    return Number(localStorage.getItem(READ_KEY)) || 0
  } catch {
    return 0
  }
}

function saveLastRead(id: number) {
  try {
    localStorage.setItem(READ_KEY, String(id))
  } catch {
    /* storage unavailable */
  }
}

// ─── Hydration ────────────────────────────────────────────────────────────────

function seedSpark(live: Snapshot['live']): WorkspaceState['spark'] {
  const jitter = () => Math.floor(Math.random() * 20) - 10
  return {
    analyzed: Array.from({ length: SPARK_LEN }, (_, i) => live.analyzed - (SPARK_LEN - 1 - i) * 37 + jitter()),
    verified: Array.from({ length: SPARK_LEN }, (_, i) => live.verified - (SPARK_LEN - 1 - i) * 32 + jitter()),
    suspicious: Array.from({ length: SPARK_LEN }, (_, i) => live.suspicious + (SPARK_LEN - 1 - i) * 4 + jitter()),
    aiGenerated: Array.from({ length: SPARK_LEN }, (_, i) => live.aiGenerated - (SPARK_LEN - 1 - i) * 5 + jitter()),
  }
}

function shiftBaseline(live: Snapshot['live']): WorkspaceState['baseline'] {
  return {
    analyzed: live.analyzed / (1 + P0.analyzed / 100),
    verified: live.verified / (1 + P0.verified / 100),
    suspicious: live.suspicious / (1 + P0.suspicious / 100),
    aiGenerated: live.aiGenerated / (1 + P0.aiGenerated / 100),
  }
}

function hydrate(snap: Snapshot, lastRead: number): WorkspaceState {
  const feed = snap.events.map((e) => ({ ...e, read: e.id <= lastRead }))
  const unread = feed.filter((f) => !f.read).length
  return {
    ...snap,
    feed: feed.slice(-FEED_MAX).reverse(),
    unread,
    baseline: shiftBaseline(snap.live),
    spark: seedSpark(snap.live),
  }
}

// ─── State mutation helpers ───────────────────────────────────────────────────

function pushSpark(prev: WorkspaceState['spark'], live: Snapshot['live']): WorkspaceState['spark'] {
  return {
    analyzed: [...prev.analyzed.slice(1), live.analyzed],
    verified: [...prev.verified.slice(1), live.verified],
    suspicious: [...prev.suspicious.slice(1), live.suspicious],
    aiGenerated: [...prev.aiGenerated.slice(1), live.aiGenerated],
  }
}

function withLive(state: WorkspaceState, live: Snapshot['live']): WorkspaceState {
  return { ...state, live, spark: pushSpark(state.spark, live) }
}

/** merge changed records by id, apply removals */
function applyPatch(state: WorkspaceState, patch: Patch): WorkspaceState {
  let records = state.records
  if (patch.changed.length) {
    const map = new Map(patch.changed.map((r) => [r.id, r]))
    records = records.map((r) => map.get(r.id) ?? r)
  }
  if (patch.removed.length) {
    const gone = new Set(patch.removed)
    records = records.filter((r) => !gone.has(r.id))
  }
  let s: WorkspaceState = { ...state, records }
  if (patch.live) s = withLive(s, patch.live)
  if (patch.weekly) s = { ...s, weekly: patch.weekly }
  if (patch.dist) s = { ...s, dist: patch.dist }
  if (patch.fingerprints) s = { ...s, fingerprints: patch.fingerprints }
  if (patch.credentials) s = { ...s, credentials: patch.credentials }
  return s
}

function applyEvents(state: WorkspaceState, items: FeedItem[], lastRead: number): WorkspaceState {
  const known = new Set(state.feed.map((f) => f.id))
  const fresh = items
    .filter((e) => !known.has(e.id))
    .map((e) => ({ ...e, read: e.id <= lastRead }))
  if (!fresh.length) return state
  const feed = [...state.feed, ...fresh].slice(-FEED_MAX).reverse()
  const unread = feed.filter((f) => !f.read).length
  return { ...state, feed, unread }
}

// ─── SSE stream ───────────────────────────────────────────────────────────────

function openStream(handlers: {
  snapshot: (s: Snapshot) => void
  patch: (p: Patch) => void
  events: (items: FeedItem[]) => void
}): () => void {
  const es = new EventSource('/api/stream')
  const on = <T,>(event: string, fn: (data: T) => void) => {
    es.addEventListener(event, (ev) => {
      try {
        fn(JSON.parse((ev as MessageEvent).data) as T)
      } catch {
        /* malformed frame */
      }
    })
  }
  on<Snapshot>('snapshot', handlers.snapshot)
  on<Patch>('patch', handlers.patch)
  on<FeedItem[]>('events', handlers.events)
  return () => es.close()
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface WorkspaceApi {
  state: WorkspaceState
  derived: {
    changePct: { analyzed: number; verified: number; suspicious: number; aiGenerated: number }
  }
  deleteRecord: (id: string) => void
  flagRecord: (id: string) => void
  addMember: (member: { name: string; role: string; email?: string }) => void
  addReport: (report: { name: string; scope: string }) => void
  removeReport: (id: string) => void
  markRead: () => void
  resetWorkspace: () => void
}

const WorkspaceCtx = createContext<WorkspaceApi | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const lastReadRef = useRef(loadLastRead())

  // initial snapshot + realtime channel
  useEffect(() => {
    let disposed = false
    setError(null)
    const close = openStream({
      snapshot: (snap) => {
        if (!disposed) {
          setError(null)
          setState(hydrate(snap, lastReadRef.current))
        }
      },
      patch: (patch) => {
        if (!disposed) setState((s) => (s ? applyPatch(s, patch) : s))
      },
      events: (items) => {
        if (!disposed) setState((s) => (s ? applyEvents(s, items, lastReadRef.current) : s))
      },
    })
    // resilience: if no SSE snapshot within 6 s (proxy hiccup, cold server nested wakeup,
    // browser's alternative DNS stack), hydrate directly from the REST endpoint instead
    const fallbackTimer = setTimeout(async () => {
      if (disposed) return
      const ctrl = new AbortController()
      const abortTimer = setTimeout(() => ctrl.abort(), 10_000)
      try {
        const res = await fetch('/api/state', { signal: ctrl.signal })
        if (!res.ok) throw new Error(`API responded ${res.status} ${res.statusText} — backend is failing`)
        const snap = (await res.json()) as Snapshot
        if (!disposed) setState((s) => (s ? s : hydrate(snap, lastReadRef.current)))
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : 'Cannot reach the backend API')
        }
      } finally {
        clearTimeout(abortTimer)
      }
    }, 6000)
    return () => {
      disposed = true
      clearTimeout(fallbackTimer)
      close()
    }
  }, [attempt])

  const actions = useMemo<WorkspaceApi>(() => ({
    state: state as WorkspaceState,
    derived: {
      changePct: state
        ? {
            analyzed: Math.round((state.live.analyzed / state.baseline.analyzed - 1) * 1000) / 10,
            verified: Math.round((state.live.verified / state.baseline.verified - 1) * 1000) / 10,
            suspicious: Math.round((state.live.suspicious / state.baseline.suspicious - 1) * 1000) / 10,
            aiGenerated: Math.round((state.live.aiGenerated / state.baseline.aiGenerated - 1) * 1000) / 10,
          }
        : { analyzed: 0, verified: 0, suspicious: 0, aiGenerated: 0 },
    },
    deleteRecord: (id) => {
      setState((s) => (s ? { ...s, records: s.records.filter((r) => r.id !== id) } : s))
      apiDeleteVerification(id).catch(() => undefined)
    },
    flagRecord: (id) => {
      setState((s) =>
        s
          ? {
              ...s,
              records: s.records.map((r) =>
                r.id === id
                  ? { ...r, status: 'Flagged' as const, risk: r.risk === 'Authentic' ? ('Low' as const) : r.risk }
                  : r,
              ),
            }
          : s,
      )
      apiFlagVerification(id).catch(() => undefined)
    },
    addMember: (member) => {
      apiAddMember(member.name, member.role)
        .catch(() => undefined)
    },
    addReport: (report) => {
      apiAddReport(report.name, report.scope)
        .catch(() => undefined)
    },
    removeReport: (id) => {
      setState((s) => (s ? { ...s, reports: s.reports.filter((r) => r.id !== id) } : s))
      apiRemoveReport(id).catch(() => undefined)
    },
    markRead: () => {
      setState((s) => {
        if (!s) return s
        const maxId = s.feed.reduce((m, f) => Math.max(m, f.id), 0)
        lastReadRef.current = maxId
        saveLastRead(maxId)
        return { ...s, unread: 0, feed: s.feed.map((f) => ({ ...f, read: true })) }
      })
    },
    resetWorkspace: () => {
      lastReadRef.current = 0
      saveLastRead(0)
      apiReset()
        .then(() => undefined)
        .catch(() => undefined)
    },
  }), [state])

  if (!state) {
    if (error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center text-ink3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">!</div>
          <p className="text-sm font-medium text-danger">Workspace could not load</p>
          <p className="max-w-md text-tiny">{error}</p>
          <button
            onClick={() => setAttempt((a) => a + 1)}
            className="mt-1 rounded-lg bg-accent px-4 py-2 text-tiny font-semibold text-white transition hover:opacity-90"
          >
            Retry connection
          </button>
        </div>
      )
    }
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-accent" />
        <p className="text-tiny">Connecting to workspace…</p>
      </div>
    )
  }

  return <WorkspaceCtx.Provider value={actions}>{children}</WorkspaceCtx.Provider>
}

export function useWorkspace(): WorkspaceApi {
  const ctx = useContext(WorkspaceCtx)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function relTime(ts: number): string {
  const d = Date.now() - ts
  if (d < 8_000) return 'just now'
  if (d < 60_000) return `${Math.floor(d / 1000)}s ago`
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  return `${Math.floor(d / 3_600_000)}h ago`
}

export function clockTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}
