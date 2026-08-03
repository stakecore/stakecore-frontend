# Playwright E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a committed Playwright regression suite that loads real data from `https://backend.stakecore.org`, covering all eight routes and a mocked EIP-6963 wallet connect, plus the devcontainer and CI wiring to run it.

**Architecture:** Playwright drives the *production build* served by `vite preview` over self-signed HTTPS on port 4173 — never `pnpm dev`, which would invalidate the bind-mounted `node_modules/.vite` dep cache the host shares. Specs live in `e2e/` and are chosen by `testDir`; Vitest's include glob is narrowed to `src/**` so the two runners never collide. Assertions are structural only, because live backend data changes every epoch.

**Tech Stack:** `@playwright/test` 1.62.1, Chromium only, Vite 7 preview server, GitHub Actions.

**Spec:** [2026-08-03-playwright-e2e-design.md](../specs/2026-08-03-playwright-e2e-design.md)

## Global Constraints

- `@playwright/test` version is **1.62.1**. Any workflow or docs reference to a Playwright version must match `package.json` exactly.
- Chromium only. Do not add Firefox or WebKit projects.
- The app under test is served by `vite preview`, never `pnpm dev`. See the spec for why.
- Preview serves **HTTPS** with a self-signed cert (`@vitejs/plugin-basic-ssl`). Every browser context needs `ignoreHTTPSErrors: true`.
- Routes are **hash** routes: navigate `/#/flare/fsp`, not `/flare/fsp`.
- Tests hit the **live** backend. Never assert exact numeric values — only structure, presence, and format.
- `pnpm test` must stay unit-only and keep passing. `pnpm lint` must stay green.
- Do **not** add `@playwright/test` to `pnpm.onlyBuiltDependencies`. Browser installation is an explicit step, not an install side effect.
- Package manager is pnpm via Corepack, pinned at 10.34.1. Use `pnpm`, never `npm` or `npx`.

## Reference: facts already verified in the codebase

Do not re-derive these; they were read from source while writing this plan.

**Route headings** — every one is an `<h1>`:

| Path | `<h1>` text | Source |
| --- | --- | --- |
| `/` | `StakeCore` | `src/components/sections/hero.tsx:47` |
| `/about` | `Your stake, our engine` | `src/pages/about/index.tsx:35` |
| `/contact` | `Get in touch` | `src/pages/contact.tsx:11` |
| `/flare/fsp` | `Flare Systems Protocol` | `src/pages/protocols/flare-fsp/page.tsx` |
| `/songbird/fsp` | `Songbird Systems Protocol` | `src/pages/protocols/songbird-fsp/page.tsx` |
| `/flare/validator` | `Flare Validator` | `src/pages/protocols/flare-validator/page.tsx` |
| `/avalanche/validator` | `Avalanche Validator` | `src/pages/protocols/avalanche-validator/page.tsx` |

The protocol pages render their `<h1>` through `ProjectTitle` as `h1.project-title-main`.

Verified current as of `51976c8`, which changed `.meter-bar-title` from `<h5>` to `<h3>` but left every `<h1>` untouched. The `verify` skill still documents the old `h5.meter-bar-title` — Task 6 corrects it.

There is **no** `/protocols` route in `src/route/router.tsx`, despite CLAUDE.md listing one. Do not test it.

**Error markup collision — important.** `NotFound` (`src/pages/notFound.tsx`) and `ServerError` (`src/components/ui/serverError.tsx`) both render `.error-container` / `.error-status` / `.error-label`. Only `NotFound` adds the `error-container--centered` modifier. So:

- "no server error on this page" → assert `.error-container` has count 0
- "this is the 404 page" → assert `.error-container--centered` is visible

`ChunkLoadError` (`src/route/lazy.tsx`) renders `.lazy-load-error` and also calls `console.error`.

**Wallet internals:**

