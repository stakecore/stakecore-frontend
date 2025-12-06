import { useSyncExternalStore } from "react"
import { addEip6963Hook } from "./hook"
import { externalState } from "../store/external"


declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent
  }
}

export const useExternalStore = () => useSyncExternalStore(
  (callback: () => void) => {
    async function onAnnouncement(event: EIP6963AnnounceProviderEvent) {
      if (externalState.walletProviders.map(x => x.info.uuid).includes(event.detail.info.uuid)) return
      externalState.walletProviders.push(event.detail)
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