import useSWR from "swr"
import { SpinnerCircular } from 'spinners-react'
import { useGlobalStore } from "~/utils/store/global"
import ServerError from "~/components/ui/serverError"
import StakeFlow from "~/components/ui/stakeFlow"
import { IStakeFlow } from "~/components/types"
import { injectActionArg } from "../../utils"
import FspDataLayer from "../../flare-fsp/data"
import * as L from '../layout'
import * as C from "~/constants"
import type { FspDelegatorInfoDto } from "~/backendApi"


function delegatorInfoToStakeFlow(position: FspDelegatorInfoDto): IStakeFlow['data'] {
  const rewards = position.rewards.reduce((x, y) => x + y.amount, 0)
  return [{
    address: position.nat.address,
    balance: position.nat.balance,
    price: position.nat.price,
    fixedInputValue: null,
    conversions: [L.SGB_TO_WSGB_FACTOR, L.WSGB_TO_SGB_FACTOR]
  }, {
    address: position.wnat.address,
    balance: position.wnat.balance,
    price: position.wnat.price,
    fixedInputValue: null,
    conversions: [L.SGB_TO_WSGB_FACTOR, null]
  }, {
    address: position.wnat.address,
    balance: position.delegated,
    price: position.wnat.price,
    fixedInputValue: rewards,
    conversions: [null, null]
  }]
}

function modifyStakeFlowLayout(position: FspDelegatorInfoDto) {
  const epoch = Math.max(...position.rewards.map(x => x.rewardEpoch))
  injectActionArg(L.DELEGATE_FLOW_LAYOUT[1].actions.up, epoch)
  return L.DELEGATE_FLOW_LAYOUT
}

const SongbirdFspLocalDelegateComponent = () => {
  const setWalletChoiceVisible = useGlobalStore(state => state.setWalletChoiceVisible)
  const walletAddress = useGlobalStore(state => state.walletAddress)
  const walletChoiceVisible = useGlobalStore(state => state.walletChoiceVisible)

  const { data, error, isLoading } = useSWR(['songbird-delegate', walletAddress], ([_, address]) => {
    if (address == null) return null
    return FspDataLayer.getDelegatorInfo('songbird', address)
  }, {
    refreshInterval: C.REFRESH_QUERY_FAST_MS,
    revalidateOnReconnect: true
  })

  async function connectWallet() {
    if (walletChoiceVisible || walletAddress != null) return
    setWalletChoiceVisible(true)
  }

  let component = null
  if (walletAddress == null) {
    component = <div style={{ textAlign: 'center' }}>
      <a onClick={connectWallet} className="theme-btn">
        Connect Wallet To See Your Position
      </a>
    </div>
  } else if (isLoading) {
    component = <div style={{ textAlign: 'center' }}>
      <SpinnerCircular color={C.SONGBIRD_COLOR_CODE} size={45} />
    </div>
  } else if (data == null) {
    component = <ServerError status={500} message={error} />
  } else {
    component = <>
      <div>
        <p>
          Delegating SGB involves wrapping it into WSGB, which you can then delegate to an SSP entity.
          The delegation in this case is liquid, meaning you can safely transfer WSGB or withdraw it.
          Note however that sending WSGB to another address will contribute the stake to the other address.

          New rewards are distributed every 3.5 days and are based on your balance at 3 block heights
          determined randomly at the end of each reward epoch.
        </p>
        <div className="mt-40">
          <StakeFlow layout={modifyStakeFlowLayout(data)} data={delegatorInfoToStakeFlow(data)} />
        </div>
      </div>
    </>
  }

  return (
    <div className="single-project-page-right wow fadeInUp delay-0-4s songbird-div-border mt-30">
      <h2>How To Delegate</h2>
      {component}
    </div>
  )
}

export default SongbirdFspLocalDelegateComponent