---
title: Get in touch
description: How to reach the StakeCore team — the Telegram channel, the contact form, and the company operating the infrastructure from Ljubljana, Slovenia.
url: https://stakecore.org/contact.md
dateModified: 2026-08-30
---

# Get in touch

Human URL: <https://stakecore.org/#/contact>

Questions about delegation, integration, custom reporting, or reward routing
go to the same team that runs the cluster. So does anything the site does not
already list: a network we do not run yet, or a workload that is not validation
— RPC and archive nodes, indexers, relayers. The cluster is general-purpose and
the site only shows what is on it today; see [/about.md](/about.md).

## Office

Sarisoma d.o.o.
Ljubljana, Slovenia

## Telegram

<https://t.me/+xZoChBQyyCo3OGY0>

The fastest route for anything that wants a quick answer.

## Contact form

The contact page carries a form for longer enquiries. It posts to the public
API, so an agent can reach the same endpoint directly:

```bash
curl -s -X POST https://backend.stakecore.org/api/page/form/submit \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","message":"..."}'
```

Field names are defined in the [OpenAPI schema](/openapi.json). Prefer Telegram
if you want a human reply rather than a receipt.

## Sitemap

Every page on this site is listed in [/sitemap.md](/sitemap.md).