- `src/features/wallet/discover.ts` dispatches a plain `Event('eip6963:requestProvider')` when the `useSyncExternalStore` subscription attaches, and listens for `eip6963:announceProvider` (a `CustomEvent` whose `detail` is an `EIP6963ProviderDetail`).
- That subscription lives inside the picker component, which `src/layout/root.tsx` lazy-mounts via `useAfterIdle` — so discovery does not start until the browser goes idle (≤2s, per the `requestIdleCallback` timeout in `src/utils/useAfterIdle.ts`). A mock installed via `addInitScript` sidesteps the race by keeping its `requestProvider` listener attached for the page's whole lifetime.
- `src/features/wallet/hook.ts` feature-detects `provider.on` and emits a `console.warn` when absent. The mock must implement `on` or it pollutes the console.
- `addEip6963Hook` calls `tryAutoConnect`, which returns an address only when `eth_chainId` matches the route's chain *and* `eth_accounts` is non-empty. A mock that returns `[]` from `eth_accounts` until `eth_requestAccounts` is called therefore forces the real click-through flow.
- The picker (`src/features/wallet/picker.tsx`) renders `role="dialog"` labelled `Connect a wallet`, one `<button>` per provider containing `<span>{provider.info.name}</span>`, and portals into `#eip6963`. On click it calls `eth_requestAccounts` then `switchNetworkIfNecessary`, which issues `wallet_switchEthereumChain` only when the route's chain differs from the provider's.
- The header button (`src/components/sections/header.tsx:17`) shows `"Connect Wallet"` or `Formatter.address(walletAddress)`.
- `Formatter.address` (`src/utils/misc/formatter.ts:102`) returns `` `${adr.substring(0, 7)}...${adr.slice(-5)}` `` after an EIP-55 checksum pass.
- Chain id hexes (`src/config/chains.ts`): Flare `0xe`, Songbird `0x13`, Avalanche `0xa86a`.

**Tooling:**

- `eslint.config.js` only matches `**/*.{js,jsx}` — TypeScript is not linted, so `e2e/*.ts` needs no ESLint changes.
- No `tsc` runs anywhere (`build` is `vite build`; there is no typecheck script). Playwright transpiles specs itself without typechecking.
- `vite.config.js` currently has **no** `test` key, so Vitest uses its default include `**/*.{test,spec}.?(c|m)[jt]s?(x)` — which would swallow `e2e/*.spec.ts`.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `playwright.config.ts` (new) | Runner config: testDir, chromium project, baseURL, webServer |
| `e2e/fixtures/console.ts` (new) | `test` fixture that collects console/page errors with a noise allowlist |
| `e2e/fixtures/wallet.ts` (new) | `injectMockWallet()` — an EIP-6963 provider installed before app code runs |
| `e2e/routes.spec.ts` (new) | Table-driven render check for all 8 routes |
| `e2e/wallet.spec.ts` (new) | Connect flow and chain-switch RPC |
| `vite.config.js` (modify) | Narrow Vitest's include to `src/**` |
| `tsconfig.json` (modify) | Add `e2e` + `playwright.config.ts` to `include` for editor IntelliSense |
| `.gitignore` (modify) | Ignore Playwright's report and result dirs |
| `package.json` (modify) | `@playwright/test` devDep, `test:e2e` scripts |
| `.devcontainer/docker-compose.yaml` (modify) | Named volume for the browser cache |
| `.devcontainer/post-create.sh` (modify) | Install Chromium + system deps |
| `.github/workflows/e2e.yml` (new) | Non-blocking e2e workflow |
| `CLAUDE.md` (modify) | Document the e2e layer |
| `.claude/skills/verify/SKILL.md` (modify) | Replace the obsolete scratchpad bootstrap |

---

## Task 1: Harness — dependency, config, and the Vitest split

Gets `pnpm test:e2e` running end to end against one route, and proves `pnpm test` is unaffected.

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/routes.spec.ts`
- Modify: `vite.config.js`
- Modify: `tsconfig.json`
- Modify: `.gitignore`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing
- Produces: a Playwright project named `chromium`; `baseURL` = `https://localhost:4173`; scripts `test:e2e` and `test:e2e:ui`; `e2e/routes.spec.ts`, which Task 2 extends.

- [ ] **Step 1: Install the dependency**

```bash
pnpm add -D @playwright/test@1.62.1
```

pnpm 10 blocks build scripts by default, so it will print a warning that `@playwright/test`'s install script was ignored. **That is intended** — browsers are installed explicitly in the next step. Do **not** run `pnpm approve-builds` and do **not** add it to `pnpm.onlyBuiltDependencies`.

- [ ] **Step 2: Install the browser**

```bash
sudo -n pnpm exec playwright install --with-deps chromium
```

`--with-deps` shells out to apt for `libnspr4`, `libnss3`, `libasound2t64` and friends, which the `mcr.microsoft.com/devcontainers/base:ubuntu24.04` image lacks. The `vscode` user has passwordless sudo. Verify it landed:

```bash
pnpm exec playwright --version   # Expected: Version 1.62.1
ls ~/.cache/ms-playwright        # Expected: a chromium-* directory
```

- [ ] **Step 3: Narrow Vitest's include**

