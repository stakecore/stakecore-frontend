import type { Page } from '@playwright/test'
import { test, expect } from './fixtures/backend'

// A chunk that is part of a page, not the page itself, must not be able to
// take the page down with it.
//
// The report this covers: GitHub Pages served a 503 for the fsp-stats chunk on
// /#/flare/fsp. The chunk existed the whole time — the same URL returned 200
// minutes later from the same deploy — but the rejection reached the route's
// errorElement and replaced everything: the <h1>, the provider data that had
// already loaded fine, and the delegate widget, under the message "A new
// version may have been deployed."
//
// These live in e2e rather than in unit tests because every assertion here is
// a fact about the browser, not about React. happy-dom has no module map, so
// the retry cannot be exercised there at all, and the request counts below —
// the ones that caught a retry storm during development — have nothing to
// count.

// Must match the retried URL too. The retry appends `?__retry=n`, so a pattern
// ending in `.js` lets every retry through to the real server and the test
// passes for the wrong reason.
const FSP_STATS_CHUNK = '**/assets/fsp-stats-*'

const FSP_ROUTE = '/#/flare/fsp'

const unavailable = (page: Page) => page.getByText('Statistics unavailable')

// The stats section is inside QueryState's data branch, so nothing here can be
// observed until the live backend has answered. That first call is the slow
// part of each test — the first request a worker makes has been measured at
// 16s against ~90ms for the rest — so the assertion gating on it is given its
// own budget instead of the default 5s.
const DATA_ARRIVED = { timeout: 45_000 }

// fsp-stats draws charts when the reward epoch has produced data and an
// informational empty state when it has not, and which one is live is the
// backend's business. Either proves what these tests care about: the chunk
// was fetched, evaluated and rendered. Anything matching inside .protocol-body
// is the stats section's — QueryState's own empty state is a sibling of this
// whole branch, and only renders when the delegate heading below is absent.
const statsRendered = (page: Page) =>
  page.locator('.protocol-body .recharts-surface, .protocol-body .empty-state').first()

test('a permanently failing section chunk does not take the route down', async ({ page }) => {
  test.slow()
  let requests = 0
  await page.route(FSP_STATS_CHUNK, route => {
    requests++
    return route.fulfill({ status: 503, contentType: 'text/plain', body: 'Service Unavailable' })
  })

  await page.goto(FSP_ROUTE)

  // Everything the page is actually for still works. The delegate heading is
  // the load-bearing one: it renders from the same data as the stats section,
  // sits above it, and is what the reported failure destroyed.
  await expect(page.getByRole('heading', { name: 'Delegate On Our Website' })).toBeVisible(DATA_ARRIVED)
  await expect(page.getByRole('heading', { level: 1, name: 'Flare Systems Protocol' })).toBeVisible()
  await expect(page.locator('.route-error')).toHaveCount(0)
  await expect(page.locator('.error-container')).toHaveCount(0)

  // ...and the failure is contained to the section that had it.
  await expect(unavailable(page)).toBeVisible()

  // The retry is bounded. Holding the lazy() in component state instead of
  // per call site made this 3,786 requests in 30s and no error UI: a chunk
  // that suspends on first render never commits, so React rebuilds the
  // subtree on every retry, and a lazy() minted in there is a different
  // object each time — so the rejection is never replayed as a catchable
  // throw. One initial request plus the two cache-busted retries is the
  // whole budget.
  expect(requests).toBe(3)
})

test('a transient 503 on a section chunk recovers without the user noticing', async ({ page }) => {
  test.slow()
  // Exactly the production shape: the first fetch fails, the file is fine.
  let requests = 0
  await page.route(FSP_STATS_CHUNK, route => {
    requests++
    return requests === 1
      ? route.fulfill({ status: 503, contentType: 'text/plain', body: 'Service Unavailable' })
      : route.continue()
  })

  await page.goto(FSP_ROUTE)

  // Recovered on its own, with no error UI shown at any point. This passes
  // only because the retry asks for a URL the module map has not already
  // recorded a failure against: in Chromium, three imports of a 503'd URL
  // produce one request and two instant rejections, so a plain re-call of the
  // same import() would leave the fallback on screen.
  await expect(statsRendered(page)).toBeVisible(DATA_ARRIVED)
  await expect(unavailable(page)).toHaveCount(0)
  expect(requests).toBe(2)
})

test('the fallback can be retried in place once the chunk is available again', async ({ page }) => {
  test.slow()
  let failing = true
  await page.route(FSP_STATS_CHUNK, route =>
    failing
      ? route.fulfill({ status: 503, contentType: 'text/plain', body: 'Service Unavailable' })
      : route.continue())

  await page.goto(FSP_ROUTE)
  await expect(unavailable(page)).toBeVisible(DATA_ARRIVED)

  failing = false
  await page.getByRole('button', { name: 'Retry' }).click()

  await expect(statsRendered(page)).toBeVisible()
  await expect(unavailable(page)).toHaveCount(0)
  // The page never went anywhere — the point of retrying in place rather than
  // reloading, which would cost the user their wallet session and scroll
  // position over a chart.
  await expect(page.getByRole('heading', { name: 'Delegate On Our Website' })).toBeVisible()
})
