import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import ServerError from '~/components/ui/serverError'
import ProjectTitle from "~/components/pages/title"
import ProjectDescription from './components/description'
import InfoComponent from "~/components/pages/info"
import AvalancheValidatorStatisticsComponent from "./components/statistics"
import AvalancheValidatorOfficialDelegateComponent from "./components/delegateOfficial"
import AvalancheValidatorDataAccess from "./data"
import { AVALANCHE_COLOR_CODE } from '~/constants'


export const AvalancheValidatorPage = () => {
  const { data, error, isLoading } = useSWR('avalanche-validator-page', (_) => AvalancheValidatorDataAccess.getAvalanchePageData())

  let component = null
  if (isLoading) {
    component = <>
      <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
        <SpinnerCircular color={AVALANCHE_COLOR_CODE} size={100} />
      </div>
    </>
  } else if (error != null) {
    component = <ServerError status={500} message={error} />
  } else {
    component = <>
      <InfoComponent specs={data.specs} summary={data.summary} />
      <AvalancheValidatorOfficialDelegateComponent validatorLink={data.delegation.validatorLink} />
      <AvalancheValidatorStatisticsComponent config={data.graphics} />
    </>
  }

  return <>
    <div className="single-project-page-design">
      <ProjectTitle title='Avalanche Validator Delegation' suptitle='Secure Avalanche Network Consensus' />
      <div className="container pt-30">
        <ProjectDescription />
        {component}
      </div>
    </div>
  </>
}

export default AvalancheValidatorPage