import { unixnow } from "~/utlits/misc/time"

type IDelegationList = {
  startTime: number
  endTime: number
  delegated: number
  reward: number
}[]

const DelegatorList = ({ delegators }: { delegators: IDelegationList}) => {
  Array.from(delegators).map((v, i) => {
    const perc = unixnow() / (v.endTime - v.startTime)
    return <>
      <div className="progress-bar"></div>
    </>
  })

}