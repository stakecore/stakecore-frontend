import { test, expect } from './fixtures/console'
import {
  injectMockWallet,
  walletCalls,
  MOCK_WALLET_NAME,
  MOCK_ADDRESS_DISPLAY,
  PICKER_MOUNT_TIMEOUT,
} from './fixtures/wallet'

// CallToAction (rendered on every route these tests visit) fires a real SWR
// call to LandingPageService.pageControllerGetUserInfo(address) once a
// wallet is connected. MOCK_ADDRESS has never held FLR/AVAX/SGB, so an
// empty portfolio is genuinely what the backend should return for it —
// stubbing that keeps these wallet-connect tests from depending on
// whatever the live backend happens to say about a synthetic address.
// Do not delete this as redundant: there's no SWRConfig onError and no
// error boundary anywhere in the app, and getProposalData has no shape
// guard on the response, so an unstubbed, unexpected reply here could throw
// during render and fail these tests for a reason unrelated to wallet
// connect. e2e/routes.spec.ts intentionally stays unstubbed and hits the
// live backend — this interception is scoped to this file only.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/page/info/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 200,
        data: { balances: [], apys: [], prices: { avax: 0, flr: 0, sgb: 0 } },
      }),
    })
  )
})

test('connects a discovered EIP-6963 wallet', async ({ page, consoleErrors }) => {
  await injectMockWallet(page)
  await page.goto('/#/')

  // The home page's CallToAction section renders its own "Connect Wallet"
  // button whenever no wallet is connected, so the plain role query is
  // ambiguous. Scope to the header — it's the button that later shows
  // MOCK_ADDRESS_DISPLAY, so the post-connect assertion stays meaningful.
  await page.getByRole('banner').getByRole('button', { name: 'Connect Wallet' }).click()

  const dialog = page.getByRole('dialog', { name: 'Connect a wallet' })
  await expect(dialog).toBeVisible({ timeout: PICKER_MOUNT_TIMEOUT })

  await dialog.getByRole('button', { name: MOCK_WALLET_NAME }).click()

  // The picker closes itself only on a successful connect.
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: MOCK_ADDRESS_DISPLAY })).toBeVisible()

  const methods = (await walletCalls(page)).map(c => c.method)
  expect(methods).toContain('eth_requestAccounts')

  await page.waitForLoadState('networkidle')
  expect(consoleErrors).toEqual([])
})

test('requests a chain switch when connecting on a protocol route', async ({ page }) => {
  // Provider sits on Songbird (0x13) while the route wants Flare (0xe), so
  // switchNetworkIfNecessary must issue wallet_switchEthereumChain.
  await injectMockWallet(page, { chainId: '0x13' })
  await page.goto('/#/flare/fsp')

  // Same ambiguity as the other test: CallToAction on this route also
  // renders a "Connect Wallet" button, so scope to the header.
  await page.getByRole('banner').getByRole('button', { name: 'Connect Wallet' }).click()

  const dialog = page.getByRole('dialog', { name: 'Connect a wallet' })
  await expect(dialog).toBeVisible({ timeout: PICKER_MOUNT_TIMEOUT })
  await dialog.getByRole('button', { name: MOCK_WALLET_NAME }).click()

  await expect(page.getByRole('button', { name: MOCK_ADDRESS_DISPLAY })).toBeVisible()

  const switchCall = (await walletCalls(page)).find(
    c => c.method === 'wallet_switchEthereumChain'
  )
  expect(switchCall).toBeDefined()
  expect(switchCall?.params).toEqual([{ chainId: '0xe' }])
})