Without this, `pnpm test` picks up `e2e/*.spec.ts` and fails — Playwright specs cannot run under happy-dom.

In `vite.config.js`, add a `test` key to the `defineConfig` object, after `css`:

```js
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    }
  },
  // Vitest's default include is `**/*.{test,spec}.*`, which would swallow the
  // Playwright specs in e2e/. Unit tests are co-located next to their source,
  // so scoping to src/ states the existing convention and keeps the two
  // runners from fighting over the same files.
  test: {
    include: ['src/**/*.test.{ts,tsx}']
  }
```

- [ ] **Step 4: Verify the unit suite is unaffected**

Run: `pnpm test`
Expected: PASS, 289 tests across 28 files (the count may have drifted; what matters is that it is the same as before this change and that no `e2e/` file appears in the output).

- [ ] **Step 5: Ignore Playwright's output directories**

Append to `.gitignore`:

```gitignore
# Playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

- [ ] **Step 6: Add the scripts**

In `package.json`, add to `scripts` immediately after `"test:watch"`:

```json
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
```

- [ ] **Step 7: Add e2e to tsconfig include**

Nothing typechecks these files, but without this the editor cannot resolve `@playwright/test`. In `tsconfig.json`:

```json
  "include": ["src", "e2e", "playwright.config.ts"],
```

`@playwright/test` depends on `@types/node`, so `process.env` resolves transitively — no extra devDependency needed.

- [ ] **Step 8: Write the failing test**

Create `e2e/routes.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('/ renders', async ({ page }) => {
  await page.goto('/#/')
  await expect(page.getByRole('heading', { level: 1, name: 'StakeCore' })).toBeVisible()
})
```

- [ ] **Step 9: Run it and watch it fail**

Run: `pnpm test:e2e`
Expected: FAIL — `Error: Cannot find module ... playwright.config.ts` or `no tests found`, because the config does not exist yet and Playwright has no `testDir` or `webServer`.

- [ ] **Step 10: Write the config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `https://localhost:${PORT}`
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // A stray .only would silently shrink CI coverage to one test.
  forbidOnly: isCI,
  // Tests hit the live backend, so a transient blip shouldn't be a red build.
  // Locally, a failure should fail immediately and loudly.
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    // @vitejs/plugin-basic-ssl serves preview over a self-signed cert.
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // `vite preview` and not `pnpm dev`: the devcontainer bind-mounts the
    // project, so host and container share one node_modules/.vite dep cache,
    // and each `vite dev` invalidates the other side's pre-bundled deps.
    // Preview serves static dist/ and never invokes the optimizer — and it
    // exercises the artifact that actually ships.
    // --strictPort so a busy 4173 fails loudly instead of silently moving to
    // 4174 while Playwright waits on the wrong URL.
    command: `pnpm build && pnpm exec vite preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    ignoreHTTPSErrors: true,
    reuseExistingServer: !isCI,
    // `pnpm build` runs first, so the default 60s is too tight.
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
```

- [ ] **Step 11: Run it and watch it pass**

Run: `pnpm test:e2e`
Expected: PASS, `1 passed`. The first run spends ~10s on `pnpm build` before the browser opens.

- [ ] **Step 12: Verify lint is still green**

Run: `pnpm lint`
Expected: no errors. ESLint only matches `**/*.{js,jsx}`, so the new `.ts` files are not linted; this step confirms the `vite.config.js` edit did not break anything.

- [ ] **Step 13: Commit**

```bash
git add playwright.config.ts e2e/routes.spec.ts vite.config.js tsconfig.json .gitignore package.json pnpm-lock.yaml
git commit -m "test(e2e): add the Playwright harness

Serves the production build via vite preview over self-signed HTTPS and
narrows Vitest's include to src/, which its default glob would otherwise
share with e2e/*.spec.ts.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: All eight routes render, with console-error detection

**Files:**
- Create: `e2e/fixtures/console.ts`
- Modify: `e2e/routes.spec.ts` (replace wholesale)

**Interfaces:**
- Consumes: `playwright.config.ts` from Task 1 (`baseURL`, the `chromium` project).
- Produces: `e2e/fixtures/console.ts` exporting `test` (a `base.extend` with a `consoleErrors: string[]` fixture) and re-exporting `expect`. Task 3 imports both from this module.

- [ ] **Step 1: Write the failing test**

Replace the whole contents of `e2e/routes.spec.ts`:

```ts
import { test, expect } from './fixtures/console'

