import { test, expect } from './fixtures/console'

// The stack carousel's two behaviours that only exist in a browser: the rows
// scroll opposite ways, and the reduced-motion fallback is pure CSS. happy-dom
// computes no styles, so a unit test asserting the fallback would pass against
// a stylesheet that does nothing — the same trap CLAUDE.md records for
// component-level axe and colour-contrast. These are the only assertions that
// can catch either.

const ABOUT = '/#/about'
// Every item across both rows of STACK_ROWS in src/pages/about/stackCarousel.tsx.
// Hardcoded rather than imported: that module is TSX and pulls in a stylesheet,
// which this process cannot transform. Bump it when the roster changes.
const ROSTER_SIZE = 22

// Long enough to out-run sampling jitter at 21–25px/s (~13–15px of travel),
// short enough that neither row can lap its ~1800px half and wrap mid-sample.
const SAMPLE_MS = 600

const rows = (page: import('@playwright/test').Page) => ({
  top: page.locator('.stack-carousel').first(),
  bottom: page.locator('.stack-carousel').last(),
})

// The loop animates a transform on the track, not the container's scroll
// offset — scroll offsets are quantised to whole pixels and these rows move
// well under a pixel per frame. Read the offset back out of the transform.
const offsetOf = async (row: import('@playwright/test').Locator) =>
  row.evaluate(el => {
    const t = getComputedStyle(el.firstElementChild as HTMLElement).transform
    if (!t || t === 'none') return 0
    // matrix(a, b, c, d, tx, ty)
    return -Number(t.slice(t.indexOf('(') + 1, -1).split(',')[4])
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

    const before = { top: await offsetOf(top), bottom: await offsetOf(bottom) }
    await page.waitForTimeout(SAMPLE_MS)
    const after = { top: await offsetOf(top), bottom: await offsetOf(bottom) }

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

  // The regression this guards: once one repeat has slid off the left, what
  // remains must still cover the container, or the far end of the content
  // comes into view before the wrap does and the row visibly runs out. Two
  // copies of these short rows failed that at desktop widths. Asserting the
  // geometry catches it instantly; catching it by eye takes ~40 seconds.
  test('leaves enough content to cover the row after one repeat', async ({ page }) => {
    await page.goto(ABOUT)
    await page.locator('.stack-carousel').first().scrollIntoViewIfNeeded()

    for (const row of await page.locator('.stack-carousel').all()) {
      const { period, remaining } = await row.evaluate(el => {
        const track = el.firstElementChild as HTMLElement
        const copies = el.querySelectorAll('.stack-carousel-half').length
        const one = track.offsetWidth / copies
        return { period: one, remaining: track.offsetWidth - one - el.clientWidth }
      })
      expect(period).toBeGreaterThan(0)
      expect(remaining).toBeGreaterThanOrEqual(0)
    }
  })

  // The whole point of animating a transform. Scroll offsets are whole
  // pixels, so at 21-25px/s the rows rendered a 1px jump every second or
  // third frame and sat frozen in between — 58% of frames measured as
  // completely still. Sample the rendered position every frame and require
  // that it actually moves on essentially all of them.
  test('moves on every frame rather than stepping whole pixels', async ({ page }) => {
    await page.goto(ABOUT)
    await page.locator('.stack-carousel').first().scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)

    const frozen = await page.evaluate(async () => {
      const track = document.querySelector('.stack-carousel')?.firstElementChild
      if (!(track instanceof HTMLElement)) return 1
      const xs: number[] = []
      await new Promise<void>(resolve => {
        const t0 = performance.now()
        const tick = (ts: number) => {
          xs.push(track.getBoundingClientRect().x)
          if (ts - t0 < 1500) requestAnimationFrame(tick)
          else resolve()
        }
        requestAnimationFrame(tick)
      })
      const deltas: number[] = []
      for (let i = 1; i < xs.length; i++) deltas.push(Math.abs(xs[i]! - xs[i - 1]!))
      const steady = deltas.filter(d => d < 50)
      return steady.filter(d => d < 0.01).length / steady.length
    })

    // Scroll-driven, this was ~0.58. A transform carries the fraction, so
    // the only still frames should be scheduling noise.
    expect(frozen).toBeLessThan(0.1)
  })

  test('pauses the hovered row while the pointer rests on it', async ({ page }) => {
    await page.goto(ABOUT)
    const { top } = rows(page)
    await top.scrollIntoViewIfNeeded()
    await top.hover()
    // Let any in-flight frame land before sampling, so the baseline is taken
    // after the pause has actually taken effect rather than mid-step.
    await page.waitForTimeout(200)

    const before = await offsetOf(top)
    await page.waitForTimeout(SAMPLE_MS * 2)
    expect(await offsetOf(top)).toBe(before)
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

      // Frozen, not creeping — in either direction. The offset lives in the
      // track's transform now, and with no loop running it should never have
      // been written at all.
      const before = await offsetOf(row)
      await page.waitForTimeout(500)
      expect(await offsetOf(row)).toBe(before)
      expect(before).toBe(0)
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
    // DOM, and getByText matches hidden nodes too. Spot-check the brand
    // rendered as type rather than a glyph, the one whose mark is fetched
    // from the vendor rather than Simple Icons, and the one whose placement
    // was the point of the group labels — covering both rows.
    const shown = page.locator('.stack-carousel-half').filter({ visible: true })
    await expect(shown.getByText('HAProxy', { exact: true })).toBeVisible()
    await expect(shown.getByText('Loki', { exact: true })).toBeVisible()
    await expect(shown.getByText('Claude', { exact: true })).toBeVisible()
  })
})
