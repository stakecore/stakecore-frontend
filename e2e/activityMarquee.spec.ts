import { test, expect } from './fixtures/backend'

// The hero activity feed's two behaviours that only exist in a browser, both
// of them regressions this file exists to hold shut.
//
// The feed is a native scroll container the user can swipe, and useMarquee
// auto-advances it. Those are two ways of moving the same row, and the whole
// question is whether they move the same coordinate. When the loop kept its
// position in a transform instead, content was drawn at `scrollLeft + travel`
// while the user could only ever reach `scrollLeft >= 0` — so the first
// `travel` pixels, growing to minutes' worth of cards, sat outside the scroll
// range with nothing able to bring them back. That is a fact about layout and
// scroll geometry: happy-dom lays nothing out, so no unit test can see it.

const HOME = '/#/'

// Distance travelled, however it is split between the two channels.
const positionOf = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const el = document.querySelector('.activity-marquee')
    const track = el?.firstElementChild
    if (!(el instanceof HTMLElement) || !(track instanceof HTMLElement)) return 0
    const t = getComputedStyle(track).transform
    const tx = !t || t === 'none' ? 0 : Number(t.slice(t.indexOf('(') + 1, -1).split(',')[4])
    return el.scrollLeft - tx
  })

test.describe('activity marquee', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME)
    await page.locator('.activity-marquee .activity-card').first().waitFor()
    // Let the loop travel far enough that a position held outside the scroll
    // range would put the first card well past the left edge.
    await page.waitForTimeout(2500)
  })

  test('a swipe to the far left reaches the first card', async ({ page }) => {
    const marquee = page.locator('.activity-marquee')
    // Park the pointer on the row so the loop pauses, which is the state a
    // user swiping it is in, and measure in one synchronous pass so no frame
    // can land between the scroll and the read.
    await marquee.hover()
    await page.waitForTimeout(200)

    const geometry = await marquee.evaluate(el => {
      el.scrollLeft = 0
      const first = el.querySelector('.activity-card')
      if (!(first instanceof HTMLElement)) return null
      const container = el.getBoundingClientRect()
      const card = first.getBoundingClientRect()
      return {
        clippedLeft: container.left - card.left,
        withinRight: card.right <= container.right,
      }
    })

    expect(geometry, 'the feed should have rendered cards').not.toBeNull()
    // Sub-pixel: all the loop may hold outside the scroll range is the
    // fraction of a pixel the scroll offset cannot carry.
    expect(geometry?.clippedLeft, 'first card should not be held left of the edge').toBeLessThan(1)
    expect(geometry?.withinRight).toBe(true)
  })

  // Every card carries links that open in a new tab. Pausing on any focus at
  // all meant the row stopped when one was clicked and never restarted: the
  // anchor still holds focus when the user comes back, so no focusout is ever
  // fired. Only keyboard focus needs the pause. preventDefault keeps the
  // navigation out of it — the focus, not the new tab, is what latched.
  test('keeps moving after a link inside it is clicked', async ({ page }) => {
    await page.locator('.activity-marquee').evaluate(el =>
      el.addEventListener('click', e => e.preventDefault(), true))

    // Hover first, as a user reaching for a link does: Playwright will not
    // click a target that is still moving between frames, and the pointer
    // pause is what holds it still.
    await page.locator('.activity-marquee').hover()
    await page.waitForTimeout(200)
    await page.locator('.activity-marquee .activity-card a').first().click()
    expect(await page.evaluate(() =>
      document.querySelector('.activity-marquee')?.contains(document.activeElement),
    ), 'the click should have left focus on the link').toBe(true)

    // Off the row, and past the interaction pause a click's pointer events set.
    await page.mouse.move(5, 5)
    await page.waitForTimeout(1500)

    const before = await positionOf(page)
    await page.waitForTimeout(600)
    expect(await positionOf(page), 'the row should still be advancing').toBeGreaterThan(before)
  })
})
