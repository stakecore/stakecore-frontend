import { Chain } from '~/enums'
import ValidatorPage from '../validator/page'
import ProjectDescription from './components/description'
import AvalancheValidatorOfficialDelegateComponent from './components/delegateOfficial'
import AvalancheValidatorDataAccess from './data'


export const AvalancheValidatorPage = () => (
  <ValidatorPage
    chain={Chain.AVALANCHE}
    swrKey='avalanche-validator-page'
    title='Avalanche Validator'
    suptitle='Secure Avalanche Network Consensus'
    dataAccess={AvalancheValidatorDataAccess}
    Description={ProjectDescription}
    OfficialDelegate={AvalancheValidatorOfficialDelegateComponent}
  />
)

export default AvalancheValidatorPage
