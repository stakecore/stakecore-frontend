import { Chain } from '~/enums'
import ValidatorPage from '../validator/page'
import ProjectDescription from './components/description'
import FlareValidatorOfficialDelegateComponent from './components/delegateOfficial'
import FlareValidatorDataAccess from './data'


export const FlareValidatorPage = () => (
  <ValidatorPage
    chain={Chain.FLARE}
    swrKey='flare-validator-page'
    title='Flare Validator Delegation'
    suptitle='Secure Flare Network Consensus Layer'
    dataAccess={FlareValidatorDataAccess}
    Description={ProjectDescription}
    OfficialDelegate={FlareValidatorOfficialDelegateComponent}
  />
)

export default FlareValidatorPage
