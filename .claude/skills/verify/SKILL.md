---
name: verify
description: Build/launch/drive recipe for verifying StakeCore UI changes end-to-end in a headless browser.
---

# Verifying StakeCore changes

## Launch

- `pnpm dev` (background) → serves at **https**://localhost:5173 (self-signed; browsers need `ignoreHTTPSErrors: true`).
- Routes use a hash router: `https://localhost:5173/#/flare/validator`, `/#/flare/fsp`, `/#/songbird/fsp`, `/#/avalanche/validator`.

## Drive (headless browser)

Playwright is not a repo dependency. Bootstrap it in the session scratchpad:

```bash
cd <scratchpad> && npm init -y && npm i playwright
npx playwright install chromium --only-shell
sudo -n npx playwright install-deps chromium   # image lacks libnspr4 etc.; node user has passwordless sudo
```

Then drive with the library API (`chromium.launch()` + `newContext({ ignoreHTTPSErrors: true })`).

Useful selectors: chart sections are `h5.meter-bar-title`; recharts renders `.recharts-responsive-container`, `.recharts-line`, `.recharts-line-dots circle` (one circle per data point), tooltip in `.recharts-tooltip-wrapper` (hover a dot first).

## Backend

Real backend at `https://backend.stakecore.org` is reachable from the devcontainer — pages load live data, so SWR needs ~2-3s after `networkidle` before charts appear (lazy recharts chunk too). Endpoint paths are in `src/backendApi/services/*.ts`. If an endpoint is down or you need deterministic data, stub it with Playwright `ctx.route('**/api/...', route => route.fulfill(...))` using the DTO shapes in `src/backendApi/models/`.

## Gotchas

- `Chain` enum in `~/enums` uses named members (`Chain.FLARE`), not the generated backend `chain._0` naming.
- Validator picker selection is driven by the `?node=<NodeID>` query param (before the `#` route works via `setParams`; for direct navigation use `/#/flare/validator?node=NodeID-...`).
