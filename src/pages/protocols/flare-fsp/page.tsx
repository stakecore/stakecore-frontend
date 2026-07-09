import { lazy, Suspense } from 'react'
import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import { HashLink } from '~/components/ui/links'
import QueryState from '~/components/ui/queryState'
import ProjectTitle from "../title"
import InfoComponent from "../info"
import FspDataLayer from "./data"
import ProjectDescription from './components/description'
import FlareFspOfficialDelegateComponent from './components/delegateOfficial'
import FlareFspLocalDelegateComponent from './components/delegateLocal'
import { Chain } from '~/enums'
import { FLARE_COLOR_CODE, flareEvmAddressUrl } from "~/constants"
import '../protocols.scss'


// recharts + d3 are heavy and only used in this below-the-fold stats
// section, so load it lazily instead of shipping it in the FSP page chunk.
const FspStatsComponent = lazy(() => import("../fsp-stats"))

const CHAIN = 'flare'

export const FlareFspPage = () => {
  const { data, error, isLoading } = useSWR('flr-fsp-page', (_) => FspDataLayer.getPageData(CHAIN))

  return (
    <div className="single-project-page-design">
      <ProjectTitle title='Flare Systems Protocol' suptitle='Secure Flare Network Oracle Data' />
      <div className="container pt-30">
        <ProjectDescription />
        <QueryState
          isLoading={isLoading} error={error} data={data}
          spinnerColor={FLARE_COLOR_CODE}
          emptyTitle='Provider data unavailable'
          emptyDescription="We couldn't load the FSP provider details right now. Please check back soon."
        >
          {data => <>
            <InfoComponent specs={FspDataLayer.extractSpecs(CHAIN, data.info)} summary={FspDataLayer.extractSummary(CHAIN, data.info, data.statistics)} />
            <FlareFspLocalDelegateComponent />
            <FlareFspOfficialDelegateComponent validatorLink={<HashLink url={flareEvmAddressUrl(data.info.delegationAddress)} address={data.info.delegationAddress} />} />
            <Suspense fallback={
              <div style={{ textAlign: 'center' }} className="mt-50 mb-30">
                <SpinnerCircular color={FLARE_COLOR_CODE} size={45} />
              </div>
            }>
              <FspStatsComponent stats={data.statistics} chain={Chain.FLARE} />
            </Suspense>
          </>}
        </QueryState>
      </div>
    </div>
  )
}

export default FlareFspPage