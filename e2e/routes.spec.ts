import { test, expect } from './fixtures/console'
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

    // NotFound shares .error-container with ServerError; only NotFound carries
    // the --centered modifier. Neither belongs on a content route.
    await expect(page.locator('.error-container')).toHaveCount(0)
    // Rendered by ChunkLoadError when a lazy route chunk fails to load.
    await expect(page.locator('.lazy-load-error')).toHaveCount(0)

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
