import { devices } from '@playwright/test'
import { test, expect } from './fixtures/console'

// The hero background is the only breakpoint-switched component in the app,
// and the desktop-only project would never exercise its mobile path. Scoped to
// one route at one viewport deliberately: a full mobile project roughly
// doubles e2e runtime against the live backend for very little extra signal.
test.use({ ...devices['Pixel 5'] })

test('the hero mounts the shimmer background, not the WebGL field', async ({ page, consoleErrors }) => {
  await page.goto('/#/')

  await expect(page.getByRole('heading', { level: 1, name: 'StakeCore' })).toBeVisible()

  // Exactly one background canvas, and it is the mobile one. HeroRuneCanvas is
  // the only caller of getContext('webgl2') on this route, so its absence from
  // the DOM is the guarantee that no WebGL context was created.
  const canvas = page.locator('canvas.hero-rune-canvas')
  await expect(canvas).toHaveCount(1)
  await expect(canvas).toHaveClass(/hero-rune-canvas--shimmer/)

  // Point-in-time assertions, so let SWR settle first — same reasoning as
  // routes.spec.ts. Nothing on this page holds a connection open.
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.error-container')).toHaveCount(0)
  await expect(page.locator('.route-error')).toHaveCount(0)

  expect(consoleErrors).toEqual([])
})
