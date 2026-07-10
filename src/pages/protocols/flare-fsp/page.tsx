import { Chain } from '~/enums'
import FspPage from '../fsp/page'
import ProjectDescription from './components/description'
import FlareFspOfficialDelegateComponent from './components/delegateOfficial'


export const FlareFspPage = () => (
  <FspPage config={{
    chain: Chain.FLARE,
    title: 'Flare Systems Protocol',
    suptitle: 'Secure Flare Network Oracle Data',
    loadContracts: () => import('./contracts'),
    Description: ProjectDescription,
    OfficialDelegate: FlareFspOfficialDelegateComponent,
  }} />
)

export default FlareFspPage
