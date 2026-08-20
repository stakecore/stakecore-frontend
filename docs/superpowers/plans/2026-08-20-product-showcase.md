# Product Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a *What we build* section to `/about` advertising StakeCore's own published software, seeded with the FAsset Visualiser, and mirror it on the site's agent-readable surface.

**Architecture:** A data-driven list (`src/utils/data/products.tsx`) rendered by a sibling section component (`src/pages/about/whatWeBuild.tsx`) placed between the existing `Stack` and `ValueProps` sections. Adding a product is an append to one array. The same copy is mirrored by hand into `public/about.md`, with index entries in `public/llms.txt` and `public/AGENTS.md`.

**Tech Stack:** React 19, TypeScript, SCSS, Vitest + happy-dom + `@testing-library/react`, Playwright.

**Spec:** [docs/superpowers/specs/2026-08-20-product-showcase-design.md](../specs/2026-08-20-product-showcase-design.md)

## Global Constraints

- **No nav entry.** Do not touch `src/utils/data/menu.ts` or `src/components/sections/footer.tsx`. This section is reachable only from `/about`.
- **No new route and no new markdown mirror.** Do not add a `/products` route or a `public/products.md`.
- **No new `<loc>` entries in `public/sitemap.xml` or `public/sitemap.md`.** They enumerate this site's own routes; a cross-host `<loc>` is inert and `sitemap.md` has a *Markdown mirror* column a third-party host cannot fill. This does not exempt existing entries from the `dateModified` rule below: if a mirror's content changes, its `<lastmod>` in `sitemap.xml` must be bumped to match.
- **Every markdown file edited must have its `dateModified` frontmatter set to the day the work ships.** Use `2026-08-20` unless the calendar has moved on, in which case use the current date. A stale date here is the one failure mode no test catches.
- **Import alias:** `~/` resolves to `src/`.
- **Exact product URLs:** `https://fasset.stakecore.org` and `https://fasset-coston2.stakecore.org`. No trailing slashes.
- **Exact body copy** for the FAsset Visualiser entry (used verbatim in both `products.tsx` and `about.md`):
  > A live system view of Flare's FAsset protocol. Each FAsset — FXRP, FBTC, FDOGE — is drawn as a tunnel whose width is its total backing capacity, split between minted backing and free capacity, with the agents behind it coloured by status and every mint and redemption flowing through as it happens. A second deployment runs the same view against the Coston2 test network.
- **Em dashes are `—` (U+2014), not `--`.** The site's copy uses them throughout.
- **British spelling in copy** (`coloured`), matching the surrounding `/about` prose.
- `strictNullChecks` is on and `noUncheckedIndexedAccess` is load-bearing: indexing an array yields `T | undefined`. Use `?? fallback` or a real guard, never `!`.
- Unit tests live beside source as `src/**/*.test.{ts,tsx}` and must declare their environment with a top-of-file `// @vitest-environment happy-dom` directive. There is no global setup file, so any test rendering more than once must call `afterEach(cleanup)` itself.

---

### Task 1: Product data module

**Files:**
- Create: `src/utils/data/products.tsx`
- Test: `src/utils/data/products.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface ProductDeployment { label: string; href: string }`
  - `interface Product { id: number; icon: ReactNode; title: string; body: string; href: string; alsoAt?: ProductDeployment[] }`
  - `const hostOf: (href: string) => string`
  - `const productsData: Product[]`

- [ ] **Step 1: Write the failing test**

Create `src/utils/data/products.test.ts`:

```tsx
// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest'
import { hostOf, productsData } from './products'

describe('hostOf', () => {
  it('reduces an absolute URL to its hostname', () => {
    expect(hostOf('https://fasset.stakecore.org')).toBe('fasset.stakecore.org')
    expect(hostOf('https://fasset.stakecore.org/legend?x=1')).toBe('fasset.stakecore.org')
  })

  // This runs during render, where a throw unmounts the whole route. The
  // failure mode has to be an ugly label, never an exception.
  it('returns the input unchanged when it will not parse', () => {
    expect(() => hostOf('not a url')).not.toThrow()
    expect(hostOf('not a url')).toBe('not a url')
    expect(hostOf('')).toBe('')
  })
})

describe('productsData', () => {
  const everyHref = productsData.flatMap(p => [p.href, ...(p.alsoAt ?? []).map(d => d.href)])

  it('lists at least one product', () => {
    expect(productsData.length).toBeGreaterThan(0)
  })

  it('points every link at an absolute https URL', () => {
    expect(everyHref.length).toBeGreaterThan(0)
    for (const href of everyHref) {
      expect(new URL(href).protocol).toBe('https:')
    }
  })

  it('gives every product a unique id', () => {
    const ids = productsData.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/utils/data/products.test.ts`
