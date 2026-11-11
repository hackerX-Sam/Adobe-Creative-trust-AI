import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ScanSearch,
  Square,
  FileImage,
  FileType2,
  HardDrive,
  Ruler,
  RotateCcw,
  Download,
  Flag,
  CheckCircle2,
  Sparkles,
  Globe2,
  Layers,
  ShieldAlert,
  Eye,
  ImageIcon as Original,
} from 'lucide-react'
import MediaUploadZone from '../components/MediaUploadZone'
import MediaPreview, { PreviewMode, HeatRegion } from '../components/MediaPreview'
import AnalysisResultCard from '../components/AnalysisResultCard'
import type { FindingTone } from '../components/AnalysisResultCard'
import TrustScoreIndicator from '../components/TrustScoreIndicator'
import ConfirmationModal from '../components/ConfirmationModal'
import { EmptyState } from '../components/EmptyState'
import { useToast } from '../components/ToastProvider'
import { hashString } from '../lib/types'
import { DEFAULT_STAGES } from '../lib/data'
import { CURRENT_USER } from '../lib/data'
import { apiAnalyze, apiFlagVerification, apiAddReport } from '../lib/api'

// ─── Types for the real backend response ──────────────────────────────────────

interface FileInfo {
  name: string
  size: number
  type: string
  width: number
  height: number
  url: string
}

interface Results {
  trustScore: number
  aiProbability: number
  aiTone: FindingTone
  manipulation: number
  regions: HeatRegion[]
  metadataScore: number
  metadataTone: FindingTone
  provenance: string
  provenanceTone: FindingTone
  noise: number
  clone: number
  exifRows: { key: string; value: string; mono?: boolean }[]
  sha256?: string
}

type ServerTone = 'success' | 'warning' | 'danger'

const toTone = (t: ServerTone): FindingTone =>
  t === 'success' ? 'positive' : t === 'warning' ? 'uncertain' : 'suspicious'

// ─── Small helpers ─────────────────────────────────────────────────────────────

const fmtBytes = (b: number): string =>
  b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b > 1024 ? (b / 1024).toFixed(0) + ' KB' : b + ' B'

