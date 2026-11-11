import type { ReactNode } from 'react'

// ─── Core types ───────────────────────────────────────────────────────────────

export type RiskLevel = 'Authentic' | 'Low' | 'Moderate' | 'High' | 'Critical'

export type AnalysisStatus = 'Verified' | 'Flagged' | 'In Review' | 'Processing' | 'Failed'

export type FileType = 'JPEG' | 'PNG' | 'WebP' | 'HEIF' | 'MP4' | 'MOV' | 'WAV' | 'PDF'

export interface VerificationRecord {
  id: string
  asset: string
  assetSlug: string
  fileType: FileType
  trustScore: number
  risk: RiskLevel
  analyzed: string
  status: AnalysisStatus
  size: string
  analyst: string
}

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  role: 'Administrator' | 'Analyst' | 'Editor' | 'Viewer'
  status: 'Active' | 'Invited' | 'Suspended'
  lastActive: string
  initials: string
}

export interface ContentCredential {
  id: string
  issuer: string
  kind: 'Equipment' | 'Capture' | 'Edit' | 'Export'
  asset: string
  signedAt: string
  integrity: 'Valid' | 'Tamper Detected' | 'Removed'
  depth: 'Full' | 'Partial'
}

export interface AssetFingerprint {
  id: string
  asset: string
  phash: string
  sha256: string
  matches: number
  similarity: number
  lastSeen: string
}

// ─── Deterministic pseudo-random helpers ──────────────────────────────────────

export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function hashString(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(h)
}

export const hex = (n: number, seed: () => number): string => {
  let out = ''
  for (let i = 0; i < n; i++) {
    out += '0123456789abcdef'[Math.floor(seed() * 16) % 16]
  }
  return out
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export const fmtNum = (n: number): string => new Intl.NumberFormat('en-US').format(n)

export const fmtDate = (iso: string): string =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

export function riskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'Authentic':
      return 'text-success'
    case 'Low':
      return 'text-success'
    case 'Moderate':
      return 'text-warning'
    case 'High':
      return 'text-danger'
    case 'Critical':
      return 'text-danger'
  }
}

export function riskTone(risk: RiskLevel): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (risk) {
    case 'Authentic':
    case 'Low':
      return 'success'
    case 'Moderate':
      return 'warning'
    case 'High':
    case 'Critical':
      return 'danger'
  }
}

export function safeNode(node: ReactNode): boolean {
  return node === null || node === undefined
}
