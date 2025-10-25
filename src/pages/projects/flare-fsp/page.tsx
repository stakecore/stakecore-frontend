import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import ProjectTitle from "~/components/pages/title"
import InfoComponent from "~/components/pages/info"
import FlareFspStatsComponent from "./components/stats"
import FlareFspDataLayer from "./data"
import { FLARE_COLOR_CODE } from "~/utlits/data/constants"
import FlareFspLocalDelegateComponent from './components/delegateLocal'


export const FlareFspPage = () => {
  const { data, error, isLoading } = useSWR('flare-fsp-page', (x) => FlareFspDataLayer.getPageData())

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
      <InfoComponent specs={data.specs} summary={data.summary} />
      <FlareFspLocalDelegateComponent />
      <FlareFspStatsComponent />
    </>
  }

  return (
    <div className="single-project-page-design">
      <ProjectTitle title='Flare FSP Delegation' suptitle='Help Secure Flare Network Oracle Data' />
      <div className="container pt-30">
        {component}
      </div>
    </div>
  )
}

export default FlareFspPage