import { test, expect } from './fixtures/console'

// The stack carousel's reduced-motion fallback is pure CSS, which is exactly
// why it needs a browser to verify. happy-dom computes no styles, so a unit
// test asserting the fallback would pass against a stylesheet that does
// nothing — the same trap CLAUDE.md records for component-level axe and
// colour-contrast. These are the only assertions that can catch it.

const ABOUT = '/#/about'
const ROSTER_SIZE = 14

test.describe('stack carousel', () => {
  test('auto-scrolls and wraps when motion is allowed', async ({ page, consoleErrors }) => {
    await page.goto(ABOUT)
    const scroller = page.locator('.stack-carousel')
    await scroller.scrollIntoViewIfNeeded()

    // Both halves are rendered so the loop has an identical seam to wrap at.
    await expect(page.locator('.stack-carousel-half')).toHaveCount(2)
    await expect(page.locator('.stack-carousel-half').nth(1))
      .toHaveAttribute('aria-hidden', 'true')

    const before = await scroller.evaluate(el => el.scrollLeft)
    await page.waitForTimeout(1200)
    const after = await scroller.evaluate(el => el.scrollLeft)
    expect(after).toBeGreaterThan(before)

    expect(consoleErrors).toEqual([])
  })

  test('pauses while the pointer rests on it', async ({ page }) => {
    await page.goto(ABOUT)
    const scroller = page.locator('.stack-carousel')
    await scroller.scrollIntoViewIfNeeded()
    await scroller.hover()
    // Let any in-flight frame land before sampling, so the baseline is taken
    // after the pause has actually taken effect rather than mid-step.
    await page.waitForTimeout(200)

    const before = await scroller.evaluate(el => el.scrollLeft)
    await page.waitForTimeout(1200)
    expect(await scroller.evaluate(el => el.scrollLeft)).toBe(before)
  })
})

// Reduced motion is emulated per test with page.emulateMedia rather than
// declared with test.use({ reducedMotion: 'reduce' }). The declarative form
// was measured NOT to reach the page here — inside the describe it left
// matchMedia('(prefers-reduced-motion: reduce)').matches false and the
// assertions below failed against a perfectly working stylesheet. emulateMedia
// is applied to the live page, so there is nothing to resolve or merge.
// Call it before goto: these rules affect first layout, not just repaint.
test.describe('stack carousel under reduced motion', () => {
  // The whole point of the fallback: with no loop running, a scroller would
  // park most of the roster off-screen with nothing to bring it round. The
  // static layout must leave nothing horizontally out of reach.
  test('lays the roster out with nothing to scroll to', async ({ page, consoleErrors }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ABOUT)
    const scroller = page.locator('.stack-carousel')
    await scroller.scrollIntoViewIfNeeded()

    // Guards the emulation itself: without this, every assertion below would
    // silently be testing the ordinary motion path instead.
    expect(await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    )).toBe(true)

    const { scrollWidth, clientWidth } = await scroller.evaluate(el => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)

    // Frozen at the start, not creeping.
    const before = await scroller.evaluate(el => el.scrollLeft)
    await page.waitForTimeout(1000)
    expect(await scroller.evaluate(el => el.scrollLeft)).toBe(before)

    expect(consoleErrors).toEqual([])
  })

  test('shows every item exactly once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ABOUT)
    await page.locator('.stack-carousel').scrollIntoViewIfNeeded()

    // The duplicate half is dropped from the layout here, so each name must
    // appear once — a visible clone would read as a rendering bug.
    await expect(page.locator('.stack-item-name:visible')).toHaveCount(ROSTER_SIZE)

    // Scoped to the first half: the clone is display:none but still in the
    // DOM, and getByText matches hidden nodes too. Spot-check the two brands
    // rendered as type rather than a glyph, and the one whose placement was
    // the point of the group labels.
    const shown = page.locator('.stack-carousel-half').first()
    await expect(shown.getByText('HAProxy', { exact: true })).toBeVisible()
    await expect(shown.getByText('Loki', { exact: true })).toBeVisible()
    await expect(shown.getByText('Claude', { exact: true })).toBeVisible()
  })
})
