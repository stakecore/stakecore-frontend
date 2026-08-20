# Advertising StakeCore's own software on /about

Date: 2026-08-20

## Goal

Give the site somewhere to say that StakeCore builds software, not only that it
runs nodes, and seed it with the first artefact: the **FAsset Visualiser**,
deployed at `fasset.stakecore.org` (Flare) and `fasset-coston2.stakecore.org`
(Coston2).

The audience is a partner or protocol evaluating StakeCore as an operator. The
job of the section is credibility — evidence that the team writes and ships
software — not traffic acquisition. That decision determines everything below:
it is why this lives on `/about` under the infrastructure story rather than
becoming a top-level nav entry, a `/products` route, or a home-page strip.

## Decisions

| Question | Decision |
| --- | --- |
| What the section is for | Proof StakeCore builds software; partner-facing credibility |
| Where it lives | `/about`, a new section between `Stack` and `ValueProps` |
| Nav entry | None. Not in `menuList`, not in the footer |
| Extensibility | Data-driven list; a new entry is an edit to one array |
| Evidence per entry | Text tile — icon, title, body, link row. No screenshots, no live status |
| Mainnet vs testnet | One entry, canonical link plus a labelled secondary deployment |
| New route | None |
| New markdown mirror | None. The section is mirrored inside `about.md` |
| `sitemap.xml` / `sitemap.md` | No new `<loc>` entries — see "Why the sitemaps get nothing" |

Two alternatives were considered and rejected:

- **Screenshot cards.** Strongest evidence per pixel, but they need captured and
  optimised images, a dark/light decision, and upkeep. A screenshot rots exactly
  the way the hand-maintained `dateModified` fields do — silently, with no test
  able to catch it. Deferred, not discarded; the data shape below takes an
  `image` field additively whenever the shots exist.
- **Live status per entry** (reachability, last snapshot age). Most convincing
  when green, but it gives the section a failure mode in which the thing meant
  to prove competence renders an error panel. This repo already carries an e2e
  fixture that exists solely because a backend trusts one origin; adding a
  second cross-origin dependency to a marketing section is the wrong trade.

## What the FAsset Visualiser is

Established by reading the deployed bundle, since the app is a client-rendered
Next.js SPA and a non-JS fetch sees only `FXRP — awaiting snapshot…`:

- Its own `<meta name="description">` reads *"Live system view of the FAsset
  protocol"*.
- It handles `FXRP`, `FBTC`, `FDOGE` (plus `FSIMCOINX` on test networks) and
  names `Flare`, `Songbird`, `Coston`, `Coston2`.
- The visual metaphor is tunnels: `width — total backing capacity`, with
  `minted backing (below)` and `free capacity (above)`.
- It animates live protocol events: `MINT`, `REDEEM`, `agent CR change`,
  `agent fee change`, `agent exit available`, `attestation window`,
  `challenge reward`.
- Agents carry a status: `Normal`, `Liquidation`, `Full liquidation`,
  `Destroying`.
- It has a legend panel, a minting-cap banner, and honours
  `prefers-reduced-motion`.

**Corrected 2026-08-20, by the author.** Two of the readings above are wrong,
and both came from inferring the product from its bundle strings rather than
from anyone who built it. A tunnel is an **agent**, not an FAsset; and the
deployment shows **FXRP only**, not FXRP/FBTC/FDOGE — those symbols appear in
the bundle because the code supports them, not because the view renders them.
The corrected description is the one pinned in
[2026-08-20-news-page-design.md](2026-08-20-news-page-design.md). Treat this
section as a record of what was inferred, not as a description of the product.

## Architecture

### Files

| File | Change |
| --- | --- |
| `src/utils/data/products.tsx` | New. The entry data and its types |
| `src/pages/about/whatWeBuild.tsx` | New. The section component |
| `src/pages/about/whatWeBuild.test.tsx` | New. Unit test |
| `src/pages/about/index.tsx` | Render the section; extend the Mission paragraph |
| `src/pages/about/about.scss` | One rule block for the link row |
| `public/about.md` | New section, extended opening paragraph, frontmatter |
| `public/llms.txt` | New `## Products` section |
| `public/AGENTS.md` | Note the deployment and that it has no agent surface |
| `e2e/routes.spec.ts` | Assert the outbound link exists on `/about` |

### Data

`src/utils/data/products.tsx`, beside the existing `protocols.tsx` and
`proposals.tsx`. That directory is already where content the site advertises
lives, and putting it there means a later footer or home-page strip consumes
the same array instead of redeclaring it. The `.tsx` extension matches
`protocols.tsx` and is required because entries carry JSX icons.

```tsx
export interface ProductDeployment {
    label: string
    href: string
}

export interface Product {
    id: number
    icon: ReactNode
    title: string
    body: string
    /** Canonical deployment. Rendered as the primary link. */
    href: string
    /** Other deployments of the same product, rendered after the primary one. */
    alsoAt?: ProductDeployment[]
}
```

