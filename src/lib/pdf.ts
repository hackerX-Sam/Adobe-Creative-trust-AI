/**
 * Client-side PDF report generator (jsPDF, lazy-loaded so it lives in its own
 * chunk and never bloats the main bundle).
 *
 * Builds a branded A4 PDF from the live workspace state: report metadata,
 * headline metrics, authenticity distribution, recent verifications and the
 * latest activity feed.
 */
import type { WorkspaceState, Report } from './store'
import type { VerificationRecord } from './types'

const BRAND: [number, number, number] = [255, 59, 48] // #FF3B30
const INK: [number, number, number] = [24, 24, 27]
const INK2: [number, number, number] = [90, 90, 99]
const INK3: [number, number, number] = [140, 140, 148]
const LINE: [number, number, number] = [228, 228, 231]
const SUCCESS: [number, number, number] = [50, 213, 131]
const WARNING: [number, number, number] = [245, 185, 66]
const DANGER: [number, number, number] = [255, 77, 79]

const M = 48 // page margin (pt)

function riskColor(risk: string): [number, number, number] {
  if (risk === 'Authentic' || risk === 'Low') return SUCCESS
  if (risk === 'Moderate') return WARNING
  return DANGER
}

function statusColor(status: string): [number, number, number] {
  if (status === 'Verified') return SUCCESS
  if (status === 'Flagged') return DANGER
  if (status === 'Processing') return BRAND
  return WARNING
}

