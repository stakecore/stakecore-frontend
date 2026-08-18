---
title: Glossary
description: Terminology used across the StakeCore site — protocol names, chain layers, epoch mechanics, and the distinction between delegation and staking.
url: https://stakecore.org/glossary.md
dateModified: 2026-08-18
---

# Glossary

Terms used across [stakecore.org](https://stakecore.org) and its
[markdown mirrors](/sitemap.md).

## Protocols

**FSP — Flare Systems Protocol.** The umbrella protocol securing Flare's
oracle data, made of three parts: FTSO, Fast Updates, and FDC. Providers are
rewarded on their performance in each reward epoch.

**SSP — Songbird Systems Protocol.** The same three-part stack running on
Songbird, Flare's canary network.

**FTSO — Flare Time Series Oracle.** The component that delivers price and
time-series data on-chain.

**Fast Updates.** The component that delivers incremental oracle updates at a
higher frequency than the base FTSO cadence.

**FDC — Flare Data Connector.** The component that attests to data originating
outside the Flare network.

**Snowball.** The proof-of-stake consensus protocol Avalanche runs and Flare
adapts. It requires validators to stake native tokens in order to validate and
broadcast transactions.

## Chain layers

**P-chain (platform chain).** Where staking and delegation actually take
place on both Avalanche and Flare. This is not where most holders keep their
tokens.

**C-chain (contract chain).** The EVM chain, where most holders keep their
assets. Flare distributes its staking rewards here even though the stake
itself sits on the P-chain.

## Mechanics

**Delegation.** Assigning the weight of held tokens to a provider without
transferring them. Nothing is bridged, wrapped, or routed through a smart
contract, and the provider never takes custody. Compare *staking*, which on
the P-chain locks tokens for a fixed term.

**Reward epoch.** The accounting period rewards are computed over. On Flare
and Songbird an FSP reward epoch lasts 3.5 days; Flare validator rewards are
distributed in 14-day cycles.

**Lockup.** The period for which staked tokens cannot be moved. Delegation on
the FSP protocols carries none; P-chain staking does.

**APY.** Annualised percentage yield, derived from observed reward history
rather than promised forward.

## Sitemap

Every page on this site is listed in [/sitemap.md](/sitemap.md).
