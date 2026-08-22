import type { ReactNode } from "react"
import useSWR, { useSWRConfig } from "swr"
import { SpinnerCircular } from 'spinners-react'
import { useGlobalStore } from "~/features/wallet/store"
import ServerError from "~/components/ui/serverError"
import FspLocalDelegate from "~/pages/protocols/fspLocalDelegate"
import { contractCallAdapter } from "~/features/wallet/contract"
import { expbigint } from "~/utils/misc/bigint"
import { CHAIN_CONFIG, type FspChain } from "~/config/chains"
import { REFRESH_QUERY_FAST_MS } from "~/constants"
import { Chain } from "~/enums"
import FspDataLayer from "./data"
import type { FspContractApi } from "./contracts"


export interface FspDelegateConfig {
  // See FspPageConfig — wrappedSymbol / evmTx are FSP-chain-only.
  chain: FspChain
  // Dynamic import of the per-chain contracts module, so ethers' heavy
  // BrowserProvider/Contract stack loads only on a wallet transaction rather
  // than in the FSP page chunk.
  loadContracts: () => Promise<FspContractApi>
}

// On-site FSP delegate flow (wrap / delegate / unwrap / claim). Everything is
// derived from CHAIN_CONFIG[chain] + the loadContracts thunk, so the two FSP
// routes share this verbatim.
const FspLocalDelegateComponent = ({ config }: { config: FspDelegateConfig }) => {
  const chainCfg = CHAIN_CONFIG[config.chain]
  const setWalletChoiceVisible = useGlobalStore(state => state.setWalletChoiceVisible)
  const walletAddress = useGlobalStore(state => state.walletAddress)
  const walletChoiceVisible = useGlobalStore(state => state.walletChoiceVisible)
  const { mutate } = useSWRConfig()

  const swrKey = [`${chainCfg.slug}-delegate`, walletAddress] as const
  const { data, error, isLoading } = useSWR(swrKey, ([_, address]) => {
    if (address == null) return null
    return FspDataLayer.getDelegatorInfo(chainCfg.slug, address)
  }, { refreshInterval: REFRESH_QUERY_FAST_MS })

  async function connectWallet() {
    if (walletChoiceVisible || walletAddress != null) return
    setWalletChoiceVisible(true)
  }

  // Each adapter dynamically loads the per-chain contracts, then wraps the
  // raw function with contractCallAdapter (provider acquisition + error
  // handling) and the appropriate bigint conversion.
  const actions = {
    deposit: async (address: string, amount: number) => {
      const { deposit } = await config.loadContracts()
      return contractCallAdapter(deposit, address, [expbigint(amount, chainCfg.decimals)])
    },
    withdraw: async (address: string, amount: number) => {
      const { withdraw } = await config.loadContracts()
      return contractCallAdapter(withdraw, address, [expbigint(amount, chainCfg.decimals)])
    },
    delegate: async (address: string, bips: number) => {
      const { delegate } = await config.loadContracts()
      return contractCallAdapter(delegate, address, [bips])
    },
    claim: async (address: string, epoch: number) => {
      const { claim } = await config.loadContracts()
      return contractCallAdapter(claim, address, [epoch])
    },
  }

  // See callToAction.tsx and queryState.tsx: SWR reports `isLoading` on every
  // retry after a failure, so the spinner has to be gated on "nothing has
  // arrived yet" or the error panel is rebuilt on each one. This view polls
  // every 10s, so that was a fixed cadence for as long as the page stayed open.
  const firstLoad = isLoading && error == null && data == null

  // mt-20 on both compact states. Unspaced, they sit 8px under the h2 —
  // reboot's heading margin and nothing else — which below md, where the
  // card drops its border and side/bottom padding (protocols.scss), reads
  // as part of the title rather than as the card's content. Top margin
  // only: a bottom one would collapse straight through the card's missing
  // bottom padding on mobile (no change there, since the next card's
  // .mt-30 already wins the collapse) while at md+ it would stack on the
  // card's 32px padding and leave the box visibly bottom-heavy. The loaded
  // and error states space themselves (a <p>, and .error-container's 32px).
  let component: ReactNode = null
  if (walletAddress == null) {
    component = <div style={{ textAlign: 'center' }} className="mt-20">
      <button type="button" onClick={connectWallet} className="theme-btn">
        Connect Wallet
      </button>
    </div>
  } else if (firstLoad) {
    component = <div style={{ textAlign: 'center' }} className="mt-20">
      <SpinnerCircular color={chainCfg.color} size={45} />
    </div>
  } else if (data == null) {
    component = <ServerError error={error} />
  } else {
    component = <>
      <p>
        Delegation on {chainCfg.name} is stored as a percentage of your {chainCfg.wrappedSymbol} balance.
        To delegate {chainCfg.symbol}, first wrap it into {chainCfg.wrappedSymbol}, then set the
        delegation percentage. The {chainCfg.wrappedSymbol} stays in your wallet and can be
        unwrapped or transferred at any time — moving it to another address reassigns
        the stake to that address.
      </p>
      <div className="mt-30">
        <FspLocalDelegate
          data={data}
          walletAddress={walletAddress}
          symbol={chainCfg.symbol}
          wrappedSymbol={chainCfg.wrappedSymbol}
          delegationLabel="StakeCore"
          actions={actions}
          explorerTxUrl={chainCfg.explorers.evmTx}
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

export default FspLocalDelegateComponent
