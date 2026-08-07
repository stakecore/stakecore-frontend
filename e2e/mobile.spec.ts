import { devices } from '@playwright/test'
import { test, expect } from './fixtures/console'

// The hero's decoration is the only breakpoint-switched thing in the app, and
// the desktop-only project would never exercise its mobile path. Scoped to one
// route at one viewport deliberately: a full mobile project roughly doubles
// e2e runtime against the live backend for very little extra signal.
test.use({ ...devices['Pixel 5'] })

test('the hero renders the rune band and no WebGL canvas', async ({ page, consoleErrors }) => {
  await page.goto('/#/')

  await expect(page.getByRole('heading', { level: 1, name: 'StakeCore' })).toBeVisible()

  // HeroRuneCanvas is the only caller of getContext('webgl2') on this route, so
  // its absence from the DOM is the guarantee that no context was created.
  await expect(page.locator('.hero-rune-band')).toHaveCount(1)
  await expect(page.locator('canvas.hero-rune-canvas')).toHaveCount(0)

  // The band must clear the activity feed. The previous design centred a mark
  // in a full-viewport canvas and it landed entirely inside the content, which
  // no assertion caught because none compared their boxes. This one does.
  const band = await page.locator('.hero-rune-band').boundingBox()
  const activity = await page.locator('.hero-activity').boundingBox()
  if (band == null) throw new Error('no .hero-rune-band — the mobile mark did not render')
  if (activity == null) throw new Error('no .hero-activity — the backend may have errored into .hero-error')
  expect(band.y).toBeGreaterThanOrEqual(activity.y + activity.height)

  // Point-in-time assertions, so let SWR settle first — same reasoning as
  // routes.spec.ts. Nothing on this page holds a connection open.
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.error-container')).toHaveCount(0)
  await expect(page.locator('.route-error')).toHaveCount(0)

  expect(consoleErrors).toEqual([])
})
