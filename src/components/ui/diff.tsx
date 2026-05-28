import './diff.scss'

// Bespoke data-viz colours for percent change (positive/negative).
// Tied to this component; not part of the theme palette.
const COLOR_POSITIVE = '#50e3c2'
const COLOR_NEGATIVE = '#ff3e55'
const BG_POSITIVE = 'rgba(80, 227, 194, 0.12)'
const BG_NEGATIVE = 'rgba(255, 62, 85, 0.12)'

export const Diff = ({ diff, unit = "", pill = false }) => {
  const neg = typeof diff === 'string' && diff.startsWith('-')
  const value = neg ? diff.slice(1) : diff
  const color = neg ? COLOR_NEGATIVE : COLOR_POSITIVE

  const pillStyle = pill ? { backgroundColor: neg ? BG_NEGATIVE : BG_POSITIVE } : undefined

  return (
    <span className={pill ? 'diff-pill' : undefined} style={{ color, ...pillStyle }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d={neg ? "M4 8L12 18L20 8Z" : "M4 16L12 6L20 16Z"} />
      </svg>
      <span className="diff-text">{value} {unit}</span>
    </span>
  )
}
