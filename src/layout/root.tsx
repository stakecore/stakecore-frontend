import { Outlet, useLocation, useMatches, useNavigation } from 'react-router'
import { useGlobalStore } from '~/features/wallet/store'
import { useShallow } from 'zustand/react/shallow'
import { onInternalChainSwitch } from '~/features/wallet/hook'
import { chainFromRoute, chainToChainId } from '../utils/misc/translations'
import Header from '../components/sections/header'
import Footer from '../components/sections/footer'
import CallToAction from '../components/sections/callToAction'
import { PreloaderContent } from '../components/ui/preloader'
import { useAfterIdle } from '../utils/useAfterIdle'
import { lazy, Suspense, useEffect, useState } from 'react'
import { CookiesProvider } from 'react-cookie'
import { CHAIN_CONFIG } from '~/config/chains'


// Deferred chrome. None of it is visible until the user acts — toasts fire on
// wallet/contact actions, the tooltip on hover, the picker on "Connect
// Wallet" — but importing it eagerly put react-toastify, react-tooltip and
// the EIP-6963 picker (~79 kB of the eager bundle) in front of first paint on
// a page whose LCP already waits on script execution. Mounted at idle
// instead, so the chunks are warm well before anyone can click.
const Toasts = lazy(() => import('react-toastify').then(m => ({ default: m.ToastContainer })))
const Tooltips = lazy(() => import('react-tooltip').then(m => ({ default: m.Tooltip })))
const DiscoverWalletProviders = lazy(() => import('../features/wallet/picker'))


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
  const deferredChrome = useAfterIdle()
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
          {/* The page needs exactly one <main> landmark for screen-reader
              "skip to content" navigation (axe: landmark-one-main). The
              footer stays outside it — it's not main content. */}
          <main>
            <Outlet />
            {!hideCallToAction && <CallToAction />}
          </main>
          <Footer />
        </CookiesProvider>
      </div>
      {deferredChrome && (
        <Suspense fallback={null}>
          <Toasts theme='dark' position='top-left' />
          <Tooltips id="tooltip" />
          <DiscoverWalletProviders />
        </Suspense>
      )}
    </>
  )
}

export default RootLayout