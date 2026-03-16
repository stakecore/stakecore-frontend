import { useMemo } from "react"
import { Formatter } from "~/utils/misc/formatter"

const MAX_PERC = 100

const LEDS_PER_PIXEL = 0.035
const MIN_LEDS = 10
const MAX_LEDS = 70

const OPACITY_BEFORE = 0.25
const OPACITY_AFTER = 1

const COLOR_BAD = ["#d94357", "radial-gradient(#d94357 25%, #a82234)"]
const COLOR_MED = ["#e58630", "radial-gradient(#a05714 25%, #dd781c)"]
const COLOR_GUD = ["#76B768", "radial-gradient(#487e3c 25%, #64ae55)"]
const COLORS = [COLOR_BAD, COLOR_MED, COLOR_GUD]

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

    const data: { color: string[], opacity: number }[] = []
    for (let i = 0; i < leds; i++) {
      const ratio = getRatio(i)
      const color = getColorIdx(ratio, scaledValue)
      const opacity = scaledValue < ratio ? OPACITY_BEFORE : OPACITY_AFTER
      data.push({ color: COLORS[color], opacity })
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
              key={i} style={{ background: d.color[1], opacity: d.opacity }}></span>
          })
        }
        <span className='meter-bar-desc' style={{ color: COLORS[valueidx][0] }}>
          { text ?? Formatter.percent(scaledValue / MAX_PERC) }
        </span>
      </div>
    </div>
  );
};

export default MeterBar
