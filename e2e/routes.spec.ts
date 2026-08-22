import { test, expect } from './fixtures/backend'
import { ROUTES, NOT_FOUND_PATH, NOT_FOUND_TITLE } from './fixtures/routes'

for (const { path, heading, title } of ROUTES) {
  test(`${path} renders`, async ({ page, consoleErrors }) => {
    await page.goto(`/#${path}`)

    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    // WCAG 2.4.2. Asserted on the same navigation as the heading so the two
    // can't drift: a title naming a page the router didn't render is worse
    // than no title at all.
    await expect(page).toHaveTitle(title)

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
  // A heading, not a styled <div>: "Page not found" reads as the page's title
  // visually, and 1.3.1 requires that relationship to survive into the markup.
  // It is also what gives the 404 the level-1 heading every other route has.
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  await expect(page).toHaveTitle(NOT_FOUND_TITLE)

  expect(consoleErrors).toEqual([])
})

test('/news links out to the FAsset 3D Visualiser', async ({ page, consoleErrors }) => {
  await page.goto('/#/news')

  // Scoped to this post's own .news-post rather than the whole page: a link
  // label is only unique within a post (see the comment on NewsLink['label']
  // in src/utils/data/news.tsx), and a second post linking the same host
  // would otherwise make these locators ambiguous.
  const post = page.locator('.news-post', { has: page.getByRole('heading', { name: 'FAsset 3D Visualiser' }) })

  const link = post.getByRole('link', { name: 'fasset.stakecore.org' })
  await expect(link).toHaveAttribute('href', 'https://fasset.stakecore.org')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')

  const testnet = post.getByRole('link', { name: 'fasset-coston2.stakecore.org' })
  await expect(testnet).toHaveAttribute('href', 'https://fasset-coston2.stakecore.org')

  // Presence of the anchors only — never a request to either host. External
  // uptime must not be able to redden this repo's CI.
  expect(consoleErrors).toEqual([])
})

// Guards e2e/fixtures/embeds.ts. Every spec that waits on
// `waitForLoadState('networkidle')` settles only once the YouTube player and
// the fonts it pulls from gstatic have finished, so without that fixture the
// four video routes take their settle time from a third-party CDN — measured:
// holding only the player's requests left /flare/fsp never settling while
// /about settled in 517ms. The symptom is a suite that reddens on a protocol
// route, at that call, and goes green on a rerun.
//
// Asserted as "no player subresources" rather than "no request to the embed
// URL": the fixture fulfils that one request locally, so it still shows up as
// a request. `/s/player/...` and the gstatic fonts only ever appear if the
// real player actually loaded.
test('protocol routes pull nothing from the video CDN', async ({ page }) => {
  const external: string[] = []
  page.on('request', r => {
    const url = r.url()
    if (/fonts\.gstatic\.com|youtube-nocookie\.com\/s\//.test(url)) external.push(url)
  })

  await page.goto('/#/flare/fsp')
  await expect(page.getByRole('heading', { level: 1, name: 'Flare Systems Protocol' })).toBeVisible()
  // A fixed wait rather than networkidle: what this asserts has nothing to do
  // with whether our own backend has settled, and the player is lazy and
  // chatty — this just gives it room to betray itself.
  await page.waitForTimeout(3000)

  expect(external).toEqual([])

  // The <iframe> itself must survive — it is our markup, and axe's frame-title
  // rule selects it. Only the bytes behind it are stubbed.
  await expect(page.locator('.video-container iframe')).toHaveAttribute('title', 'YouTube video player')
})
