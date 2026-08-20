# A news feed at /news, and moving the product showcase into it

Date: 2026-08-20

## Goal

Give StakeCore a dated announcements feed at `/news`, reachable from a **News**
item in the header, and move the FAsset Visualiser out of `/about` and into it
as the first post — carried by a card with a drawn thumbnail of the visualiser
itself.

This supersedes part of
[2026-08-20-product-showcase-design.md](2026-08-20-product-showcase-design.md),
merged earlier the same day. That design deliberately put the visualiser on
`/about` with no nav entry, on the grounds that its job was credibility rather
than traffic. The decision has changed: announcements are their own content
type, they accumulate, and they belong behind a nav item. The earlier spec is
not wrong about `/about`; it is simply no longer what is wanted.

## Decisions

| Question | Decision |
| --- | --- |
| What `/news` holds | Dated announcements — releases, network events, incidents |
| Route | `/news`, a lazy child route |
| Nav | Fifth `menuList` entry, ordered `home · about · protocols▾ · news · contact` |
| Post permalinks | None. One page, all posts inline, newest first |
| Markdown mirror | One — `public/news.md` — carrying every post |
| Layout | Stacked full-width post blocks |
| Categories | Yes: `Release` / `Network` / `Incident`, as a chip |
| `/about` section | Removed and moved here. The Mission clause stays |
| Thumbnail | Hand-authored SVG, in colour, an abstraction rather than a trace |

Rejected, with reasons:

- **A route per post.** Shareable and better for search, but every post becomes
  a lazy route plus its own mirror file plus its own `<loc>` plus its own
  hand-maintained `dateModified` — multiplying the one failure mode this
  project already names as uncatchable. Revisit when posts are numerous enough
  that someone actually needs to link one; the `id` field below is the anchor
  that migration would use.
- **A tile grid like `Portfolio`.** The strongest visual match to the home
  page, but tiles need short bodies, and a truncated body needs a permalink to
  expand into — which the decision above rules out.
- **A timeline with a pinned date rail.** It is the stacked layout plus a rail
  that exists only at `lg`. If the page reads flat once it has several posts,
  add the rail then.
- **Keeping the `/about` section as well.** Two homes for one description means
  two copies to keep in step, and the earlier spec's own reasoning about pinned
  copy applies: the way to stop copy drifting is to have one of it.

## The reference the artwork is drawn from

The FAsset Visualiser is a 3D canvas application. Its legend reads *"drag to
orbit · scroll to zoom · click a pillar for details"*, and it renders nothing
without WebGL — a headless capture in this project's container reports
`NO WEBGL` and produces an empty scene, so the artwork cannot be traced from an
automated screenshot.

Two screenshots were supplied by the author in conversation. **They are not
committed to this repository and are not on disk**, so an implementer cannot
open them. This section is therefore the reference: the composition is
described here in enough detail to be drawn from text alone.

The scene, from those screenshots:

- **A maroon elliptical platform** seen in axonometric projection, roughly wine
  coloured (`#7b1e32`), semi-transparent, carrying the grey Flare wordmark
  glyph across its face at low opacity (`#8a8f96`, ~45%).
- **Translucent tunnels hanging beneath it** — vertical cylinders, seven or so,
  of clearly varying length and diameter, in a lighter red (`#a02040`) at
  roughly 40% opacity so overlaps read darker. This variation is the data:
  cylinder width is total backing capacity.
- **Mint-green rims** (`#9fe0c0`) as thin ellipses capping the cylinder ends —
  the "Normal" agent status colour from the legend.
- **Asset coins seated around the platform rim** — small circles with mint-green
  rims and pale faces, five or six of them, spaced around the ellipse.
- **A blue wireframe vault floating above** the platform: a geodesic sphere in
  steel blue (`#4a90b8`) crossed by two or three orbital ellipses, sitting
  inside a faint circular glow.
- **A dark ground ellipse below** everything, near-black, carrying the grey XRP
  glyph at low opacity.
- **Ground colour** is a very dark navy (`#0b1020`), not the neutral `#0a0a0a`
  the protocol thumbnails use.

