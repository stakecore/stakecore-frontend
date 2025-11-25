import classNames from "classnames"

const MAX_PERC = 100
const LED_TOTAL = 70

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

const MeterBar = ({ name, value, text, ranges, height = 40, reverse = false }: args) => {
  value = value * MAX_PERC

  function getRatio(index: number) {
    return Math.floor(MAX_PERC * index / LED_TOTAL)
  }

  function getLedOpacity(ratio: number) {
    return value < ratio ? OPACITY_BEFORE : OPACITY_AFTER
  }

  function getLedColor(ratio: number) {
    let coloridx = null
    for (let i = 0; i < ranges.length; i++) {
      if (ratio < ranges[i]) {
        coloridx = i
        break
      }
    }
    if (coloridx == null) coloridx = ranges.length
    return reverse ? COLORS[ranges.length-coloridx] : COLORS[coloridx]
  }

  const valuecolor = getLedColor(value)
  const valuetext = text == null ? `${value}%` : text

  let data: { color: string[], opacity: number }[] = []
  for (let i = 0; i < LED_TOTAL; i++) {
    const ratio = getRatio(i)
    const color = getLedColor(ratio)
    const opacity = getLedOpacity(ratio)
    data.push({ color, opacity })
  }

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
        <span className='meter-bar-desc' style={{ color: valuecolor[0] }}>{ valuetext }</span>
      </div>
    </div>
  );
};

export default MeterBar