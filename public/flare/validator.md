---
title: Flare Validator
description: StakeCore's Flare validator — proof-of-stake consensus on the P-chain, where delegated FLR is locked for a fixed term and rewards are bound to Flare Systems Protocol performance and paid on the C-chain.
url: https://stakecore.org/flare/validator.md
dateModified: 2026-10-16
---

# Flare Validator

Secure Flare Network consensus.

Human URL: <https://stakecore.org/#/flare/validator>

## Basic information

Every blockchain needs a way to agree on which transactions happened and in
what order. On Flare, that is the job of validators: computers that check new
transactions and add them to the chain. Flare uses the same proof-of-stake
design as Avalanche, where each validator puts up FLR as a stake, and the more
stake behind a validator, the more weight its vote carries. In return,
validators and the people backing them earn FLR rewards.

You can add your FLR to a validator's stake by delegating to it. Your tokens
never leave your own wallet, but unlike delegating to an FSP provider, they are
staked for a fixed term:

- **Amount and term**: there is a minimum amount, and the delegation runs for a
  period you choose, at least 14 days and never past the validator's own end
  date. Both limits are shown on the page. Until the delegation ends, your
  FLR is locked and cannot be withdrawn early.
- **Two chains**: your wallet normally holds FLR on Flare's contract chain
  (C-chain), but staking happens on its platform chain (P-chain). To delegate,
  you first move FLR from the C-chain to the P-chain, and move it back once the
  delegation ends.
- **Rewards**: paid every 14 days on the C-chain, not on the P-chain where your
  stake sits. They depend on the validator staying online at least 80% of the
  time and on its operator meeting the Flare Systems Protocol's requirements,
  minus the validator's fee.

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
