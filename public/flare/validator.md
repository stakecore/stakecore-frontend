---
title: Flare Validator
description: StakeCore's Flare validator — Snowball consensus staking on the P-chain, with rewards bound to Flare Systems Protocol performance and paid on the C-chain.
url: https://stakecore.org/flare/validator.md
dateModified: 2026-08-18
---

# Flare Validator

Secure Flare Network consensus.

Human URL: <https://stakecore.org/#/flare/validator>

## Basic information

Flare Network adapts Avalanche's Snowball proof-of-stake protocol. The protocol
is the basis for the network consensus, which requires validators to stake
funds, and broadcast and validate network transactions.

However, Flare modifies the rewarding structure by binding it to the Flare
Systems Protocol performance and distributing rewards in 14-day cycles on the
C-chain (EVM chain) instead of the P-chain (platform chain).

**Note:** even though Flare staking rewards are distributed on the C-chain,
staking still takes place on its platform chain (P-chain).

## Staking

Staking here means locking FLR on the P-chain for a fixed term, which is a
different commitment from FSP delegation — see the
[glossary](/glossary.md) for the distinction. StakeCore never takes custody;
the transaction is signed in the holder's own wallet.

## Live statistics

The page shows the validator's stake, delegator count, uptime, and reward
history, plus a picker when more than one validator node is running. Read the
same data from the API:

```bash
curl -s https://backend.stakecore.org/api/flare/validator/info
```

A single delegator's position, keyed by C-chain address:

```bash
curl -s https://backend.stakecore.org/api/flare/validator/delegator/{cChainAddress}
```

Verifiable on the
[Flare P-chain explorer](https://flare.space/dapp/p-chain-explorer) and the
[Flare block explorer](https://flare-explorer.flare.network).

## Related

- [Flare Systems Protocol](/flare/fsp.md) — the protocol Flare validator rewards are bound to
- [Avalanche Validator](/avalanche/validator.md) — the same consensus protocol, unmodified rewards

## Sitemap

Every page on this site is listed in [/sitemap.md](/sitemap.md).
