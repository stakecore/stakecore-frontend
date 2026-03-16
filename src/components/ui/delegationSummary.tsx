import { SpinnerCircular } from "spinners-react"
import { ApiResponseDto_PageStatsDto } from "~/backendApi"
import { Formatter } from "~/utils/misc/formatter"
import { Diff } from "../pages/diff"
import FlipCounter from "./flipCounter"
import { PAGE_COLOR_CODE } from "~/constants"
import useSWR from "swr"


const DelegationSummary = ({ data, isLoading, error }: {
  data: ApiResponseDto_PageStatsDto, isLoading: boolean, error: string
}) => {
  let delegated = null
  let delegators = null
  let delegatedDiff = null
  let delegatorDiff = null
  if (data?.data != null) {
    const _delegated0 = data.data.historicDelegations.reduce((x, y) => x + y.delegatedUsd, 0)
    const _delegated1 = data.data.delegated.reduce((x, y) => x + y.delegatedUsd, 0)
    const _delegators0 = data.data.historicDelegations.reduce((x, y) => x + y.delegators, 0)
    const _delegators1 = data.data.delegated.reduce((x, y) => x + y.delegators, 0)
    delegated = Formatter.number(_delegated1)
    delegators = Formatter.number(_delegators1)
    delegatedDiff = Formatter.percent(_delegated0 > 0 ? _delegated1 / _delegated0 - 1 : 0)
    delegatorDiff = Formatter.percent(_delegators0 > 0 ? _delegators1 / _delegators0 - 1 : 0)

  } else if (isLoading) {
    return <div style={{ textAlign: 'center' }}>
      <SpinnerCircular color={PAGE_COLOR_CODE} size={40} />
    </div>
  } else {
    console.log(String(error)) // should not happen
  }

  return <div className="metrics-grid loading">

    <div className="metric-card">
      <div className="metric-card-inner">
        <div className="metric-title">Total Delegated</div>
        <div className="counter-wrapper">
          <span className="counter-unit">$</span>
          <div className="counter"><FlipCounter value={delegated} /></div>
        </div>
        <div className="metric-trend">
          <Diff diff={delegatedDiff} unit={"in 24h"} pill />
        </div>
      </div>
    </div>

    <div className="metric-card">
      <div className="metric-card-inner">
        <div className="metric-title">Our Delegators</div>
        <div className="counter-wrapper">
          <div className="counter"><FlipCounter value={delegators} /></div>
          <span className="counter-unit">users</span>
        </div>
        <div className="metric-trend">
          <Diff diff={delegatorDiff} unit={"in 24h"} pill />
        </div>
      </div>
    </div>

  </div>
}

export default DelegationSummary
