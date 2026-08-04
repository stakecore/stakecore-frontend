import type { Page } from '@playwright/test'

export const MOCK_WALLET_NAME = 'Mock Wallet'

// All-digit hex: EIP-55 checksumming (Formatter.address runs getAddress) can
// only change letter case, so this address survives it byte-for-byte and the
// expected display string below stays a literal.
export const MOCK_ADDRESS = '0x1111111111111111111111111111111111111111'

// Formatter.address: first 7 chars + '...' + last 5.
export const MOCK_ADDRESS_DISPLAY = '0x11111...11111'

// An empty 1x1 SVG. The picker renders <img src={info.icon}>, and a
// non-resolving URL would log a console error the console fixture then flags.
const MOCK_ICON =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz4='

type RpcCall = { method: string; params?: unknown }

/**
 * Installs a fake EIP-6963 wallet before any app code runs.
 *
 * discover.ts dispatches `eip6963:requestProvider` when the picker's
 * useSyncExternalStore subscription attaches — which, because root.tsx
 * lazy-mounts the picker via useAfterIdle, happens well after load. Keeping
 * the listener attached for the page's lifetime means the announce lands
 * whenever that happens, with no race to lose.
 *
 * `eth_accounts` stays empty until `eth_requestAccounts` is called, so
 * tryAutoConnect declines and the test drives the real click-through flow.
 */
export async function injectMockWallet(
  page: Page,
  opts: { chainId?: string } = {}
): Promise<void> {
  const chainId = opts.chainId ?? '0xe'

  await page.addInitScript(
    ({ name, address, icon, chainId: initialChainId }) => {
      const listeners: Record<string, ((...args: unknown[]) => void)[]> = {}
      const calls: RpcCall[] = []
      let authorized = false
      let chainId = initialChainId

      const provider = {
        request: async ({ method, params }: { method: string; params?: unknown }) => {
          calls.push({ method, params })
          switch (method) {
            case 'eth_chainId':
              return chainId
            case 'eth_accounts':
              return authorized ? [address] : []
            case 'eth_requestAccounts':
              authorized = true
              return [address]
            case 'wallet_switchEthereumChain':
              // A real wallet reports the new chain on the next eth_chainId
              // call once the switch succeeds — mirror that so callers that
              // check-before-switching (root.tsx's onInternalChainSwitch)
              // see it and skip a redundant second request.
              chainId = (params as [{ chainId: string }])[0].chainId
              return null
            default:
              // EIP-1193 "unsupported method".
              throw Object.assign(new Error(`unhandled RPC: ${method}`), { code: 4200 })
          }
        },
        // hook.ts feature-detects `.on` and console.warns without it, which
        // would trip the console-error fixture. A real registry, not a stub.
        on: (event: string, handler: (...args: unknown[]) => void) => {
          ;(listeners[event] ||= []).push(handler)
        },
        removeListener: (event: string, handler: (...args: unknown[]) => void) => {
          listeners[event] = (listeners[event] || []).filter(h => h !== handler)
        },
      }

      const detail = {
        info: {
          uuid: '00000000-0000-4000-8000-000000000000',
          name,
          icon,
          rdns: 'org.stakecore.mock',
        },
        provider,
      }

      ;(window as unknown as { __walletCalls: RpcCall[] }).__walletCalls = calls

      const announce = () =>
        window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }))

      window.addEventListener('eip6963:requestProvider', announce)
      // Real wallets also announce unprompted on load; harmless here since
      // nothing is listening yet, but it keeps the mock faithful.
      announce()
    },
    { name: MOCK_WALLET_NAME, address: MOCK_ADDRESS, icon: MOCK_ICON, chainId }
  )
}

/** Every RPC the app made against the mock, in order. */
export async function walletCalls(page: Page): Promise<RpcCall[]> {
  return page.evaluate(
    () => (window as unknown as { __walletCalls?: RpcCall[] }).__walletCalls ?? []
  )
}
