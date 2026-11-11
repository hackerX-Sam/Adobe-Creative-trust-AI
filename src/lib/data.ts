import type {
  VerificationRecord,
  WorkspaceMember,
  ContentCredential,
  AssetFingerprint,
  RiskLevel,
  AnalysisStatus,
  FileType,
} from './types'

// ─── Workspace identity ───────────────────────────────────────────────────────

export const WORKSPACES = [
  { id: 'brand-studio', name: 'Brand Studio', plan: 'Enterprise', seats: 48 },
  { id: 'newsroom', name: 'Newsroom Integrity', plan: 'Enterprise', seats: 32 },
  { id: 'legal', name: 'Legal & Compliance', plan: 'Business', seats: 12 },
]

export const CURRENT_USER = {
  name: 'samirantsk2020',
  firstName: 'samirantsk2020',
  email: 'samirantsk2020@gmail.com',
  role: 'Administrator',
  initials: 'SA',
}

// ─── Verification records ─────────────────────────────────────────────────────

interface RowDef {
  asset: string
  fileType: FileType
  trustScore: number
  risk: RiskLevel
  analyzed: string
  status: AnalysisStatus
  size: string
  analyst: string
}

const rowDefs: RowDef[] = [
  { asset: 'urban-skyline_MASTER.jpg', fileType: 'JPEG', trustScore: 97, risk: 'Authentic', analyzed: '2026-11-06', status: 'Verified', size: '8.4 MB', analyst: 'samirantsk2020' },
  { asset: 'product-launch-hero_v3.png', fileType: 'PNG', trustScore: 92, risk: 'Authentic', analyzed: '2026-11-06', status: 'Verified', size: '14.2 MB', analyst: 'Dana Cole' },
  { asset: 'interview_clip_final.mp4', fileType: 'MP4', trustScore: 88, risk: 'Low', analyzed: '2026-11-05', status: 'Verified', size: '212 MB', analyst: 'Marcus Lee' },
  { asset: 'annual-report-cover_2026.pdf', fileType: 'PDF', trustScore: 79, risk: 'Moderate', analyzed: '2026-11-05', status: 'In Review', size: '3.1 MB', analyst: 'Priya Nair' },
  { asset: 'keynote-portrait_edit.jpg', fileType: 'JPEG', trustScore: 64, risk: 'High', analyzed: '2026-11-04', status: 'Flagged', size: '5.7 MB', analyst: 'samirantsk2020' },
  { asset: 'seasonal-banner_b.png', fileType: 'PNG', trustScore: 95, risk: 'Authentic', analyzed: '2026-11-04', status: 'Verified', size: '6.9 MB', analyst: 'Dana Cole' },
  { asset: 'press-conference_wide.mp4', fileType: 'MP4', trustScore: 71, risk: 'Moderate', analyzed: '2026-11-03', status: 'In Review', size: '486 MB', analyst: 'Marcus Lee' },
  { asset: 'lifestyle-campaign_04.heif', fileType: 'HEIF', trustScore: 93, risk: 'Authentic', analyzed: '2026-11-03', status: 'Verified', size: '3.2 MB', analyst: 'Dana Cole' },
  { asset: 'deepseeded-morgan_generated.jpg', fileType: 'JPEG', trustScore: 18, risk: 'Critical', analyzed: '2026-11-02', status: 'Flagged', size: '4.8 MB', analyst: 'Priya Nair' },
  { asset: 'product-transparency.webp', fileType: 'WebP', trustScore: 96, risk: 'Authentic', analyzed: '2026-11-02', status: 'Verified', size: '1.4 MB', analyst: 'samirantsk2020' },
  { asset: 'ceo-quote-graphic.png', fileType: 'PNG', trustScore: 84, risk: 'Low', analyzed: '2026-11-01', status: 'Verified', size: '2.2 MB', analyst: 'samirantsk2020' },
  { asset: 'factory-aerial_drone.mov', fileType: 'MOV', trustScore: 90, risk: 'Authentic', analyzed: '2026-11-01', status: 'Verified', size: '1.2 GB', analyst: 'Marcus Lee' },
  { asset: 'magazine-spread_render.pdf', fileType: 'PDF', trustScore: 76, risk: 'Moderate', analyzed: '2026-10-31', status: 'In Review', size: '18.9 MB', analyst: 'Dana Cole' },
  { asset: 'social-carousel_11.jpg', fileType: 'JPEG', trustScore: 94, risk: 'Authentic', analyzed: '2026-10-31', status: 'Verified', size: '2.8 MB', analyst: 'Priya Nair' },
  { asset: 'headshot-studio_take7.jpg', fileType: 'JPEG', trustScore: 68, risk: 'High', analyzed: '2026-10-30', status: 'Flagged', size: '7.5 MB', analyst: 'samirantsk2020' },
  { asset: 'packshot_matte_v2.webp', fileType: 'WebP', trustScore: 97, risk: 'Authentic', analyzed: '2026-10-30', status: 'Verified', size: '0.9 MB', analyst: 'Dana Cole' },
  { asset: 'conference-recap_720.mp4', fileType: 'MP4', trustScore: 82, risk: 'Low', analyzed: '2026-10-29', status: 'Verified', size: '344 MB', analyst: 'Marcus Lee' },
  { asset: 'voice-sample_ivr.wav', fileType: 'WAV', trustScore: 55, risk: 'High', analyzed: '2026-10-29', status: 'Flagged', size: '96 MB', analyst: 'Priya Nair' },
  { asset: 'annual-banner_alt.png', fileType: 'PNG', trustScore: 91, risk: 'Authentic', analyzed: '2026-10-28', status: 'Verified', size: '4.1 MB', analyst: 'Dana Cole' },
  { asset: 'insta-story_bokeh.jpg', fileType: 'JPEG', trustScore: 87, risk: 'Low', analyzed: '2026-10-28', status: 'Verified', size: '3.6 MB', analyst: 'samirantsk2020' },
  { asset: 'trade-booth_moodboard.pdf', fileType: 'PDF', trustScore: 74, risk: 'Moderate', analyzed: '2026-10-27', status: 'In Review', size: '12.4 MB', analyst: 'Priya Nair' },
  { asset: 'corporate-reel_2026.mov', fileType: 'MOV', trustScore: 0, risk: 'Moderate', analyzed: '2026-10-27', status: 'Failed', size: '2.8 GB', analyst: 'Marcus Lee' },
  { asset: 'brand-cta_sprite.webp', fileType: 'WebP', trustScore: 98, risk: 'Authentic', analyzed: '2026-10-26', status: 'Verified', size: '0.4 MB', analyst: 'samirantsk2020' },
  { asset: 'press-kit_portrait.png', fileType: 'PNG', trustScore: 86, risk: 'Low', analyzed: '2026-10-26', status: 'Verified', size: '9.3 MB', analyst: 'Dana Cole' },
]

