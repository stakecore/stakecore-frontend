import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import ProjectTitle from "~/components/pages/title"
import InfoComponent from "~/components/pages/info"
import AvalancheValidatorStatisticsComponent from "./components/statistics"
import AvalancheValidatorOfficialDelegateComponent from "./components/delegateOfficial"
import AvalancheValidatorLocalDelegateComponent from "./components/delegateLocal"
import AvalancheValidatorDataAccess from "./data"


export const AvalancheValidatorPage = () => {
  const { data, error, isLoading } = useSWR('avalanche-validator-page', (x) => AvalancheValidatorDataAccess.getAvalanchePageData())

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
      <AvalancheValidatorLocalDelegateComponent />
      <AvalancheValidatorOfficialDelegateComponent validatorLink={data.delegation.validatorLink} />
      <AvalancheValidatorStatisticsComponent config={data.graphics} />
    </>
  }

  return <>
    <div className="single-project-page-design">
      <ProjectTitle title='Avalanche Validator Delegation' suptitle='Secure The Avalanche Network' />
      <div className="container pt-30">
        {component}
      </div>
    </div>
  </>
}

export default AvalancheValidatorPage