---
title: Songbird Systems Protocol
description: StakeCore's SSP signing on Songbird, Flare's canary network — FTSO, Fast Updates, and FDC, rewarded per 3.5-day epoch under real economic conditions.
url: https://stakecore.org/songbird/fsp.md
dateModified: 2026-10-16
---

# Songbird Systems Protocol

Secure Songbird canary network oracle data.

Human URL: <https://stakecore.org/#/songbird/fsp>

## Basic information

Songbird is Flare's canary network: it runs the same protocols and receives
upgrades before Flare does, so they are tested under real economic conditions
first. Like Flare, it is a blockchain with data built in. Besides processing
transactions, the network publishes prices and other outside information that
apps on Songbird can rely on. That data comes from independent data providers
like StakeCore, working under the Songbird Systems Protocol (SSP). The protocol
has three parts:

- **FTSO (Flare Time Series Oracle)**: every 90 seconds, each provider submits
  its own prices, and the network combines them into a single price feed.
- **Fast Updates**: between those rounds, providers adjust the prices up or
  down a little on every block, so the feeds stay current.
- **FDC (Flare Data Connector)**: providers confirm that something happened on
  another blockchain, such as a Bitcoin or XRP payment, so contracts on
  Songbird can act on it.

Providers need SGB holders to back them, and holders do that by delegating.
You wrap your SGB into WSGB (one to one, reversible at any time) and assign its
weight to up to two providers. Your tokens never leave your wallet, there is no
lock-up, and you can unwrap or move them whenever you like.

Rewards are paid each reward epoch, which lasts 3.5 days. What you earn depends
on how much you delegated and how well your provider performed in that epoch,
minus the provider's fee. A provider that misses the protocol's minimum
requirements can lose that epoch's rewards, and its delegators lose theirs with
it. That's why the page shows our record over the last 25 reward epochs (about
three months).

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
