import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import ProjectTitle from "~/components/pages/title"
import InfoComponent from "~/components/pages/info"
import SongbirdFspStatsComponent from "./components/stats"
import FspDataLayer from "../flare-fsp/data"
import ProjectDescription from './components/description'
import SongbirdFspLocalDelegateComponent from './components/delegateLocal'
import { SONGBIRD_COLOR_CODE } from "~/utlits/data/constants"


export const SongbirdFspPage = () => {
  const { data, error, isLoading } = useSWR('songbird-fsp-page', (x) => FspDataLayer.getPageData('songbird'))

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
      <InfoComponent specs={data.specs} summary={data.summary} />
      <SongbirdFspLocalDelegateComponent />
      <SongbirdFspStatsComponent />
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