// Every route in src/route/router.tsx, plus the `*` fallback. Headings are
// literal per route — read from each page component, not inferred — so a
// wrong page rendering under the right URL still fails.
const ROUTES = [
  { path: '/', heading: 'StakeCore' },
  { path: '/about', heading: 'Your stake, our engine' },
  { path: '/contact', heading: 'Get in touch' },
  { path: '/flare/fsp', heading: 'Flare Systems Protocol' },
  { path: '/songbird/fsp', heading: 'Songbird Systems Protocol' },
  { path: '/flare/validator', heading: 'Flare Validator' },
  { path: '/avalanche/validator', heading: 'Avalanche Validator' },
]

for (const { path, heading } of ROUTES) {
  test(`${path} renders`, async ({ page, consoleErrors }) => {
    await page.goto(`/#${path}`)

    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()

    // The error assertions below are point-in-time, and ServerError only
    // appears once a fetch has actually failed — so wait for SWR to settle
    // first. networkidle is the right tool here despite the general advice
    // against it: nothing on these pages holds a connection open.
    await page.waitForLoadState('networkidle')

    // NotFound shares .error-container with ServerError; only NotFound carries
    // the --centered modifier. Neither belongs on a content route.
    await expect(page.locator('.error-container')).toHaveCount(0)
    // Rendered by ChunkLoadError when a lazy route chunk fails to load.
    await expect(page.locator('.lazy-load-error')).toHaveCount(0)

    expect(consoleErrors).toEqual([])
  })
}

test('unknown paths render the 404 page', async ({ page }) => {
  await page.goto('/#/no-such-page')

  await expect(page.locator('.error-container--centered')).toBeVisible()
  await expect(page.getByText('404', { exact: true })).toBeVisible()
  await expect(page.getByText('Page not found')).toBeVisible()
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test:e2e`
Expected: FAIL — `Cannot find module './fixtures/console'`.

- [ ] **Step 3: Write the fixture**

Create `e2e/fixtures/console.ts`:

```ts
import { test as base } from '@playwright/test'

// Console output that is environmental, not a product defect. Keep this list
// short and justified — every entry is coverage deliberately given up.
const IGNORED = [
  // The preview server's self-signed cert. Expected; we set ignoreHTTPSErrors.
  /ERR_CERT_AUTHORITY_INVALID/,
  // Chromium logs a console error for the favicon 404 on some routes.
  /favicon/i,
]

type ConsoleFixtures = {
  /**
   * Console errors and uncaught page exceptions collected for the whole test,
   * minus the IGNORED noise. Assert `toEqual([])` after the page has settled —
   * the array keeps filling until the test ends, so asserting too early passes
   * on errors that have not been logged yet.
   */
  consoleErrors: string[]
}

export const test = base.extend<ConsoleFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = []

    // Attached before the test body runs — and therefore before any goto —
    // because this fixture resolves during setup.
    page.on('console', msg => {
      if (msg.type() !== 'error') return
      const text = msg.text()
      if (IGNORED.some(re => re.test(text))) return
      errors.push(text)
    })
    page.on('pageerror', err => errors.push(`pageerror: ${err.message}`))

    await use(errors)
  },
})

export { expect } from '@playwright/test'
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm test:e2e`
Expected: PASS, `8 passed`.

If a route fails on `consoleErrors`, read the reported strings before touching `IGNORED`. A real render or fetch error is the suite doing its job; only genuinely environmental noise earns an allowlist entry, and each one needs a comment saying why.

- [ ] **Step 5: Confirm the suite actually catches breakage**

Temporarily change the `/contact` heading expectation to `'Get in touchhh'`, run `pnpm test:e2e --grep contact`, confirm it FAILS, then revert. A green suite that cannot go red is worthless.

- [ ] **Step 6: Commit**

```bash
git add e2e/
git commit -m "test(e2e): cover all eight routes

Structural assertions only — headings, absence of ServerError and
ChunkLoadError, no console errors — since live backend figures move
every epoch.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Wallet connect with a mocked EIP-6963 provider

**Files:**
- Create: `e2e/fixtures/wallet.ts`
- Create: `e2e/wallet.spec.ts`

**Interfaces:**
- Consumes: `test` and `expect` from `e2e/fixtures/console.ts` (Task 2).
- Produces: `e2e/fixtures/wallet.ts` exporting
  - `injectMockWallet(page: Page, opts?: { chainId?: string }): Promise<void>`
  - `MOCK_WALLET_NAME: string`
  - `MOCK_ADDRESS: string`
  - `MOCK_ADDRESS_DISPLAY: string`
  - `walletCalls(page: Page): Promise<{ method: string; params?: unknown }[]>`

