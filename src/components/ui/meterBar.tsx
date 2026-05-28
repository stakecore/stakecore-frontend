import { useMemo } from "react"
import { Formatter } from "~/utils/misc/formatter"
import './meterBar.scss'

const MAX_PERC = 100

const LEDS_PER_PIXEL = 0.035
const MIN_LEDS = 10
const MAX_LEDS = 70

const OPACITY_BEFORE = 0.25
const OPACITY_AFTER = 1

// Bespoke status palette for the meter LEDs. Each tier carries the flat
// label colour + the radial gradient used to render the LED itself.
type StatusPalette = { label: string, gradient: string }

const STATUS_BAD:    StatusPalette = { label: '#d94357', gradient: 'radial-gradient(#d94357 25%, #a82234)' }
const STATUS_MEDIUM: StatusPalette = { label: '#e58630', gradient: 'radial-gradient(#a05714 25%, #dd781c)' }
const STATUS_GOOD:   StatusPalette = { label: '#76B768', gradient: 'radial-gradient(#487e3c 25%, #64ae55)' }
const STATUS_PALETTE = [STATUS_BAD, STATUS_MEDIUM, STATUS_GOOD]

type args = {
  name: string
  ranges: [number, number]
  value: number
  text?: string
  height?: number
  reverse?: boolean
}

const MeterBar = ({ name, value, text, ranges, height = 40 }: args) => {
  const leds = Math.min(Math.max(LEDS_PER_PIXEL * window.innerWidth, MIN_LEDS), MAX_LEDS)

  const scaledValue = value * MAX_PERC

  const { data, valueidx } = useMemo(() => {
    let valueidx = 0

    function getRatio(index: number) {
      return Math.floor(MAX_PERC * index / leds)
    }

    function getColorIdx(ratio: number, val: number): number {
      if (ratio < val) return valueidx
      let coloridx = null
      for (let i = 0; i < ranges.length; i++) {
        if (ranges[i] >= ratio) {
          coloridx = i
          break
        }
      }
      return coloridx ?? ranges.length
    }

    valueidx = getColorIdx(scaledValue, -1)

    const data: { palette: StatusPalette, opacity: number }[] = []
    for (let i = 0; i < leds; i++) {
      const ratio = getRatio(i)
      const idx = getColorIdx(ratio, scaledValue)
      const opacity = scaledValue < ratio ? OPACITY_BEFORE : OPACITY_AFTER
      data.push({ palette: STATUS_PALETTE[idx], opacity })
    }

    return { data, valueidx }
  }, [scaledValue, leds, ranges])

  return (
    <div className="meter-bar-container">
      <h5 className='meter-bar-title'>{name}</h5>
      <div className='meter-bar' style={{ height }}>
        {
          data.map((d, i) => {
            return <span className='meter-bar-led'
              key={i} style={{ background: d.palette.gradient, opacity: d.opacity }}></span>
          })
        }
        <span className='meter-bar-desc' style={{ color: STATUS_PALETTE[valueidx].label }}>
          { text ?? Formatter.percent(scaledValue / MAX_PERC) }
        </span>
      </div>
    </div>
  );
};

export default MeterBar
