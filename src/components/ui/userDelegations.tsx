import { useEffect, useState } from "react"
import { AvalancheDelegationDto } from "~/backendApi"
import { Formatter } from "~/utils/misc/formatter"
import { unixnow } from "~/utils/misc/time"
import { REFRESH_QUERY_FAST_MS } from "~/constants"


const UserDelegations = ({ delegators }: { delegators: AvalancheDelegationDto[] }) => {
  const [now, setNow] = useState(unixnow)

  useEffect(() => {
    const id = setInterval(() => setNow(unixnow()), REFRESH_QUERY_FAST_MS)
    return () => clearInterval(id)
  }, [])

  const delegations = Array.from(delegators).map((v) => {
    const duration = v.endTime - v.startTime
    const perc = Formatter.number(Math.min((now - v.startTime) / duration, 100))

    const str = Formatter.date(v.startTime)
    const end = Formatter.date(v.endTime)
    const del = Formatter.number(v.delegated)
    const rew = Formatter.number(v.reward + v.delegated)

    return <div key={`${v.startTime}-${v.endTime}-${v.delegated}`}>
      <div>
        <span className="user-del-left">{del} AVAX at {str}</span>
        <span className="user-del-right">{rew} AVAX at {end}</span>
      </div>
      <div className="progress-bar user-del-progress">
        <div className="center user-del-perc">{perc}%</div>
        <div className="progress-fill" style={{ width: `${perc}%` }}>
          &nbsp;
        </div>
      </div>
    </div>
  })
  return <div className="user-del-container">
    {delegations}
  </div>

}

export default UserDelegations
