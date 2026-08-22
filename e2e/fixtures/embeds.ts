import { test as base } from './console'

/**
 * Stubs the YouTube player embedded by `movieClip.tsx` on the four protocol
 * routes. Nothing of ours is stubbed — see `backend.ts`, which goes out of its
 * way to keep the real backend in the loop.
 *
 * **Why this exists.** Every spec that waits on
 * `page.waitForLoadState('networkidle')` was waiting on youtube-nocookie.com,
 * and on fonts.gstatic.com, which YouTube's player pulls in from inside the
 * frame. So the four routes carrying a video had their settle time set by a
 * third-party CDN rather than by anything this project ships. When that CDN was
 * slow the routes blew the 30s test budget and the suite went red — always on a
 * protocol route, always at that call, and always passing again on a rerun.
 *
 * Measured rather than inferred. Holding *only* the player's requests for 25s
 * and changing nothing else:
 *
 *     /flare/fsp   networkidle never settled  (timed out at 12s)
 *     /about       networkidle settled in 517ms
 *
 * `/about` renders no video, which is the control: same delay, same backend,
 * no effect. The failures observed in CI-shaped runs were on `/flare/fsp`,
 * `/songbird/fsp`, `/flare/validator` and `/avalanche/validator` — the video
 * routes, and only those.
 *
 * **Why this is not a loss of coverage.** No spec asserts anything about the
 * player. The a11y scans already exclude the frame's *contents* as markup that
 * isn't ours to fix (`.exclude(['.video-container iframe', 'body'])`), and
 * `console.ts` already allowlists the player's own `compute-pressure` warning
 * for the same reason. The `<iframe>` element stays in our document untouched,
 * so `frame-title` and every other rule that selects the element in our markup
 * stays fully active. This only stops the bytes behind it crossing the
 * internet.
 *
 * **Why a fulfilled response and not `route.abort()`.** Aborting makes Chromium
 * log a failed subresource, which `consoleErrors` in `routes.spec.ts` would
 * (correctly) refuse. And the body is a complete document rather than an empty
 * one because axe injects into every frame: the `exclude` above scopes out the
 * frame's `<body>`, not its `<html>`, so document-level rules like
 * `html-has-lang` still evaluate against whatever is served here.
 *
 * If a spec ever needs the real player, `page.route` in that spec takes
 * precedence over this one — same mechanism `backend.ts` documents.
 */
export const EMBED_HOST_PATTERN = '**://*.youtube-nocookie.com/**'

// Deliberately valid and complete: lang, title, and a body. See above.
const STUB_DOCUMENT =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<title>Video player (stubbed in tests)</title></head><body></body></html>'

export const test = base.extend<{ stubbedEmbeds: void }>({
  stubbedEmbeds: [
    async ({ page }, use) => {
      await page.route(EMBED_HOST_PATTERN, route =>
        route.fulfill({
          status: 200,
          contentType: 'text/html; charset=utf-8',
          body: STUB_DOCUMENT,
        }),
      )

      await use()
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'
