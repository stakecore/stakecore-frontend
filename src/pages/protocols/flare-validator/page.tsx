import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import ServerError from '~/components/ui/serverError'
import ProjectTitle from "~/components/pages/title"
import ProjectDescription from './components/description'
import InfoComponent from "~/components/pages/info"
import FlareValidatorStatisticsComponent from "./components/statistics"
import FlareValidatorOfficialDelegateComponent from "./components/delegateOfficial"
import FlareValidatorLocalDelegateComponent from "./components/delegateLocal"
import FlareValidatorDataAccess from "./data"
import { FLARE_COLOR_CODE } from '~/constants'


export const FlareValidatorPage = () => {
  const { data, error, isLoading } = useSWR('flare-validator-page', (_) => FlareValidatorDataAccess.getFlarePageData())

  let component = null
  if (isLoading) {
    component = <>
      <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
        <SpinnerCircular color={FLARE_COLOR_CODE} size={100} />
      </div>
    </>
  } else if (error != null) {
    component = <ServerError status={500} message={error} />
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
        <ProjectDescription />
        {component}
      </div>
    </div>
  </>
}

export default FlareValidatorPage