import { test, expect, type Page, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { ROUTES } from './fixtures/routes'

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
  // Excludes the YouTube embed in movieClip.tsx: axe injects into every frame,
  // including cross-origin ones, so without this the scan audits YouTube's own
  // player markup (their aria-label strings, their button roles) rather than
  // ours. Scope, not suppression — aria-allowed-attr, aria-prohibited-attr and
  // button-name stay fully active on everything that is actually our markup.
  const results = await new AxeBuilder({ page })
    .withTags(SCAN_TAGS)
    .exclude('iframe')
    .analyze()

  const isWcag = (v: { tags: string[] }) => v.tags.some(t => WCAG_TAGS.includes(t))
  const gated = results.violations.filter(isWcag)
  const advisory = results.violations.filter(v => !isWcag(v))

  if (advisory.length > 0) {
    console.warn(
      `[a11y] ${label} — best-practice, not gated:\n  ` +
        advisory.map(summarise).join('\n  ')
    )
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

for (const { path } of ROUTES) {
  test(`${path} has no WCAG violations`, async ({ page }, testInfo) => {
    await page.goto(`/#${path}`)
    // Without this the audit targets a loading spinner, not the rendered page.
    await page.waitForLoadState('networkidle')

    expect(await scanForWcagViolations(page, testInfo, path)).toEqual([])
  })
}

test('the 404 page has no WCAG violations', async ({ page }, testInfo) => {
  await page.goto('/#/no-such-page')
  await page.waitForLoadState('networkidle')

  expect(await scanForWcagViolations(page, testInfo, '404')).toEqual([])
})
