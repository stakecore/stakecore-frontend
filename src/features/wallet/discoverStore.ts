// EIP-6963 discovered-provider list. (Was a global ambient in vite-env.d.ts;
// co-located here so changes have an import trail.)
export interface ExternalState {
  walletProviders: EIP6963ProviderDetail[]
}

export let externalState: ExternalState = {
  walletProviders: []
}

// Return a NEW snapshot object on every change so useSyncExternalStore's
// Object.is comparison detects it and re-renders. The old code pushed into
// the same array in place, leaving the reference identical — so React
// dropped any provider that announced after the initial mount (e.g. an
// extension that finishes initialising while the picker is already open).
export function addWalletProvider(detail: EIP6963ProviderDetail): boolean {
  if (externalState.walletProviders.some(p => p.info.uuid === detail.info.uuid)) {
    return false
  }
  externalState = { walletProviders: [...externalState.walletProviders, detail] }
  return true
}
