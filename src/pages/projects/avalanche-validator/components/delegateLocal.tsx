import useSWR from "swr"
import { SpinnerCircular } from 'spinners-react'
import { useGlobalStore } from "~/utlits/store/global"
import { avalanchePChainAddressUrl } from "~/utlits/data/constants"
import InvestFlow from "~/components/ui/investFlow"
import DelegatorList from "~/components/ui/delegations"
import { AddressLink } from "~/components/utils/links"
import { IStakeFlow } from "~/components/types"
import AvalancheValidatorDataAccess from "../data"
import * as C from '../constants'
import type { AvalancheDelegatorInfoDto } from "~/backendApi"


function delegatorInfoToStakeFlow(position: AvalancheDelegatorInfoDto): IStakeFlow['data'] {
  return {
    staked: position.delegations.reduce((x, y) => x + y.delegated, 0),
    tokens: [{
      address: position.cChain.address,
      balance: position.cChain.balance,
      price: position.cChain.price,
      stakeReturn: [C.C_TO_P_FACTOR, C.P_TO_C_FACTOR]
    }, {
      address: position.pChain.address,
      balance: position.pChain.balance,
      price: position.pChain.price,
      stakeReturn: [C.P_TO_C_FACTOR, null]
    }]
  }
}

const AvalancheValidatorLocalDelegateComponent = () => {
  const walletAddress = useGlobalStore((state) => state.walletAddress)
  const setWalletVisible = useGlobalStore((state) => state.setWalletVisible)
  const walletVisible = useGlobalStore((state) => state.walletVisible)

  const { data, error, isLoading } = useSWR([walletAddress], ([address]) => {
    if (address == null) return null
    return AvalancheValidatorDataAccess.getDelegatorInfo(address)
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
          Delegating AVAX involves moving it from C-Chain to P-Chain, where you then sign the add delegator transaction.
          After the set delegation lockup time expires, funds are automatically returned to your P-Chain account.
        </p>
        <InvestFlow layout={C.DELEGATE_FLOW_LAYOUT} data={delegatorInfoToStakeFlow(data)} />
      </div>
      <h4>Active Delegations</h4>
      <div>
        <p className="mb-40">
          Below are active delegations from your account <AddressLink
            address={data.pChain.address}
            url={avalanchePChainAddressUrl(data.pChain.address)}
          />
        </p>
        <DelegatorList delegators={data.delegations} />
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

export default AvalancheValidatorLocalDelegateComponent