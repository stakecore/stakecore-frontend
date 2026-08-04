# Playwright e2e for stakecore-frontend

Date: 2026-08-03

## Goal

Add a committed Playwright regression suite that catches breakage in the shipping
build, plus the devcontainer and CI wiring to run it. The suite loads real data
from the public backend at `https://backend.stakecore.org`.

Today Playwright is not a repo dependency at all — the `verify` skill bootstraps
it ad hoc into the session scratchpad (`npm init -y && npm i playwright`). This
work makes it first-class.

## Decisions

| Question | Decision |
| --- | --- |
| Purpose | Regression test suite, committed to the repo |
| Data | Live backend, structural assertions only |
| CI | Separate non-blocking workflow, not a deploy gate |
| Coverage | All 8 routes render + wallet connect with a mocked EIP-6963 provider |
| Browsers | Chromium only |
| Browser cache | Named docker volume so it survives devcontainer rebuilds |
| Server under test | `vite preview`, never `pnpm dev` |

### Why `vite preview` and not `pnpm dev`

[docker-compose.yaml](../../../.devcontainer/docker-compose.yaml) bind-mounts the
project, so host and container share one `node_modules` — including Vite's
`node_modules/.vite` dep cache. Vite's `configHash` incorporates the resolved
project root path, which differs between the two, so each `pnpm dev` invalidates
and rewrites the other environment's pre-bundled deps and leaves any browser
mid-load on the other side requesting stale `?v=<browserHash>` dep URLs
(`504 (Outdated Optimize Dep)` on the host).

`vite preview` serves static `dist/` and never invokes the dep optimizer. It also
exercises the artifact that actually ships. Cost: ~6s of `pnpm build` before a run,
and no HMR.

### Why live data, structural assertions

APYs, reward figures, and node lists change every epoch. Tests assert structure and
invariants — the route's heading renders, no `ServerError` panel appears, the page
logged no console errors — and never exact values. This catches real integration
breakage (backend contract drift, chunk-load failures, render crashes) while
tolerating data that moves underneath it.

## Architecture

### Files added

```
playwright.config.ts          # root, next to vite.config.js
e2e/
  routes.spec.ts              # all 8 routes render
  wallet.spec.ts              # mocked EIP-6963 connect
  fixtures/console.ts         # consoleErrors test fixture + allowlist
  fixtures/wallet.ts          # injectMockWallet() helper
```

`@playwright/test` (1.62.1) is added as a devDependency and deliberately **not**
added to `pnpm.onlyBuiltDependencies`. Its postinstall auto-downloads browsers;
keeping it out means browser installation is an explicit, cacheable step in
`post-create.sh` and in CI rather than an implicit side effect of every
`pnpm install`.

### Vitest collision

There is no Vitest config today — `vite.config.js` has no `test` key, so Vitest
runs on its default include, `**/*.{test,spec}.?(c|m)[jt]s?(x)`. That glob matches
`e2e/*.spec.ts`, so `pnpm test` would try to run the Playwright specs under
happy-dom and fail.

Fix: add `test: { include: ['src/**/*.test.{ts,tsx}'] }` to `vite.config.js`. This
also makes the existing co-located unit-test convention explicit.

Scripts:

- `test` — unchanged, `vitest run`, unit only
- `test:e2e` — `playwright test`
- `test:e2e:ui` — `playwright test --ui`

### playwright.config.ts

- `testDir: './e2e'`
- One project: `chromium`, from `devices['Desktop Chrome']`
- `baseURL: 'https://localhost:4173'`, `ignoreHTTPSErrors: true` (the app is served
  over self-signed HTTPS by `@vitejs/plugin-basic-ssl`)
- `webServer`: `pnpm build && pnpm exec vite preview --port 4173 --strictPort`, with
  `reuseExistingServer: !process.env.CI` and a timeout generous enough for the
  build (120s)
- `retries: process.env.CI ? 2 : 0` — live backend, so a transient blip should not
  turn the build red
- `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`
- Reporter: `list` locally, `html` + `github` in CI

## Tests

### routes.spec.ts

Table-driven over the eight paths in [router.tsx](../../../src/route/router.tsx):
`/`, `/about`, `/contact`, `/flare/fsp`, `/flare/validator`, `/songbird/fsp`,
`/avalanche/validator`, plus a nonexistent path exercising the `*` → `NotFound`
route.

Per route:

1. Navigate the hash URL (`/#/flare/fsp` etc.).
2. Assert a route-identifying heading is visible. The exact heading text or role
   locator for each route is pinned during implementation by reading that route's
   page component — the table holds one literal expectation per route, not a
   heuristic.
3. Assert no `ServerError` panel is present (the `.error-*` rules).
4. Assert the page collected no console errors.

Playwright's auto-waiting on `toBeVisible()` covers the lazy route chunks and the
SWR fetch; no fixed sleeps.

