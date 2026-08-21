import { lazy, Suspense, type ComponentType } from 'react'
import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import QueryState from '~/components/ui/queryState'
import { CHAIN_CONFIG, type FspChain } from '~/config/chains'
import { Chain } from '~/enums'
import PageHeader from '~/components/ui/pageHeader'
import InfoComponent from "../info"
import FspDataLayer from "./data"
import FspLocalDelegateComponent from "./delegateLocal"
import type { FspContractApi } from "./contracts"
import type { ILink } from "../types"
import '../protocols.scss'


// recharts + d3 are heavy and only used in this below-the-fold stats section,
// so load it lazily instead of shipping it in the FSP page chunk.
const FspStatsComponent = lazy(() => import("../fsp-stats"))

export interface FspPageConfig {
  // FspChain, not Chain: this shell reads wrappedSymbol and the EVM explorer
  // builders, none of which Avalanche has — it runs no FSP.
  chain: FspChain
  title: string
  suptitle: string
  loadContracts: () => Promise<FspContractApi>
  Description: ComponentType
  OfficialDelegate: ComponentType<{ validatorLink: ILink }>
}

// Shared FSP page shell. The Flare and Songbird routes differ only in their
// chain (→ colour / symbols / explorers / slug via CHAIN_CONFIG), page copy,
// contracts module, and per-chain description/official-delegate components.
const FspPage = ({ config }: { config: FspPageConfig }) => {
  const chainCfg = CHAIN_CONFIG[config.chain]
  const { data, error, isLoading } = useSWR(
    `${chainCfg.slug}-fsp-page`,
    () => FspDataLayer.getPageData(chainCfg.slug),
  )
  const { Description, OfficialDelegate } = config

  return (
    <div className="single-project-page-design">
      <div className="container">
        <PageHeader supTitle={config.suptitle} title={config.title} />
      </div>
      <div className="container pt-30">
        <Description />
        {/* Height reserved for the whole state ladder — see .protocol-body in
            protocols.scss. Without it the call-to-action and footer render
            inside the viewport next to the spinner and get shoved out of it
            when the data lands, which measured 0.30 CLS on this route. */}
        <div className="protocol-body">
          <QueryState
            isLoading={isLoading} error={error} data={data}
            spinnerColor={chainCfg.color}
            emptyTitle='Provider data unavailable'
            emptyDescription="We couldn't load the FSP provider details right now. Please check back soon."
          >
            {data => <>
              <InfoComponent
                specs={FspDataLayer.extractSpecs(chainCfg.slug, data.info)}
                summary={FspDataLayer.extractSummary(chainCfg.slug, data.info, data.statistics)}
              />
              <FspLocalDelegateComponent config={{ chain: config.chain, loadContracts: config.loadContracts }} />
              <OfficialDelegate validatorLink={{
                url: chainCfg.explorers.evmAddress!(data.info.delegationAddress),
                hash: data.info.delegationAddress,
              }} />
              <Suspense fallback={
                <div style={{ textAlign: 'center' }} className="mt-50 mb-30">
                  <SpinnerCircular color={chainCfg.color} size={45} />
                </div>
              }>
                <FspStatsComponent stats={data.statistics} chain={config.chain} />
              </Suspense>
            </>}
          </QueryState>
        </div>
      </div>
    </div>
  )
}

export default FspPage
