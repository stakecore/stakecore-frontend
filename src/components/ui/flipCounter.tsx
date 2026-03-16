import { useEffect, useRef, useState } from "react"

const DURATION = 350

const FlipCounter = ({ value }: { value: string | null }) => {
  const [display, setDisplay] = useState(value)
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)
  const prevRef = useRef(value)

  useEffect(() => {
    if (value == null || value === prevRef.current) {
      prevRef.current = value
      setDisplay(value)
      return
    }

    // compare numeric values to determine direction
    const prev = parseFloat((prevRef.current ?? '0').replace(/,/g, ''))
    const next = parseFloat(value.replace(/,/g, ''))
    setDirection(next >= prev ? 'up' : 'down')
    setDisplay(value)

    const timer = setTimeout(() => {
      setDirection(null)
    }, DURATION)

    prevRef.current = value
    return () => clearTimeout(timer)
  }, [value])

  if (display == null) return null

  const chars = display.split('')

  return <span className="flip-counter">
    {chars.map((char, i) => {
      const isDigit = char >= '0' && char <= '9'
      if (!isDigit) {
        return <span key={`sep-${i}`} className="flip-char-static">{char}</span>
      }
      return <span
        key={`d-${i}`}
        className={`flip-char ${direction ? `flip-${direction}` : ''}`}
        style={{ animationDelay: `${i * 30}ms` }}
      >
        {char}
      </span>
    })}
  </span>
}

export default FlipCounter
