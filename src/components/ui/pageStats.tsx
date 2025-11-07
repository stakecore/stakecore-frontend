import { useEffect } from "react"
import { SpinnerCircular } from "spinners-react"
import useSWR, { mutate } from "swr"
import { PageDataService } from "~/backendApi"
import { Formatter } from "~/utlits/misc/formatter"


const DelegationCounter = () => {
  const { data, isLoading, error } = useSWR(['page-total-delegated'], (_) => {
    return PageDataService.pageControllerGetTotalDelegated()
  }, {
    refreshInterval: 30_000,
    revalidateOnReconnect: true
  })

  let delegated = null
  let delegators = null
  if (data?.data != null) {
    delegated = Formatter.number(data.data.results.reduce((x, y) => x + y.delegatedUsd, 0), 3)
    delegators = data.data.results.reduce((x, y) => x + y.delegators, 0)
  } else if (isLoading) {
    delegated = <span style={{ marginLeft: 15 }}><SpinnerCircular color='FireBrick' size={25} /></span>
    delegators = <span style={{ marginRight: 15 }}><SpinnerCircular color='FireBrick' size={25} /></span>
  } else {
    delegated = <span>{String(error)}</span>
    delegators = <span>{String(error)}</span>
  }

  return <div className="page-stats-container">
    <div className="dashboard loading">

      <div className="metrics-grid">
        <div className="metric-card" data-start="0" data-end="7489" data-increment="1" data-speed="20">
          <div className="metric-title">
            Total Delegated
          </div>
          <div className="counter-wrapper">
            <span className="counter-unit">$</span>
            <div className="counter" id="counter-1">{delegated}</div>
          </div>
          <div className="metric-trend trend-up">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>12.4% in last 24h</span>
          </div>
        </div>

        <div className="metric-card" data-start="0" data-end="843217" data-increment="100" data-speed="5">
          <div className="metric-title">
            Our Delegators
          </div>
          <div className="counter-wrapper">
            <div className="counter" id="counter-2">{delegators}</div>
            <span className="counter-unit">users</span>
          </div>
          <div className="metric-trend trend-up">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>8.7% in last 24h</span>
          </div>
        </div>

      </div>
    </div>
  </div>
}

export default DelegationCounter