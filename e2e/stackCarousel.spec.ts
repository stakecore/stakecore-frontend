import { test, expect } from './fixtures/console'

// The stack carousel's two behaviours that only exist in a browser: the rows
// scroll opposite ways, and the reduced-motion fallback is pure CSS. happy-dom
// computes no styles, so a unit test asserting the fallback would pass against
// a stylesheet that does nothing — the same trap CLAUDE.md records for
// component-level axe and colour-contrast. These are the only assertions that
// can catch either.

const ABOUT = '/#/about'
const ROSTER_SIZE = 15

// Long enough to out-run sampling jitter at 21–25px/s (~13–15px of travel),
// short enough that neither row can lap its ~1800px half and wrap mid-sample.
const SAMPLE_MS = 600

const rows = (page: import('@playwright/test').Page) => ({
  top: page.locator('.stack-carousel').first(),
  bottom: page.locator('.stack-carousel').last(),
})

test.describe('stack carousel', () => {
  test('renders two counter-scrolling rows', async ({ page, consoleErrors }) => {
    await page.goto(ABOUT)
    await expect(page.locator('.stack-carousel')).toHaveCount(2)
    const { top, bottom } = rows(page)
    await top.scrollIntoViewIfNeeded()

    // The reverse row starts at 0 and wraps forward to the seam on its first
    // frame — identical content either side, so invisible, but it would read
    // as a jump forward if sampled immediately. Let it settle first.
    await page.waitForTimeout(300)

    const before = {
      top: await top.evaluate(el => el.scrollLeft),
      bottom: await bottom.evaluate(el => el.scrollLeft),
    }
    await page.waitForTimeout(SAMPLE_MS)
    const after = {
      top: await top.evaluate(el => el.scrollLeft),
      bottom: await bottom.evaluate(el => el.scrollLeft),
    }

    expect(after.top, 'top row should advance').toBeGreaterThan(before.top)
    expect(after.bottom, 'bottom row should retreat').toBeLessThan(before.bottom)

    expect(consoleErrors).toEqual([])
  })

  test('duplicates each row so it can wrap seamlessly', async ({ page }) => {
    await page.goto(ABOUT)
    await page.locator('.stack-carousel').first().scrollIntoViewIfNeeded()

    for (const row of await page.locator('.stack-carousel').all()) {
      const halves = row.locator('.stack-carousel-half')
      expect(await halves.count()).toBeGreaterThanOrEqual(2)
      // Only the leading copy is exposed; every repeat after it is inert.
      for (let i = 1; i < await halves.count(); i++) {
        await expect(halves.nth(i)).toHaveAttribute('aria-hidden', 'true')
      }
    }
  })

  // The regression this guards: scrollLeft stops at scrollWidth - clientWidth,
  // so if one repeat of the content is wider than that range the wrap point
  // can never be reached and the row creeps to the end and freezes (or, going
  // backwards, jumps the wrong distance and tears). Two copies of these short
  // rows did exactly that at desktop widths. Asserting the geometry catches it
  // instantly; catching it by watching for a stall takes ~40 seconds.
  test('gives every row a reachable wrap point', async ({ page }) => {
    await page.goto(ABOUT)
    await page.locator('.stack-carousel').first().scrollIntoViewIfNeeded()

    for (const row of await page.locator('.stack-carousel').all()) {
      const { period, maxScroll } = await row.evaluate(el => {
        const copies = el.querySelectorAll('.stack-carousel-half').length
        return {
          period: el.scrollWidth / copies,
          maxScroll: el.scrollWidth - el.clientWidth,
        }
      })
      expect(period).toBeGreaterThan(0)
      expect(period).toBeLessThanOrEqual(maxScroll)
    }
  })

  test('pauses the hovered row while the pointer rests on it', async ({ page }) => {
    await page.goto(ABOUT)
    const { top } = rows(page)
    await top.scrollIntoViewIfNeeded()
    await top.hover()
    // Let any in-flight frame land before sampling, so the baseline is taken
    // after the pause has actually taken effect rather than mid-step.
    await page.waitForTimeout(200)

    const before = await top.evaluate(el => el.scrollLeft)
    await page.waitForTimeout(SAMPLE_MS * 2)
    expect(await top.evaluate(el => el.scrollLeft)).toBe(before)
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
  // park most of the roster off-screen with nothing to bring it round. Both
  // rows must leave everything horizontally in reach.
  test('lays both rows out with nothing to scroll to', async ({ page, consoleErrors }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ABOUT)
    await page.locator('.stack-carousel').first().scrollIntoViewIfNeeded()

    // Guards the emulation itself: without this, every assertion below would
    // silently be testing the ordinary motion path instead.
    expect(await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    )).toBe(true)

    for (const row of await page.locator('.stack-carousel').all()) {
      const { scrollWidth, clientWidth } = await row.evaluate(el => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)

      // Frozen, not creeping — in either direction.
      const before = await row.evaluate(el => el.scrollLeft)
      await page.waitForTimeout(500)
      expect(await row.evaluate(el => el.scrollLeft)).toBe(before)
    }

    expect(consoleErrors).toEqual([])
  })

  test('shows every item exactly once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ABOUT)
    await page.locator('.stack-carousel').first().scrollIntoViewIfNeeded()

    // The duplicate half of each row is dropped from the layout here, so each
    // name must appear once — a visible clone would read as a rendering bug.
    await expect(page.locator('.stack-item-name:visible')).toHaveCount(ROSTER_SIZE)

    // Scoped to the visible halves: clones are display:none but still in the
    // DOM, and getByText matches hidden nodes too. Spot-check the two brands
    // rendered as type rather than a glyph, and the one whose placement was
    // the point of the group labels — one from each row.
    const shown = page.locator('.stack-carousel-half').filter({ visible: true })
    await expect(shown.getByText('HAProxy', { exact: true })).toBeVisible()
    await expect(shown.getByText('Loki', { exact: true })).toBeVisible()
    await expect(shown.getByText('Claude', { exact: true })).toBeVisible()
  })
})
