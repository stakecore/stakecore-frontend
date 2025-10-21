import useSWR from "swr"
import { SpinnerCircular } from 'spinners-react'
import { useGlobalStore } from "~/utlits/store/global"
import InvestFlow from "~/components/ui/investFlow"
import { IStakeFlow } from "~/components/types"
import FlareFspDataLayer from "../data"
import * as C from '../constants'
import type { FlareFspDelegatorInfo } from "../types"



function delegatorInfoToStakeFlow(position: FlareFspDelegatorInfo): IStakeFlow['data'] {
  return {
    staked: position.delegated,
    tokens: [{
      address: position.nat.address,
      balance: position.nat.balance,
      price: position.nat.price,
      stakeReturn: [C.FLR_TO_WFLR_FACTOR, C.WFLR_TO_FLR_FACTOR]
    }, {
      address: position.wnat.address,
      balance: position.wnat.balance,
      price: position.wnat.price,
      stakeReturn: [C.FLR_TO_WFLR_FACTOR, null]
    }]
  }
}

const FlareFspLocalDelegateComponent = () => {
  const walletAddress = useGlobalStore((state) => state.walletAddress)
  const setWalletVisible = useGlobalStore((state) => state.setWalletVisible)
  const walletVisible = useGlobalStore((state) => state.walletVisible)

  const { data, error, isLoading } = useSWR(['flare-delegate', walletAddress], ([_, address]) => {
    if (address == null) return null
    return FlareFspDataLayer.getDelegatorInfo(address)
  }, {
    refreshInterval: 6_000,
    revalidateOnReconnect: true
  })

  async function connectWallet() {
    if (walletVisible || walletAddress != null) return
    setWalletVisible(true)
  }

  let component = null
  if (walletAddress == null) {
    component = <a onClick={connectWallet} className="theme-btn">
      Connect Wallet To See Your Position
    </a>
  } else if (isLoading) {
    component = <div style={{ textAlign: 'center' }}>
      <SpinnerCircular color="firebrick" size={45} />
    </div>
  } else if (error != null) {
    component = <div>error {error}</div>
  }
  else {
    component = <>
      <div className="mb-40">
        <p>
          Delegating FLR involves wrapping it into WFLR, which you can then delegate to an FSP entity.
          The delegation in this case is liquid, meaning you can safely transfer WFLR or withdraw it.
          Note however that sending WFLR to another address will contribute the stake to the other address.

          New rewards are distributed every 3.5 days and are based on your balance at 3 block heights
          determined randomly at the end of each reward epoch.
        </p>
        <InvestFlow layout={C.DELEGATE_FLOW_LAYOUT} data={delegatorInfoToStakeFlow(data)} />
      </div>
    </>
  }

  return (
    <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mt-30">
      <h2>How To Delegate</h2>
      {component}
    </div>
  )
}

export default FlareFspLocalDelegateComponent