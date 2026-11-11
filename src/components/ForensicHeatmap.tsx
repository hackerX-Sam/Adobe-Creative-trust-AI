import { HeatRegion } from './MediaPreview'

/** Legend + forensic detail panel that pairs with the heatmap overlay. */
export default function ForensicHeatmap({
  regions,
  title = 'Suspicious-Region Heatmap',
}: {
  regions: HeatRegion[]
  title?: string
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-card-title font-semibold text-ink">{title}</h3>
        <span className="font-mono text-micro text-ink3">{regions.length} flagged</span>
      </div>

      {regions.length === 0 ? (
        <p className="mt-3 text-tiny text-ink3">No regions exceeding the suspicion threshold were recovered.</p>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {regions.map((r, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-line bg-elevated px-3 py-2">
                <span
                  className="flex h-6 w-9 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, rgba(255,59,48,${r.intensity}), rgba(255,106,0,${r.intensity * 0.7}))`,
                  }}
                >
                  R{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-tiny font-medium text-ink">
                    Region R{i + 1} — {(r.intensity * 100).toFixed(0)}% anomaly
                  </p>
                  <p className="font-mono text-micro text-ink3">
                    pos {r.x.toFixed(0)}%, {r.y.toFixed(0)}% · {r.w.toFixed(0)}×{r.h.toFixed(0)}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 text-micro text-ink3">
            <span>Low</span>
            <span
              className="h-1.5 flex-1 rounded-full"
              style={{ background: 'linear-gradient(90deg, rgba(255,59,48,0.15), rgba(255,59,48,0.85))' }}
            />
            <span>High</span>
          </div>
        </>
      )}
    </div>
  )
}
