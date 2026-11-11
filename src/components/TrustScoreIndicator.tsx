import { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider'

interface Props {
  /** 0–100 value */
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
}

/** Deterministic color intepolation for the trust score ring. */
function ringColor(v: number): string {
  if (v >= 80) return '#32D583'
  if (v >= 55) return '#F5B942'
  return '#FF3B30'
}

export default function TrustScoreIndicator({
  value,
  size = 168,
  strokeWidth = 10,
  label = 'Trust Score',
  sublabel,
}: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  const [shown, setShown] = useState(0)

  useEffect(() => {
    // counts up to the target; restarts when the value changes
    setShown(0)
    const start = performance.now()
    const dur = 900
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(clamped * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clamped])

  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const color = ringColor(shown)
  const { palette } = useTheme()

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={palette.radialTrack}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * shown) / 100}
          style={{ transition: 'stroke-dashoffset 80ms linear, stroke 300ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-medium tracking-tight" style={{ color }}>
          {shown}
          <span className="text-xl text-ink3">/100</span>
        </span>
        <span className="mt-1 text-tiny font-medium text-ink2">{label}</span>
        {sublabel && <span className="mt-0.5 text-micro text-ink3">{sublabel}</span>}
      </div>
    </div>
  )
}
