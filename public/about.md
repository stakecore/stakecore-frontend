---
title: Your stake, our engine
description: Who StakeCore serves, how its multi-provider node cluster is built, why it is not tied to any particular chain, and why delegating carries a risk profile close to simply holding the asset.
url: https://stakecore.org/about.md
dateModified: 2026-08-19
---

# Your stake, our engine

Human URL: <https://stakecore.org/#/about>

StakeCore runs blockchain node infrastructure — a redundant cluster we build,
orchestrate, and monitor ourselves. Validator duty and core protocol signing on
Flare, Avalanche, and Songbird are what it carries today, but nothing about it
is specific to those three: RPC and archive nodes, indexers, relayers, and
attestation or oracle daemons are the same shape of work, and any network is a
candidate. From individual holders to protocols, custodians, and treasuries,
anyone can delegate or stake their native tokens with us, earning rewards with
a risk profile close to that of simply holding the asset.

## Who we serve

**Individual holders.** Whether you hold a hundred tokens or a hundred
thousand, the rate is the same — rewards are proportional and we run no tiers.
No account to open and no onboarding call to sit through.

**Protocols and foundations.** The treasury you are sitting on is denominated
in the token your own network runs on. Putting it to work adds weight to the
validator set securing that network, and the rewards land back in the treasury.

**Custodians, exchanges and wallets.** Offer staking to your users without
becoming an infrastructure operator yourself. You keep the relationship and the
interface; we run the nodes and publish the uptime you quote them.

**Funds, treasuries and family offices.** A mandate that rules out wrapped
assets and derivatives is the usual blocker to staking. Delegation keeps the
position in the instrument you already hold, so there is nothing new to put
past a risk committee.

## Infrastructure

Small, robust, and decentralized.

**Three providers, two continents.** The three Nomad server nodes holding
cluster state sit in Beauharnois, Helsinki, and Nuremberg, so an outage
confined to one facility or region costs us a single node, not the cluster.
Worker nodes run from Roubaix, Frankfurt, and Warsaw, plus our own premises in
Ljubljana — spreading the cluster across OVH, Hetzner, and hardware we host
ourselves, so no single provider can take it down.

**A purpose-built cluster, plenty of redundancy.** Three Nomad server nodes
orchestrate the validators and FSP signers we run across Flare, Songbird, and
Avalanche. Nothing in that arrangement is particular to those chains: to the
scheduler a node is a containerised job with a data volume, a set of ports, and
a health check, so another network's client — validating or not — is a job
specification and a place to put it. Any worker node can host any workload —
failure of a single node is recovered automatically by re-scheduling somewhere
else in the cluster.

## Why StakeCore

**Tokens that never move.** Delegation is a vote, not a transfer. Nothing gets
bridged, wrapped, or routed through a smart contract, and we never take custody
of anything — your keys stay yours the entire time.

**Transparent statistics.** Delegation totals, reward history, and uptime are
on this site, live, and every number behind them is on-chain. No NDA, no
quarterly PDF, nothing you have to believe just because we said it.

**One operator, any network.** The same team and the same cluster stand behind
every workload we run — validator duty, protocol signing, RPC and archive
nodes, indexers, relayers. Whatever you hold, picking up another network
doesn't mean finding someone new to trust.

**Direct access to the engineers.** Partners get a direct line to the engineers
who built the cluster: integration questions, custom reporting, reward routing,
answered by whoever is on call for it. Everyone else reaches the same team
through our socials or the [contact page](/contact.md).

## Sitemap

Every page on this site is listed in [/sitemap.md](/sitemap.md).
