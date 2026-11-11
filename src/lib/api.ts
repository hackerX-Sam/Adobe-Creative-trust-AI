/**
 * API client for the CreativeTrust backend.
 * In dev, Vite proxies /api → localhost:8787 (see vite.config.ts).
 * In production (Vercel), the same-origin /api routes are serverless functions.
 */

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      if (body?.error) msg = body.error
    } catch {
      /* non-JSON error body */
    }
    throw new Error(msg)
  }
  return (await res.json()) as T
}

// ─── Typed endpoints ──────────────────────────────────────────────────────────

export const apiGetState = () => api('/api/state')

export const apiAnalyze = (file: File, analyst: string) => {
  const form = new FormData()
  form.append('file', file)
  form.append('analyst', analyst)
  return api<AnalyzeResponse>('/api/analyze', { method: 'POST', body: form })
}

export interface AnalyzeResponse {
  record: { id: string; asset: string; trustScore: number; status: string }
  results: {
    trustScore: number
    aiProbability: number
    aiTone: 'success' | 'warning' | 'danger'
    manipulation: number
    regions: { x: number; y: number; w: number; h: number; intensity: number }[]
    metadataScore: number
    metadataTone: 'success' | 'warning' | 'danger'
    provenance: string
    provenanceTone: 'success' | 'warning' | 'danger'
    noise: number
    clone: number
    sha256: string
    exifRows: { key: string; value: string; mono?: boolean }[]
  }
}

export const apiQueueVerification = (asset: string, fileType: string, size: string, analyst: string) =>
  api('/api/verifications', { method: 'POST', body: JSON.stringify({ asset, fileType, size, analyst }) })

export const apiDeleteVerification = (id: string) => api(`/api/verifications/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const apiFlagVerification = (id: string) => api(`/api/verifications/${encodeURIComponent(id)}/flag`, { method: 'POST' })

export const apiResolveVerification = (id: string) => api(`/api/verifications/${encodeURIComponent(id)}/resolve`, { method: 'POST' })

export const apiAddMember = (name: string, role: string) =>
  api('/api/team', { method: 'POST', body: JSON.stringify({ name, role }) })

export const apiAddReport = (name: string, scope: string) =>
  api('/api/reports', { method: 'POST', body: JSON.stringify({ name, scope }) })

export const apiRemoveReport = (id: string) => api(`/api/reports/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const apiSweep = () => api('/api/sweep', { method: 'POST' })

export const apiReset = () => api('/api/reset', { method: 'POST' })
