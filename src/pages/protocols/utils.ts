// Protocol-page display helper. The wallet/contract-call plumbing that used
// to live here (ensureProvider, contractCallAdapter, extractFriendlyError,
// actionStatusMessage) moved to ~/features/wallet/contract, where it belongs
// with the rest of the wallet domain.

// this is specifically made for flare and avalanche info summary component
export function checkRangeAvailable(min: number, max: number, available: string): string {
  return min <= max ? available : 'Unavailable'
}
