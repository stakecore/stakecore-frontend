export const Diff = ({ diff, unit = "", pill = false }) => {
  let color = '#50e3c2'
  const neg = typeof diff == 'string' && diff.startsWith('-')
  if (neg) {
    diff = diff.slice(1)
    color = '#ff3e55'
  }

  const pillStyle = pill ? {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 6,
    backgroundColor: neg ? 'rgba(255, 62, 85, 0.12)' : 'rgba(80, 227, 194, 0.12)',
    fontSize: 'inherit',
  } : {}

  return <span style={{ color, ...pillStyle }}>
    <svg width="10" height="10" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d={neg ? "M4 8L12 18L20 8Z" : "M4 16L12 6L20 16Z"} />
    </svg>
    <span style={{ marginLeft: pill ? 0 : 5 }}>{diff} {unit}</span>
  </span>
}
