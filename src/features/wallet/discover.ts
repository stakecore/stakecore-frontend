import { useSyncExternalStore } from "react"
import { addEip6963Hook } from "./hook"
import { externalState, addWalletProvider } from "./discoverStore"


declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent
  }
}

export const useExternalStore = () => useSyncExternalStore(
  (callback: () => void) => {
    async function onAnnouncement(event: EIP6963AnnounceProviderEvent) {
      // addWalletProvider dedups by uuid and swaps in a fresh snapshot; it
      // returns false when the wallet was already known, so we skip the
      // re-render in that case.
      if (!addWalletProvider(event.detail)) return
      await addEip6963Hook(event.detail)
      callback()
    }
    window.addEventListener("eip6963:announceProvider", onAnnouncement)
    window.dispatchEvent(new Event("eip6963:requestProvider"))
    return () => window.removeEventListener("eip6963:announceProvider", onAnnouncement)
  },
  () => externalState,
  () => externalState
)