function Toggle({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (_v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg px-1 py-1.5 ${disabled ? 'opacity-50' : ''}`}>
      <span className="min-w-0">
        <span className="block text-tiny font-medium text-ink">{label}</span>
        <span className="block text-micro text-ink3">{desc}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? 'bg-accent/80' : 'bg-elevated2 ring-1 ring-line'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}

const RISK_FROM_SCORE = (s: number): { label: string; cls: string } =>
  s >= 85
    ? { label: 'Authentic', cls: 'bg-success/10 text-success border-success/30' }
    : s >= 65
      ? { label: 'Low Risk', cls: 'bg-success/10 text-success border-success/30' }
      : s >= 45
        ? { label: 'Moderate Risk', cls: 'bg-warning/10 text-warning border-warning/30' }
        : s >= 25
          ? { label: 'High Risk', cls: 'bg-danger/10 text-danger border-danger/30' }
          : { label: 'Critical', cls: 'bg-danger/15 text-danger border-danger/40' }

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyzeMedia() {
  const { toast } = useToast()

  const [file, setFile] = useState<FileInfo | null>(null)
  const [phase, setPhase] = useState<'empty' | 'ready' | 'scanning' | 'done'>('empty')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Results | null>(null)
  const rawFileRef = useRef<File | null>(null)
  const recordIdRef = useRef<string | null>(null)

  const [mode, setMode] = useState<PreviewMode>(PreviewMode.Original)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [optEla, setOptEla] = useState(true)
  const [optHeat, setOptHeat] = useState(true)
  const [optDeepfake, setOptDeepfake] = useState(true)
  const [sensitivity, setSensitivity] = useState('Balanced')

  const [confirmFlag, setConfirmFlag] = useState(false)
  const [flagged, setFlagged] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelRef = useRef(false)

  const stageCount = DEFAULT_STAGES.length
  const stageIndex = Math.min(stageCount - 1, Math.floor((progress / 100) * stageCount))

  const accept = useCallback(
    (f: File) => {
      const url = URL.createObjectURL(f)
      const img = new Image()
      const fallback = () => {
        const info: FileInfo = {
          name: f.name,
          size: f.size,
          type: (f.type.split('/')[1] || 'bin').toUpperCase(),
          width: 0,
          height: 0,
          url,
        }
        rawFileRef.current = f
        setFile(info)
        setPhase('ready')
        setResults(null)
        setFlagged(false)
        setMode(PreviewMode.Original)
        toast('success', 'Asset loaded', `${f.name} ready for forensic analysis.`)
      }
      img.onload = () => {
        rawFileRef.current = f
        setFile({
          name: f.name,
          size: f.size,
          type: (f.type.split('/')[1] || 'image').toUpperCase(),
          width: img.naturalWidth,
          height: img.naturalHeight,
          url,
        })
        setPhase('ready')
        setResults(null)
        setFlagged(false)
        setMode(PreviewMode.Original)
        toast('success', 'Asset loaded', `${f.name} ready for forensic analysis.`)
      }
      img.onerror = fallback
      img.src = url
    },
    [toast],
  )

  // sample asset generator (stand-in demo image)
  const loadSample = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 680
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const bg = ctx.createLinearGradient(0, 0, 1024, 680)
    bg.addColorStop(0, '#17171C')
    bg.addColorStop(1, '#3b2026')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 1024, 680)
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(255,${59 + i * 6},${48 + i * 3},${0.05 + (i % 5) * 0.02})`
      ctx.beginPath()
      ctx.arc((i * 149) % 1024, (i * 213) % 680, 30 + (i % 7) * 26, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#F5F5F7'
    ctx.font = '600 30px Inter, sans-serif'
    ctx.fillText('CreativeTrust Sample Asset', 60, 92)
    ctx.font = '400 17px Inter, sans-serif'
    ctx.fillStyle = '#A1A1AA'
    ctx.fillText('Synthetic test image · Peach Bloom Study 03', 60, 124)
    canvas.toBlob((blob) => {
      if (!blob) return
      const f = new File([blob], 'creative-trust_sample_peachbloom.png', { type: 'image/png' })
      accept(f)
    }, 'image/png')
  }, [accept])

  // scanning engine — drives the stage UI while the real API analyzes the bytes
  const startScan = useCallback(async () => {
    const raw = rawFileRef.current
    if (!raw || phase === 'scanning') return
    cancelRef.current = false
    setPhase('scanning')
    setProgress(0)
    setResults(null)
    setShowHeatmap(optHeat)
    let done = false
    timerRef.current = setInterval(() => {
      setProgress((p) => (done ? 100 : Math.min(93, p + 0.7 + Math.random() * 1.2)))
    }, 55)

    try {
      const res = await apiAnalyze(raw, CURRENT_USER.name)
      if (cancelRef.current) return
      done = true
      if (timerRef.current) clearInterval(timerRef.current)
      recordIdRef.current = res.record.id
      setResults({
        ...res.results,
        aiTone: toTone(res.results.aiTone),
        metadataTone: toTone(res.results.metadataTone),
        provenanceTone: toTone(res.results.provenanceTone),
      })
      setProgress(100)
      setTimeout(() => setPhase('done'), 240)
      toast('success', 'Analysis complete', `${res.record.asset} → trust ${res.results.trustScore}/100 · recorded as ${res.record.id}`)
    } catch (err) {
      if (cancelRef.current) return
      done = true
      if (timerRef.current) clearInterval(timerRef.current)
      setPhase(rawFileRef.current ? 'ready' : 'empty')
      setProgress(0)
      toast('error', 'Analysis failed', err instanceof Error ? err.message : 'The backend is unreachable.')
    }
  }, [optHeat, phase, toast])

  const cancelScan = () => {
    cancelRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase(file ? 'ready' : 'empty')
    setProgress(0)
    toast('info', 'Analysis cancelled', 'No report was generated.')
  }

  const reset = () => {
    if (file) URL.revokeObjectURL(file.url)
    rawFileRef.current = null
    recordIdRef.current = null
    setFile(null)
    setPhase('empty')
    setResults(null)
    setProgress(0)
    setFlagged(false)
  }

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const risk = results ? RISK_FROM_SCORE(results.trustScore) : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-ink">Analyze Media</h1>
          <p className="mt-1 text-body text-ink2">
            Run forensic analysis on visual assets — manipulation, AI content, metadata and provenance.
          </p>
        </div>
        {phase === 'done' && results && (
          <div className="flex items-center gap-2.5">
            <button
              className="btn-secondary btn-md"
              onClick={() =>
                apiAddReport(`${file?.name ?? 'asset'} Forensic Report`, 'Analyze Media')
                  .then(() => toast('success', 'Forensic report queued', 'Find the artifact in Reports once generation completes.'))
                  .catch(() => toast('error', 'Export failed', 'Could not reach the backend.'))
              }
            >
              <Download className="h-4 w-4" />
              Export Report
            </button>
            <button
              className="btn-secondary btn-md"
              onClick={() => setConfirmFlag(true)}
              disabled={flagged}
            >
              <Flag className={`h-4 w-4 ${flagged ? 'text-warning' : ''}`} />
              {flagged ? 'Flagged for review' : 'Flag for Review'}
            </button>
          </div>
        )}
      </header>

      {/* 3-column workspace */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[290px_minmax(0,1fr)_330px]">
        {/* LEFT: upload + settings */}
        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="flex items-center gap-2 text-card-title font-semibold text-ink">
              <UploadIcon />
              Upload Panel
            </h2>
            <p className="mt-1 text-micro text-ink3">Drag & drop, browse, or generate a test asset.</p>
            <div className="mt-3">
              <MediaUploadZone onFile={accept} disabled={phase === 'scanning'} />
            </div>
            {phase === 'empty' && (
              <button className="btn-ghost btn-sm mt-2 w-full" onClick={loadSample}>
                <Sparkles className="h-3.5 w-3.5" />
                Use sample asset
              </button>
            )}

            {file && (
              <dl className="mt-3.5 space-y-2 rounded-lg border border-line bg-elevated p-3">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <FileImage className="h-4 w-4 shrink-0 text-accent" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink" title={file.name}>
                    {file.name}
                  </span>
                  <button
                    className="btn-ghost h-6 w-6 p-0 text-micro"
                    onClick={reset}
                    disabled={phase === 'scanning'}
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                </div>
                {[
                  { icon: FileType2, k: 'Format', v: file.type },
                  { icon: HardDrive, k: 'Size', v: fmtBytes(file.size) },
                  { icon: Ruler, k: 'Dimensions', v: `${file.width} × ${file.height} px` },
                ].map((row) => (
                  <div key={row.k} className="flex items-center justify-between text-tiny">
                    <span className="flex items-center gap-1.5 text-ink3">
                      <row.icon className="h-3 w-3" />
                      {row.k}
                    </span>
                    <span className="font-medium text-ink2">{row.v}</span>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="card p-4">
            <h2 className="flex items-center gap-2 text-card-title font-semibold text-ink">
              <SettingsIcon />
              Analysis Settings
            </h2>
            <div className="mt-2.5 space-y-1.5">
              <Toggle label="Error-Level Analysis" desc="ELA baseline & compression deltas" checked={optEla} onChange={setOptEla} disabled={phase === 'scanning'} />
              <Toggle label="Heatmap overlay" desc="Mark suspicious regions on preview" checked={optHeat} onChange={setOptHeat} disabled={phase === 'scanning'} />
              <Toggle label="Deepfake scan" desc="Diffusion-artifact classifier v4" checked={optDeepfake} onChange={setOptDeepfake} disabled={phase === 'scanning'} />
            </div>

            <label className="mt-3 block text-micro font-medium text-ink2" htmlFor="sensitivity">
              Detector sensitivity
            </label>
            <select
              id="sensitivity"
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value)}
              disabled={phase === 'scanning'}
              className="select-base mt-1.5 w-full text-[13px]"
            >
              <option>Conservative</option>
              <option>Balanced</option>
              <option>Forensic (strict)</option>
            </select>

            <div className="mt-4">
              {phase === 'scanning' ? (
                <button className="btn-secondary btn-md w-full" onClick={cancelScan}>
                  <Square className="h-4 w-4" />
                  Cancel Analysis
                </button>
              ) : (
                <button
                  className="btn-primary btn-md w-full"
                  onClick={startScan}
                  disabled={!file || phase === 'done'}
                >
                  <ScanSearch className="h-4 w-4" />
                  {phase === 'done' ? 'Analysis Complete' : 'Run Analysis'}
                </button>
              )}
            </div>
            {phase === 'done' && file && (
              <button
                className="btn-ghost btn-sm mt-2 w-full"
                onClick={() => {
                  setPhase('ready')
                  setResults(null)
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Analyze again
              </button>
            )}
          </section>
        </div>

        {/* CENTER: preview */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-line bg-elevated p-0.5" role="tablist" aria-label="Preview mode">
              {(
                [
                  { key: PreviewMode.Original, label: 'Original', icon: Original },
                  { key: PreviewMode.Ela, label: 'ELA View', icon: Layers },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={mode === t.key}
                  onClick={() => setMode(t.key)}
                  disabled={phase !== 'done' && phase !== 'ready'}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all ${
                    mode === t.key ? 'bg-accent-dim text-accent' : 'text-ink3 hover:text-ink2 disabled:opacity-40'
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
            {results && results.regions.length > 0 && (
              <button
                onClick={() => setShowHeatmap((v) => !v)}
                className={`btn-sm btn ${showHeatmap ? 'bg-accent-dim text-accent' : 'btn-secondary'}`}
                aria-pressed={showHeatmap}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Heatmap {showHeatmap ? 'On' : 'Off'}
              </button>
            )}
          </div>

          {file ? (
            <MediaPreview
              src={file.url}
              scanning={phase === 'scanning'}
              showHeatmap={showHeatmap && phase === 'done' && !!results}
              heatRegions={results?.regions ?? []}
              mode={mode}
              infoLabel={`${file.width}×${file.height}`}
            />
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-lineBright/60 bg-card/40 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-elevated">
                <ScanSearch className="h-6 w-6 text-ink3" />
              </div>
              <p className="mt-4 text-body font-medium text-ink">No media loaded</p>
              <p className="mt-1.5 max-w-xs text-tiny leading-relaxed text-ink2">
                Upload an image from the left panel — the forensic preview, ELA view and heatmap will render here.
              </p>
            </div>
          )}

          {phase === 'scanning' && file && (
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <p className="text-tiny font-medium text-ink">Analyzing {file.name}…</p>
                <p className="tabular font-mono text-tiny text-accent">{Math.floor(progress)}%</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-base">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-[width] duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {DEFAULT_STAGES.map((s, i) => (
                  <li
                    key={s.key}
                    className={`flex items-center gap-2 text-micro ${i < stageIndex ? 'text-ink2' : i === stageIndex ? 'text-accent' : 'text-ink3'}`}
                  >
                    {i < stageIndex ? (
                      <CheckCircle2 className="h-3 w-3 text-success" />
                    ) : i === stageIndex ? (
                      <span className="h-3 w-3 rounded-full border-2 border-accent/40 border-t-accent animate-dashRotate" />
                    ) : (
                      <span className="h-3 w-3 rounded-full border border-line" />
                    )}
                    {s.key}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT: results */}
        <div className="space-y-4">
          {phase !== 'done' || !results ? (
            <section className="card flex min-h-[520px] flex-col items-center justify-center p-6 text-center">
              {phase === 'scanning' ? (
                <>
                  <div className="relative flex h-16 w-16 items-center justify-center">
                    <span className="absolute inset-0 rounded-full border-2 border-accent/25" />
                    <span className="absolute inset-0 animate-dashRotate rounded-full border-2 border-transparent border-t-accent" style={{ animationDuration: '1s' }} />
                    <ScanSearch className="h-6 w-6 text-accent" />
                  </div>
                  <p className="mt-4 text-[13px] font-semibold text-ink">Forensic pipeline running</p>
                  <p className="mt-1 text-tiny text-ink2">
                    Stage {stageIndex + 1} of {stageCount} · {DEFAULT_STAGES[stageIndex].key}
                  </p>
                </>
              ) : (
                <EmptyState
                  icon={Eye}
                  title="No analysis yet"
                  description="Run an analysis to generate the AI-content, manipulation, metadata and provenance report for this asset."
                />
              )}
            </section>
          ) : (
            <>
              {/* Trust score */}
              <section className="card flex flex-col items-center p-5">
                <TrustScoreIndicator value={results.trustScore} label="Overall Trust Score" sublabel={`${sensitivity} sensitivity`} />
                <div className={`mt-4 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${risk?.cls}`}>
                  {risk?.label}
                </div>
                <p className="mt-2 text-center text-micro text-ink3">
                  Computed server-side · run {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}{results.sha256 ? ` · digest ${results.sha256.slice(0, 10)}…` : ''}
                </p>
                <div className="mt-4 w-full space-y-2 border-t border-line pt-4">
                  {[
                    { label: 'Noise consistency', value: results.noise, invert: true },
                    { label: 'Clone/stamp detection', value: results.clone, invert: false },
                    { label: 'Metadata reliability', value: results.metadataScore, invert: false },
                    { label: 'AI-generation confidence', value: results.aiProbability, invert: true },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="mb-1 flex justify-between text-micro">
                        <span className="text-ink2">{b.label}</span>
                        <span className="tabular font-medium text-ink2">{b.value}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-base">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            b.invert ? (b.value > 60 ? 'bg-danger' : b.value > 30 ? 'bg-warning' : 'bg-success') : b.value > 70 ? 'bg-success' : b.value > 40 ? 'bg-warning' : 'bg-danger'
                          }`}
                          style={{ width: `${Math.max(4, b.value)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Result cards */}
              <AnalysisResultCard
                icon={Sparkles}
                title="AI Content Detection"
                tone={results.aiTone}
                badge={results.aiProbability >= 65 ? 'Likely AI-Generated' : results.aiProbability >= 32 ? 'Inconclusive' : 'No AI signature'}
                summary={
                  results.aiProbability >= 65
                    ? `Diffusion artifacts consistent with generative models detected.`
                    : results.aiProbability >= 32
                      ? `Mixed signals — baseline frequency statistics show partial generative characteristics.`
                      : `No generative model signatures above threshold.`
                }
                bars={[{ label: 'AI-generation probability', value: results.aiProbability }]}
                details={[
                  { key: 'Classifier', value: 'c2pa-forensics v4.2.0' },
                  { key: 'Artifact score', value: `${results.aiProbability} / 100` },
                  { key: 'Sensitivity', value: sensitivity },
                ]}
                footnote="Inconclusive results are probabilistic and require reporter review before any editorial decision."
              />

              <AnalysisResultCard
                icon={Layers}
                title="Image Manipulation Analysis"
                tone={results.manipulation > 45 ? 'suspicious' : results.manipulation > 25 ? 'uncertain' : 'positive'}
                badge={results.manipulation > 45 ? 'Local edits detected' : results.manipulation > 25 ? 'Minor edits' : 'No tampering'}
                summary={
                  results.regions.length > 0
                    ? `${results.regions.length} region(s) deviate from the global noise & compression baseline.`
                    : 'Error-level and PRNU analysis found no deviations from the camera baseline.'
                }
                bars={[{ label: 'Composite likelihood', value: results.manipulation }]}
                details={[
                  { key: 'ELA pass', value: optEla ? 'Completed' : 'Skipped by settings' },
                  { key: 'Flagged regions', value: String(results.regions.length) },
                  { key: 'Resampling score', value: `${results.noise} / 100` },
                ]}
              />

              <AnalysisResultCard
                icon={FileImage}
                title="Metadata Integrity"
                tone={results.metadataTone}
                badge={results.metadataScore >= 75 ? 'Intact' : results.metadataScore >= 40 ? 'Partial' : 'Stripped / inconsistent'}
                summary={
                  results.metadataScore >= 75
                    ? 'EXIF/XMP present with coherent capture chain.'
                    : results.metadataScore >= 40
                      ? 'Metadata present but partially redacted by an editing pipeline.'
                      : 'EXIF block missing fields expected from a camera source.'
                }
                bars={[{ label: 'Metadata completeness', value: results.metadataScore }]}
                details={results.exifRows.map((r) => ({ key: r.key, value: r.value, mono: false }))}
              />

              <AnalysisResultCard
                icon={Globe2}
                title="Content Provenance"
                tone={results.provenanceTone}
                badge={results.provenanceTone === 'positive' ? 'Credentials valid' : results.provenanceTone === 'suspicious' ? 'Chain broken' : 'Not attached'}
                summary={results.provenance}
                details={[
                  { key: 'C2PA status', value: results.provenanceTone === 'positive' ? 'Valid' : results.provenanceTone === 'suspicious' ? 'Manifest invalid' : 'No claims', mono: false },
                  { key: 'Registry lookup', value: 'Adobe Content Authenticity', mono: false },
                  { key: 'Vault reference', value: 'CV-' + (results.sha256 ? parseInt(results.sha256.slice(0, 8), 16) % 100000 : Math.abs(hashString(file?.name ?? '')) % 100000), mono: true },
                ]}
                defaultOpen={false}
              />
            </>
          )}
        </div>
      </div>

      <ConfirmationModal
        open={confirmFlag}
        onClose={() => setConfirmFlag(false)}
        onConfirm={() => {
          setFlagged(true)
          const id = recordIdRef.current
          if (id) {
            apiFlagVerification(id)
              .then(() => toast('warning', 'Asset flagged for review', `Record ${id} escalated to the integrity queue.`))
              .catch(() => toast('error', 'Flag failed', 'Could not reach the backend — the record stays unflagged.'))
          } else {
            toast('warning', 'Asset flagged locally', 'No server record was linked to this run.')
          }
        }}
        title="Flag this asset for review?"
        description="The asset and its forensic report will be escalated to the workspace integrity queue for human adjudication."
        confirmLabel="Flag asset"
      />
    </div>
  )
}

function UploadIcon() {
  return <ScanSearch className="h-3.5 w-3.5 text-accent" />
}
function SettingsIcon() {
  return <FileType2 className="h-3.5 w-3.5 text-accent" />
}
