import { Chain } from '~/enums'
import FspPage from '../fsp/page'
import ProjectDescription from './components/description'
import SongbirdFspOfficialDelegateComponent from './components/delegateOfficial'


export const SongbirdFspPage = () => (
  <FspPage config={{
    chain: Chain.SONGBIRD,
    title: 'Songbird Systems Protocol',
    suptitle: 'Secure Songbird Canary Network Oracle Data',
    loadContracts: () => import('./contracts'),
    Description: ProjectDescription,
    OfficialDelegate: SongbirdFspOfficialDelegateComponent,
  }} />
)

export default SongbirdFspPage
