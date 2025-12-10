import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import { HashLink } from '~/components/utils/links'
import ServerError from '~/components/ui/serverError'
import ProjectTitle from "~/components/pages/title"
import InfoComponent from "~/components/pages/info"
import FspStatsComponent from "../../../components/pages/fsp-stats"
import FspDataLayer from "./data"
import ProjectDescription from './components/description'
import FlareFspOfficialDelegateComponent from './components/delegateOfficial'
import FlareFspLocalDelegateComponent from './components/delegateLocal'
import { Chain } from '~/enums'
import { FLARE_COLOR_CODE, flareEvmAddressUrl } from "~/constants"


const CHAIN = 'flare'

export const FlareFspPage = () => {
  const { data, error, isLoading } = useSWR('flr-fsp-page', (_) => FspDataLayer.getPageData(CHAIN))

  let component = null
  if (isLoading) {
    component = <>
      <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
        <SpinnerCircular color={FLARE_COLOR_CODE} size={100} />
      </div>
    </>
  } else if (data == null) {
    component = <ServerError status={500} message={error} />
  } else {
    const delegator = <HashLink url={flareEvmAddressUrl(data.info.delegationAddress)} address={data.info.delegationAddress} />
    component = <>
      <InfoComponent specs={FspDataLayer.extractSpecs(data.info)} summary={FspDataLayer.extractSummary(CHAIN, data.info)} />
      <FlareFspLocalDelegateComponent />
      <FlareFspOfficialDelegateComponent validatorLink={delegator} />
      <FspStatsComponent stats={data.statistics} chain={Chain.FLARE} />
    </>
  }

  return (
    <div className="single-project-page-design">
      <ProjectTitle title='Flare Systems Protocol' suptitle='Secure Flare Network Oracle Data' />
      <div className="container pt-30">
        <ProjectDescription />
        {component}
      </div>
    </div>
  )
}

export default FlareFspPage