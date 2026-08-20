import { test, expect } from './fixtures/backend'
import { ROUTES, NOT_FOUND_PATH } from './fixtures/routes'

for (const { path, heading } of ROUTES) {
  test(`${path} renders`, async ({ page, consoleErrors }) => {
    await page.goto(`/#${path}`)

    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()

    // The error assertions below are point-in-time, and ServerError only
    // appears once a fetch has actually failed — so wait for SWR to settle
    // first. networkidle is the right tool here despite the general advice
    // against it: nothing on these pages holds a connection open.
    await page.waitForLoadState('networkidle')

    // NotFound and RouteError share .error-container with ServerError; only
    // the first two carry the --centered modifier. None belongs on a content
    // route, so the bare-class assertion covers all three.
    await expect(page.locator('.error-container')).toHaveCount(0)
    // Called out separately because it is the loudest failure of the three:
    // the route's render boundary caught a throw, or its chunk never loaded.
    await expect(page.locator('.route-error')).toHaveCount(0)

    expect(consoleErrors).toEqual([])
  })
}

test('unknown paths render the 404 page', async ({ page, consoleErrors }) => {
  await page.goto(NOT_FOUND_PATH)

  await expect(page.locator('.error-container--centered')).toBeVisible()
  await expect(page.getByText('404', { exact: true })).toBeVisible()
  await expect(page.getByText('Page not found')).toBeVisible()

  expect(consoleErrors).toEqual([])
})

test('/news links out to the FAsset Visualiser', async ({ page, consoleErrors }) => {
  await page.goto('/#/news')

  const link = page.getByRole('link', { name: 'fasset.stakecore.org' })
  await expect(link).toHaveAttribute('href', 'https://fasset.stakecore.org')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')

  const testnet = page.getByRole('link', { name: 'Coston2 testnet' })
  await expect(testnet).toHaveAttribute('href', 'https://fasset-coston2.stakecore.org')

  // Presence of the anchors only — never a request to either host. External
  // uptime must not be able to redden this repo's CI.
  expect(consoleErrors).toEqual([])
})
