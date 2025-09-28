const MAX_PERC = 100
const LED_TOTAL = 70

const OPACITY_BEFORE = 0.25
const OPACITY_AFTER = 1

const COLOR_BAD = "#d94357"
const COLOR_MED = "#e58630"
const COLOR_GUD = "#6aaa5e"
const COLORS = [COLOR_BAD, COLOR_MED, COLOR_GUD]

type args = {
  name: string
  value: number
  text: string
  ranges: [number, number]
  height: number
  reverse: boolean
}

const MeterBar = ({ name, value, text, ranges, height = 40, reverse = false }: args) => {

  function getPercentage(index: number) {
    return Math.floor(MAX_PERC * index / LED_TOTAL)
  }

  function getLedOpacity(perc: number) {
    return value < perc ? OPACITY_BEFORE : OPACITY_AFTER
  }

  function getLedColor(perc: number) {
    let coloridx = null
    for (let i = 0; i < ranges.length; i++) {
      if (perc < ranges[i]) {
        coloridx = i
        break
      }
    }
    if (coloridx == null) coloridx = ranges.length
    return reverse ? COLORS[ranges.length-coloridx] : COLORS[coloridx]
  }

  const valuecolor = getLedColor(value)
  const valuetext = text == null ? `${value}%` : text

  return (
    <div className="meter-bar-container">
      <h5 className='meter-bar-title'>{name}</h5>
      <div className='meter-bar' style={{ height }}>
        {
          Array.from(Array(LED_TOTAL).keys()).map((_, i) => {
            const ratio = getPercentage(i)
            const color = getLedColor(ratio)
            const opacity = getLedOpacity(ratio)
            return <span className='meter-bar-led'
              key={i} style={{ background: color, opacity }}></span>
          })
        }
        <span className='meter-bar-desc' style={{ color: valuecolor }}>{ valuetext }</span>
      </div>
    </div>
  );
};

export default MeterBar