export async function downloadReportPdf(report: Report, state: WorkspaceState): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth() // 595 pt
  const H = doc.internal.pageSize.getHeight() // 842 pt
  const CW = W - M * 2

  const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2])
  const setText = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2])
  const setDraw = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2])

  // ── Header band ────────────────────────────────────────────────────────────
  setFill(BRAND)
  doc.rect(0, 0, W, 96, 'F')
  setText([255, 255, 255])
  doc.setFont('helvetica', 'bold').setFontSize(17)
  doc.text('Adobe CreativeTrust AI', M, 40)
  doc.setFont('helvetica', 'normal').setFontSize(10.5)
  doc.text('Workspace Integrity Report', M, 60)
  doc.setFontSize(9)
  doc.text(new Date().toLocaleString('en-US'), W - M, 40, { align: 'right' })
  doc.text('Conceptual prototype — forensic results are simulated', W - M, 56, { align: 'right' })

  let y = 132

  const sectionTitle = (t: string) => {
    if (y > H - 150) {
      doc.addPage()
      y = 64
    }
    setText(INK)
    doc.setFont('helvetica', 'bold').setFontSize(12)
    doc.text(t, M, y)
    setDraw(LINE)
    doc.setLineWidth(0.75)
    doc.line(M, y + 7, W - M, y + 7)
    y += 26
  }

  const kv = (label: string, value: string, x: number, colW: number, vy: number) => {
    setText(INK3)
    doc.setFont('helvetica', 'normal').setFontSize(8.5)
    doc.text(label.toUpperCase(), x, vy)
    setText(INK)
    doc.setFont('helvetica', 'bold').setFontSize(11)
    doc.text(doc.splitTextToSize(value, colW)[0] ?? '', x, vy + 15)
  }

  // ── Report metadata ────────────────────────────────────────────────────────
  sectionTitle('Report Details')
  const colW = (CW - 24) / 3
  kv('Name', report.name, M, colW, y)
  kv('Report ID', report.id, M + colW + 12, colW, y)
  kv('Scope', report.scope, M + (colW + 12) * 2, colW, y)
  y += 34
  kv('Created', new Date(report.created).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), M, colW, y)
  kv('Status', report.status, M + colW + 12, colW, y)
  kv('Artifact size', report.size || '—', M + (colW + 12) * 2, colW, y)
  y += 40

  // ── Live workspace metrics ────────────────────────────────────────────────
  sectionTitle('Workspace Snapshot (live)')
  const metrics: [string, string, [number, number, number]][] = [
    ['Total analyzed', state.live.analyzed.toLocaleString('en-US'), INK],
    ['Verified', state.live.verified.toLocaleString('en-US'), SUCCESS],
    ['Suspicious', state.live.suspicious.toLocaleString('en-US'), WARNING],
    ['AI-generated', state.live.aiGenerated.toLocaleString('en-US'), BRAND],
  ]
  const boxW = (CW - 36) / 4
  metrics.forEach(([label, value, color], i) => {
    const bx = M + i * (boxW + 12)
    setFill([247, 247, 249])
    doc.roundedRect(bx, y, boxW, 58, 6, 6, 'F')
    setText(INK3)
    doc.setFont('helvetica', 'normal').setFontSize(8)
    doc.text(label.toUpperCase(), bx + 12, y + 20)
    setText(color)
    doc.setFont('helvetica', 'bold').setFontSize(17)
    doc.text(value, bx + 12, y + 44)
  })
  y += 82

  // ── Authenticity distribution ─────────────────────────────────────────────
  sectionTitle('Authenticity Distribution')
  const distTotal = state.dist.reduce((s, d) => s + d.value, 0) || 1
  state.dist.forEach((d, i) => {
    const dx = M + i * (boxW + 12)
    const pct = Math.round((d.value / distTotal) * 1000) / 10
    setFill([247, 247, 249])
    doc.roundedRect(dx, y, boxW, 58, 6, 6, 'F')
    setFill(hexToRgb(d.color))
    doc.roundedRect(dx + 12, y + 14, 8, 8, 2, 2, 'F')
    setText(INK)
    doc.setFont('helvetica', 'bold').setFontSize(9)
    doc.text(d.name, dx + 26, y + 21)
    setText(INK2)
    doc.setFont('helvetica', 'normal').setFontSize(10)
    doc.text(`${d.value.toLocaleString('en-US')} assets · ${pct}%`, dx + 12, y + 44)
  })
  y += 82

  // ── Recent verifications table ────────────────────────────────────────────
  sectionTitle('Recent Verifications')
  const rows = [...state.records]
    .sort((a, b) => (a.analyzed < b.analyzed ? 1 : a.analyzed > b.analyzed ? -1 : 0))
    .slice(0, 14)

  const cols = [
    { label: 'ID', w: 64 },
    { label: 'Asset', w: 170 },
    { label: 'Trust', w: 44 },
    { label: 'Risk', w: 72 },
    { label: 'Status', w: 74 },
    { label: 'Analyzed', w: 61 },
  ]
  const drawHead = () => {
    setText(INK3)
    doc.setFont('helvetica', 'bold').setFontSize(8)
    let x = M
    for (const c of cols) {
      doc.text(c.label.toUpperCase(), x, y)
      x += c.w
    }
    y += 8
    setDraw(LINE)
    doc.setLineWidth(0.6)
    doc.line(M, y, W - M, y)
    y += 14
  }
  drawHead()

  const clip = (s: string, w: number) => {
    let t = s
    while (doc.getTextWidth(t) > w && t.length > 4) t = t.slice(0, -1)
    return t === s ? t : t.slice(0, -1) + '…'
  }

  doc.setFont('helvetica', 'normal').setFontSize(9.5)
  for (const r of rows) {
    if (y > H - 120) {
      doc.addPage()
      y = 64
      drawHead()
      doc.setFont('helvetica', 'normal').setFontSize(9.5)
    }
    const rec = r as VerificationRecord
    const vals = [
      clip(rec.id, cols[0].w),
      clip(rec.asset, cols[1].w),
      `${rec.trustScore}/100`,
      rec.risk,
      rec.status,
      rec.analyzed,
    ]
    let x = M
    vals.forEach((v, i) => {
      if (cols[i].label === 'Risk') setText(riskColor(rec.risk))
      else if (cols[i].label === 'Status') setText(statusColor(rec.status))
      else if (cols[i].label === 'Trust') setText(INK)
      else setText(INK2)
      doc.setFont(cols[i].label === 'Asset' || cols[i].label === 'ID' ? 'helvetica' : 'helvetica', cols[i].label === 'Risk' || cols[i].label === 'Status' ? 'bold' : 'normal')
      doc.text(String(v), x, y - 4)
      x += cols[i].w
    })
    y += 17
  }

  // ── Recent activity feed ──────────────────────────────────────────────────
  y += 12
  sectionTitle('Recent Activity')
  doc.setFont('helvetica', 'normal').setFontSize(9.5)
  for (const e of state.feed.slice(0, 10)) {
    if (y > H - 90) {
      doc.addPage()
      y = 64
      doc.setFont('helvetica', 'normal').setFontSize(9.5)
    }
    setText(e.kind === 'verified' ? SUCCESS : e.kind === 'flagged' ? DANGER : INK2)
    doc.setFillColor(e.kind === 'verified' ? SUCCESS[0] : e.kind === 'flagged' ? DANGER[0] : INK2[0], e.kind === 'verified' ? SUCCESS[1] : e.kind === 'flagged' ? DANGER[1] : INK2[1], e.kind === 'verified' ? SUCCESS[2] : e.kind === 'flagged' ? DANGER[2] : INK2[2])
    doc.circle(M + 3, y - 3, 2, 'F')
    setText(INK2)
    const msg = clip(e.message, CW - 90)
    doc.text(msg, M + 14, y)
    setText(INK3)
    doc.setFontSize(8)
    doc.text(relTime(e.ts), W - M, y, { align: 'right' })
    doc.setFontSize(9.5)
    y += 15
  }

  // ── Footers on every page ─────────────────────────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    setDraw(LINE)
    doc.setLineWidth(0.6)
    doc.line(M, H - 46, W - M, H - 46)
    setText(INK3)
    doc.setFont('helvetica', 'normal').setFontSize(8)
    doc.text('Adobe CreativeTrust AI · Conceptual prototype · v1.0.0', M, H - 30)
    doc.text(`Page ${p} of ${pages} · ${report.id}`, W - M, H - 30, { align: 'right' })
  }

  const filename = `${report.id}_${report.name.replace(/[^\w-]+/g, '-').slice(0, 60)}.pdf`
  doc.save(filename)
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function relTime(ts: number): string {
  const d = Date.now() - ts
  if (d < 60_000) return `${Math.floor(d / 1000) || 1}s ago`
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return `${Math.floor(d / 86_400_000)}d ago`
}
