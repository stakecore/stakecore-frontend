# Stakecore Frontend

Source for the Stakecore site at https://stakecore.org — the public-facing dashboard for our validator and protocol-signing infrastructure on Flare, Songbird, and Avalanche.

## What is Stakecore?

Stakecore operates validator and FSP/SSP signing infrastructure for the Flare, Avalanche, and Songbird networks. Delegation is non-custodial — to earn APY on your FLR, head to https://portal.flare.network/ and either:

- delegate FSP rewards to `0x1e68DC808A240C096F0261144dc41fd4c883Cfb0`, or
- stake to our Flare validator node (Node ID surfaced on the [Flare Validator](https://stakecore.org/#/flare/validator) page).

The site itself is read-only by default; connecting a wallet enables in-page actions (wrap/delegate/claim) on the protocols you choose to interact with.

## Tech stack

- React 19 + TypeScript
- Vite 7 (build / dev server)
- React Router 7 (hash router — required for GitHub Pages)
- SWR for data fetching, Zustand for wallet/session state
- Bootstrap 5 grid + custom SCSS (design tokens in `src/assets/css/_tokens.scss`)
- ethers.js 6 + EIP-6963 wallet discovery + EIP-1193 RPC
- Vitest + happy-dom + Testing Library (233 tests across 21 files)

## Local development

```bash
pnpm install  # install dependencies
pnpm dev      # start the dev server (Vite)
pnpm build    # production build → ./dist
pnpm lint     # eslint
pnpm test     # run the full test suite once
```

The backend lives at `https://backend.stakecore.org`. The TypeScript client under `src/backendApi/` is **auto-generated from OpenAPI** — never edit by hand. Regenerate with:

```bash
pnpm openapi-gen && pnpm openapi-fix
```

## Project layout

- `src/route/` — hash-router config + lazy-loaded route definitions
- `src/layout/` — root layout (header, footer, wallet UI, toasts)
- `src/pages/` — page-level components; routes that branch into sub-components live as folders (e.g. `pages/protocols/flare-fsp/`), single-file routes stay flat
- `src/components/sections/` — page sections used across multiple routes (hero, header, footer, etc.)
- `src/components/ui/` — reusable primitives (links, diff pill, meter bar, server-error panel, etc.)
- `src/features/wallet/` — EIP-6963 discovery, EIP-1193 helpers, Zustand store, picker modal
- `src/backendApi/` — auto-generated; do not edit
- `src/constants.ts` — chain configs, contract addresses + ABIs, explorer URL builders, refresh intervals
- `src/utils/misc/formatter.ts` — shared number / date / address / currency formatting

`CLAUDE.md` has a deeper architecture write-up if you need it.

## Deployment

The site auto-deploys to GitHub Pages on every push to `main` via [`.github/workflows/deploy-site.yml`](.github/workflows/deploy-site.yml). The workflow lints, runs the test suite, builds with `pnpm build-all`, and publishes the `./dist` output through the official `actions/deploy-pages` action.

The repo's Pages source must be set to **GitHub Actions** (Settings → Pages → Build and deployment → Source). The first deploy creates a `github-pages` environment in the repo with the published URL.

For a manual deploy from your local machine (emergency fallback), the `deploy` script still pushes to a `gh-pages` branch via the `gh-pages` CLI — but that path only works while the Pages source is temporarily switched back to "Deploy from a branch":

```bash
pnpm build-all   # production build with the stakecore.org CNAME
pnpm run deploy  # gh-pages → publish ./dist (run, not bare — `deploy` is a reserved pnpm command)
```
