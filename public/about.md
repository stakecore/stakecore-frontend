---
title: Your stake, our engine
description: Who StakeCore serves, how its multi-provider node cluster is built, why it is not tied to any particular chain, and why delegating carries a risk profile close to simply holding the asset.
url: https://stakecore.org/about.md
dateModified: 2026-08-29
---

# Your stake, our engine

Human URL: <https://stakecore.org/#/about>

StakeCore runs blockchain node infrastructure — a redundant cluster we build,
orchestrate, and monitor ourselves. Validator duty on Flare and Avalanche, and
core oracle attestation signing on Flare and Songbird, are what it carries
today, and we are actively taking it onto more networks. We're open to running
any kind of workload, but we prefer to keep our stakers and delegators on core
network protocols, where the risk profile stays close to that of simply holding
the asset.

## Who we serve

Whatever the size of the position, the offer is the same. Delegate to us and
earn yield on tokens that stay in your wallet. Or, where that does not fit, we
will build something that does — staking without the delegation fee, for one.

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

**Three providers, seven cities.** The three server nodes holding cluster
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

**What the cluster runs on.** WireGuard links our nodes into one private
network, whichever provider or site they sit in. Nomad places every workload
onto that network and keeps it running, moving a job between nodes in case of
failures. Each job pulls its signing keys and service credentials from Vault
when it starts, rather than carrying them in an image. HAProxy balances traffic
between jobs inside that network, and Traefik publishes the APIs and websites
that need to be reachable from outside it.

From there, everything the cluster does becomes a signal. Alloy ships every
container's logs to Loki, Prometheus scrapes the metrics, and both are read
through Grafana. Sentry catches what neither can: an exception reporting itself
from inside the process that failed. Healthchecks.io waits outside the cluster
for jobs to check in on schedule, and treats silence as the alarm. When one of
Grafana's alert rules fires the
alert lands in Telegram, and Claude helps the on-call engineer work out why,
correlating logs against metrics and drafting a fix.

| Job | What we run |
| --- | --- |
| Orchestration and secrets | Nomad, Consul, Vault |
| Data | PostgreSQL, Redis |
| Private network | WireGuard, HAProxy |
| Public edge | Traefik, Let's Encrypt |
| Observability | Grafana, Prometheus, Loki, Alloy, Sentry, Healthchecks.io |
| Delivery | Docker, GitHub Actions |
| Hosting | OVH, Hetzner, GitHub Pages |
| Alerting and triage | Telegram, Claude |

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
