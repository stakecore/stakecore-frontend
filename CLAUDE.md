# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StakeCore is a React SPA for a crypto staking infrastructure provider operating on Flare, Songbird, and Avalanche networks. Deployed to GitHub Pages at stakecore.org.

## Commands

- **Dev server**: `pnpm dev`
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Test**: `pnpm test` (one-shot) / `pnpm test:watch` (watch mode)
- **Regenerate API client**: `pnpm openapi-gen && pnpm openapi-fix`
- **Deploy**: `pnpm build-all && pnpm run deploy` (GitHub Pages; `deploy` is a reserved pnpm command, so use `pnpm run`)

## Package Manager (pnpm via Corepack)

The version is pinned in `package.json#packageManager` (`pnpm@10.34.1`). There is **no global pnpm install** anywhere in this project — Corepack (built into Node ≥ 16.10) reads `packageManager` and delegates `pnpm <cmd>` to that exact version. Switch projects, the version switches with you. The lockfile is `pnpm-lock.yaml` and CI runs `pnpm install --frozen-lockfile`.

Setup is in two places:

- **Devcontainer** ([.devcontainer/post-create.sh](.devcontainer/post-create.sh)): the container is built from [docker-compose.yaml](.devcontainer/docker-compose.yaml) (`base:ubuntu24.04` plus the `devcontainers/features/node` feature, pinned to Node 22 in [devcontainer.json](.devcontainer/devcontainer.json) and hash-locked in `devcontainer-lock.json`). The node feature installs a global pnpm that shadows Corepack's shim, so `postCreateCommand` → `post-create.sh` runs `npm rm -g pnpm` then `corepack enable --install-directory "$(npm config get prefix)/bin" pnpm` — the shim lands in a writable, on-PATH bin (the `vscode` user can't write to `/usr/local/bin`, where Corepack defaults). `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` is set in `containerEnv` so the `pnpm install` at the end of that script doesn't hang on an interactive download prompt.
- **CI** ([.github/workflows/deploy-site.yml](.github/workflows/deploy-site.yml)): `corepack enable` runs **before** `actions/setup-node@v4` — otherwise `cache: pnpm` in setup-node fails because `pnpm` doesn't resolve yet. `node-version` is kept at 22 to match the devcontainer.

Symptoms that point at a Corepack misconfig:

- `pnpm --version` reports a version that isn't `10.34.1` → a global pnpm is shadowing the shim. Remove it (`npm rm -g pnpm`) and re-enable Corepack.
- `pnpm install` hangs with no output on first run → the download prompt is waiting on stdin. Set `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`.
- CI fails on `cache: pnpm` before any install step → `corepack enable` is missing or runs after `setup-node`.
- `pnpm install` fails on a **fresh rebuild** with `EACCES … mkdir '/home/vscode/.cache/node/corepack/v1'` → `~/.cache` is root-owned. Docker creates the parent directories of a volume mount itself, as root, and the base image ships no `/home/vscode/.cache`, so mounting `playwright-browsers` at `.cache/ms-playwright` leaves both that directory and `.cache` owned by root. `post-create.sh` chowns them before corepack runs; if you add another volume under `$HOME`, chown it there too. Corepack is only the first casualty — `playwright install` writes to the same volume.

## Ports

The devcontainer **publishes** its ports in [docker-compose.yaml](.devcontainer/docker-compose.yaml) rather than relying on the editor's port forwarding. Forwarding only exists while VS Code is attached and only reaches the host's own loopback; publishing means a plain host browser works, and so does a phone on the same LAN — the only honest way to check a mobile layout.

| Port (in container) | What | Host port | Reachable from host |
| --- | --- | --- | --- |
| 5173 | `pnpm dev` | `$DEV_SERVER_PORT` | published |
| 4173 | `vite preview` (the Playwright target) | `$PREVIEW_PORT` | published |
| 53770–53779 | ad-hoc tooling that picks its own port | same | published |
| anything else | — | — | editor forwarding only, via the Ports panel |

**If you also run `pnpm dev` on the host, the two sides collide and the host loses.** Publishing binds the host port for as long as the container is up, whether or not anything inside is listening — so a host-side `pnpm dev` fails with `Port 5173 is already in use`, and `ss -ltnp` shows a listener with a blank Process column (the holder is root-owned `docker-proxy`, not a stray server of yours). The fix is to shift the *host* side in `.devcontainer/.env` and rebuild; the in-container numbers never change, so nothing else has to move:

```
DEV_SERVER_PORT=15173
PREVIEW_PORT=14173
```

