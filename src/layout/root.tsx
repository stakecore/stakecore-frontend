import { Outlet, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { useGlobalStore } from '~/utlits/store/global'
import { onInternalChainSwitch } from '~/utlits/eip6963/hook'
import { chainFromRoute, chainToChainId } from '../utlits/misc/translations'
import Header from '../components/sections/header'
import Footer from '../components/sections/footer'
import CallToAction from '../components/sections/callToAction'
import Preloader from '../components/ui/preloader'
import DiscoverWalletProviders from '../components/sections/eip6963'
import ScrollToTop from '../components/sections/scrollToTop'
import { Tooltip } from 'react-tooltip'
import { useEffect } from 'react'
import { CookiesProvider } from 'react-cookie'
import { Chain } from '~/constants'


function chainToClassName(chain: Chain): string {
  if (chain == Chain.FLARE) {
    return 'background background-flare'
  } else if (chain == Chain.SONGBIRD) {
    return 'background background-songbird'
  } else if (chain == Chain.AVALANCHE) {
    return 'background background-avalanche'
  }
  return ''
}

const RootLayout = () => {
  const { pathname } = useLocation()
  const chain = chainFromRoute(pathname)
  const chainId = chainToChainId(chain)
  const classname = chainToClassName(chain)

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
      <div className={classname}>
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