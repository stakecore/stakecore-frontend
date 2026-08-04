---
name: verify
description: Build/launch/drive recipe for verifying StakeCore UI changes end-to-end in a headless browser.
---

# Verifying StakeCore changes

## Launch

**Use `vite preview`, never `pnpm dev`, from inside the devcontainer.** See "Why not `pnpm dev`" below — this is not a style preference, running the dev server here breaks the user's browser on the host.

```bash
pnpm build
pnpm exec vite preview --port 4173 &   # background
```

- Serves at **https**://localhost:4173 (self-signed; browsers need `ignoreHTTPSErrors: true`).
- Routes use a hash router: `https://localhost:4173/#/flare/validator`, `/#/flare/fsp`, `/#/songbird/fsp`, `/#/avalanche/validator`.
- Rebuild (`pnpm build`, ~6s) after each source change; there is no HMR. Worth it — this exercises the artifact that actually ships.

### Why not `pnpm dev`

[docker-compose.yaml](../../../.devcontainer/docker-compose.yaml) bind-mounts the project (`..:/workspaces/${WORKSPACE_NAME}:cached`), so the host and the container share one `node_modules` — including Vite's `node_modules/.vite` dep cache.

Vite's `configHash` incorporates the resolved project **root path**, which differs between the two (`/home/<user>/…` vs `/workspaces/…`) even though `vite.config.js` is identical. So each `pnpm dev` invalidates and rewrites the other environment's pre-bundled deps, and any browser mid-load on the other side is left requesting `?v=<stale browserHash>` dep URLs. Symptom on the host: the page stops loading, with `504 (Outdated Optimize Dep)` in the Network tab.

`vite preview` serves the static `dist/` and never invokes the dep optimizer, so it leaves `node_modules/.vite` byte-identical. Verified: full route sweep against preview left `_metadata.json` hash and mtime unchanged.

If you ever do need the dev server here, `--force` won't save you — it re-bundles but still writes the container's `configHash`. Clear `node_modules/.vite/deps` afterward (**not** `basic-ssl/`, which holds the cert the user's browser already trusts) and tell the user to restart their dev server.

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

## Backend

Real backend at `https://backend.stakecore.org` is reachable from the devcontainer — pages load live data, so SWR needs ~2-3s after `networkidle` before charts appear (lazy recharts chunk too). Endpoint paths are in `src/backendApi/services/*.ts`. If an endpoint is down or you need deterministic data, stub it with Playwright `ctx.route('**/api/...', route => route.fulfill(...))` using the DTO shapes in `src/backendApi/models/`.

## Gotchas

- `Chain` enum in `~/enums` uses named members (`Chain.FLARE`), not the generated backend `chain._0` naming.
- Validator picker selection is driven by the `?node=<NodeID>` query param (before the `#` route works via `setParams`; for direct navigation use `/#/flare/validator?node=NodeID-...`).
