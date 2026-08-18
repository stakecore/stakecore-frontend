---
title: Avalanche Validator
description: StakeCore's Avalanche validator — Snowball proof-of-stake on the P-chain, where delegators earn a share of network inflation minus the validator fee.
url: https://stakecore.org/avalanche/validator.md
dateModified: 2026-08-18
---

# Avalanche Validator

Secure Avalanche Network consensus.

Human URL: <https://stakecore.org/#/avalanche/validator>

## Basic information

Avalanche runs on the proof of stake protocol called Snowball. Snowball
requires validators to stake AVAX, which allows them to validate and broadcast
network transactions. In return, validators are rewarded with the network's
inflation.

Delegators can choose to contribute to a validator's staked AVAX, earning a
share of the inflation reward rate, offset by a small fee percentage that each
validator defines.

**Note:** Avalanche staking takes place on its platform chain (P-chain), not
the contract chain (C-chain), where most users hold their AVAX assets.

## Staking

Delegating AVAX to a validator locks it on the P-chain for the chosen term.
StakeCore never takes custody — the transaction is signed in the holder's own
wallet, and the stake returns to that wallet when the term ends.

## Live statistics

The page shows the validator's stake, delegator count, uptime, fee, and reward
history, with a picker when more than one node is running. Read the same data
from the API:

```bash
curl -s https://backend.stakecore.org/api/avalanche/validator/info
```

A single delegator's position, keyed by C-chain address:

```bash
curl -s https://backend.stakecore.org/api/avalanche/validator/delegator/{cChainAddress}
```

Verifiable on the [Avalanche explorer](https://subnets.avax.network).

## Related

- [Flare Validator](/flare/validator.md) — the same consensus protocol with rewards bound to FSP
- [Glossary](/glossary.md) — P-chain vs C-chain, delegation vs staking

## Sitemap

Every page on this site is listed in [/sitemap.md](/sitemap.md).
