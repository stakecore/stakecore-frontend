// Protocol-page display helper. The wallet/contract-call plumbing that used
// to live here (ensureProvider, contractCallAdapter, extractFriendlyError,
// actionStatusMessage) moved to ~/features/wallet/contract, where it belongs
// with the rest of the wallet domain.

// this is specifically made for flare and avalanche info summary component.
// Generic in the available value so it can pass through an IRange as well as
// a plain string; the unavailable branch is a string either way, which is
// what unavailabilityBanner.tsx tests for.
export function checkRangeAvailable<T>(min: number, max: number, available: T): T | 'Unavailable' {
  return min <= max ? available : 'Unavailable'
}