`alsoAt` models one product with several deployments rather than a flat list of
links, where which link is canonical would be carried only by array position.

The primary link displays its hostname, derived rather than stored so the two
cannot drift. `URL` throws on a malformed string and this runs during render, so
the derivation is total, following the fallback pattern `CLAUDE.md` prescribes
for `SERVERS[w.type]` and `paletteAt` — drift becomes an ugly label rather than
a blank page:

```tsx
/** Hostname of an absolute URL, or the input unchanged if it will not parse. */
export const hostOf = (href: string): string => {
    try {
        return new URL(href).host
    } catch {
        return href
    }
}
```

It stays local rather than joining `Formatter`. Every member of that namespace
is total by returning `Formatter.NO_VALUE` on bad input, and a link whose label
rendered as `—` would be worse than one showing a raw href — so `hostOf` would
either break that contract or adopt a fallback wrong for this use.

The seed entry:

```tsx
export const productsData: Product[] = [
    {
        id: 1,
        icon: <RiPulseLine size={28} />,
        title: 'FAsset Visualiser',
        body: "A live system view of Flare's FAsset protocol. Each FAsset — FXRP, FBTC, FDOGE — is drawn as a tunnel whose width is its total backing capacity, split between minted backing and free capacity, with the agents behind it coloured by status and every mint and redemption flowing through as it happens. A second deployment runs the same view against the Coston2 test network.",
        href: 'https://fasset.stakecore.org',
        alsoAt: [{ label: 'Coston2 testnet', href: 'https://fasset-coston2.stakecore.org' }],
    },
]
```

`RiPulseLine` is confirmed present in `@remixicon/react@4.9.0` and is not
already used on the page — `RiLineChartLine` in `valueProps` is the nearest
neighbour and stays visually distinct.

### The section component

`src/pages/about/whatWeBuild.tsx`, a sibling component rather than another
module-scope `const` inside `index.tsx`. The reason is testability: mounting
`index.tsx` under happy-dom pulls in `ServerGlobe` and `InfraConstellation`,
both canvas-backed. This follows the `stackCarousel.tsx` precedent.

```tsx
<section className="about-section">
    <div className="container">
        <header className="about-section-header">
            <p className="about-section-header-sup">What we build</p>
            <h2 className="about-section-header-main">
                The cluster runs{' '}
                <span className="about-mark">our own software</span> too
            </h2>
        </header>
        <div className="about-grid">
            {productsData.map(({ id, icon, title, body, href, alsoAt }) => (
                <article key={id} className="about-tile about-tile--wide">
                    <div className="about-tile-icon">{icon}</div>
                    <div>
                        <h3 className="about-tile-title">{title}</h3>
                        <p className="about-tile-body">{body}</p>
                        <p className="about-product-links">
                            <a
                                className="about-inline-link"
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {hostOf(href)}
                            </a>
                            {alsoAt?.map(({ label, href: altHref }) => (
                                <a
                                    key={altHref}
                                    className="about-product-link-alt"
                                    href={altHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${title} on ${label}`}
                                >
                                    {label}
                                </a>
                            ))}
                        </p>
                    </div>
                </article>
            ))}
        </div>
    </div>
</section>
```

Four choices in that markup are load-bearing:

- **The primary link's text is the hostname, not "Open".** It is unique per
  entry, so a screen-reader link list stays unambiguous as entries accumulate;
  it is self-describing out of context; and showing the real URL is itself part
  of the credibility argument.
- **Secondary links carry an `aria-label` naming the product.** `Coston2
  testnet` is unique today and would stop being unique the moment a second
  product ships a testnet. The label prevents that regression from ever
  arriving.
- **The tile does not become clickable.** `about.scss` documents that these
  tiles carry no hover state deliberately — a hover response on static text
  reads as an affordance and invites clicks that go nowhere. A link inside a
  tile is a real affordance; the tile stays a tile.
- **`.about-grid` with `--two`.** At the `md` breakpoint the base grid is three
  columns, and a single entry there is squeezed into a sliver — title
  wrapping, body reflowing to a handful of characters per line, links
  stacking instead of sharing a row. The two-column variant gives a lone
  entry enough width for the title and links to each hold one line. Revisit
  at three or four entries.

### Placement

Rendered in `index.tsx` between `<Stack />` and `<ValueProps />`. The
infrastructure section directly above closes on *what the cluster runs on*, so
"and it runs our own software too" is the next beat, and it lands before the
closing *why StakeCore* rather than after it.

### Styling

One block appended to `about.scss`:

- `.about-product-links` — top margin separating it from `.about-tile-body`,
  `display: flex`, `flex-wrap: wrap`, a gap, and `align-items: baseline`.
- `.about-product-link-alt` — smaller than the primary link, `--main-color`
  rather than `--heading-color`, with a visible `:focus-visible` treatment
  matching `a.about-inline-link`.

No new design tokens.

### The Mission paragraph

The page's opening paragraph currently ends at *"…and any network is a
candidate."* and describes StakeCore purely as an infrastructure operator, so
the new section would arrive unannounced. One clause is appended, in both
`index.tsx` and `about.md`:

> Some of what runs on it is our own: tools we build for our own operations,
> published when they're useful to anyone else.

## Agent-readable surface

### `public/about.md`

- Append the Mission clause to the opening paragraph.
- Add a `## What we build` section carrying the same copy, with both URLs as
  links.