Expected: FAIL — `Failed to resolve import "./products"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/data/products.tsx`:

```tsx
import type { ReactNode } from 'react'
import { RiPulseLine } from '@remixicon/react'

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

// The primary link is labelled with its own hostname, derived rather than
// stored so the label cannot drift from the href. `URL` throws on anything it
// cannot parse and this runs during render, where a throw unmounts the route —
// so the derivation falls back to the raw string instead.
//
// It stays out of `Formatter` deliberately: every member there is total by
// falling back to NO_VALUE, and a link labelled `—` is worse than one showing
// a raw href.
export const hostOf = (href: string): string => {
    try {
        return new URL(href).host
    } catch {
        return href
    }
}

// Software StakeCore built and runs in public. This sits under a heading that
// claims the team ships software, so an entry here is a claim about something
// deployed and reachable — not a private tool, and not a prototype.
export const productsData: Product[] = [
    {
        id: 1,
        icon: <RiPulseLine size={28} />,
        title: 'FAsset Visualiser',
        body: "A live system view of Flare's FAsset protocol. Each FAsset — FXRP, FBTC, FDOGE — is drawn as a tunnel whose width is its total backing capacity, split between minted backing and free capacity, with the agents behind it coloured by status and every mint and redemption flowing through as it happens. A second deployment runs the same view against the Coston2 test network.",
        href: 'https://fasset.stakecore.org',
        alsoAt: [
            { label: 'Coston2 testnet', href: 'https://fasset-coston2.stakecore.org' },
        ],
    },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/utils/data/products.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc -p tsconfig.json --noEmit && pnpm lint`
Expected: no new errors. `pnpm lint` prints pre-existing warnings from the documented ratchet block in `biome.jsonc`; it must still exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/utils/data/products.tsx src/utils/data/products.test.ts
git commit -m "feat(about): add the product data module for published software"
```

---

### Task 2: The section component

**Files:**
- Create: `src/pages/about/whatWeBuild.tsx`
- Test: `src/pages/about/whatWeBuild.test.tsx`

**Interfaces:**
- Consumes: `hostOf`, `productsData` from `~/utils/data/products` (Task 1).
- Produces: default export `WhatWeBuild` — a React component taking no props.

Rendered markup contract, relied on by Task 3's styles and Task 5's e2e assertion:

- Root `<section className="about-section">` → `.container` → `.about-section-header` + `.about-grid`.
- Each product is an `<article className="about-tile about-tile--wide">`.
- The link row is `<p className="about-product-links">`, containing one
  `a.about-inline-link` (the canonical deployment, labelled with its hostname)
  followed by one `a.about-product-link-alt` per `alsoAt` entry.

- [ ] **Step 1: Write the failing test**

Create `src/pages/about/whatWeBuild.test.tsx`:

```tsx
// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import WhatWeBuild from './whatWeBuild'
import { hostOf, productsData } from '~/utils/data/products'

afterEach(cleanup)

