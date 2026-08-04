# Page-level axe accessibility checks in the e2e suite

Date: 2026-08-04

## Goal

Automate the accessibility audit that was run by hand in `51976c8`, as part of the
existing Playwright e2e suite. Nine scans: the seven real routes, the 404
fallback, and the wallet picker with the modal open.

## Why page-level, not component-level

Component-level axe under Vitest + happy-dom was evaluated and rejected. It works
— `axe.run()` needs no shims there — but two whole classes of defect are
structurally invisible to it.

Measured directly, one fixture with five seeded violations through both engines:

| | happy-dom | real Chromium |
| --- | --- | --- |
| violations | `button-name`, `heading-order`, `image-alt`, `label` | `button-name`, **`color-contrast`**, `heading-order`, `image-alt`, `label` |
| incomplete | `color-contrast` | (none) |
| passes | 12 rules | 13 rules |
| inapplicable | 72 rules | 72 rules |

The fixture had `#777777` text on `#888888`. Real Chromium flags it; happy-dom
files it under `incomplete`, because it computes no styles and declines to judge.
Since the conventional assertion is `expect(violations).toEqual([])`, and
`incomplete` is not `violations`, **a page with unreadable text passes a green
happy-dom run** — a test that reports success exactly where it checked nothing.

The second gap is composition. The `heading-order` violation fixed in `51976c8`
was an `<h5>` in `meterBar.tsx` following an `<h2>` rendered by a different
component. Render `MeterBar` in isolation and there is no `<h2>` to violate
against.

Page-level scans in real Chromium have neither limitation.

## Decisions

| Question | Decision |
| --- | --- |
| Rule tags gated | `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` |
| `best-practice` rules | Scanned and logged, never gated |
| `incomplete` results | Logged and attached to the report, never gated |
| Scope | 7 routes + 404 + wallet picker open |
| Backend | Live and unstubbed, as in `routes.spec.ts` |
| Product fixes | Out of scope — report violations, do not fix `src/` |

## Architecture

### Dependency

`@axe-core/playwright` 4.12.1 as a devDependency — Deque-maintained, versioned in
lockstep with `axe-core` 4.12.1, both published within the last two weeks. Its
only peer dependency is `playwright-core >= 1.0.0`, already present.

Injecting `axe.min.js` via `page.addScriptTag` was verified to work and was
rejected: it re-implements a maintained wrapper for no gain.

### Files

```
e2e/
  a11y.spec.ts                # new — nine scans
  fixtures/routes.ts          # new — ROUTES table, extracted
  routes.spec.ts              # modified — imports ROUTES instead of defining it
```

`ROUTES` currently lives inside `routes.spec.ts`. Both specs need the same paths,
so it moves to `e2e/fixtures/routes.ts` and is imported by each. The table keeps
its `heading` field; the a11y spec ignores it.

A11y checks live in their own spec rather than folding into `routes.spec.ts`:
different failure mode, independently runnable via `--grep`, and axe adds roughly
a second per route.

`a11y.spec.ts` imports `test` and `expect` from `@playwright/test` directly, not
from `e2e/fixtures/console.ts`. Console-error detection is already asserted per
route in `routes.spec.ts`; re-collecting it here would duplicate that check and
couple an accessibility failure to an unrelated console message. The `testInfo`
argument needed for attachments is available on the base `test` without the
fixture.

### The gate, and what it deliberately does not gate

Gating on WCAG tags alone drops `heading-order`, which is a `best-practice` rule
— and the rule that caught the real bug in `51976c8`. Losing that visibility
would be a poor trade.

