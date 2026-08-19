import type { Page, TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
// Not @playwright/test: without the CORS shim in this fixture every data
// route renders ServerError, and these scans would cover the error panel
// while claiming to cover the loaded page.
import { test, expect } from './fixtures/backend'
import { ROUTES, NOT_FOUND_PATH } from './fixtures/routes'
import { injectMockWallet, MOCK_WALLET_NAME, PICKER_MOUNT_TIMEOUT } from './fixtures/wallet'

// Gated: a violation carrying any of these fails the test.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// Scanned but not gated. best-practice is where heading-order lives — the rule
// that caught the real bug in 51976c8 — so we keep it visible. Gating on it
// would let a routine axe bump that adds a rule turn CI red. `experimental` is
// excluded entirely: unstable by axe's own definition.
const SCAN_TAGS = [...WCAG_TAGS, 'best-practice']

// Raw axe objects serialize to an unreadable wall of DOM in a failure diff.
// One line per violation, naming the rule and linking its docs, is what makes
// a red build actionable.
const summarise = (r: { id: string; helpUrl: string; nodes: unknown[] }) =>
  `${r.id} — ${r.nodes.length} node(s) — ${r.helpUrl}`

/**
 * Scans the current page and returns one summary line per gated (WCAG)
 * violation — empty means clean. best-practice violations and `incomplete`
 * results are reported to the console and the report, never returned, so they
 * cannot fail a test.
 */
async function scanForWcagViolations(
  page: Page,
  testInfo: TestInfo,
  label: string
): Promise<string[]> {
  // Excludes only the *contents* of the YouTube embed in movieClip.tsx: axe
  // injects into every frame, including cross-origin ones, so without this the
  // scan audits YouTube's own player markup (their aria-label strings, their
  // button roles) rather than ours. Excluding the whole `iframe` element (as
  // opposed to its contents) would also drop frame-title and
  // frame-focusable-content, which select the <iframe> itself in *our*
  // document — so the frame-path form here scopes out only what's inside it.
  // The second segment must be 'body', not 'html': axe's context resolution
  // defaults `include` to the whole document, i.e. the frame's own <html>, so
  // excluding 'html' ties with that boundary and axe's own containment check
  // (Node.contains() is true for self) resolves the tie in favour of
  // "in context" — the exclude is silently a no-op. 'body' is a strict
  // descendant of that boundary, so it excludes as intended. Verified via
  // axe's raw violation/pass output, not inferred from the docs.
  // Scope, not suppression — every rule stays fully active against everything
  // that is actually our markup, including the iframe element itself.
  const results = await new AxeBuilder({ page })
    .withTags(SCAN_TAGS)
    .exclude(['.video-container iframe', 'body'])
    .analyze()

  const isWcag = (v: { tags: string[] }) => v.tags.some(t => WCAG_TAGS.includes(t))
  const gated = results.violations.filter(isWcag)
  const advisory = results.violations.filter(v => !isWcag(v))

  if (advisory.length > 0) {
    const advisoryLines = advisory.map(summarise)
    console.warn(
      `[a11y] ${label} — best-practice, not gated:\n  ` + advisoryLines.join('\n  ')
    )
    // console.warn alone is invisible on a green run: Playwright's reporters
    // only print captured output for failing tests, and visibility is the
    // whole reason best-practice is scanned at all. attach() puts the full
    // list in the report; the annotation surfaces it in the HTML report's
    // test *list*, not just the per-test detail pane.
    await testInfo.attach(`axe-best-practice-${label.replace(/\W+/g, '-')}`, {
      body: advisoryLines.join('\n'),
      contentType: 'text/plain',
    })
    testInfo.annotations.push({
      type: 'a11y-best-practice',
      description: advisory.map(r => r.id).join(', '),
    })
  }

  // axe files a check here when it cannot decide — e.g. contrast over a
  // background image. Environment-sensitive, so gating on it would produce
  // CI-only failures; but silently dropping it is the blind spot that makes a
  // green run meaningless, so it is always surfaced.
  if (results.incomplete.length > 0) {
    console.warn(
      `[a11y] ${label} — incomplete, needs human review: ` +
        results.incomplete.map(r => r.id).join(', ')
    )
    await testInfo.attach(`axe-incomplete-${label.replace(/\W+/g, '-')}`, {
      body: JSON.stringify(results.incomplete, null, 2),
      contentType: 'application/json',
    })
  }

  return gated.map(summarise)
}

for (const { path, heading } of ROUTES) {
  test(`${path} has no WCAG violations`, async ({ page }, testInfo) => {
    await page.goto(`/#${path}`)
    // Guards against a vacuous pass: if a lazy chunk fails or React throws,
    // the body is effectively empty and every rule is inapplicable, so an
    // unscanned page would still report zero violations. This is not a
    // duplicate of routes.spec.ts's heading assertion — that spec doesn't run
    // when this one is invoked alone via --grep.
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    // Without this the audit targets a loading spinner, not the rendered page.
    await page.waitForLoadState('networkidle')

    expect(await scanForWcagViolations(page, testInfo, path)).toEqual([])
  })
}

test('the 404 page has no WCAG violations', async ({ page }, testInfo) => {
  await page.goto(NOT_FOUND_PATH)
  // Same vacuous-pass guard as the route loop above.
  await expect(page.getByText('Page not found')).toBeVisible()
  await page.waitForLoadState('networkidle')

  expect(await scanForWcagViolations(page, testInfo, '404')).toEqual([])
})

// The picker is the densest a11y surface in the app: role="dialog", aria-modal,
// a hand-rolled focus trap. Scanning the whole page rather than just the dialog
// is deliberate — the rules worth having here concern the relationship between
// the modal and the content behind it.
test('the wallet picker has no WCAG violations', async ({ page }, testInfo) => {
  await injectMockWallet(page)
  await page.goto('/#/')
  await page.waitForLoadState('networkidle')

  // Scoped to the header: CallToAction renders a second "Connect Wallet"
  // button, so the unscoped role query is a strict-mode violation.
  await page.getByRole('banner').getByRole('button', { name: 'Connect Wallet' }).click()

  const dialog = page.getByRole('dialog', { name: 'Connect a wallet' })
  await expect(dialog).toBeVisible({ timeout: PICKER_MOUNT_TIMEOUT })
  // Scan with a provider listed, not the "No browser wallets detected" state.
  await expect(dialog.getByRole('button', { name: MOCK_WALLET_NAME })).toBeVisible()

  expect(await scanForWcagViolations(page, testInfo, 'wallet-picker')).toEqual([])
})