Console-error checking is the one real flake risk (extension noise, requests
aborted on teardown). It is gated behind a small allowlist in the fixture, and is
expected to be tightened over time rather than treated as a hard gate on day one.

### wallet.spec.ts

`injectMockWallet()` uses `page.addInitScript` to install a fake EIP-6963 provider
before any app code runs. It listens for `eip6963:requestProvider` — which
[discover.ts](../../../src/features/wallet/discover.ts) dispatches when the
`useSyncExternalStore` subscription attaches — and re-dispatches
`eip6963:announceProvider` with a provider detail that implements:

- `request()` answering `eth_chainId`, `eth_accounts`, `eth_requestAccounts`, and
  `wallet_switchEthereumChain`
- `.on()` as a real listener registry. This is load-bearing:
  [hook.ts](../../../src/features/wallet/hook.ts) feature-detects `.on` and
  `console.warn`s when it is missing, which would trip the console-error check.

The test opens the wallet picker, asserts the mock wallet is listed, clicks it, and
asserts the truncated address renders in the header.

Timing constraint the test must respect: the picker is lazy-mounted via
`useAfterIdle` in [root.tsx](../../../src/layout/root.tsx), so it does not exist on
first commit. Locators must wait for it rather than assert presence immediately.

## Devcontainer

[docker-compose.yaml](../../../.devcontainer/docker-compose.yaml) gains a named
volume:

```yaml
volumes:
  - playwright-browsers:/home/vscode/.cache/ms-playwright
```

so the ~170 MB Chromium download survives container rebuilds.

[post-create.sh](../../../.devcontainer/post-create.sh) installs the browser inside
the existing `if [ -f package.json ]` guard, immediately after `pnpm install`:

```bash
if [ -f package.json ]; then
    pnpm install
    pnpm exec playwright install --with-deps chromium
fi
```

`--with-deps` needs root for apt — the ubuntu24.04 base image lacks `libnspr4` and
friends — but the command itself must **not** be wrapped in `sudo`. Playwright
self-elevates for the apt step alone, and the `vscode` user has passwordless
sudo so that succeeds non-interactively; wrapping the outer command instead
sends the browser download to root's `HOME` (outside the named volume, invisible
to the `vscode`-run test suite) and fails outright besides, since Corepack's
`pnpm` shim isn't on root's `secure_path`. When the named volume is warm the
download is a no-op and only the apt check runs.

Playwright's npm version and its browser build are coupled, so bumping
`@playwright/test` requires re-running this command. The install is not guarded on
"some chromium exists"; letting `playwright install` decide is what keeps the
version coupling correct.

## CI

New `.github/workflows/e2e.yml`, independent of `deploy-site.yml`, so a backend
outage never blocks a Pages publish.

- Triggers: push to `main`, and pull requests
- Runner: plain `ubuntu-latest`, mirroring the known-good setup in
  `deploy-site.yml` (`corepack enable` before `actions/setup-node`, Node 22,
  `cache: pnpm`). Chromium is installed as an explicit step and cached with
  `actions/cache` keyed on the resolved Playwright version.
- Steps: checkout → `corepack enable` → setup-node → `pnpm install --frozen-lockfile`
  → cache/install Chromium → `pnpm test:e2e`
- Upload the HTML report as a workflow artifact

The official `mcr.microsoft.com/playwright:v1.62.1-noble` container image was
considered and rejected. Running in it requires `options: --user 1001`, because
Chromium refuses to launch as root without `--no-sandbox` — and uid 1001 cannot
write to `/usr/local/bin`, so `corepack enable` fails. That is the same problem
`post-create.sh` works around with `--install-directory`, and porting the
workaround into CI costs more than the ~30s of browser download it would save on
a cache miss.

`deploy-site.yml` is not modified.

## Documentation

- `CLAUDE.md` gains an e2e subsection under Testing: where specs live, how to run
  them, the `vite preview` constraint, and the Vitest/Playwright include split.
- The `verify` skill's "Drive (headless browser)" section is rewritten. The
  scratchpad `npm init -y && npm i playwright` bootstrap is obsolete once Playwright
  is a repo dependency; the skill should point at `pnpm test:e2e` and the shared
  fixtures instead.

## Out of scope

Deliberately excluded from this pass:

- Protocol-page chart and data assertions (meter bars, recharts, epoch progress,
  the `?node=` validator picker)
- Header, footer, mobile-nav, and marquee coverage
- Visual/screenshot snapshot comparison
- Firefox and WebKit
- Any real on-chain transaction flow

## Success criteria

- `pnpm test` runs unit tests only and still passes
- `pnpm test:e2e` passes from a clean devcontainer against the live backend
- A devcontainer rebuild does not re-download Chromium
- `e2e.yml` runs green on a PR and does not gate `deploy-site.yml`
