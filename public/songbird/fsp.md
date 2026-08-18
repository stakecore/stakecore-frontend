---
title: Songbird Systems Protocol
description: StakeCore's SSP signing on Songbird, Flare's canary network — FTSO, Fast Updates, and FDC, rewarded per 3.5-day epoch under real economic conditions.
url: https://stakecore.org/songbird/fsp.md
dateModified: 2026-08-18
---

# Songbird Systems Protocol

Secure Songbird canary network oracle data.

Human URL: <https://stakecore.org/#/songbird/fsp>

## Basic information

Songbird Systems Protocol (SSP) is a protocol consisting of three parts — FTSO
(Flare Time Series Oracle), Fast Updates, and FDC (Flare Data Connector),
running on the Songbird canary network. Rewards are distributed based on the
delegated provider's performance in each 3.5-day epoch. The site shows
statistics for the last 25 reward epochs. Note that a reward epoch on the
Songbird canary network lasts 3.5 days.

Songbird is the canary network for Flare — it runs protocol upgrades ahead of
mainnet under real economic conditions.

## Delegating

Delegation on SSP works exactly as it does on Flare: wrapped SGB stays in the
holder's wallet, there is no lockup, and StakeCore never takes custody.

## Live statistics

The page carries the provider's delegation total, delegator count, reward rate,
and per-epoch performance over the last 25 epochs, with the protocol
specification table and contract addresses. Read the same data from the API:

```bash
curl -s https://backend.stakecore.org/api/fsp/info/songbird
```

Verifiable on the
[Songbird Systems Explorer](https://songbird-systems-explorer.flare.network)
and the [Songbird block explorer](https://songbird-explorer.flare.network).

## Related

- [Flare Systems Protocol](/flare/fsp.md) — the same stack on Flare mainnet
- [Glossary](/glossary.md) — FTSO, Fast Updates, FDC, canary network

## Sitemap

Every page on this site is listed in [/sitemap.md](/sitemap.md).
