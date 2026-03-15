# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stakecore is a React SPA for a crypto staking infrastructure provider operating on Flare, Songbird, and Avalanche networks. Deployed to GitHub Pages at stakecore.org.

## Commands

- **Dev server**: `yarn dev`
- **Build**: `yarn build`
- **Lint**: `yarn lint`
- **Regenerate API client**: `yarn openapi-gen && yarn openapi-fix`
- **Deploy**: `yarn build-all && yarn deploy` (GitHub Pages)

## Tech Stack

React 19, TypeScript, Vite 7, React Router 7 (hash router), SWR for data fetching, Zustand for state, Bootstrap 5 + custom CSS/SCSS, ethers.js 6, EIP-6963 wallet discovery.

## Architecture

- `src/route/router.jsx` — Hash router config. Routes: `/`, `/about`, `/contact`, `/protocols`, `/flare/fsp`, `/flare/validator`, `/songbird/fsp`, `/avalanche/validator`
- `src/layout/root.tsx` — Root layout wrapping all pages (header, footer, wallet UI, toasts)
- `src/pages/` — Route-level page components
- `src/components/sections/` — Page sections (hero, portfolio, header, footer)
- `src/components/ui/` — Reusable UI (modals, charts, forms)
- `src/components/pages/` — Page-specific components
- `src/components/types.ts` — Shared component interfaces (ISpecs, ISummary, IStakeFlow)

### API Layer

- Backend at `https://backend.stakecore.org`
- `src/backendApi/` is **auto-generated** from OpenAPI — do not edit manually. Use `yarn openapi-gen` to regenerate.
- Services: `FspService`, `FlareValidatorService`, `AvalancheValidatorService`, `LandingPageService`
- Data fetching uses SWR with refresh intervals defined in `src/constants.ts` (`REFRESH_QUERY_FAST_MS` = 10s, `REFRESH_QUERY_SLOW_MS` = 30s)

### State Management

- `src/utils/store/global.ts` — Zustand store for wallet/chain selection
- `src/utils/eip6963/` — EIP-6963 wallet provider discovery and EIP-1193 interaction
- `src/utils/store/external.ts` — External wallet provider state via `useSyncExternalStore`

### Constants & Config

- `src/constants.ts` — Chain configs, contract addresses/ABIs, explorer URL builders, token configs, epoch configs, color codes
- `src/enums.ts` — Chain enum, StatusCode, Status type
- `src/vite-env.d.ts` — Global TypeScript definitions for EIP-6963, EIP-1193, app state

### Styling

Global CSS files loaded in `main.jsx`: `style.css`, `spacing.css`, `responsive.css`, `custom.css`, `wallet.css`. Component-specific SCSS: `pageStatsPanel.scss`, `investFlow.scss`, `error.scss`. Bootstrap grid used for layout.

## Conventions

- Import alias: `~/` resolves to `src/` (configured in tsconfig.json and vite.config.js)
- `src/utils/misc/formatter.ts` — Shared number/date/address formatting
- Explorer URLs follow pattern: `chain{Evm|PChain}{AddressUrl|TransactionUrl}(hash)` in constants
- Three chains supported: Flare (chain._0), Songbird (chain._1), Avalanche (chain._2)
- Two protocols: FSP (protocol._0), Validator (protocol._1)
- Package manager: Yarn (1.22.22)
