# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stakecore is a React SPA for a crypto staking infrastructure provider operating on Flare, Songbird, and Avalanche networks. Deployed to GitHub Pages at stakecore.org.

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

- **Devcontainer** ([.devcontainer/devcontainer.json](.devcontainer/devcontainer.json)): the base `typescript-node:20` image ships a global pnpm via npm-global that shadows Corepack's shim. `postCreateCommand` runs `npm rm -g pnpm` then `corepack enable --install-directory "$(npm config get prefix)/bin" pnpm` so the shim lands in a writable, on-PATH bin (the `node` user can't write to `/usr/local/bin`). `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` is set in `containerEnv` so the first run doesn't hang on an interactive download prompt.
- **CI** ([.github/workflows/deploy-site.yml](.github/workflows/deploy-site.yml)): `corepack enable` runs **before** `actions/setup-node@v4` — otherwise `cache: pnpm` in setup-node fails because `pnpm` doesn't resolve yet.

Symptoms that point at a Corepack misconfig:

- `pnpm --version` reports a version that isn't `10.34.1` → a global pnpm is shadowing the shim. Remove it (`npm rm -g pnpm`) and re-enable Corepack.
- `pnpm install` hangs with no output on first run → the download prompt is waiting on stdin. Set `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`.
- CI fails on `cache: pnpm` before any install step → `corepack enable` is missing or runs after `setup-node`.

## Tech Stack

React 19, TypeScript, Vite 7, React Router 7 (hash router), SWR for data fetching, Zustand for state, Bootstrap 5 + custom CSS/SCSS, ethers.js 6, EIP-6963 wallet discovery.

## Architecture

- `src/route/router.tsx` — Hash router config. Routes: `/`, `/about`, `/contact`, `/protocols`, `/flare/fsp`, `/flare/validator`, `/songbird/fsp`, `/avalanche/validator`
- `src/layout/root.tsx` — Root layout wrapping all pages (header, footer, wallet UI, toasts)
- `src/pages/` — Route-level page components. Pages with sub-components live as folders (e.g. `pages/about/`); single-file routes (`home.tsx`, `contact.tsx`, `notFound.tsx`) stay flat. `pages/protocols/` holds the four protocol routes plus shared pieces used by all of them (`info.tsx`, `title.tsx`, `tooltip.tsx`, `fsp-stats.tsx`, `fspLocalDelegate.{tsx,scss}`, `unavailabilityBanner.{tsx,scss}`, `protocols.scss`, `types.ts`, `utils.ts`).
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

### Constants & Config

- `src/constants.ts` — Chain configs, contract addresses/ABIs, explorer URL builders, token configs, epoch configs, color codes
- `src/enums.ts` — Chain enum, StatusCode, Status type
- `src/vite-env.d.ts` — Global TypeScript definitions for EIP-6963, EIP-1193, app state

### Styling

Global stylesheets are aggregated through `src/assets/css/index.scss`, which `main.tsx` imports alongside the two third-party CSS bundles (Bootstrap + react-tooltip). The aggregator pulls in `spacing.css`, `style.css`, `responsive.css`, `custom.css`, `wallet.css`, and `specs.css` in cascade order, and also inlines the `.error-*` rules used by `ServerError` and the 404 page (originally in `error.scss`, inlined to silence Sass `@import` deprecation warnings). Component-specific SCSS is co-located with each component (e.g. `header.scss`, `hero.scss`, `proposal.scss`, `meterBar.scss`, `epochProgress.scss`, `diff.scss`, `unavailabilityBanner.scss`). Design tokens (breakpoints, weights, font-size scale, radii, z-index scale, colors) live in `src/assets/css/_tokens.scss` and are consumed via `@use '...tokens' as t;`. Bootstrap grid + utility classes are used for layout.

### Testing

Vitest + happy-dom + `@testing-library/react` / `user-event`. 233 tests across 21 files at last count, all co-located next to source as `*.test.ts(x)`. Test files declare their environment per-file via a top-of-file `// @vitest-environment happy-dom` directive (no global config).

Common patterns: `vi.mock('~/features/wallet/store', ...)` to provide a fake Zustand store, `vi.mock('~/features/wallet/eip1193', ...)` for the RPC helpers, Proxy-mocked `Contract` instances for ethers calls, `MemoryRouter` wrapping for components that use `useLocation` / `NavLink`. `fireEvent.click` instead of `userEvent.click` when targeting react-router-dom `<Link>` (userEvent's synthetic chain doesn't reach the onClick prop reliably through Link's `preventDefault`).

## Conventions

- Import alias: `~/` resolves to `src/` (configured in tsconfig.json and vite.config.js)
- `src/utils/misc/formatter.ts` — Shared number / currency / date / address formatting (use `Formatter.usd()` for dollar amounts so signs and the `<` sub-precision marker land outside the `$`)
- Explorer URLs follow pattern: `chain{Evm|PChain}{AddressUrl|TransactionUrl}(hash)` in constants
- Three chains supported: Flare (chain._0), Songbird (chain._1), Avalanche (chain._2)
- Two protocols: FSP (protocol._0), Validator (protocol._1)
- Package manager: pnpm (see the dedicated section above); run scripts with `pnpm <script>` except the reserved `deploy` name, which needs `pnpm run deploy`
