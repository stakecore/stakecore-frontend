import { test, expect } from './fixtures/console'
import { ROUTES, NOT_FOUND_PATH } from './fixtures/routes'

for (const { path, heading } of ROUTES) {
  test(`${path} renders`, async ({ page, consoleErrors }) => {
    await page.goto(`/#${path}`)

    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()

    // Desktop side of the hero's breakpoint swap. e2e/mobile.spec.ts proves the
    // band renders below md; this proves the WebGL canvas renders above it and
    // the band does not. useBelowMd.test.tsx already asserts both arms of the
    // hook, but against a fake matchMedia — this is the same claim against a
    // real viewport and the real components. Scoped to '/' since it's the only
    // route with any hero decoration.
    if (path === '/') {
      await expect(page.locator('canvas.hero-rune-canvas')).toHaveCount(1)
      await expect(page.locator('.hero-rune-band')).toHaveCount(0)
    }

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
