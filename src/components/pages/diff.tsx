export const Diff = ({ diff, unit }) => {
  let color = '#50e3c2'
  const neg = typeof diff == 'string' && diff.startsWith('-')
  if (neg) {
    diff = diff.slice(1)
    color = '#ff3e55'
  }
  return <span style={{ color }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d={neg ? "M6 9L12 15L18 9" : "M18 15L12 9L6 15"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span style={{ marginLeft: 5 }}>{diff} {unit}</span>
  </span>
}