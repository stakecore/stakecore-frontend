import { useEffect, useState } from "react"
import { Formatter } from "~/utils/misc/formatter"

type MetadataItem = { label: string; value: string | number }

export type EpochPeriod = {
  startMs: number
  endMs: number
  metadata: MetadataItem[]
}

type Props = {
  /** Compute the current period boundaries and metadata from a timestamp */
  period: (now: number) => EpochPeriod
  /** Optional accent color for the fill (default: white) */
  color?: string
}

const EpochProgress = ({ period, color = "white" }: Props) => {
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const { startMs, endMs, metadata } = period(now)
  const total = endMs - startMs
  const elapsed = Math.min(Math.max(now - startMs, 0), total)
  const progress = total > 0 ? (elapsed / total) * 100 : 0
  const remaining = Math.max(endMs - now, 0)

  return (
    <div style={styles.wrapper}>
      {metadata.length > 0 && (
        <div style={styles.metaRow}>
          {metadata.map((m) => (
            <span key={m.label} style={styles.pill}>
              <span style={styles.pillLabel}>{m.label}</span>
              <span style={styles.pillValue}>{m.value}</span>
            </span>
          ))}
        </div>
      )}

      <div style={styles.barOuter}>
        <div
          style={{
            ...styles.barFill,
            width: `${progress}%`,
            background: color,
          }}
        />
      </div>

      <div style={styles.footer}>
        <span style={styles.footerText}>{progress.toFixed(1)}%</span>
        <span style={styles.footerText}>{Formatter.duration(remaining)} remaining</span>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: "100%",
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10.5,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 13,
  },
  pillLabel: {
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    fontWeight: 500,
  },
  pillValue: {
    color: "rgba(255,255,255,0.9)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
  },
  barOuter: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 1s linear",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 6,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontVariantNumeric: "tabular-nums",
  },
  footerText: {},
}

export default EpochProgress
