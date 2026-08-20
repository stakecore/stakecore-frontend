---
title: Your stake, our engine
description: Who StakeCore serves, how its multi-provider node cluster is built, the software StakeCore builds and publishes, why it is not tied to any particular chain, and why delegating carries a risk profile close to simply holding the asset.
url: https://stakecore.org/about.md
dateModified: 2026-08-20
---

# Your stake, our engine

Human URL: <https://stakecore.org/#/about>

StakeCore runs blockchain node infrastructure — a redundant cluster we build,
orchestrate, and monitor ourselves. Validator duty and core protocol signing on
Flare, Avalanche, and Songbird are what it carries today, but nothing about it
is specific to those three: RPC and archive nodes, indexers, relayers, and
attestation or oracle daemons are the same shape of work, and any network is a
candidate. Some of what runs on it is our own: tools we build for our own
operations, published when they're useful to anyone else. From individual
holders to protocols, custodians, and treasuries, anyone can delegate or stake
their native tokens with us, earning rewards with a risk profile close to that
of simply holding the asset.

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

**Three providers, two continents.** The three server nodes holding cluster
state sit in Beauharnois, Helsinki, and Nuremberg, so an outage confined to one
facility or region costs us a single node, not the cluster. Worker nodes run
from Roubaix, Frankfurt, and Warsaw, plus our own premises in Ljubljana — three
independent providers, so no single one can take the cluster down. Those seven
sites sit inside a much larger footprint: OVHcloud and Hetzner between them
publish 19 datacenter regions across four continents, and a workload can be
scheduled into any of them.

**A purpose-built cluster, plenty of redundancy.** Three Nomad server nodes
orchestrate the validators and FSP signers we run across Flare, Songbird, and
Avalanche. Nothing in that arrangement is particular to those chains: to the
scheduler a node is a containerised job with a data volume, a set of ports, and
a health check, so another network's client — validating or not — is a job
specification and a place to put it. Any worker node can host any workload —
failure of a single node is recovered automatically by re-scheduling somewhere
else in the cluster.

**What the cluster runs on.** WireGuard links the sites into one private
network, HAProxy balances traffic inside the cluster, and Traefik publishes the
services and sites that face outward. When something breaks the alert lands in
Telegram, and Claude helps the on-call engineer work out why — pulling logs
from Loki and metrics from Prometheus, correlating the two, drafting a fix —
but nothing reaches the cluster without an engineer approving it.

| Job | What we run |
| --- | --- |
| Orchestration and secrets | Nomad, Consul, Vault |
| Data | PostgreSQL, Redis |
| Private network | WireGuard, HAProxy |
| Public edge | Traefik, Let's Encrypt |
| Observability | Grafana, Prometheus, Loki, Alloy |
| Delivery | Docker, GitHub Actions |
| Hosting | OVH, Hetzner, GitHub Pages |
| Alerting and triage | Telegram, Claude |

## What we build

The cluster runs our own software too.

**FAsset Visualiser.** A live system view of Flare's FAsset protocol. Each
FAsset — FXRP, FBTC, FDOGE — is drawn as a tunnel whose width is its total
backing capacity, split between minted backing and free capacity, with the
agents behind it coloured by status and every mint and redemption flowing
through as it happens. A second deployment runs the same view against the
Coston2 test network.

- Flare: <https://fasset.stakecore.org>
- Coston2 testnet: <https://fasset-coston2.stakecore.org>

Both are client-rendered applications with no markdown mirror and no public
API — there is nothing there for an agent to read.

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
