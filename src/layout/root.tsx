import { Outlet, useLocation, useMatches, useNavigation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { useGlobalStore } from '~/features/wallet/store'
import { useShallow } from 'zustand/react/shallow'
import { onInternalChainSwitch } from '~/features/wallet/hook'
import { chainFromRoute, chainToChainId } from '../utils/misc/translations'
import Header from '../components/sections/header'
import Footer from '../components/sections/footer'
import CallToAction from '../components/sections/callToAction'
import { PreloaderContent } from '../components/ui/preloader'
import DiscoverWalletProviders from '../features/wallet/picker'
import { Tooltip } from 'react-tooltip'
import { useEffect, useState } from 'react'
import { CookiesProvider } from 'react-cookie'
import { CHAIN_CONFIG } from '~/config/chains'


const NavigationPreloader = () => {
  const navigation = useNavigation()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (navigation.state !== 'loading') {
      setShow(false)
      return
    }
    const t = setTimeout(() => setShow(true), 150)
    return () => clearTimeout(t)
  }, [navigation.state])

  if (!show) return null
  return <div className="preloader"><PreloaderContent /></div>
}

const RootLayout = () => {
  const { pathname } = useLocation()
  const matches = useMatches()
  const hideCallToAction = matches.some(m => (m.handle as { hideCallToAction?: boolean } | undefined)?.hideCallToAction)
  const chain = chainFromRoute(pathname)
  const chainId = chainToChainId(chain)
  // Per-chain background art + modifier class (e.g. the Songbird symbol
  // needs a bigger render size to match Flare/Avalanche visually).
  const cfg = chain != null ? CHAIN_CONFIG[chain] : null
  const image = cfg?.background.image ?? ''
  const bgClass = cfg?.background.className ?? ''

  const { setChain, setWallet, wallet } = useGlobalStore(
    useShallow(state => ({ setChain: state.setChain, setWallet: state.setWalletAddress, wallet: state.walletProvider }))
  )

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    setChain(chainId)
    if (wallet == null) return
    // Guard against overlapping switches (rapid route changes each fire one):
    // if a newer switch supersedes this one, drop the stale result instead of
    // letting the last-to-resolve win.
    let active = true
    ;(async () => {
      const address = await onInternalChainSwitch(chainId, wallet)
      if (!active) return
      // When the switch is rejected or no account is available, clear the
      // provider alongside the address — otherwise the header shows the
      // wallet icon next to "Connect Wallet", a half-connected state.
      setWallet(address, address == null ? null : wallet)
    })()
    return () => { active = false }
    // setChain / setWallet are stable Zustand setters; intentionally
    // omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, chainId])

  return (
    <>
      <NavigationPreloader />
      <Header />
      <div className='background'>
        {image && <div className={`background-image ${bgClass}`} style={{ backgroundImage: `url("${image}")` }} />}
        <CookiesProvider>
          <Outlet />
          {!hideCallToAction && <CallToAction />}
          <Footer />
        </CookiesProvider>
      </div>
      <ToastContainer theme='dark' position='top-left' />
      <Tooltip id="tooltip" />
      <DiscoverWalletProviders />
    </>
  )
}

export default RootLayout