- Rewrite the frontmatter `description`, which enumerates what the page covers
  and would otherwise be incomplete.
- Bump `dateModified` to the day this ships. It reads `2026-08-20` at the time
  of writing; if implementation slips, the date moves with it. `CLAUDE.md`
  names a stale date here as the one failure mode no test catches.

### `public/llms.txt`

A new `## Products` section, sibling to `## Pages`, `## Protocols` and
`## Reference`, listing the visualiser with both URLs. It does not belong under
`## Pages` — these are not pages of this site.

### `public/AGENTS.md`

A short entry recording that the visualiser exists, is client-rendered, and has
**no markdown mirror and no public API**. Without it, an agent that reads
`llms.txt`, sees a `stakecore.org` URL and fetches it receives an empty shell
with no explanation. Preventing that wasted round trip is what `AGENTS.md` is
for; the file already does the same job for the main site under *Reading the
site*. Bump its `dateModified` too.

### Why the sitemaps get no new entry

`sitemap.xml` and `sitemap.md` enumerate this site's own routes and their
mirrors. Two reasons not to add a `<loc>` for the visualiser:

- A cross-host `<loc>` is ignored or rejected by crawlers under the sitemaps
  protocol unless the host is cross-submitted, so the entry would be inert at
  best.
- `sitemap.md`'s table has a *Markdown mirror* column that a separately hosted
  Next.js app cannot fill.

If the visualiser warrants a sitemap, it warrants its own, served from its own
host.

That reasoning bars only *new* entries. It says nothing about the existing
ones: `AGENTS.md` gets a new entry recording the visualiser (see below), which
changes its content, so its `<lastmod>` in `sitemap.xml` must be bumped to
match — same as any other mirror edited on this branch.

## Testing

### Unit — `src/pages/about/whatWeBuild.test.tsx`

Environment directive `// @vitest-environment happy-dom` at the top of the file,
and `afterEach(cleanup)` if it renders more than once — there is no global setup
file, so RTL's auto-cleanup does not run.

Assertions, driven off `productsData` rather than hardcoded:

1. Every entry's `title` renders as a heading.
2. Every entry's `href` renders as an anchor.
3. **Every** anchor in the section carries `target="_blank"` and
   `rel="noopener noreferrer"`, and an `https:` absolute href.
4. Every `alsoAt` deployment renders an anchor with an accessible name that
   includes its product's title.

Assertion 3 is the one worth having. That invariant is maintained by hand and
grows with every entry added; a `target="_blank"` without `rel` is the kind of
omission that survives review indefinitely.

### E2E

- `e2e/a11y.spec.ts` already scans `/about`. The new links are covered with no
  change to that spec.
- `e2e/routes.spec.ts` gains one assertion: the `/about` page contains an anchor
  whose `href` is `fasset.stakecore.org`. It asserts the anchor is **present**,
  never that the host is **reachable** — external uptime must not be able to
  redden this repo's CI.

### Before pushing

```
pnpm test
pnpm lint
npx tsc -p tsconfig.json --noEmit
```

## Out of scope

- Any nav, footer, or home-page entry point.
- A `/products` route or a `products.md` mirror.
- Screenshots or live status (see Decisions).
- Changes to `sitemap.xml` / `sitemap.md`.
- Anything on the visualiser's own deployments.

## Follow-ups

- **Screenshots.** Adding an `image` field to `Product` and a figure to the
  tile is purely additive against the data shape above. Worth doing once there
  are shots that survive a dark/light decision and a size budget.
- **Second entry.** The section is built for a list; the shape should be
  re-checked at the second entry — in particular whether `.about-grid`'s
  three-column default still reads correctly at two.

## Success criteria

1. `/about` renders a *What we build* section between the infrastructure and
   *Why StakeCore* sections, carrying the FAsset Visualiser with a primary link
   to `fasset.stakecore.org` and a labelled `Coston2 testnet` link.
2. Adding a second product is an append to `productsData` and nothing else.
3. `about.md` carries the same copy, an updated `description`, and a
   `dateModified` matching the ship date.
4. `llms.txt` lists both deployments; `AGENTS.md` records that neither has an
   agent-readable surface; both sitemaps are untouched.
5. `pnpm test`, `pnpm lint`, `npx tsc --noEmit`, and the axe scan of `/about`
   all pass.
