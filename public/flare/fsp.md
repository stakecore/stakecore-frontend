---
title: Flare Systems Protocol
description: StakeCore's FSP signing on Flare — FTSO, Fast Updates, and FDC — with rewards distributed on provider performance in each 3.5-day reward epoch.
url: https://stakecore.org/flare/fsp.md
dateModified: 2026-10-16
---

# Flare Systems Protocol

Secure Flare Network oracle data.

Human URL: <https://stakecore.org/#/flare/fsp>

## Basic information

Flare is a blockchain with data built in. Besides processing transactions, the
network publishes prices and other outside information that apps on Flare can
rely on. That data comes from independent data providers like StakeCore,
working under the Flare Systems Protocol (FSP). The protocol has three parts:

- **FTSO (Flare Time Series Oracle)**: every 90 seconds, each provider submits
  its own prices, and the network combines them into a single price feed.
- **Fast Updates**: between those rounds, providers adjust the prices up or
  down a little on every block (about every 1.8 seconds), so the feeds stay
  current.
- **FDC (Flare Data Connector)**: providers confirm that something happened on
  another blockchain, such as a Bitcoin or XRP payment, so contracts on Flare
  can act on it.

Providers need FLR holders to back them, and holders do that by delegating.
You wrap your FLR into WFLR (one to one, reversible at any time) and assign its
weight to up to two providers. Your tokens never leave your wallet, there is no
lock-up, and you can unwrap or move them whenever you like.

Rewards are paid each reward epoch, which lasts 3.5 days. What you earn depends
on how much you delegated and how well your provider performed in that epoch,
minus the provider's fee. A provider that misses the protocol's minimum
requirements can lose that epoch's rewards, and its delegators lose theirs with
it. That's why the page shows our record over the last 25 reward epochs (about
three months).

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
