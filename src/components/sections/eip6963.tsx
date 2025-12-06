import ReactDOM from 'react-dom'
import { RiCloseCircleFill } from '@remixicon/react'
import { useGlobalStore } from '../../utils/store/global'
import { requestAccounts, switchNetworkIfNecessary } from '../../utils/eip6963/eip1193'
import { changeOpacity } from '../utils/style'
import { useExternalStore } from '../../utils/eip6963/discover'


export const Eip6963 = () => {
  const { walletProviders } = useExternalStore()
  const walletChoiceVisible = useGlobalStore(state => state.walletChoiceVisible)
  const setWalletChoiceVisible = useGlobalStore(state => state.setWalletChoiceVisible)
  const setWalletAddress = useGlobalStore(state => state.setWalletAddress)
  const chain = useGlobalStore(state => state.chain)

  const executeConnect = async (detail: EIP6963ProviderDetail, address: string) => {
    const switched = await switchNetworkIfNecessary(chain, detail.provider)
    if (!switched) return
    setWalletAddress(address, detail)
    setWalletChoiceVisible(false)
  }

  const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
    const accounts: string[] | undefined = await requestAccounts(providerWithInfo.provider)
    if (accounts?.[0]) await executeConnect(providerWithInfo, accounts[0])
  }

  changeOpacity(walletChoiceVisible)
  if (!walletChoiceVisible) return null

  return ReactDOM.createPortal(
    <div className="wallet-container">
      <div className="wallet">
        <h2>Your Wallets:</h2>
        <div className="provider">
          {
            walletProviders.length > 0 ? walletProviders.map((provider: EIP6963ProviderDetail) => (
              <button key={provider.info.uuid} onClick={() => handleConnect(provider)} >
                <img src={provider.info.icon} alt={provider.info.name} />
                <div>{provider.info.name}</div>
              </button>
            )) :
              <div>
                You Have No Browser Wallets Installed
              </div>
          }
        </div>
        <button onClick={() => setWalletChoiceVisible(false)} className="close">
          <i><RiCloseCircleFill size={20} /></i>
        </button>
      </div>
    </div>,
    document.getElementById('eip6963') as HTMLElement
  )
}

export default Eip6963