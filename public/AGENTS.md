---
title: StakeCore agent guide
description: How an agent can read StakeCore's delegation data, which public API endpoints exist, and what the site does and does not let an agent do.
url: https://stakecore.org/AGENTS.md
dateModified: 2026-08-18
---

# StakeCore agent guide

StakeCore operates validator and core protocol-signing infrastructure on the
Flare, Songbird, and Avalanche networks. This file describes what an agent can
usefully do with the site.

There is nothing to install. StakeCore is a hosted service, not a package, so
the agent-facing surface is a read-only HTTP API plus the markdown mirrors
indexed in [/llms.txt](/llms.txt).

## Reading the site

The site at <https://stakecore.org> is a client-rendered single-page app on a
hash router. Every route lives behind a fragment, which is never sent to the
server, so fetching any route URL returns the same shell and executing no
JavaScript yields an empty document.

Read the markdown mirrors instead — one per route, listed in
[/sitemap.md](/sitemap.md). They carry the page copy; live figures stay on the
pages and in the API, because they change every 10 to 30 seconds.

## Public API

Base URL: `https://backend.stakecore.org`

The machine-readable schema is at [/openapi.json](/openapi.json) (OpenAPI
3.0.0, "Stakecore Indexer Api"). It is the same schema the site's own client is
generated from, so it does not drift from what the frontend calls.

Read endpoints:

| Endpoint | Returns |
| --- | --- |
| `GET /api/page/info` | Aggregate delegation totals, delegator counts, and recent activity across all chains |
| `GET /api/page/info/{user}` | The same aggregate, scoped to one address |
| `GET /api/fsp/info/{chain}` | FSP/SSP provider statistics for a chain |
| `GET /api/fsp/delegator-info/{chain}/{delegator}` | One delegator's FSP position on a chain |
| `GET /api/flare/validator/info` | Flare validator statistics |
| `GET /api/flare/validator/delegator/{cChainAddress}` | One delegator's Flare validator position |
| `GET /api/avalanche/validator/info` | Avalanche validator statistics |
| `GET /api/avalanche/validator/delegator/{cChainAddress}` | One delegator's Avalanche validator position |
| `GET /health` | Service liveness |

Example:

```bash
curl -s https://backend.stakecore.org/api/page/info
```

```bash
curl -s https://backend.stakecore.org/api/fsp/info/flare
```

Figures are indexed from on-chain state and can also be verified directly
against the block explorers linked on each protocol page.

## What agents cannot do here

Delegation is a wallet action. It is signed in the user's own wallet through
EIP-6963 discovery in the browser, and StakeCore never takes custody of tokens
or holds keys. There is no API that moves funds, and no credential an agent can
be issued to act on a holder's behalf. An agent can read positions and explain
options; committing a delegation requires the holder's own signature.

`POST /api/page/form/submit` backs the contact form. Prefer the channels on
[/contact.md](/contact.md) for anything that wants a human reply.

## Sitemap

Every page on this site is listed in [/sitemap.md](/sitemap.md). Terminology is
defined in [/glossary.md](/glossary.md).
