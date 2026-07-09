import { lazy, Suspense } from 'react'
import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import { Chain } from '~/enums'
import { HashLink } from '~/components/ui/links'
import ServerError from '~/components/ui/serverError'
import ProjectTitle from "../title"
import InfoComponent from "../info"
import FspDataLayer from "../flare-fsp/data"
import ProjectDescription from './components/description'
import SongbirdFspLocalDelegateComponent from './components/delegateLocal'
import { SONGBIRD_COLOR_CODE, songbirdEvmAddressUrl } from "~/constants"
import SongbirdFspOfficialDelegateComponent from './components/delegateOfficial'
import '../protocols.scss'

// recharts + d3 are heavy and only used in this below-the-fold stats
// section, so load it lazily instead of shipping it in the FSP page chunk.
const FspStatsComponent = lazy(() => import('../fsp-stats'))

const CHAIN = 'songbird'

export const SongbirdFspPage = () => {
  const { data, error, isLoading } = useSWR('sgb-fsp-page', (_) => FspDataLayer.getPageData(CHAIN))

  let component = null
  if (isLoading) {
    component = <>
      <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
        <SpinnerCircular color={SONGBIRD_COLOR_CODE} size={100} />
      </div>
    </>
  } else if (data == null) {
    component = <ServerError error={error} />
  } else {
    const link = <HashLink url={songbirdEvmAddressUrl(data.info.delegationAddress)} address={data.info.delegationAddress} />
    component = <>
      <InfoComponent specs={FspDataLayer.extractSpecs(CHAIN, data.info)} summary={FspDataLayer.extractSummary(CHAIN, data.info, data.statistics)} />
      <SongbirdFspLocalDelegateComponent />
      <SongbirdFspOfficialDelegateComponent validatorLink={link} />
      <Suspense fallback={
        <div style={{ textAlign: 'center' }} className="mt-50 mb-30">
          <SpinnerCircular color={SONGBIRD_COLOR_CODE} size={45} />
        </div>
      }>
        <FspStatsComponent stats={data.statistics} chain={Chain.SONGBIRD} />
      </Suspense>
    </>
  }

  return (
    <div className="single-project-page-design">
      <ProjectTitle title='Songbird Systems Protocol' suptitle='Secure Songbird Canary Network Oracle Data' />
      <div className="container pt-30">
        <ProjectDescription />
        {component}
      </div>
    </div>
  )
}

export default SongbirdFspPage