---
title: StakeCore
description: Blockchain node infrastructure, today running validators and protocol signing for the Flare, Songbird, and Avalanche networks, with non-custodial delegation and on-chain reporting.
url: https://stakecore.org/index.md
dateModified: 2026-08-19
---

# StakeCore

Validator infrastructure for Flare, Songbird, and Avalanche.

Human URL: <https://stakecore.org/>

StakeCore runs blockchain node infrastructure — validator and core
protocol-signing duty across three networks today, on a general-purpose cluster
that is not tied to those chains or to validating roles (see
[/about.md](/about.md)). Delegating to StakeCore is non-custodial: tokens stay
in the holder's wallet, nothing is bridged or wrapped, and every figure
published on the site is derived from on-chain state.

## Live figures

The landing page shows total value delegated across all three networks, the
number of distinct delegators, each with its 24-hour change, and a feed of
recent on-chain delegation activity.

These are not reproduced here because they refresh every 30 seconds. Read them
from the page itself, or from the public API:

```bash
curl -s https://backend.stakecore.org/api/page/info
```

## Protocols

Validator and protocol-signing services on Flare, Avalanche, and the Songbird
canary network — the networks live on the cluster today. Each protocol sets its
own rules and reward structure.

| Protocol | Network | Mirror |
| --- | --- | --- |
| Validator | Flare | [/flare/validator.md](/flare/validator.md) |
| FSP | Flare | [/flare/fsp.md](/flare/fsp.md) |
| FSP | Songbird | [/songbird/fsp.md](/songbird/fsp.md) |
| Validator | Avalanche | [/avalanche/validator.md](/avalanche/validator.md) |

## More

- [About StakeCore](/about.md) — who it serves and how the cluster is built
- [Contact](/contact.md) — how to reach the team
- [Agent guide](/AGENTS.md) — the public API and what agents can do
- [Glossary](/glossary.md) — FSP, FTSO, P-chain, reward epoch, and the rest

## Sitemap

Every page on this site is listed in [/sitemap.md](/sitemap.md).