export const VERIFICATION_RECORDS: VerificationRecord[] = rowDefs.map(
  (r, idx) => ({
    id: `CT-${8420 - idx}`,
    asset: r.asset,
    assetSlug: r.asset.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    fileType: r.fileType,
    trustScore: r.trustScore,
    risk: r.risk,
    analyzed: r.analyzed,
    status: r.status,
    size: r.size,
    analyst: r.analyst,
  }),
)

// ─── Charts data ──────────────────────────────────────────────────────────────

export interface ActivityPoint {
  week: string
  verified: number
  flagged: number
}

export const ACTIVITY_WEEKS: ActivityPoint[] = [
  { week: 'W1', verified: 132, flagged: 14 },
  { week: 'W2', verified: 148, flagged: 9 },
  { week: 'W3', verified: 139, flagged: 18 },
  { week: 'W4', verified: 161, flagged: 11 },
  { week: 'W5', verified: 154, flagged: 2 },
  { week: 'W6', verified: 173, flagged: 3 },
  { week: 'W7', verified: 191, flagged: 16 },
  { week: 'W8', verified: 218, flagged: 13 },
  { week: 'W9', verified: 204, flagged: 21 },
  { week: 'W10', verified: 231, flagged: 17 },
  { week: 'W11', verified: 248, flagged: 22 },
  { week: 'W12', verified: 271, flagged: 15 },
]

export const AUTHENTICITY_DIST = [
  { name: 'Authentic', value: 1284, color: '#32D583' },
  { name: 'AI-Generated', value: 158, color: '#FF3B30' },
  { name: 'Manipulated', value: 92, color: '#F5B942' },
  { name: 'Uncertain', value: 41, color: '#6B6B75' },
]

export const WEEKLY_SCANS = [
  { day: 'Mon', scans: 96, automated: 74 },
  { day: 'Tue', scans: 112, automated: 88 },
  { day: 'Wed', scans: 104, automated: 90 },
  { day: 'Thu', scans: 128, automated: 101 },
  { day: 'Fri', scans: 141, automated: 118 },
  { day: 'Sat', scans: 63, automated: 58 },
  { day: 'Sun', scans: 51, automated: 47 },
]

export const RISK_TREND = [
  { month: 'Jun', risk: 12 },
  { month: 'Jul', risk: 10 },
  { month: 'Aug', risk: 14 },
  { month: 'Sep', risk: 11 },
  { month: 'Oct', risk: 16 },
  { month: 'Nov', risk: 13 },
]

export const PIPELINE_LOAD = [
  { service: 'Imaging', cpu: 68 },
  { service: 'Video', cpu: 82 },
  { service: 'Audio', cpu: 31 },
  { service: 'Docs', cpu: 44 },
  { service: 'Registry', cpu: 57 },
]

// ─── Team ─────────────────────────────────────────────────────────────────────