That is the current local setting. The compose defaults stay at `5173`/`4173` for anyone who works only inside the container, since the straight-through mapping is what you want then.

Three things hold this together, and breaking any one of them makes a running server look unreachable:

- **Vite binds all interfaces.** `server`/`preview` in [vite.config.js](vite.config.js) set `host: true`. Vite's default is loopback, which inside a container is the *container's* loopback — the published mapping would then reach an interface with nothing listening and refuse the connection. They also set `strictPort`, because the mapping is for those exact numbers: Vite's default hunt for the next free port would leave the server on an unpublished 5174 while reporting success.
- **Host-side numbers come from `.devcontainer/.env`** (`DEV_SERVER_PORT`, `PREVIEW_PORT`, `TOOL_PORTS`), seeded by `initialize.sh` with the same `ensure_var` mechanism as `WORKSPACE_NAME`. They are overridable for two reasons: a host port already in use makes `docker compose up` fail, and that failure takes the whole devcontainer with it rather than just the one service; and running the dev server on the host as well as in the container needs the two to stop fighting over the same number (see above). `TOOL_PORTS` is applied to *both* sides of the mapping, so it must stay a range or a single number — a published range has to be the same size on each side.
- **Published ports are deliberately absent from `forwardPorts`** in [devcontainer.json](.devcontainer/devcontainer.json). Listing them would make VS Code try to bind the same host port a second time, fail, and silently land on a neighbouring one. `otherPortsAttributes` is set to `notify` so ports *outside* the published blocks — where forwarding is the only way in — announce themselves instead of being forwarded silently.

The ad-hoc block is ten ports and not a wide range because Docker starts a userland proxy process per published port. The `host: true` rule applies to whatever you run there too: a tool that defaults to binding loopback needs its own equivalent flag (`--host 0.0.0.0`) or the published port reaches nothing. Changing any of this needs a **container rebuild** (*Dev Containers: Rebuild Container*); `forwardPorts`-style settings alone would only need a window reload.

## Tech Stack

React 19, TypeScript, Vite 7, React Router 8 (hash router), SWR for data fetching, Zustand for state, Bootstrap 5 + custom CSS/SCSS, ethers.js 6, EIP-6963 wallet discovery.

## Architecture

- `src/route/router.tsx` — Hash router config. Routes: `/`, `/about`, `/contact`, `/flare/fsp`, `/flare/validator`, `/songbird/fsp`, `/avalanche/validator`
- `src/layout/root.tsx` — Root layout wrapping all pages (header, footer, wallet UI, toasts)
- `src/pages/` — Route-level page components. Pages with sub-components live as folders (e.g. `pages/about/`); single-file routes (`home.tsx`, `contact.tsx`, `notFound.tsx`) stay flat. `pages/protocols/` holds the four protocol routes plus shared pieces used by all of them (`info.tsx`, `title.tsx`, `tooltip.tsx`, `fsp-stats.tsx`, `fspLocalDelegate.{tsx,scss}`, `unavailabilityBanner.{tsx,scss}`, `protocols.scss`, `types.ts`, `utils.ts`). Both page shells (`validator/page.tsx`, `fsp/page.tsx`) wrap their loading/error/empty/loaded ladder in `.protocol-body`, which reserves `60vh`. That keeps the call-to-action and footer below the fold while data loads instead of letting them get shoved out of the viewport when it arrives — worth 0.62 and 0.30 CLS on the validator and FSP routes respectively. Keep new state branches inside that wrapper.
- `src/components/sections/` — Page sections used across multiple routes (hero, portfolio, header, footer, callToAction, proposal, etc.).
- `src/components/ui/` — Reusable UI primitives (links, diff pill, server-error panel, meter bar, epoch progress, etc.).
- `src/pages/protocols/types.ts` — Shared protocol-page interfaces (ISpecs, ISummary).

### API Layer

- Backend at `https://backend.stakecore.org`
- `src/backendApi/` is **auto-generated** from OpenAPI — do not edit manually. Use `pnpm openapi-gen` to regenerate.
- Services: `FspService`, `FlareValidatorService`, `AvalancheValidatorService`, `LandingPageService`
- Data fetching uses SWR with refresh intervals defined in `src/constants.ts` (`REFRESH_QUERY_FAST_MS` = 10s, `REFRESH_QUERY_SLOW_MS` = 30s)

### State Management

All wallet + chain-session state lives under `src/features/wallet/`:

