---
title: Flare Systems Protocol
description: StakeCore's FSP signing on Flare — FTSO, Fast Updates, and FDC — with rewards distributed on provider performance in each 3.5-day reward epoch.
url: https://stakecore.org/flare/fsp.md
dateModified: 2026-08-18
---

# Flare Systems Protocol

Secure Flare Network oracle data.

Human URL: <https://stakecore.org/#/flare/fsp>

## Basic information

Flare Systems Protocol is a protocol consisting of three parts — FTSO (Flare
Time Series Oracle), Fast Updates, and FDC (Flare Data Connector). Rewards are
distributed based on the delegated provider's performance in each 3.5-day
epoch. The site shows statistics for the last 25 reward epochs. Note that a
reward epoch on Flare Network lasts 3.5 days.

## Delegating

Delegation on FSP is a vote, not a transfer. Wrapped FLR stays in the holder's
own wallet, there is no lockup, and StakeCore never takes custody. Delegation
is signed in the holder's wallet on the page itself — see the
[agent guide](/AGENTS.md) for why this step cannot be automated on a holder's
behalf.

## Live statistics

The page carries the provider's current delegation total, delegator count,
reward rate, and per-epoch performance across the last 25 epochs, alongside the
protocol's specification table and the contract addresses behind it. Those
figures refresh continuously and are read from the public API:

```bash
curl -s https://backend.stakecore.org/api/fsp/info/flare
```

A single delegator's position:

```bash
curl -s https://backend.stakecore.org/api/fsp/delegator-info/flare/{delegator}
```

Every figure is verifiable on the
[Flare Systems Explorer](https://flare-systems-explorer.flare.network) and the
[Flare block explorer](https://flare-explorer.flare.network).

## Related

- [Songbird Systems Protocol](/songbird/fsp.md) — the same stack on the canary network
- [Flare Validator](/flare/validator.md) — consensus staking on the same network
- [Glossary](/glossary.md) — FTSO, Fast Updates, FDC, reward epoch

## Sitemap

Every page on this site is listed in [/sitemap.md](/sitemap.md).
