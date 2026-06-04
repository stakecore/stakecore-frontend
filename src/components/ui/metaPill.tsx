import type { ReactNode } from "react"
import './metaPill.scss'


// Small label-value pill used as a compact metadata indicator. Original
// home was EpochProgress (the "Validator Expiration" pill above the
// progress bar); now also the building block for the validator stats
// strip + capacity legend so all on-page metadata reads in one style.
const MetaPill = ({ label, value, leading }: {
  label: string
  // Renderable so callers can drop in formatted numbers, units, etc.
  value: ReactNode
  // Optional visual lead (e.g. a coloured square in a capacity legend).
  leading?: ReactNode
}) => (
  <span className="meta-pill">
    {leading && <span className="meta-pill-leading" aria-hidden>{leading}</span>}
    <span className="meta-pill-label">{label}</span>
    <span className="meta-pill-value">{value}</span>
  </span>
)

export default MetaPill