- [ ] **Step 1: Write the failing test**

Create `e2e/wallet.spec.ts`:

```ts
import { test, expect } from './fixtures/console'
import {
  injectMockWallet,
  walletCalls,
  MOCK_WALLET_NAME,
  MOCK_ADDRESS_DISPLAY,
} from './fixtures/wallet'

// root.tsx lazy-mounts the picker via useAfterIdle, whose requestIdleCallback
// timeout is 2s — so the dialog can appear a beat after the click. Give the
// first assertion after opening it room beyond the 5s default.
const PICKER_MOUNT_TIMEOUT = 15_000

test('connects a discovered EIP-6963 wallet', async ({ page, consoleErrors }) => {
  await injectMockWallet(page)
  await page.goto('/#/')

  await page.getByRole('button', { name: 'Connect Wallet' }).click()

  const dialog = page.getByRole('dialog', { name: 'Connect a wallet' })
  await expect(dialog).toBeVisible({ timeout: PICKER_MOUNT_TIMEOUT })

  await dialog.getByRole('button', { name: MOCK_WALLET_NAME }).click()

  // The picker closes itself only on a successful connect.
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: MOCK_ADDRESS_DISPLAY })).toBeVisible()

  const methods = (await walletCalls(page)).map(c => c.method)
  expect(methods).toContain('eth_requestAccounts')

  await page.waitForLoadState('networkidle')
  expect(consoleErrors).toEqual([])
})

test('requests a chain switch when connecting on a protocol route', async ({ page }) => {
  // Provider sits on Songbird (0x13) while the route wants Flare (0xe), so
  // switchNetworkIfNecessary must issue wallet_switchEthereumChain.
  await injectMockWallet(page, { chainId: '0x13' })
  await page.goto('/#/flare/fsp')

  await page.getByRole('button', { name: 'Connect Wallet' }).click()

  const dialog = page.getByRole('dialog', { name: 'Connect a wallet' })
  await expect(dialog).toBeVisible({ timeout: PICKER_MOUNT_TIMEOUT })
  await dialog.getByRole('button', { name: MOCK_WALLET_NAME }).click()

  await expect(page.getByRole('button', { name: MOCK_ADDRESS_DISPLAY })).toBeVisible()

  const switchCall = (await walletCalls(page)).find(
    c => c.method === 'wallet_switchEthereumChain'
  )
  expect(switchCall).toBeDefined()
  expect(switchCall?.params).toEqual([{ chainId: '0xe' }])
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test:e2e e2e/wallet.spec.ts`
Expected: FAIL — `Cannot find module './fixtures/wallet'`.

- [ ] **Step 3: Write the wallet fixture**

Create `e2e/fixtures/wallet.ts`:

```ts
import type { Page } from '@playwright/test'

export const MOCK_WALLET_NAME = 'Mock Wallet'

// All-digit hex: EIP-55 checksumming (Formatter.address runs getAddress) can
// only change letter case, so this address survives it byte-for-byte and the
// expected display string below stays a literal.
export const MOCK_ADDRESS = '0x1111111111111111111111111111111111111111'

// Formatter.address: first 7 chars + '...' + last 5.
export const MOCK_ADDRESS_DISPLAY = '0x11111...11111'

// An empty 1x1 SVG. The picker renders <img src={info.icon}>, and a
// non-resolving URL would log a console error the console fixture then flags.
const MOCK_ICON =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz4='

type RpcCall = { method: string; params?: unknown }

/**
 * Installs a fake EIP-6963 wallet before any app code runs.
 *
 * discover.ts dispatches `eip6963:requestProvider` when the picker's
 * useSyncExternalStore subscription attaches — which, because root.tsx
 * lazy-mounts the picker via useAfterIdle, happens well after load. Keeping
 * the listener attached for the page's lifetime means the announce lands
 * whenever that happens, with no race to lose.
 *
 * `eth_accounts` stays empty until `eth_requestAccounts` is called, so
 * tryAutoConnect declines and the test drives the real click-through flow.
 */
export async function injectMockWallet(
  page: Page,
  opts: { chainId?: string } = {}
): Promise<void> {
  const chainId = opts.chainId ?? '0xe'

  await page.addInitScript(
    ({ name, address, icon, chainId }) => {
      const listeners: Record<string, ((...args: unknown[]) => void)[]> = {}
      const calls: RpcCall[] = []
      let authorized = false

      const provider = {
        request: async ({ method, params }: { method: string; params?: unknown }) => {
          calls.push({ method, params })
          switch (method) {
            case 'eth_chainId':
              return chainId
            case 'eth_accounts':
              return authorized ? [address] : []
            case 'eth_requestAccounts':
              authorized = true
              return [address]
            case 'wallet_switchEthereumChain':
              return null
            default:
              // EIP-1193 "unsupported method".
              throw Object.assign(new Error(`unhandled RPC: ${method}`), { code: 4200 })
          }
        },
        // hook.ts feature-detects `.on` and console.warns without it, which
        // would trip the console-error fixture. A real registry, not a stub.
        on: (event: string, handler: (...args: unknown[]) => void) => {
          ;(listeners[event] ||= []).push(handler)
        },
        removeListener: (event: string, handler: (...args: unknown[]) => void) => {
          listeners[event] = (listeners[event] || []).filter(h => h !== handler)
        },
      }

      const detail = {
        info: {
          uuid: '00000000-0000-4000-8000-000000000000',
          name,
          icon,
          rdns: 'org.stakecore.mock',
        },
        provider,
      }

      ;(window as unknown as { __walletCalls: RpcCall[] }).__walletCalls = calls

      const announce = () =>
        window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }))

      window.addEventListener('eip6963:requestProvider', announce)
      // Real wallets also announce unprompted on load; harmless here since
      // nothing is listening yet, but it keeps the mock faithful.
      announce()
    },
    { name: MOCK_WALLET_NAME, address: MOCK_ADDRESS, icon: MOCK_ICON, chainId }
  )
}

/** Every RPC the app made against the mock, in order. */
export async function walletCalls(page: Page): Promise<RpcCall[]> {
  return page.evaluate(
    () => (window as unknown as { __walletCalls?: RpcCall[] }).__walletCalls ?? []
  )
}
```

Note: `RpcCall` is referenced inside the `addInitScript` callback, which is serialized and evaluated in the browser. TypeScript resolves the type at author time and it is erased before serialization, so this is fine — but no *runtime* value from module scope may be used inside that callback. Everything the browser needs is passed through the second argument.

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm test:e2e e2e/wallet.spec.ts`
Expected: PASS, `2 passed`.

- [ ] **Step 5: Run the whole suite**

Run: `pnpm test:e2e`
Expected: PASS, `10 passed`.

- [ ] **Step 6: Check for flake**

Run: `pnpm test:e2e --repeat-each=3`
Expected: PASS, `30 passed`. The picker's idle mount and the live backend are the two timing risks; three clean rounds is the bar before committing.

- [ ] **Step 7: Commit**

```bash
git add e2e/
git commit -m "test(e2e): connect flow against a mocked EIP-6963 wallet

Provider is installed via addInitScript and keeps its requestProvider
listener for the page's lifetime, so the announce lands whenever the
lazy-mounted picker starts discovery.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Devcontainer

**Files:**
- Modify: `.devcontainer/docker-compose.yaml`
- Modify: `.devcontainer/post-create.sh`

**Interfaces:**
- Consumes: the `@playwright/test` dependency from Task 1.
- Produces: nothing other tasks import.

- [ ] **Step 1: Add the named volume**

Replace the whole contents of `.devcontainer/docker-compose.yaml`:

```yaml
name: ${WORKSPACE_NAME}-devbox

services:
  dev:
    image: mcr.microsoft.com/devcontainers/base:ubuntu24.04
    volumes:
      - ..:/workspaces/${WORKSPACE_NAME}:cached
      - ${HOME}/.claude:/home/vscode/.claude
      - ${HOME}/.claude.json:/home/vscode/.claude.json
      # Playwright downloads ~170 MB of Chromium into this path. Without a
      # volume it lives in the container's writable layer and is re-downloaded
      # on every rebuild.
      - playwright-browsers:/home/vscode/.cache/ms-playwright
    command: sleep infinity

volumes:
  playwright-browsers:
```

- [ ] **Step 2: Verify the compose file parses**

```bash
WORKSPACE_NAME=stakecore-frontend HOME=$HOME docker compose -f .devcontainer/docker-compose.yaml config >/dev/null
```
Expected: exit 0, no output.

If `docker` is not available from inside the devcontainer, skip this step and say so in the commit — do not claim it was verified.

- [ ] **Step 3: Install the browser from post-create**

In `.devcontainer/post-create.sh`, replace the final block:

```bash
if [ -f package.json ]; then
    pnpm install
fi
```

with:

```bash
if [ -f package.json ]; then
    pnpm install
    # Playwright's npm version and its browser build are coupled, so this
    # runs unconditionally rather than being guarded on "some chromium
    # exists" — a hand-rolled existence check would silently skip the
    # re-download after a version bump. With the playwright-browsers volume
    # warm it is a fast no-op. --with-deps needs root for apt: the base image
    # has no libnspr4/libnss3, and the vscode user has passwordless sudo.
    sudo -n pnpm exec playwright install --with-deps chromium
fi
```

- [ ] **Step 4: Verify the script is valid and idempotent**

```bash
bash -n .devcontainer/post-create.sh                      # syntax
sudo -n pnpm exec playwright install --with-deps chromium # re-run: should be a fast no-op
```
Expected: `bash -n` silent; the install reports the browser is already downloaded and exits 0.

- [ ] **Step 5: Commit**

```bash
git add .devcontainer/docker-compose.yaml .devcontainer/post-create.sh
git commit -m "chore(devcontainer): install Chromium for Playwright

Cached in a named volume so a rebuild does not re-download ~170 MB.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: CI workflow

**Files:**
- Create: `.github/workflows/e2e.yml`

**Interfaces:**
- Consumes: the `test:e2e` script from Task 1.
- Produces: nothing other tasks import. `deploy-site.yml` is **not** modified.

**Deviation from the spec, deliberate.** The spec called for the `mcr.microsoft.com/playwright:v1.62.1-noble` container image. Running in that container needs `options: --user 1001` (Chromium refuses to launch as root without `--no-sandbox`), and uid 1001 cannot write to `/usr/local/bin`, so `corepack enable` fails — the exact problem `post-create.sh` works around with `--install-directory`. Rather than port that workaround into CI, this workflow runs on a plain `ubuntu-latest` runner, mirroring the known-good setup in `deploy-site.yml`, and caches the browser download. Net cost is roughly 30s on a cache miss.

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/e2e.yml`:

```yaml
name: E2E

# Deliberately separate from deploy-site.yml. These tests hit the live backend,
# so a backend outage must never block publishing to Pages.
on:
  push:
    branches:
      - main
  pull_request:

permissions:
  contents: read

concurrency:
  group: e2e-${{ github.ref }}
  cancel-in-progress: true

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # Before setup-node, otherwise `cache: pnpm` fails — pnpm does not
      # resolve yet. Same ordering as deploy-site.yml.
      - name: Enable Corepack
        run: corepack enable

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # Keyed on the resolved Playwright version so a version bump misses the
      # cache and pulls the matching browser build.
      - name: Resolve Playwright version
        id: pw
        run: echo "version=$(pnpm exec playwright --version | sed 's/Version //')" >> "$GITHUB_OUTPUT"

      - name: Cache Playwright browsers
        id: pw-cache
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ steps.pw.outputs.version }}

      - name: Install Chromium
        if: steps.pw-cache.outputs.cache-hit != 'true'
        run: pnpm exec playwright install --with-deps chromium

      # System deps live outside the cached path, so they are needed even on a
      # cache hit.
      - name: Install Chromium system dependencies
        if: steps.pw-cache.outputs.cache-hit == 'true'
        run: pnpm exec playwright install-deps chromium

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 2: Verify the YAML parses**

```bash
pnpm exec js-yaml .github/workflows/e2e.yml >/dev/null && echo OK
```
Expected: `OK`. (`js-yaml` is already present — it is pinned in `pnpm.overrides`. If the binary is not exposed, use `python3 -c "import yaml,sys;yaml.safe_load(open('.github/workflows/e2e.yml'))"` instead.)

- [ ] **Step 3: Confirm deploy-site.yml is untouched**

```bash
git diff --name-only .github/
```
Expected: no `deploy-site.yml`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/e2e.yml
git commit -m "ci(e2e): add a non-blocking Playwright workflow

Separate from deploy-site.yml so a backend outage cannot block a Pages
publish. Runs on a plain runner rather than the Playwright container
image, whose required --user 1001 breaks corepack enable.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `.claude/skills/verify/SKILL.md`

**Interfaces:**
- Consumes: everything above.
- Produces: nothing.

- [ ] **Step 1: Document the e2e layer in CLAUDE.md**

In the `### Testing` section, after the existing paragraph about Vitest patterns, append:

```markdown
#### End-to-end (Playwright)

Playwright 1.62.1, Chromium only, specs in `e2e/`. `pnpm test:e2e` (or
`pnpm test:e2e:ui`). Coverage is deliberately thin: every route renders with
its real heading and no error panel, plus a wallet connect against a mocked
EIP-6963 provider.

- **Vitest and Playwright split by include glob.** Vitest's default include
  (`**/*.{test,spec}.*`) would swallow `e2e/*.spec.ts`, so `vite.config.js`
  pins `test.include` to `src/**/*.test.{ts,tsx}`. Unit tests stay co-located
  next to source; e2e specs are the only thing under `e2e/`. Name a new unit
  test `*.test.ts(x)` inside `src/`, or it will not run.
- **The app under test is `vite preview`, not `pnpm dev`** — configured as
  Playwright's `webServer`, which runs `pnpm build` first. The devcontainer
  bind-mounts the project, so host and container share one
  `node_modules/.vite` dep cache and each `vite dev` invalidates the other
  side's pre-bundled deps. Preview also exercises the artifact that ships.
- Preview is **HTTPS** with a self-signed cert; contexts need
  `ignoreHTTPSErrors: true` (set globally in `playwright.config.ts`). Routes
  are hash routes — navigate `/#/flare/fsp`.
- **Tests hit the live backend**, so they assert structure only, never exact
  values. `e2e/fixtures/console.ts` fails a test on any unallowlisted console
  error; `e2e/fixtures/wallet.ts` installs a fake EIP-6963 provider via
  `addInitScript`.
- CI runs them in `.github/workflows/e2e.yml`, separate from the deploy
  workflow so a backend outage cannot block a Pages publish.
```

- [ ] **Step 2: Replace the obsolete bootstrap in the verify skill**

In `.claude/skills/verify/SKILL.md`, replace the entire `## Drive (headless browser)` section — from the heading through the line ending `...for direct navigation use /#/flare/validator?node=NodeID-...)` is *not* included; stop before `## Backend` — with:

```markdown
## Drive (headless browser)

Playwright is a repo dependency (`@playwright/test`, Chromium only) and the
devcontainer installs the browser in `post-create.sh`. There is nothing to
bootstrap.

For a quick check that nothing is broken, run the committed suite — it starts
its own `vite preview` via Playwright's `webServer`, so the manual launch above
is unnecessary:

```bash
pnpm test:e2e            # whole suite
pnpm test:e2e --headed   # watch it
pnpm test:e2e:ui         # pick and step through tests
```

For ad-hoc exploration against a server you launched yourself, write a throwaway
spec in `e2e/` and delete it after, or drive the library API directly with
`chromium.launch()` + `newContext({ ignoreHTTPSErrors: true })`.

Reusable pieces already in the repo:

- `e2e/fixtures/console.ts` — `test` fixture exposing `consoleErrors`
- `e2e/fixtures/wallet.ts` — `injectMockWallet()` for anything behind a
  connected wallet

Useful selectors: route headings are `h1` (`h1.project-title-main` on protocol
pages); chart sections are `h3.meter-bar-title`; recharts renders
`.recharts-responsive-container`, `.recharts-line`, `.recharts-line-dots circle`
(one circle per data point), tooltip in `.recharts-tooltip-wrapper` (hover a dot
first). `ServerError` and `NotFound` share `.error-container` — only `NotFound`
adds `--centered`.
```

- [ ] **Step 3: Verify the skill file still parses as valid frontmatter + markdown**

```bash
head -5 .claude/skills/verify/SKILL.md
```
Expected: the `---` / `name: verify` / `description: ...` / `---` block is intact.

- [ ] **Step 4: Final full verification**

```bash
pnpm lint && pnpm test && pnpm test:e2e
```
Expected: all three PASS. Record the actual test counts in the commit body — do not write "all tests pass" without having seen this output.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md .claude/skills/verify/SKILL.md
git commit -m "docs(e2e): document the Playwright layer

Drops the verify skill's scratchpad bootstrap, which is obsolete now that
Playwright is a repo dependency.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-review notes

Checked against the spec:

- Purpose, data strategy, coverage, browsers, browser cache, server choice — all covered by Tasks 1–4.
- Vitest collision — Task 1 Steps 3–4.
- `onlyBuiltDependencies` exclusion — Task 1 Step 1, and restated in Global Constraints.
- Named volume — Task 4 Step 1.
- CI non-blocking + report artifact — Task 5. The spec originally specified the `mcr.microsoft.com/playwright` container image; it has been amended to the runner-based approach for the reasons stated in Task 5, so spec and plan now agree.
- Docs — Task 6.
- Out-of-scope items (protocol chart assertions, nav/footer, snapshots, Firefox/WebKit, on-chain flows) are absent from every task, as intended.