describe('WhatWeBuild', () => {
  it('names every product under an h3', () => {
    render(<WhatWeBuild />)
    for (const { title } of productsData) {
      const heading = screen.getByRole('heading', { name: title })
      // The level is the assertion worth making: the section's own h2
      // precedes these, and the e2e axe scan of /about gates on
      // heading-order. getByRole already throws if the heading is absent.
      expect(heading.tagName).toBe('H3')
    }
  })

  it('labels each canonical link with its hostname', () => {
    render(<WhatWeBuild />)
    for (const { href } of productsData) {
      const link = screen.getByRole('link', { name: hostOf(href) })
      expect(link.getAttribute('href')).toBe(href)
    }
  })

  // "Coston2 testnet" is unique today and stops being unique the moment a
  // second product ships a testnet. The accessible name has to carry the
  // product so the link list never goes ambiguous.
  it('names the product in every secondary deployment link', () => {
    render(<WhatWeBuild />)
    for (const { title, alsoAt } of productsData) {
      for (const { label, href } of alsoAt ?? []) {
        const link = screen.getByRole('link', { name: `${title} on ${label}` })
        expect(link.getAttribute('href')).toBe(href)
      }
    }
  })

  // Hand-maintained and growing with every entry added: a target="_blank"
  // without rel="noopener noreferrer" is exactly the omission that survives
  // review indefinitely.
  it('opens every outbound link safely', () => {
    const { container } = render(<WhatWeBuild />)
    const links = [...container.querySelectorAll('a')]
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
      expect(link.getAttribute('href')?.startsWith('https://')).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/pages/about/whatWeBuild.test.tsx`
Expected: FAIL — `Failed to resolve import "./whatWeBuild"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/pages/about/whatWeBuild.tsx`:

```tsx
import { hostOf, productsData } from '~/utils/data/products'

// Software StakeCore built and runs in public. Rendered between the
// infrastructure section and the closing value props: the section above ends
// on what the cluster runs on, and "it runs our own software too" is the next
// beat.
//
// A sibling component rather than another module-scope const inside index.tsx
// so it can be tested without mounting ServerGlobe and InfraConstellation,
// both of which are canvas-backed and unavailable under happy-dom.
const WhatWeBuild = () => (
    <section className="about-section">
        <div className="container">
            <header className="about-section-header">
                <p className="about-section-header-sup">What we build</p>
                <h2 className="about-section-header-main">
                    The cluster runs{' '}
                    <span className="about-mark">our own software</span> too
                </h2>
            </header>

            {/* .about-grid, not .about-grid--two: a single entry in the
                two-column variant reads as a broken pair, while in the base
                three-column grid it reads as the first of a row. Revisit at
                two or four entries. */}
            <div className="about-grid">
                {productsData.map(({ id, icon, title, body, href, alsoAt }) => (
                    <article key={id} className="about-tile about-tile--wide">
                        <div className="about-tile-icon">{icon}</div>
                        <div>
                            <h3 className="about-tile-title">{title}</h3>
                            <p className="about-tile-body">{body}</p>
                            {/* The tile keeps the no-hover rule the other
                                about tiles carry — these links are the
                                affordance, not the card. */}
                            <p className="about-product-links">
                                <a
                                    className="about-inline-link"
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {hostOf(href)}
                                </a>
                                {alsoAt?.map(({ label, href: deploymentHref }) => (
                                    <a
                                        key={deploymentHref}
                                        className="about-product-link-alt"
                                        href={deploymentHref}
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
)

export default WhatWeBuild
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/pages/about/whatWeBuild.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc -p tsconfig.json --noEmit && pnpm lint`
Expected: no new errors, exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/pages/about/whatWeBuild.tsx src/pages/about/whatWeBuild.test.tsx
git commit -m "feat(about): add the What we build section component"
```

---

### Task 3: Wire the section into /about and style the link row

**Files:**
- Modify: `src/pages/about/index.tsx`
- Modify: `src/pages/about/about.scss` (append)

**Interfaces:**
- Consumes: default export `WhatWeBuild` from `./whatWeBuild` (Task 2).
- Produces: `/about` renders the section between `Stack` and `ValueProps`; the CSS classes `.about-product-links` and `a.about-product-link-alt` exist.

- [ ] **Step 1: Import and render the section**

In `src/pages/about/index.tsx`, add the import beside the existing sibling-component imports:

```tsx
import StackCarousel from './stackCarousel'
import WhatWeBuild from './whatWeBuild'
import './about.scss'
```

and render it between `<Stack />` and `<ValueProps />`:

```tsx
const About = () => {
    return (
        <>
            <Mission />
            <Audiences />
            <Stack />
            <WhatWeBuild />
            <ValueProps />
        </>
    )
}
```

- [ ] **Step 2: Extend the Mission paragraph**

In the same file, inside `Mission`, find:

```tsx
                    <span className="about-mark">
                        any network is a candidate
                    </span>
                    . From individual holders to protocols, custodians, and
```

and replace it with:

```tsx
                    <span className="about-mark">
                        any network is a candidate
                    </span>
                    . Some of what runs on it is our own: tools we build for our
                    own operations, published when they're useful to anyone
                    else. From individual holders to protocols, custodians, and
```

The new sentence sits after the infrastructure claim and before the audience
sentence, so the paragraph reads *what the cluster is → what runs on it →
who can delegate*. A raw apostrophe in JSX text is fine and has precedent in
this file (`can't`, `network's`).

- [ ] **Step 3: Append the styles**

Append to `src/pages/about/about.scss`:

```scss
// The outbound links on a product tile. Sized down from the body copy so the
// row reads as an appendix to the tile rather than a second paragraph.
.about-product-links {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 16px;
    margin: 12px 0 0;
    font-family: var(--font-sans);
    font-size: t.$text-sm;
}

// Secondary deployments sit below the canonical one in weight. Same
// element+class specificity trick as a.about-inline-link above: plain
// `.about-product-link-alt:hover` ties with the global
// `a:hover { color: inherit }` and would lose on load order.
a.about-product-link-alt {
    color: var(--main-color);
    font-size: t.$text-xs;
    text-decoration: underline;
    text-decoration-color: rgba(255, 255, 255, 0.18);
    text-underline-offset: 0.18em;
    transition: text-decoration-color 150ms ease-out;
}

a.about-product-link-alt:hover,
a.about-product-link-alt:focus-visible {
    color: var(--heading-color);
    text-decoration-color: var(--success);
}
```

- [ ] **Step 4: Run the full unit suite**

Run: `pnpm test`
Expected: PASS, with 9 more tests than before this plan started (5 from Task 1, 4 from Task 2).

- [ ] **Step 5: Typecheck, lint, and build**

Run: `npx tsc -p tsconfig.json --noEmit && pnpm lint && pnpm build`
Expected: all three exit 0. The build must succeed — a Sass error in the appended block only surfaces here.

- [ ] **Step 6: Look at it**

Use the project's `verify` skill to load `/#/about` and confirm: the section
appears between the infrastructure and *Why StakeCore* sections; the tile shows
the icon, title, body, then `fasset.stakecore.org` followed by the smaller
`Coston2 testnet`; the two links are visually distinguishable; and keyboard
focus on each shows a visible underline change.

- [ ] **Step 7: Commit**

```bash
git add src/pages/about/index.tsx src/pages/about/about.scss
git commit -m "feat(about): render What we build and style its link row"
```

---

### Task 4: Mirror the section on the agent-readable surface

**Files:**
- Modify: `public/about.md`
- Modify: `public/llms.txt`
- Modify: `public/AGENTS.md`

**Interfaces:**
- Consumes: the copy from Task 1's `productsData`.
- Produces: nothing consumed by later tasks.

Do **not** touch `public/sitemap.xml` or `public/sitemap.md`.

- [ ] **Step 1: Update `public/about.md` frontmatter**

Replace the `description` and `dateModified` lines:

```yaml
description: Who StakeCore serves, how its multi-provider node cluster is built, the software StakeCore builds and publishes, why it is not tied to any particular chain, and why delegating carries a risk profile close to simply holding the asset.
dateModified: 2026-08-20
```

- [ ] **Step 2: Extend the opening paragraph of `public/about.md`**

Find:

```
attestation or oracle daemons are the same shape of work, and any network is a
candidate. From individual holders to protocols, custodians, and treasuries,
```

Replace with:

```
attestation or oracle daemons are the same shape of work, and any network is a
candidate. Some of what runs on it is our own: tools we build for our own
operations, published when they're useful to anyone else. From individual
holders to protocols, custodians, and treasuries,
```

- [ ] **Step 3: Add the `## What we build` section to `public/about.md`**

Insert between the end of the `## Infrastructure` section (immediately after
the `| Alerting and triage | Telegram, Claude |` table row) and the
`## Why StakeCore` heading:

```markdown
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
```

- [ ] **Step 4: Add the `## Products` section to `public/llms.txt`**

Insert between the end of the `## Protocols` list and the `## Reference`
heading:

```markdown
## Products

Software StakeCore builds and runs in public. These are separate applications
rather than pages of this site: both are client-rendered, and neither has a
markdown mirror or a public API.

- [FAsset Visualiser](https://fasset.stakecore.org): Live system view of Flare's FAsset protocol — backing capacity, agent status, and mint and redemption flow as it happens.
- [FAsset Visualiser on Coston2](https://fasset-coston2.stakecore.org): The same view against the Coston2 test network.
```

- [ ] **Step 5: Add the deployments section to `public/AGENTS.md`**

Bump `dateModified` in its frontmatter to `2026-08-20`, then insert a new
section between the end of `## Public API` and the `## What agents cannot do
here` heading:

```markdown
## Other StakeCore deployments

StakeCore publishes software of its own on subdomains of `stakecore.org`. These
are separate applications, not pages of this site.

| Deployment | What it is |
| --- | --- |
| <https://fasset.stakecore.org> | FAsset Visualiser — a live system view of Flare's FAsset protocol |
| <https://fasset-coston2.stakecore.org> | The same visualiser against the Coston2 test network |

Neither has a markdown mirror, a public API, or a machine-readable schema, and
both are client-rendered — fetching either without executing JavaScript returns
a shell with nothing to read. They are listed here so an agent that finds the
URLs in [/llms.txt](/llms.txt) does not spend a request discovering that.
```

- [ ] **Step 6: Verify the edits landed and the sitemaps did not move**

```bash
grep -n "What we build" public/about.md
grep -n "^## Products" public/llms.txt
grep -n "Other StakeCore deployments" public/AGENTS.md
grep -c "fasset" public/sitemap.md public/sitemap.xml
git diff --stat public/
```

Expected: the first three each print one match; both `grep -c` print `0`;
`git diff --stat` lists exactly `public/about.md`, `public/llms.txt`, and
`public/AGENTS.md`.

- [ ] **Step 7: Confirm every edited mirror carries today's date**

```bash
grep -n "dateModified" public/about.md public/AGENTS.md
```

Expected: both read the current date. If the calendar has moved past
2026-08-20, correct them now — this is the failure mode no test catches.

- [ ] **Step 8: Commit**

```bash
git add public/about.md public/llms.txt public/AGENTS.md
git commit -m "docs(agents): mirror What we build on the agent-readable surface"
```

---

### Task 5: End-to-end assertion

**Files:**
- Modify: `e2e/routes.spec.ts` (append)

**Interfaces:**
- Consumes: the rendered `/about` page from Task 3.
- Produces: nothing.

- [ ] **Step 1: Write the test**

Append to `e2e/routes.spec.ts`:

```ts
test('/about links out to the FAsset Visualiser', async ({ page, consoleErrors }) => {
  await page.goto('/#/about')

  const link = page.getByRole('link', { name: 'fasset.stakecore.org' })
  await expect(link).toHaveAttribute('href', 'https://fasset.stakecore.org')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')

  const testnet = page.getByRole('link', { name: 'FAsset Visualiser on Coston2 testnet' })
  await expect(testnet).toHaveAttribute('href', 'https://fasset-coston2.stakecore.org')

  // Presence of the anchors only — never a request to either host. External
  // uptime must not be able to redden this repo's CI.
  expect(consoleErrors).toEqual([])
})
```

`test` and `expect` are already imported at the top of the file from
`./fixtures/backend`; do not add another import.

- [ ] **Step 2: Run it**

Run: `pnpm test:e2e routes.spec.ts`
Expected: PASS. Playwright runs `pnpm build` and serves `vite preview` over
HTTPS with a self-signed cert first, so the run takes a minute or two.

- [ ] **Step 3: Run the accessibility scan**

Run: `pnpm test:e2e a11y.spec.ts`
Expected: PASS. The `/about` scan already existed and now covers the new links;
`best-practice` findings are logged but never gate.

- [ ] **Step 4: Commit**

```bash
git add e2e/routes.spec.ts
git commit -m "test(e2e): assert /about links out to the FAsset Visualiser"
```

---

### Task 6: Full verification

**Files:** none.

- [ ] **Step 1: Run everything**

```bash
pnpm test && pnpm lint && npx tsc -p tsconfig.json --noEmit && pnpm build && pnpm test:e2e
```

Expected: all pass. `pnpm lint` prints the pre-existing ratchet warnings from
`biome.jsonc` and still exits 0; if the count of checked files jumps from ~160
into the hundreds, `biome.jsonc` has fallen back to its default config and the
run proves nothing.

- [ ] **Step 2: Confirm the untouched files really are untouched**

```bash
git diff --stat main...HEAD
```

Expected: no `public/sitemap.xml`, no `public/sitemap.md`, no
`src/utils/data/menu.ts`, no `src/components/sections/footer.tsx`, and no new
route in `src/route/router.tsx`.