export const TEAM: WorkspaceMember[] = [
  { id: '1', name: 'samirantsk2020', email: 'samir.anwar@adobe-ct.ai', role: 'Administrator', status: 'Active', lastActive: '2 min ago', initials: 'SA' },
  { id: '2', name: 'Dana Cole', email: 'dana.cole@adobe-ct.ai', role: 'Analyst', status: 'Active', lastActive: '18 min ago', initials: 'DC' },
  { id: '3', name: 'Marcus Lee', email: 'marcus.lee@adobe-ct.ai', role: 'Analyst', status: 'Active', lastActive: '1 hr ago', initials: 'ML' },
  { id: '4', name: 'Priya Nair', email: 'priya.nair@adobe-ct.ai', role: 'Editor', status: 'Active', lastActive: '3 hr ago', initials: 'PN' },
  { id: '5', name: 'Tomás Ferreira', email: 'tomas.f@adobe-ct.ai', role: 'Viewer', status: 'Invited', lastActive: '—', initials: 'TF' },
  { id: '6', name: 'Elena Marchetti', email: 'elena.m@partner.co', role: 'Viewer', status: 'Suspended', lastActive: '12 days ago', initials: 'EM' },
]

// ─── Content credentials ──────────────────────────────────────────────────────

export const CREDENTIALS: ContentCredential[] = [
  { id: 'CR-9012', issuer: 'Sony α7R V', kind: 'Capture', asset: 'urban-skyline_MASTER.jpg', signedAt: '2026-11-06', integrity: 'Valid', depth: 'Full' },
  { id: 'CR-9011', issuer: 'Canon EOS R5', kind: 'Capture', asset: 'product-launch-hero_v3.png', signedAt: '2026-11-06', integrity: 'Valid', depth: 'Full' },
  { id: 'CR-9010', issuer: 'Adobe Photoshop 29.2', kind: 'Edit', asset: 'annual-report-cover_2026.pdf', signedAt: '2026-11-05', integrity: 'Valid', depth: 'Partial' },
  { id: 'CR-9009', issuer: 'Adobe Lightroom 14.1', kind: 'Edit', asset: 'keynote-portrait_edit.jpg', signedAt: '2026-11-04', integrity: 'Tamper Detected', depth: 'Partial' },
  { id: 'CR-9008', issuer: 'Blackmagic Resolve 20', kind: 'Edit', asset: 'press-conference_wide.mp4', signedAt: '2026-11-03', integrity: 'Valid', depth: 'Full' },
  { id: 'CR-9007', issuer: 'Export — Web Bridge', kind: 'Export', asset: 'social-carousel_11.jpg', signedAt: '2026-10-31', integrity: 'Valid', depth: 'Partial' },
  { id: 'CR-9006', issuer: 'Unknown Producer', kind: 'Capture', asset: 'deepseeded-morgan_generated.jpg', signedAt: '2026-10-29', integrity: 'Removed', depth: 'Partial' },
  { id: 'CR-9005', issuer: 'Nikon Z9', kind: 'Capture', asset: 'factory-aerial_drone.mov', signedAt: '2026-10-27', integrity: 'Valid', depth: 'Full' },
]

// ─── Fingerprints ─────────────────────────────────────────────────────────────

export const FINGERPRINTS: AssetFingerprint[] = [
  { id: 'FP-2201', asset: 'urban-skyline_MASTER', phash: 'e4def2b81c04a7f3', sha256: '9f2c…e41a', matches: 3, similarity: 99.8, lastSeen: '2026-11-06' },
  { id: 'FP-2200', asset: 'keynote-portrait_edit', phash: 'a1b2c3d40f11812d', sha256: 'aa77…844b', matches: 14, similarity: 97.1, lastSeen: '2026-11-05' },
  { id: 'FP-2199', asset: 'deepseeded-morgan_generated', phash: 'f1209a77b3ce11ef', sha256: '1c8d…f090', matches: 41, similarity: 96.4, lastSeen: '2026-11-02' },
  { id: 'FP-2198', asset: 'packshot_matte_v2', phash: '55d8a1c20b31aa01', sha256: '77a1…3d5e', matches: 0, similarity: 100, lastSeen: '2026-10-30' },
  { id: 'FP-2197', asset: 'voice-sample_ivr', phash: 'ce01f0b4993a117e', sha256: 'bde0…aa21', matches: 7, similarity: 95.5, lastSeen: '2026-10-29' },
  { id: 'FP-2196', asset: 'insta-story_bokeh', phash: '3fa9ce44d01b2c88', sha256: '5e44…9b1c', matches: 2, similarity: 98.2, lastSeen: '2026-10-28' },
]

// ─── Mock provenance chain ────────────────────────────────────────────────────

export const DEFAULT_STAGES = [
  { key: 'Upload validated', done: 'File header and container verified.' },
  { key: 'Metadata extraction', done: 'EXIF / XMP parsed.' },
  { key: 'ELA generation', done: 'Error-level baseline computed.' },
  { key: 'Noise pattern analysis', done: 'PRNU local-correlation sampled.' },
  { key: 'AI-content detection', done: 'Diffusion artifact classifier run.' },
  { key: 'Provenance lookup', done: 'Querying content credential registry.' },
] as const