- `store.ts` — Zustand store for wallet provider + connected address + chain selection + picker visibility
- `picker.tsx` — The EIP-6963 wallet-picker modal (portaled into `#eip6963`)
- `discover.ts` + `discoverStore.ts` — EIP-6963 provider discovery exposed via `useSyncExternalStore`
- `eip1193.ts` — EIP-1193 RPC helpers (account/chain queries, network switching, personal sign)
- `hook.ts` — `onInternalChainSwitch` (call when the route's target chain changes)

### Deferred Work

`src/utils/useAfterIdle.ts` returns false on the first render and true once the browser is idle (with a 2s timeout escape hatch). Two things use it, both to keep work off the first commit:

- [root.tsx](src/layout/root.tsx) lazy-mounts the toast container, the tooltip singleton, and the wallet picker. None are visible until the user acts, but importing them eagerly cost ~79 kB of the eager bundle. `toast()` call sites import `react-toastify` directly and are all inside lazy route chunks, so they don't drag it back onto the critical path.
- [recentActivity.tsx](src/components/ui/recentActivity.tsx) renders `INITIAL_CARDS` activity cards first and fills in the remaining ~40 at idle. Pass `enabled` (`useAfterIdle(itemCount > 0)`) when deferring work that needs data first — an ungated callback fires during the initial empty render and lifts the deferral before there's anything to defer.

### Constants & Config

- `src/constants.ts` — Chain configs, contract addresses/ABIs, explorer URL builders, token configs, epoch configs, color codes
- `src/enums.ts` — Chain enum, StatusCode, Status type
- `src/vite-env.d.ts` — Global TypeScript definitions for EIP-6963, EIP-1193, app state

### Styling

Global stylesheets are aggregated through `src/assets/css/index.scss`, which `main.tsx` imports alongside `bootstrap-reboot.min.css`, `grid.scss`, and the react-tooltip bundle. The aggregator pulls in `fonts.css`, `spacing.css`, `style.css`, `responsive.css`, `custom.css`, `wallet.css`, and `specs.css` in cascade order, and also inlines the `.error-*` rules used by `ServerError` and the 404 page (originally in `error.scss`, inlined to silence Sass `@import` deprecation warnings). Component-specific SCSS is co-located with each component (e.g. `header.scss`, `hero.scss`, `proposal.scss`, `meterBar.scss`, `epochProgress.scss`, `diff.scss`, `unavailabilityBanner.scss`). Design tokens (breakpoints, weights, font-size scale, radii, z-index scale, colors) live in `src/assets/css/_tokens.scss` and are consumed via `@use '...tokens' as t;`.

Layout uses a 12-column grid, but **not** Bootstrap's — `src/assets/css/grid.scss` reimplements the containers, rows, columns, and the five utility classes the app actually uses (`d-flex`, `align-items-center`, `justify-content-center`, `mx-auto`, `mb-0`). Semantics match Bootstrap 5 exactly, including the `--bs-gutter-x` / `--bs-gutter-y` custom properties that `responsive.css` overrides. `bootstrap-grid.min.css` was 51.8 kB of render-blocking CSS for ~13 class usages. Only `bootstrap-reboot.min.css` remains third-party. If you reach for a Bootstrap class that isn't in `grid.scss`, add it there rather than pulling the framework back in.

Fonts are **self-hosted** in `public/fonts/` (latin subsets; Inter and Roboto Mono are variable). `src/assets/css/fonts.css` holds the `@font-face` rules and `index.html` preloads Inter + Major Mono Display. They were on fonts.googleapis.com, which was render-blocking on a cold third-party origin and sat in front of the font files themselves. Two details are load-bearing: the metric-matched `'Inter Fallback'` face (second in every sans stack) keeps text from re-wrapping when the real Inter arrives, and Major Mono Display uses `font-display: optional` so a late arrival can't shift the header. Font URLs are literal and unhashed — that's why the files live in `public/`, not `src/assets/`.

### Testing

Vitest + happy-dom + `@testing-library/react` / `user-event`. 322 tests across 30 files at last count, all co-located next to source as `*.test.ts(x)`. Test files declare their environment per-file via a top-of-file `// @vitest-environment happy-dom` directive (no global config). There is no global setup file, so RTL's auto-cleanup does not run — a test that renders more than once must call `afterEach(cleanup)` itself, or later queries will match elements left behind by earlier renders.

Common patterns: `vi.mock('~/features/wallet/store', ...)` to provide a fake Zustand store, `vi.mock('~/features/wallet/eip1193', ...)` for the RPC helpers, Proxy-mocked `Contract` instances for ethers calls, `MemoryRouter` wrapping for components that use `useLocation` / `NavLink`. `fireEvent.click` instead of `userEvent.click` when targeting react-router `<Link>` (userEvent's synthetic chain doesn't reach the onClick prop reliably through Link's `preventDefault`).

#### End-to-end (Playwright)

Playwright 1.62.1, Chromium only, specs in `e2e/`. `pnpm test:e2e` (or
`pnpm test:e2e:ui`). Coverage is deliberately thin: every route renders with
its real heading and no error panel, a wallet connect against a mocked
EIP-6963 provider, and an axe-core accessibility scan of all eight page states
plus the open wallet picker.

Accessibility scans (`e2e/a11y.spec.ts`) gate on WCAG 2a/2aa/21a/21aa only.
`best-practice` rules are scanned and logged but never fail a test — gating on
them would let a routine axe bump redden CI — and axe's `incomplete` results are
logged and attached to the Playwright report rather than gated. Component-level
axe under happy-dom was measured and rejected: it cannot evaluate `color-contrast`
(no style computation, so the check lands in `incomplete` and a green run proves
nothing) and cannot see cross-component `heading-order`. The *contents* of the
YouTube embed on the protocol routes are excluded from every scan
(`.exclude(['.video-container iframe', 'body'])`), since that markup isn't this
project's to fix — a scope decision, not rule suppression. The `<iframe>`
element itself stays in the scanned document, so rules that target the frame
element in our own markup (e.g. `frame-title`) stay fully active. The exclude
selector's second segment must be `body`, not `html`: axe's own containment
check treats an `html` exclude as tied with the default document-wide
`include` boundary and resolves ties in favour of "in context", making it a
silent no-op — `body` is a strict descendant of that boundary, so it excludes
as intended.

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

## Conventions

- Import alias: `~/` resolves to `src/` (configured in tsconfig.json and vite.config.js)
- `src/utils/misc/formatter.ts` — Shared number / currency / date / address formatting (use `Formatter.usd()` for dollar amounts so signs and the `<` sub-precision marker land outside the `$`). The `length` argument on `number` / `usd` / `percent` is an **exact** digit count, not a maximum: results are zero-padded to it (`2` → `2.00`, `2000` → `2.00k`, `0` → `0.00` at the length-3 default) so figures in a column share one decimal precision. Only two things escape it — an integer part that already fills `length` renders whole, and the `<0.01` sub-precision rail is a marker rather than a number. `percent` spends its budget after the ×100 shift, so `percent(0.5)` is `50.0%` and `percent(1)` is `100%`. That padding rule is why **counts go through `Formatter.count()`, never `number()`** — a cardinal quantity has no sub-unit, so `number(2)` rendering `2.00` under a "Delegators" label describes a fraction of a delegator that cannot exist. `count` pads nothing and compacts nothing (`1234` → `1,234`, not `1.23k`): the exact answer exists and is short enough to show. Reach for `number` when the thing is *measured* (token amounts, USD, rates) and `count` when it is *counted*. Every formatter is **total**: NaN, ±Infinity, undefined/null, an unparseable string, or an invalid date renders as `Formatter.NO_VALUE` (`—`) instead of throwing or inventing a value. That matters because these run during render on values derived from backend JSON. Two distinct failure modes were folded into one rule here:

  - `number` / `usd` / `percent` / `date` / `dateHuman` used to **throw** — `BigInt()` and `Date#toISOString()` both do on bad input, and a throw during render unmounts the whole route.
  - `days` / `duration` / `relativeDate` used to **lie**, which is worse in one specific way: the output looked like data. `duration(NaN)` rendered the literal `"NaNs"`, and `relativeDate(NaN)` fell through every unit to report `"0 seconds ago"` — an absent timestamp displayed as "just now".

  All of them return the marker **bare**, with no `$` / `%` / `' days'` affix, so it never reads as a real quantity. Genuine zeros are unaffected (`usd(0)` is `$0.00`, `duration(0)` is `0s`) — there are tests pinning that, since a falsy check here would silently swallow them.
- Explorer URLs follow pattern: `chain{Evm|PChain}{AddressUrl|TransactionUrl}(hash)` in constants
- Three chains supported: Flare (chain._0), Songbird (chain._1), Avalanche (chain._2)
- Two protocols: FSP (protocol._0), Validator (protocol._1)
- Package manager: pnpm (see the dedicated section above); run scripts with `pnpm <script>` except the reserved `deploy` name, which needs `pnpm run deploy`

### Type strictness

`tsconfig.json` runs `strict: false` but `strictNullChecks: true`. The split is deliberate: `strictNullChecks` is what catches the null-deref class that white-screens a route, while full `strict` would also enable `noImplicitAny` and light up every untyped callback param (the router's `lazyRoute`, several component props) without catching runtime crashes. Two consequences worth knowing:

- `noUncheckedIndexedAccess` is only load-bearing *because* `strictNullChecks` is on. Without it the `| undefined` that flag adds stays assignable to everything and the setting is a silent no-op. Don't turn `strictNullChecks` off without also dropping that one, or the config will claim a guarantee it isn't providing.
- Array/record indexing therefore yields `T | undefined`. Prefer a real guard (`const x = arr[i]; if (x == null) return`) or `?? fallback` over `!`. Where an invariant genuinely holds but isn't expressible — `SERVERS[w.type]` in `infraConstellation.tsx`, `paletteAt` in `meterBar.tsx` — the codebase uses a total accessor with a fallback rather than an assertion, so drift becomes a wrong colour instead of a blank page.

`pnpm lint` does not typecheck. Run `npx tsc -p tsconfig.json --noEmit` before pushing.

### Chain config (`src/config/chains.ts`)

`CHAIN_CONFIG` is declared with **`satisfies Record<Chain, ChainConfig>`**, not a `: Record<Chain, ChainConfig>` annotation. Keep it that way. An annotation widens every entry to `ChainConfig`, where `epoch`, `video`, `wrappedSymbol` and the explorer builders are all optional — which is why `constants.ts` used to assert ~20 of them with `!` on module-scope lines that run at import, inside the eager bundle. A rename or deletion in `chains.ts` was invisible to the compiler and surfaced as `Cannot read properties of undefined` during module evaluation: a blank page on **every** route, thrown before React mounts and before any error boundary exists. `satisfies` still checks each entry is a valid `ChainConfig` (and that no `Chain` is missing) while preserving the literal shape, so per-chain field presence is compile-checked and the `!`s are gone.

Protocol availability is carried by two exported types rather than re-asserted at each use:

- `ValidatorChain = Chain.FLARE | Chain.AVALANCHE` — Songbird runs no validator, so it has no P-chain or validator explorer. Used by `createValidatorDataAccess`.
- `FspChain = Chain.FLARE | Chain.SONGBIRD` — Avalanche runs no FSP, so it has no `wrappedSymbol` and no EVM explorer. Used by `FspPageConfig` / `FspDelegateConfig`.

Passing the wrong chain to either shell is now a compile error instead of a pair of `undefined` URL builders reaching a click handler. If you add a chain or move a protocol, expect errors at the call sites — that is the mechanism working, not something to `!` past.

### Web Storage

Never touch `sessionStorage` / `localStorage` directly — go through `safeSession` / `safeLocal` in [safeStorage.ts](src/utils/safeStorage.ts). Storage doesn't merely fail, it **throws**: Chrome with cookies fully blocked raises `SecurityError` on *property access* to `sessionStorage`, before any method runs. The helper fetches the storage object through a thunk inside each `try` so the property access is covered too, and resolves it per call rather than at module scope — caching it at import would move the failure into module evaluation, which is the blank-page-before-React case.

`set()` returns a **boolean**, and callers recording a decision they must later read back have to branch on it. `routeLazy` is the cautionary example: its `RELOAD_FLAG` is the only thing stopping a permanently broken chunk from reloading forever, so it reloads only `if (get(...) !== '1' && set(...))`. Swallowing the write failure and reloading anyway would produce an infinite reload loop — strictly worse than the crash being fixed.

Testing blocked storage: replace the property with a throwing getter via `Object.defineProperty(window, 'sessionStorage', { get() { throw ... } })`, and restore the saved descriptor afterwards. Do **not** use `vi.spyOn(Storage.prototype, …)` — those spies were observed to silently stop applying once another test in the same file had already touched storage, which turns the storage tests green against code that is still broken. Both storage test suites assert the block is live before asserting anything else, for exactly that reason.

### Route error boundaries

`src/route/routeError.tsx` is the render boundary for every route, wired as `errorElement` on each **child** route in `router.tsx` plus the root as a backstop. Child placement is the point: an `errorElement` on the root route replaces `<RootLayout />` itself, so a single bad component would take the header, footer and wallet UI down with it. On a child, the crash is contained to the `<Outlet />`.

It also tells a failed dynamic import (a deploy replaced the hashed chunk — reloading genuinely fixes it) apart from an ordinary render throw, and only shows the "a new version may have been deployed" copy for the former. The previous `ChunkLoadError` component doubled as both and blamed a deployment for every error it caught. Its markup reuses the `.error-*` classes shared with `ServerError` / the 404 page, plus a `.route-error` hook that `e2e/routes.spec.ts` asserts is absent on every content route.
