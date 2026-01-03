import { Outlet, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { useGlobalStore } from '~/utils/store/global'
import { onInternalChainSwitch } from '~/utils/eip6963/hook'
import { chainFromRoute, chainToChainId } from '../utils/misc/translations'
import Header from '../components/sections/header'
import Footer from '../components/sections/footer'
import CallToAction from '../components/sections/callToAction'
import Preloader from '../components/ui/preloader'
import DiscoverWalletProviders from '../components/sections/eip6963'
import ScrollToTop from '../components/sections/scrollToTop'
import { Tooltip } from 'react-tooltip'
import { useEffect } from 'react'
import { CookiesProvider } from 'react-cookie'
import { Chain } from '~/enums'
import flareImg from '../assets/images/protocols/flare/symbol.svg'
import songbirdImg from '../assets/images/protocols/songbird/symbol.svg'
import avalancheImg from '../assets/images/protocols/avalanche/symbol.svg'


function chainToBackgroundImage(chain: Chain): string {
  if (chain == Chain.FLARE) {
    return flareImg
  } else if (chain == Chain.SONGBIRD) {
    return songbirdImg
  } else if (chain == Chain.AVALANCHE) {
    return avalancheImg
  }
  return ''
}

const RootLayout = () => {
  const { pathname } = useLocation()
  const chain = chainFromRoute(pathname)
  const chainId = chainToChainId(chain)
  const image = chainToBackgroundImage(chain)

  const setChain = useGlobalStore(state => state.setChain)
  const setWallet = useGlobalStore(state => state.setWalletAddress)
  const wallet = useGlobalStore(state => state.walletProvider)

  useEffect(() => {
    setChain(chainId)
    if (wallet == null) return
    (async () => {
      const address = await onInternalChainSwitch(chainId, wallet)
      setWallet(address, wallet)
    })()
  }, [wallet, chainId])

  return (
    <>
      <Preloader />
      <Header />
      <div className='background' style={{ backgroundImage: `url(${image})` }}>
        <CookiesProvider>
          <Outlet />
          <CallToAction />
          <Footer />
        </CookiesProvider>
      </div>
      <ToastContainer theme='dark' position='top-left' />
      <Tooltip id="tooltip" />
      <DiscoverWalletProviders />
      <ScrollToTop />
    </>
  )
}

export default RootLayout