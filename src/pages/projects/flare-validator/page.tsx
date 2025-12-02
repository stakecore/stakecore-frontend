import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import ProjectTitle from "~/components/pages/title"
import InfoComponent from "~/components/pages/info"
import FlareValidatorStatisticsComponent from "./components/statistics"
import FlareValidatorOfficialDelegateComponent from "./components/delegateOfficial"
import FlareValidatorLocalDelegateComponent from "./components/delegateLocal"
import FlareValidatorDataAccess from "./data"


export const AvalancheValidatorPage = () => {
  const { data, error, isLoading } = useSWR('flare-validator-page', (_) => FlareValidatorDataAccess.getFlarePageData())

  let component = null
  if (isLoading) {
    component = <>
      <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
        <SpinnerCircular color='FireBrick' size={100} />
      </div>
    </>
  } else if (error != null || data == null) {
    component = <div>error {String(error)}</div>
  } else {
    component = <>
      <InfoComponent specs={data.specs} summary={data.summary} />
      <FlareValidatorLocalDelegateComponent />
      <FlareValidatorOfficialDelegateComponent validatorLink={data.delegation.validatorLink} />
      <FlareValidatorStatisticsComponent config={data.graphics} />
    </>
  }

  return <>
    <div className="single-project-page-design">
      <ProjectTitle title='Flare Validator Delegation' suptitle='Secure Flare Network Consensus' />
      <div className="container pt-30">
        {component}
      </div>
    </div>
  </>
}

export default AvalancheValidatorPage