So: **one scan with `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and
`best-practice`, with results partitioned by tag.** Every violation object carries
its own `tags`, so this is a single `analyze()` call plus a filter.

- A violation carrying any of the four WCAG tags **fails the test**.
- A violation carrying only `best-practice` is **logged as a warning**.

This keeps CI stable — a routine axe bump that adds a best-practice rule cannot
turn the build red — while `heading-order` regressions stay visible.

`experimental` is not scanned at all. Its rules are unstable by axe's own
definition.

WCAG 2.2 (`wcag22a`, `wcag22aa` — e.g. `target-size`) is deliberately out of
scope for this pass: not gated, not scanned as advisory, not included in
`SCAN_TAGS` at all. This is a scope decision, not an oversight — a future pass
can add it.

### Reporting

`expect(violations).toEqual([])` on raw axe objects produces an unreadable wall of
serialized DOM. Instead each violation maps to a one-line summary —
`${id} — ${nodes.length} node(s) — ${helpUrl}` — and the assertion runs against
that array, so a red build names the rule and links its documentation.

`incomplete` rule IDs are logged, and the full JSON is attached to the Playwright
report via `testInfo.attach`, so it survives into the CI artifact. Nothing about
`incomplete` fails a test: it is environment-sensitive and would be the most
likely source of CI-only failures that do not reproduce locally. But it is never
silently discarded — that is the exact blind spot the happy-dom measurement
exposed.

### Timing

Every scan runs after `await page.waitForLoadState('networkidle')`, matching
`routes.spec.ts`. Without it the audit targets a loading spinner rather than the
rendered page.

### The picker scan

Runs on `/#/` — the home route, chosen because it needs no chain context. Reuses
`injectMockWallet()` from `e2e/fixtures/wallet.ts` so the picker lists a provider
rather than rendering its "No browser wallets detected" empty state. It opens the
dialog but never connects, so `walletAddress` stays null, `CallToAction` fires no
user-info request, and no route stub is needed.

The dialog is opened the same way `wallet.spec.ts` does it — clicking the header
button via `page.getByRole('banner')`, since `CallToAction` renders a second
"Connect Wallet" button and the unscoped query is a strict-mode violation.

The scan covers the whole page rather than just the dialog — the rules worth
having here concern the relationship between the modal and the content behind it.

The picker is lazy-mounted via `useAfterIdle` in `root.tsx`, so the dialog can
appear up to ~2s after the click. The existing `PICKER_MOUNT_TIMEOUT` of 15s in
`wallet.spec.ts` is the precedent to follow.

## CI

No new workflow. These tests run inside the existing `.github/workflows/e2e.yml`,
adding roughly 10s. The workflow remains non-blocking with respect to
`deploy-site.yml`.

## Expected first-run outcome

`51976c8` verified `/`, `/flare/fsp`, `/flare/validator` and `/avalanche/validator`
clean under a *broader* tag set than this gate uses, so those four should stay
green.

`/about`, `/contact`, `/songbird/fsp` and the 404 have never been scanned. **The
first run may fail**, and that would be the feature working as designed.

Fixing a real WCAG violation means changing `src/`, which is product work rather
than test work. The implementation is therefore scoped to: build the suite, run
it, and if violations appear, **report them and stop**. Do not fix product code,
and do not exclude the offending rule to force green. Whether to fix or defer is
decided with the actual findings in hand.

## Out of scope

- Connected-wallet state (mostly text swaps; little a11y surface per unit of
  added complexity)
- Keyboard-navigation flows — axe does not test these regardless
- Contrast on hover and focus states
- Any change under `src/`
- `experimental` axe rules

Two deviations from this list were approved by the human during execution; see
"Deviations, approved during execution" in the plan for what changed and why.
Both are narrow: one genuine `src/` fix for a real WCAG failure the new gate
caught, and one scope narrowing of the iframe exclusion. Neither reopens "any
change under `src/`" as a general allowance.

## Success criteria

- `pnpm test:e2e` runs 19 tests: the existing 10, plus 9 a11y scans
- A seeded WCAG violation fails the relevant test with a readable, rule-named message
- A seeded best-practice-only violation logs a warning and does not fail
- `pnpm test` stays unit-only at 289 passing; `pnpm lint` stays clean
- `routes.spec.ts` behaviour is unchanged by the `ROUTES` extraction
