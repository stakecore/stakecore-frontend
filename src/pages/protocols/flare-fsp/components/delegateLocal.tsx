import useSWR, { useSWRConfig } from "swr"
import { SpinnerCircular } from 'spinners-react'
import { useGlobalStore } from "~/utils/store/global"
import ServerError from "~/components/ui/serverError"
import FspLocalDelegate from "~/components/pages/fspLocalDelegate"
import { contractCallAdapter } from "../../utils"
import FspDataLayer from "../data"
import { claim, delegate, deposit, withdraw } from "../contracts"
import { expbigint } from "~/utils/misc/bigint"
import * as C from "~/constants"


const FlareFspLocalDelegateComponent = () => {
  const setWalletChoiceVisible = useGlobalStore(state => state.setWalletChoiceVisible)
  const walletAddress = useGlobalStore(state => state.walletAddress)
  const walletChoiceVisible = useGlobalStore(state => state.walletChoiceVisible)
  const { mutate } = useSWRConfig()

  const swrKey = ['flare-delegate', walletAddress] as const
  const { data, error, isLoading } = useSWR(swrKey, ([_, address]) => {
    if (address == null) return null
    return FspDataLayer.getDelegatorInfo('flare', address)
  }, { refreshInterval: C.REFRESH_QUERY_FAST_MS })

  async function connectWallet() {
    if (walletChoiceVisible || walletAddress != null) return
    setWalletChoiceVisible(true)
  }

  // Contract-call adapters. Each wraps the raw contracts.ts function with
  // contractCallAdapter (provider acquisition + error handling) and the
  // appropriate bigint conversion. The new FspLocalDelegate component
  // calls these by name; the security-sensitive contracts.ts code path
  // is unchanged.
  const actions = {
    deposit: (address: string, amount: number) =>
      contractCallAdapter(deposit, address, [expbigint(amount, C.FLR_DECIMALS)]),
    withdraw: (address: string, amount: number) =>
      contractCallAdapter(withdraw, address, [expbigint(amount, C.FLR_DECIMALS)]),
    delegate: (address: string, bips: number) =>
      contractCallAdapter(delegate, address, [bips]),
    claim: (address: string, epoch: number) =>
      contractCallAdapter(claim, address, [epoch]),
  }

  let component = null
  if (walletAddress == null) {
    component = <div style={{ textAlign: 'center' }}>
      <a onClick={connectWallet} className="theme-btn">
        Connect Wallet
      </a>
    </div>
  } else if (isLoading) {
    component = <div style={{ textAlign: 'center' }}>
      <SpinnerCircular color={C.FLARE_COLOR_CODE} size={45} />
    </div>
  } else if (data == null) {
    component = <ServerError status={500} message={error} />
  } else {
    component = <>
      <p>
        Delegation on Flare is stored as a percentage of your {C.WFLR_SYMBOL} balance.
        To delegate {C.FLR_SYMBOL}, first wrap it into {C.WFLR_SYMBOL}, then set the
        delegation percentage. The {C.WFLR_SYMBOL} stays in your wallet and can be
        unwrapped or transferred at any time — moving it to another address reassigns
        the stake to that address.
      </p>
      <div className="mt-30">
        <FspLocalDelegate
          data={data}
          walletAddress={walletAddress}
          symbol={C.FLR_SYMBOL}
          wrappedSymbol={C.WFLR_SYMBOL}
          delegationLabel="Stakecore"
          actions={actions}
          onRefresh={() => mutate(swrKey)}
        />
      </div>
    </>
  }

  return (
    <div className="single-project-page-right mt-30">
      <h2>Delegate On Our Website</h2>
      {component}
    </div>
  )
}

export default FlareFspLocalDelegateComponent
