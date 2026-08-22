import { OpenAPI } from '../../src/backendApi/core/OpenAPI'
import { test as base } from './embeds'

/**
 * The live backend answers **every** origin with a fixed
 * `Access-Control-Allow-Origin: https://stakecore.org` — the same value with
 * no `Origin` header, with the production one, or with ours. Preview serves
 * from `https://localhost:4173`, so a browser there can issue the request and
 * never read the reply: every SWR call fails, every data route falls through
 * to ServerError, and the console fills with CORS errors. That is not a
 * product defect and no amount of retrying clears it — the origin is one thing
 * a localhost test run can never satisfy.
 *
 * This fixture patches that single header back. `route.fetch()` performs the
 * request from Playwright rather than from the page, where CORS does not
 * apply, and the reply is fulfilled unchanged apart from the origin. So the
 * specs still hit the real backend and still fail on a real outage, a 500, or
 * a schema change — the coverage CLAUDE.md describes is intact. Nothing is
 * stubbed here; see wallet.spec.ts for the one place that deliberately is.
 *
 * Three things to know before changing it:
 *
 * - **Do not "fix" this by allowlisting the CORS message in `console.ts`.**
 *   The console errors are the quieter half of the failure; the routes render
 *   ServerError, so an allowlist would leave routes.spec.ts asserting that the
 *   error panel is fine to show on every content route.
 * - **Per-spec stubs still win.** This is an auto fixture, so it registers
 *   during setup, before any `test.beforeEach` — and Playwright gives the
 *   last-registered matching handler precedence. A `page.route` in a spec
 *   therefore overrides this one for the paths it names.
 * - **Preflighted requests are not covered.** Chromium issues the preflight
 *   itself and `page.route` never sees it, so it would reach the real server
 *   and be refused. Only the contact-form POST preflights (it sends
 *   `Content-Type: application/json`); every other call is a GET carrying just
 *   `Accept`, which is CORS-safelisted. No spec submits that form today.
 *
 * The alternative fix lives in the backend: allowlist the preview origin
 * there, and this file can be deleted.
 */
export const test = base.extend<{ liveBackend: void }>({
  liveBackend: [
    async ({ page }, use) => {
      // Pattern taken from the generated client rather than retyped, so a
      // backend move can't leave this silently matching nothing.
      await page.route(`${OpenAPI.BASE}/**`, async route => {
        const response = await route.fetch()
        await route.fulfill({
          response,
          headers: {
            ...response.headers(),
            // Echo the caller's origin — what a server with the preview origin
            // allowlisted would send. Requests carry no credentials
            // (WITH_CREDENTIALS is false), so the `*` fallback is equally valid.
            'access-control-allow-origin': route.request().headers().origin ?? '*',
          },
        })
      })

      await use()

      // SWR refreshes every 10-30s and a wallet connect fires its own call, so
      // a request is routinely still in flight when the test body ends —
      // `route.fetch()` then rejects with "Test ended.", which Playwright
      // reports as an error outside any test and exits 1 with every test
      // green. Dropping the handlers here is Playwright's own remedy.
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'