### Two deliberate departures

- **It is in colour**, unlike the four existing protocol thumbnails, which are
  strictly white strokes at 8–40% opacity on `#0a0a0a`. Those four sit together
  in the Portfolio grid, where consistency is the whole point. This one sits
  alone on a news card, and the maroon/mint/blue *is* the product's identity —
  rendering it monochrome would describe the composition while discarding what
  makes it recognisable.
- **It is an abstraction, not a likeness.** A hand-authored SVG cannot trace a
  raster and should not pretend to. The honest consequence is that it will
  drift as the application evolves — the same maintenance class as the
  hand-maintained `dateModified` fields, and recorded here as a known cost
  rather than left to be discovered.

## Architecture

### Files

| File | Change |
| --- | --- |
| `src/utils/data/news.tsx` | New. Post types, `hostOf`, `sortedPosts`, the post data |
| `src/utils/misc/formatter.ts` | Add `Formatter.day(iso)` |
| `src/utils/misc/formatter.test.ts` | Cover `day`, including malformed input |
| `src/utils/data/news.test.ts` | New |
| `src/pages/news/index.tsx` | New. The page |
| `src/pages/news/post.tsx` | New. One post block |
| `src/pages/news/post.test.tsx` | New |
| `src/pages/news/news.scss` | New |
| `src/assets/images/news/fasset-visualiser.svg` | New. The artwork |
| `src/route/router.tsx` | Add the `/news` lazy route |
| `src/utils/data/menu.ts` | Add the News entry |
| `e2e/fixtures/routes.ts` | Add `{ path: '/news', heading: 'News' }` |
| `e2e/routes.spec.ts` | Move the FAsset link assertion from `/about` to `/news` |
| `public/news.md` | New mirror |
| `public/sitemap.xml` | New `<loc>` for `news.md` |
| `public/sitemap.md` | New table row |
| `public/llms.txt` | `/news.md` under `## Pages` |
| `public/about.md` | Remove `## What we build`; keep and re-point the Mission clause |
| `src/pages/about/index.tsx` | Remove the import and render |
| `src/pages/about/about.scss` | Remove the two product-link rules |
| `src/pages/about/whatWeBuild.tsx` | **Delete** |
| `src/pages/about/whatWeBuild.test.tsx` | **Delete** |
| `src/utils/data/products.tsx` | **Delete** — superseded by `news.tsx` |
| `src/utils/data/products.test.ts` | **Delete** |

`public/AGENTS.md` is deliberately absent: its "Other StakeCore deployments"
section remains accurate, so its content does not change and its
`dateModified` must **not** move.

### Post data

```tsx
export type NewsCategory = 'Release' | 'Network' | 'Incident'

export interface NewsLink {
    /** Defaults to the href's hostname. Set it only when that reads wrongly. */
    label?: string
    href: string
}

export interface NewsPost {
    /** Stable slug. React key today; the anchor a permalink route would use. */
    id: string
    /** ISO yyyy-mm-dd. */
    date: string
    category: NewsCategory
    title: string
    body: string
    /** Imported SVG. Omitted for posts that do not warrant art. */
    thumbnail?: string
    links?: NewsLink[]
}
```

Three properties are load-bearing:

- **`category` is a union, not a string.** A typo becomes a compile error
  rather than an unstyled chip nobody notices.
- **The feed sorts by `date` at render**, via an exported `sortedPosts` helper,
  rather than trusting array order. Hand-ordered arrays drift the moment
  someone appends a backdated post, and a news page in the wrong order fails
  silently. Because the dates are ISO `yyyy-mm-dd`, the comparator is plain
  string comparison — no parsing, and therefore nothing to throw.
- **`hostOf` moves here from `products.tsx` unchanged**, including its totality:
  `URL` throws on anything it cannot parse and this runs during render, where a
  throw unmounts the route, so it falls back to the raw string. It stays out of
  `Formatter` for the reason the earlier spec gives — every member there falls
  back to `—`, and a link labelled `—` is worse than one showing a raw href.
  It now has a second job: supplying the default `NewsLink` label.

