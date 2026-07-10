import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import { HashLink } from '~/components/ui/links'
import QueryState from '~/components/ui/queryState'
import { CHAIN_CONFIG } from '~/config/chains'
import { Chain } from '~/enums'
import ProjectTitle from "../title"
import InfoComponent from "../info"
import FspDataLayer from "./data"
import FspLocalDelegateComponent from "./delegateLocal"
import type { FspContractApi } from "./contracts"
import '../protocols.scss'


// recharts + d3 are heavy and only used in this below-the-fold stats section,
// so load it lazily instead of shipping it in the FSP page chunk.
const FspStatsComponent = lazy(() => import("../fsp-stats"))

export interface FspPageConfig {
  chain: Chain
  title: string
  suptitle: string
  loadContracts: () => Promise<FspContractApi>
  Description: ComponentType
  OfficialDelegate: ComponentType<{ validatorLink: ReactNode }>
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
      <ProjectTitle title={config.title} suptitle={config.suptitle} />
      <div className="container pt-30">
        <Description />
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
            <OfficialDelegate validatorLink={
              <HashLink url={chainCfg.explorers.evmAddress!(data.info.delegationAddress)} address={data.info.delegationAddress} />
            } />
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
  )
}

export default FspPage
