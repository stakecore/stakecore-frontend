import classNames from "classnames"
import { SpinnerCircular } from "spinners-react"
import { ApiResponseDto_PageStatsDto } from "~/backendApi"
import { Formatter } from "~/utils/misc/formatter"
import { PAGE_COLOR_CODE } from "~/constants"

const DOWN_ARROW = "M6 9L12 15L18 9"
const UP_ARROW = "M18 15L12 9L6 15"

const DelegatedStats = ({ data, isLoading, error }: {
  data: ApiResponseDto_PageStatsDto, isLoading: boolean, error: string
}) => {

  console.log(data)

  let delegated = null
  let delegators = null
  let delegatedDiff = null
  let delegatorDiff = null
  if (data?.data != null) {
    const _delegated0 = data.data.delegatedHistoric.reduce((x, y) => x + y.delegatedUsd, 0)
    const _delegated1 = data.data.delegated.reduce((x, y) => x + y.delegatedUsd, 0)
    const _delegators0 = data.data.delegatedHistoric.reduce((x, y) => x + y.delegators, 0)
    const _delegators1 = data.data.delegated.reduce((x, y) => x + y.delegators, 0)
    delegated = Formatter.number(_delegated1, 3)
    delegators = Formatter.number(_delegators1, 3)
    delegatedDiff = Formatter.percent(_delegated0 > 0 ? _delegated1 / _delegated0 - 1 : 0, 0)
    delegatorDiff = Formatter.percent(_delegators0 > 0 ? _delegators1 / _delegators0 - 1 : 0, 0)
  } else if (isLoading) {
    delegated = <span style={{ marginLeft: 15 }}><SpinnerCircular color={PAGE_COLOR_CODE} size={25} /></span>
    delegators = <span style={{ marginRight: 15 }}><SpinnerCircular color={PAGE_COLOR_CODE} size={25} /></span>
    delegatedDiff = <span style={{ marginRight: 15 }}><SpinnerCircular color={PAGE_COLOR_CODE} size={25} /></span>
    delegatorDiff = <span style={{ marginRight: 15 }}><SpinnerCircular color={PAGE_COLOR_CODE} size={25} /></span>
  } else {
    console.log(String(error))
  }

  const delegatedNeg = typeof delegatedDiff == 'string' && delegatedDiff.startsWith('-')
  const delegatorNeg = typeof delegatorDiff == 'string' && delegatorDiff.startsWith('-')

  if (delegatedNeg) {
    delegatedDiff = delegatedDiff.slice(1)
  }
  if (delegatorNeg) {
    delegatorDiff = delegatorDiff.slice(1)
  }

  return <div className="page-stats-container">
    <div className="dashboard loading">

      <div className="metrics-grid">
        <div className="metric-card" data-start="0" data-end="7489" data-increment="1" data-speed="10">
          <div className="metric-title">
            Total Delegated
          </div>
          <div className="counter-wrapper">
            <span className="counter-unit">$</span>
            <div className="counter" id="counter-1">{delegated}</div>
          </div>
          <div className={classNames('metric-trend', { 'trend-down': delegatedNeg, 'trend-up': !delegatedNeg })}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d={delegatedNeg ? DOWN_ARROW : UP_ARROW} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{delegatedDiff} in 24h</span>
          </div>
        </div>

        <div className="metric-card" data-start="0" data-end="843217" data-increment="100" data-speed="1">
          <div className="metric-title">
            Our Delegators
          </div>
          <div className="counter-wrapper">
            <div className="counter" id="counter-2">{delegators}</div>
            <span className="counter-unit">users</span>
          </div>
          <div className={classNames('metric-trend', { 'trend-down': delegatorNeg, 'trend-up': !delegatorNeg })}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d={delegatorNeg ? DOWN_ARROW : UP_ARROW} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{delegatorDiff} in 24h</span>
          </div>
        </div>

      </div>
    </div>
  </div>
}

export default DelegatedStats