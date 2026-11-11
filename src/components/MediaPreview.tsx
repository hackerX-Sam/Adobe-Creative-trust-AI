import { Maximize2, ShieldAlert, Layers, Sparkles } from 'lucide-react'

export interface HeatRegion {
  /** percentages within the image box */
  x: number
  y: number
  w: number
  h: number
  intensity: number // 0.35 – 1
}

/** Suspicious-region heatmap rendered as soft radial overlays over the preview. */
export function HeatOverlay({ regions }: { regions: HeatRegion[] }) {
  return (
    <>
      {regions.map((r, i) => (
        <div
          key={i}
          className="animate-fadeIn pointer-events-none absolute rounded-lg"
          style={{
            left: `${r.x}%`,
            top: `${r.y}%`,
            width: `${r.w}%`,
            height: `${r.h}%`,
            border: `1.5px solid rgba(255,59,48,${0.55 * r.intensity})`,
            boxShadow: `0 0 24px rgba(255,59,48,${0.35 * r.intensity}), inset 0 0 18px rgba(255,59,48,${0.25 * r.intensity})`,
            background: `radial-gradient(ellipse at center, rgba(255,59,48,${0.28 * r.intensity}) 0%, rgba(255,59,48,0.08) 55%, transparent 75%)`,
          }}
        >
          <span
            className="absolute -top-[18px] left-0 rounded bg-danger px-1 py-px font-mono text-[9px] font-semibold leading-[14px] text-white"
            style={{ opacity: r.intensity }}
          >
            R{i + 1} · {(r.intensity * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </>
  )
}

function ScanLine() {
  return (
    <>
      <div className="animate-scan absolute inset-x-0 z-10 h-[3px] rounded-full">
        <div className="h-full w-full bg-accent shadow-[0_0_18px_4px_rgba(255,59,48,0.45)]" />
      </div>
      <div className="animate-scan absolute inset-x-0 z-[9]">
        <div
          className="h-[68px] -translate-y-2/3"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(255,59,48,0.10) 70%, rgba(255,59,48,0.22))',
          }}
        />
      </div>
    </>
  )
}

export enum PreviewMode {
  Original = 'original',
  Ela = 'ela',
}

export default function MediaPreview({
  src,
  scanning,
  showHeatmap,
  heatRegions,
  mode,
  infoLabel,
}: {
  src: string | null
  scanning: boolean
  showHeatmap: boolean
  heatRegions: HeatRegion[]
  mode: PreviewMode
  infoLabel: string
}) {
  if (!src) return null

  return (
    <div className="relative">
      <div
        className="stage relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-xl border border-line px-4 py-5"
      >
        <img
          src={src}
          alt="Media under analysis"
          draggable={false}
          className="max-h-[520px] max-w-full select-none rounded-lg object-contain"
          style={
            mode === PreviewMode.Ela
              ? {
                  filter:
                    'contrast(1.45) brightness(1.05) saturate(1.6) hue-rotate(-10deg) drop-shadow(0 0 1px rgba(0,0,0,0.9))',
                }
              : undefined
          }
        />

        {scanning && <ScanLine />}
        {showHeatmap && <HeatOverlay regions={heatRegions} />}

        {/* corner ticks */}
        <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l-2 border-t-2 border-white/25" />
        <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r-2 border-t-2 border-white/25" />
        <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b-2 border-l-2 border-white/25" />
        <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b-2 border-r-2 border-white/25" />

        {/* badges */}
        <div className="pointer-events-none absolute bottom-3.5 right-3.5 flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 font-mono text-[10px] text-ink2 backdrop-blur-sm">
            <Layers className="h-3 w-3" /> {mode === PreviewMode.Ela ? 'ELA APPROX' : 'RGB · 8BIT'}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 font-mono text-[10px] text-ink2 backdrop-blur-sm">
            <Maximize2 className="h-3 w-3" /> {infoLabel}
          </span>
          {showHeatmap && (
            <span className="flex items-center gap-1 rounded-md bg-danger/85 px-2 py-1 font-mono text-[10px] font-semibold text-white backdrop-blur-sm">
              <ShieldAlert className="h-3 w-3" /> {heatRegions.length} REGIONS
            </span>
          )}
          {scanning && (
            <span className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 font-mono text-[10px] font-semibold text-white">
              <Sparkles className="h-3 w-3" /> SCANNING
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
