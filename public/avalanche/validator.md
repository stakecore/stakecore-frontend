---
title: Avalanche Validator
description: StakeCore's Avalanche validator — proof-of-stake consensus on the P-chain, where delegated AVAX is locked for a fixed term and rewarded from new issuance, minus the validator fee.
url: https://stakecore.org/avalanche/validator.md
dateModified: 2026-10-16
---

# Avalanche Validator

Secure Avalanche Network consensus.

Human URL: <https://stakecore.org/#/avalanche/validator>

## Basic information

Every blockchain needs a way to agree on which transactions happened and in
what order. On Avalanche, that is the job of validators: computers that check
new transactions and add them to the chain. Avalanche is proof of stake, so
each validator puts up AVAX as a stake, and the more stake behind a validator,
the more weight its vote carries. In return, validators and the people backing
them are rewarded with newly issued AVAX.

You can add your AVAX to a validator's stake by delegating to it. Your tokens
never leave your own wallet, but they are staked for a fixed term:

- **Amount and term**: there is a minimum amount, and the delegation runs for a
  period you choose, at least 14 days and never past the validator's own end
  date. Both limits are shown on the page. Until the delegation ends, your
  AVAX is locked and cannot be withdrawn early.
- **Two chains**: your wallet normally holds AVAX on Avalanche's contract chain
  (C-chain), but staking happens on its platform chain (P-chain). To delegate,
  you first move AVAX from the C-chain to the P-chain, and move it back once
  the delegation ends.
- **Rewards**: paid in one go on the P-chain when the delegation ends, together
  with your stake, minus the validator's fee. They are all or nothing: if the
  validator was online less than 80% of the time, the delegation earns no
  reward at all.

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
