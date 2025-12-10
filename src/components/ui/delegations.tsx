import useSWR from "swr"
import { AvalancheDelegationDto } from "~/backendApi"
import { Formatter } from "~/utils/misc/formatter"
import { unixnow } from "~/utils/misc/time"
import { REFRESH_QUERY_FAST_MS } from "~/constants"


const DelegatorList = ({ delegators }: { delegators: AvalancheDelegationDto[] }) => {
  let { data: now } = useSWR('delegator-list-refresh', (_) => null, { refreshInterval: REFRESH_QUERY_FAST_MS })
  now = unixnow()

  const delegations = Array.from(delegators).map((v, i) => {
    const duration = v.endTime - v.startTime
    const perc = Formatter.number(Math.min((now - v.startTime) / duration, 100))

    const str = Formatter.date(v.startTime)
    const end = Formatter.date(v.endTime)
    const del = Formatter.number(v.delegated)
    const rew = Formatter.number(v.reward + v.delegated)

    return <div key={i}>
      <div>
        <span style={{ float: 'left' }}>{del} AVAX at {str}</span>
        <span style={{ float: 'right' }}>{rew} AVAX at {end}</span>
      </div>
      <div className="progress-bar" style={{ position: 'relative' }}>
        <div className="center" style={{ fontSize: '16px', position: 'absolute' }}>{perc}%</div>
        <div className="progress-fill" style={{ width: `${perc}%` }}>
          &nbsp;
        </div>
      </div>
    </div>
  })
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    {delegations}
  </div>

}

export default DelegatorList