### One addition to `Formatter`

Every date function in `src/utils/misc/formatter.ts` takes **unix seconds**, and
`dateHuman` also appends a time — neither suits an ISO post date. Add one
function beside them:

```ts
/** "2026-08-20" → "20 Aug 2026". Total: NO_VALUE for anything unparseable. */
export function day(iso: string): string
```

It follows the namespace's existing contract exactly: returns `Formatter.NO_VALUE`
rather than throwing or inventing a value, since it runs during render. It gets
tests in the existing formatter suite alongside the other date functions,
including the empty-string and malformed cases.

### The first post, verbatim

These are the exact values. The `body` is reused unchanged from the superseded
product-showcase spec, and must appear identically in `public/news.md` — the
same pinning rule as before, for the same reason.

```tsx
{
    id: 'fasset-visualiser',
    date: '2026-08-20',
    category: 'Release',
    title: 'FAsset Visualiser',
    thumbnail: fassetVisualiserThumbnail,
    body: "A live 3D view of Flare's FAsset protocol. Each agent backing FXRP is drawn as a tunnel whose width is its total backing capacity, split between minted backing and free capacity and coloured by the agent's status, with every mint and redeem travelling through it as it happens. Every figure in the scene is rendered live from protocol state, not from a snapshot. A second deployment runs the same view against the Coston2 test network.",
    links: [
        { href: 'https://fasset.stakecore.org' },
        { label: 'Coston2 testnet', href: 'https://fasset-coston2.stakecore.org' },
    ],
}
```

The first link takes no `label`, so it renders as `fasset.stakecore.org` via
`hostOf`; the second is labelled, because `fasset-coston2.stakecore.org` says
less to a reader than "Coston2 testnet" does.

The page's intro line, beneath the `h1`:

> What we have shipped, and what has changed on the networks we run.

### The page and the post block

`src/pages/news/index.tsx` renders an `h1` of exactly **`News`** (the `ROUTES`
fixture asserts that literal), a short intro line, and `sortedPosts()` mapped
through `Post`.

`src/pages/news/post.tsx` renders one block:

- a meta row: `<time dateTime={date}>{Formatter.day(date)}</time>` and the
  category chip
- an `h2` title
- the thumbnail, when present, as `<img alt="" />` constrained to
  `max-width: 480px`
- the body
- a link row, when present: one `a` per link, each `target="_blank"` and
  `rel="noopener noreferrer"`, labelled by `hostOf` for outbound deployments

Four choices worth stating:

- **`h1` page / `h2` posts.** Keeps `heading-order` clean for the axe scan that
  the `ROUTES` fixture will now run against `/news` automatically.
- **`alt=""` on the thumbnail.** The artwork is an abstraction the body already
  describes in words. Descriptive alt text would assert something the drawing
  does not actually convey, and a decorative image with an empty alt is the
  correct accessible treatment.
- **Dates go through `Formatter.day`**, which is total — a malformed date
  renders `—` rather than throwing during render. The `dateTime` attribute
  carries the raw ISO value, so the machine-readable form never depends on the
  display format.
- **`max-width: 480px`, not full-bleed.** The SVG is a 480×300 illustration; a
  wide thin band of abstract shapes reads as a divider rather than a picture.

### Why the mirror cannot be forgotten

`e2e/fixtures/agentFiles.ts` derives `MIRRORS` from `ROUTES`
(`MIRRORS = ROUTES.map(mirrorFor)`). Adding one line to the `ROUTES` fixture
therefore drives six specs at once:

- `routes.spec.ts` — `/news` renders with the literal heading and no error panel
- `a11y.spec.ts` — `/news` gets an axe scan
- `agentReadability.spec.ts` — `/news.md` is fetched and asserted not to be the
  SPA shell; its frontmatter is checked; it must appear in `sitemap.xml` and in
  `sitemap.md`

So `public/news.md` and both sitemap entries are not optional extras that might
be skipped — omitting any of them turns the suite red. This is the mechanism
that makes the agent-readable surface real rather than aspirational, and it is
worth knowing before adding a future route.

