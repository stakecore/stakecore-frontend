import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import ProjectTitle from "~/components/pages/title"
import InfoComponent from "~/components/pages/info"
import FspStatsComponent from "../../../components/pages/fsp-stats"
import FspDataLayer from "./data"
import ProjectDescription from './components/description'
import FlareFspLocalDelegateComponent from './components/delegateLocal'
import { FLARE_COLOR_CODE } from "~/constants"
import { Chain } from '~/enums'


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
    component = <div>error {String(error)}</div>
  } else {
    component = <>
      <InfoComponent specs={FspDataLayer.extractSpecs(data.info)} summary={FspDataLayer.extractSummary(CHAIN, data.info)} />
      <FlareFspLocalDelegateComponent />
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