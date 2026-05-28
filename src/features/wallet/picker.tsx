import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { RiCloseCircleFill } from '@remixicon/react'
import { useGlobalStore } from './store'
import { useShallow } from 'zustand/react/shallow'
import { requestAccounts, switchNetworkIfNecessary } from './eip1193'
import { changeOpacity } from '../../utils/dom'
import { useExternalStore } from './discover'


const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export const Eip6963 = () => {
  const { walletProviders } = useExternalStore()
  const { walletChoiceVisible, setWalletChoiceVisible, setWalletAddress, chain } = useGlobalStore(
    useShallow(state => ({ walletChoiceVisible: state.walletChoiceVisible, setWalletChoiceVisible: state.setWalletChoiceVisible, setWalletAddress: state.setWalletAddress, chain: state.chain }))
  )
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  // Lock background scroll + dim the page behind the wallet modal
  // while it's open. Modern browsers scroll on <html>, not <body>, so
  // lock both. Restore the previous inline overflow values on cleanup
  // so anything else that sets them isn't clobbered. `changeOpacity`
  // mutates the #overlay element directly and is a side effect — it
  // must run from an effect, not in render.
  useEffect(() => {
    changeOpacity(walletChoiceVisible)
    if (!walletChoiceVisible) return
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [walletChoiceVisible])

  // Dialog a11y: move focus into the modal on open, trap Tab inside,
  // close on Escape, restore focus to the trigger on close.
  useEffect(() => {
    if (!walletChoiceVisible) return
    returnFocusRef.current = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    first?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setWalletChoiceVisible(false)
        return
      }
      if (e.key !== 'Tab' || !dialog) return
      const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusables.length === 0) return
      const firstEl = focusables[0]
      const lastEl = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && (active === firstEl || !dialog.contains(active))) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && (active === lastEl || !dialog.contains(active))) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const target = returnFocusRef.current
      if (target && document.body.contains(target)) target.focus()
    }
  }, [walletChoiceVisible, setWalletChoiceVisible])

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

  if (!walletChoiceVisible) return null

  return ReactDOM.createPortal(
    <div className="wallet-container" onClick={() => setWalletChoiceVisible(false)}>
      <div
        ref={dialogRef}
        className="wallet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="wallet-modal-title">Connect a wallet</h2>
        <div className="provider">
          {
            walletProviders.length > 0 ? walletProviders.map((provider: EIP6963ProviderDetail) => (
              <button key={provider.info.uuid} onClick={() => handleConnect(provider)}>
                <img src={provider.info.icon} alt="" />
                <span>{provider.info.name}</span>
              </button>
            )) :
              <div className="wallet-empty">
                No browser wallets detected.
              </div>
          }
        </div>
        <button type="button" onClick={() => setWalletChoiceVisible(false)} className="close" aria-label="Close wallet picker">
          <i><RiCloseCircleFill size={20} /></i>
        </button>
      </div>
    </div>,
    document.getElementById('eip6963') as HTMLElement
  )
}

export default Eip6963