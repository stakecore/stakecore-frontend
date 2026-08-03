import { test, expect } from './fixtures/console'
import {
  injectMockWallet,
  walletCalls,
  MOCK_WALLET_NAME,
  MOCK_ADDRESS_DISPLAY,
} from './fixtures/wallet'

// root.tsx lazy-mounts the picker via useAfterIdle, whose requestIdleCallback
// timeout is 2s — so the dialog can appear a beat after the click. Give the
// first assertion after opening it room beyond the 5s default.
const PICKER_MOUNT_TIMEOUT = 15_000

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