## Agent-readable surface

`public/news.md` carries frontmatter (`title`, `description`, `url`,
`dateModified`) and then one `##` section per post, each giving the date, the
category, the body, and the links.

Its `dateModified` is **the day the file was last edited**, which is not the
same thing as the newest post's date — a post may be backdated, and a typo fix
touches the file without adding a post. An earlier draft of this spec said the
two tracked each other; that was wrong, and following it would have stamped the
mirror with a past date on a day it changed, which is exactly the staleness
`CLAUDE.md` names as its one uncatchable failure. `e2e/agentReadability.spec.ts`
pins `dateModified` against the file's `<lastmod>` in `sitemap.xml`, so the two
copies cannot drift apart even though neither is checked for being correct.

`public/sitemap.xml` gains a `<loc>` for `https://stakecore.org/news.md`. This
is consistent with the constraint as reworded on the previous branch: no
*cross-host* entries, but a new mirror of our own belongs there.

`public/llms.txt` gains `/news.md` under `## Pages`. Its `## Products` section
**stays**: it indexes the live deployments, which an agent wants pointed at
directly regardless of which page describes them to humans.

`public/about.md` loses `## What we build`, keeps the Mission clause, and gains
a pointer to `/news.md`; its `description` and `dateModified` are updated
accordingly.

## Testing

### `src/utils/data/news.test.ts`

- every post's `date` matches `^\d{4}-\d{2}-\d{2}$` and parses
- ids are unique
- every `category` is one of the three union members
- every link href is absolute `https:`
- **`sortedPosts` returns strictly date-descending order**, exercised against a
  seeded multi-post fixture array rather than the real data. A one-element
  array cannot detect a broken comparator, so testing the sort against live
  data alone would be a test that cannot fail.

### `src/pages/news/post.test.tsx`

`// @vitest-environment happy-dom` and `afterEach(cleanup)` — there is no global
setup file, so a suite that renders in every test must clean up itself.

- the title renders as an `h2`
- the `<time>` element carries a machine-readable `dateTime` equal to the ISO
  date, while displaying the human form
- the category renders
- every anchor carries `target="_blank"`, `rel="noopener noreferrer"`, and an
  `https:` href
- a post with a `thumbnail` renders an `img` whose `alt` is empty; a post
  without one renders no `img` at all

### End-to-end

One line in `e2e/fixtures/routes.ts` (`{ path: '/news', heading: 'News' }`),
which activates the six checks above. The FAsset outbound-link assertion moves
from `/about` to `/news` in `routes.spec.ts` — still presence-only, never a
request to either host, so external uptime cannot redden CI.

### Before pushing

```
pnpm test
pnpm lint
npx tsc -p tsconfig.json --noEmit
pnpm build
pnpm test:e2e
```

## Out of scope

- Permalinks, per-post mirrors, per-post sitemap entries
- An RSS or Atom feed
- Any CMS, markdown-sourced posts, or build-time content pipeline — posts are a
  typed array in the repo
- Pagination — revisit when the page is long enough to need it
- Changes to `public/AGENTS.md`

## Follow-ups

- **A permalink route** when someone first needs to link a single post. `id` is
  already the slug it would use.
- **Pagination or an archive split** once the page runs long.
- **The artwork will drift** as the visualiser evolves. It is an abstraction,
  not a screenshot, so nothing detects this — a periodic look is the only
  mechanism.

## Success criteria

1. A **News** item in the header opens `/news`, which renders an `h1` of `News`
   and the FAsset Visualiser post with its date, `Release` chip, drawn
   thumbnail, body, and links to both deployments.
2. `/about` no longer carries the "What we build" section, in the page or in
   `about.md`, but keeps the Mission clause pointing at `/news.md`.
3. `public/news.md` exists, is listed in both sitemaps and in `llms.txt`, and is
   not the SPA shell.
4. Adding a second post is an append to one array plus an edit to `news.md`.
5. `pnpm test`, `pnpm lint`, `npx tsc --noEmit`, `pnpm build`, and
   `pnpm test:e2e` all pass.
