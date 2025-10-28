import useSWR from "swr"
import { AvalancheDelegationDto } from "~/backendApi"
import { Formatter } from "~/utlits/misc/formatter"
import { unixnow } from "~/utlits/misc/time"


const DelegatorList = ({ delegators }: { delegators: AvalancheDelegationDto[] }) => {
  let { data: now } = useSWR('delegator-list-refresh',
    (_) => null, { refreshInterval: 1000 })
  now = unixnow()

  const delegations = Array.from(delegators).map((v, i) => {
    const duration = v.endTime - v.startTime
    const perc = Formatter.number(Math.min((now - v.startTime) / duration, 100), 3)

    const str = new Date(v.startTime * 1000)
    const end = new Date(v.endTime * 1000)
    const del = Formatter.number(v.delegated, 3)
    const rew = Formatter.number(v.reward + v.delegated, 3)

    return <div key={i}>
      <div>
        <span style={{ float: 'left' }}>{del} AVAX at {str.toLocaleDateString()}</span>
        <span style={{ float: 'right' }}>{rew} AVAX at {end.toLocaleDateString()}</span>
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