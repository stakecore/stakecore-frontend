import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import { Chain } from '~/enums'
import ProjectTitle from "~/components/pages/title"
import InfoComponent from "~/components/pages/info"
import FspDataLayer from "../flare-fsp/data"
import ProjectDescription from './components/description'
import SongbirdFspLocalDelegateComponent from './components/delegateLocal'
import FspStatsComponent from '~/components/pages/fsp-stats'
import { SONGBIRD_COLOR_CODE } from "~/constants"

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
    component = <div>error {String(error)}</div>
  } else {
    component = <>
      <InfoComponent specs={FspDataLayer.extractSpecs(data.info)} summary={FspDataLayer.extractSummary(CHAIN, data.info)} />
      <SongbirdFspLocalDelegateComponent />
      <FspStatsComponent stats={data.statistics} chain={Chain.SONGBIRD} />
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