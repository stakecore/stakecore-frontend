# Display Type Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fourteen hand-written display pixel sizes and seven hand-built page headers with four named ramp mixins and one variant-driven `PageHeader` component.

**Architecture:** Display sizes become Sass *mixins* rather than variables, because a display size is a ramp across breakpoints and a variable holds one number — the reason the existing `$text-xl` / `$text-2xl` / `$text-hero` tokens went nearly unused. A single `PageHeader` component then owns the suptitle-plus-title block; its `variant` prop binds ramp, heading level, `max-width`, `line-height` and body size together, because all five were already perfectly correlated across the seven copies being replaced.

**Tech Stack:** React 19, TypeScript, Sass (SCSS), Vitest + happy-dom + @testing-library/react, Playwright.

**Spec:** [docs/superpowers/specs/2026-08-21-display-type-consistency-design.md](../specs/2026-08-21-display-type-consistency-design.md)

## Global Constraints

- Import alias `~/` resolves to `src/`. Component-specific SCSS is co-located and imported by the component that uses it.
- Tokens are consumed as `@use '<relative>/assets/css/tokens' as t;`.
- Unit tests are co-located as `*.test.tsx` inside `src/`, declare `// @vitest-environment happy-dom` on the first line, and **must call `afterEach(cleanup)` themselves** — there is no global setup file, so RTL auto-cleanup does not run.
- `@testing-library/jest-dom` is **not installed**. Use plain Vitest matchers only: `toBeTruthy()`, `toBeNull()`, `toBe()`, `toContain()`, `toHaveLength()`.
- `tsconfig.json` runs `strict: false` with `strictNullChecks: true`. `pnpm lint` does **not** typecheck — run `npx tsc -p tsconfig.json --noEmit` separately.
- Never run `pnpm lint:fix --unsafe`.
- The e2e fixture [e2e/fixtures/routes.ts](../../../e2e/fixtures/routes.ts) pins a named **level-1** heading on all eight routes. Heading text and heading level must not change for: `/` → `StakeCore`, `/about` → `Your stake, our engine`, `/news` → `What's new`, `/contact` → `Get in touch`, `/flare/fsp` → `Flare Systems Protocol`, `/songbird/fsp` → `Songbird Systems Protocol`, `/flare/validator` → `Flare Validator`, `/avalanche/validator` → `Avalanche Validator`.
- Ramp values, fixed by the spec and not to be adjusted while implementing:
  - `display-page` — 36px / md 56px / lg 72px
  - `display-section` — 28px / md 40px
  - `display-hero` — 32px / md 48px / lg 60px
  - `display-stat` — 34px / md 50px / lg 60px
- Spacing values, fixed by the spec: `.page-header` margin-bottom **32px**; `.page-header-sup` margin-bottom **12px**; `.page-header-main` margin **0**; `.page-header-body` margin-top **24px**.
- Variant bindings, fixed by the spec: `page` → `h1`, 880px, line-height 1.05, body `$text-lg`. `section` → `h2`, 720px, line-height 1.1, body `$text-base`.

---

### Task 1: Ramp mixins, proven by the hero

Establishes the four mixins and immediately gives two of them a consumer, so the task has a testable deliverable. Sass mixins emit nothing until used, so adding them alone would be unverifiable. The hero is the right first consumer because its change is **pure renaming** — every pixel value stays identical, so any visual difference is a bug rather than an intended effect.

**Files:**
- Modify: `src/assets/css/_tokens.scss` (append after the `$weight-*` block at end of file)
- Modify: `src/components/sections/hero.scss:58-76` (`.hero-wordmark`), `:115-131` (`.hero-stat-value`)

**Interfaces:**
- Consumes: nothing.
- Produces: four Sass mixins on the `tokens` module — `display-page`, `display-section`, `display-hero`, `display-stat`. All take no arguments and emit only `font-size` declarations plus nested `@media` blocks. Consumed as `@include t.display-page;`.

- [ ] **Step 1: Capture the baseline CSS, before touching anything**

This task must not change a single pixel, so record what the build emits now:

```bash
cd /workspaces/stakecore-frontend
pnpm build >/dev/null 2>&1
grep -o 'font-size:[0-9]*px' dist/assets/*.css | sed 's/.*://' | sort -n | uniq -c > /tmp/sizes-before.txt
wc -l < /tmp/sizes-before.txt
```

Expected: a non-zero line count. Do not proceed without this file — it is the
only evidence that the refactor was value-preserving.

- [ ] **Step 2: Append the four mixins to `_tokens.scss`**

Add at the end of the file, after the `$weight-bold: 700;` line:

```scss

// ---- Display ramps ----
//
// A display title's size is a RAMP across breakpoints, not a scalar — which is
// why the $text-* scale above went unused at the display end while fourteen
// distinct raw px values accumulated in component files. A mixin can carry the
// whole ramp, so a title states its ROLE and never its pixels.

@mixin display-page {
    font-size: 36px;
    @include up(md) { font-size: 56px; }
    @include up(lg) { font-size: 72px; }
}

@mixin display-section {
    font-size: 28px;
    @include up(md) { font-size: 40px; }
}

// The home wordmark only. Deliberately distinct from display-page: it is the
// one title with no page above it in the hierarchy.
@mixin display-hero {
    font-size: 32px;
    @include up(md) { font-size: 48px; }
    @include up(lg) { font-size: 60px; }
}

// Hero statistics. Sized alongside display-hero and converging with it at lg,
// but kept separate on purpose: a stat readout is not a title, and merging the
// two would make a future hero-title change silently resize every figure.
@mixin display-stat {
    font-size: 34px;
    @include up(md) { font-size: 50px; }
    @include up(lg) { font-size: 60px; }
}
```

- [ ] **Step 3: Point `.hero-wordmark` at `display-hero`**

In `src/components/sections/hero.scss`, replace the three size declarations inside `.hero-wordmark` — `font-size: 32px;`, `@include t.up(md) { font-size: 48px; }`, `@include t.up(lg) { font-size: 60px; }` — with a single `@include t.display-hero;`. The rule becomes:

```scss
.hero-wordmark {
    // Inter Extrabold matches the protocol page titles + hero stat
    // values — same display treatment used across the rest of the site.
    font-family: t.$font-display;
    font-weight: t.$weight-extrabold;
    letter-spacing: -0.02em;
    line-height: 1.05;
    margin: 0;
    color: var(--heading-color);
    max-width: 100%;
    overflow-wrap: break-word;

    @include t.display-hero;
}
```

- [ ] **Step 4: Point `.hero-stat-value` at `display-stat`**

Same treatment — remove `font-size: 34px;` and the `md`/`lg` overrides, add `@include t.display-stat;`:

```scss
.hero-stat-value {
    font-family: t.$font-display;
    font-weight: t.$weight-extrabold;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    line-height: 1;
    color: var(--heading-color);
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';

    @include t.display-stat;
}
```

- [ ] **Step 5: Rebuild and prove nothing moved**

```bash
pnpm build >/dev/null 2>&1
grep -o 'font-size:[0-9]*px' dist/assets/*.css | sed 's/.*://' | sort -n | uniq -c > /tmp/sizes-after.txt
diff /tmp/sizes-before.txt /tmp/sizes-after.txt && echo "IDENTICAL — refactor was value-preserving"
```

Expected: **no diff output**, then `IDENTICAL`. Any difference means a ramp value was mistyped — compare against the Global Constraints list and fix before committing.

- [ ] **Step 6: Commit**

```bash
git add src/assets/css/_tokens.scss src/components/sections/hero.scss
git commit -m "refactor(tokens): express display sizes as ramp mixins

A display size is a ramp across breakpoints and a Sass variable holds one
number, which is why \$text-xl/2xl/hero sat at one usage each while fourteen
raw px values accumulated. Adds display-page/section/hero/stat and moves the
hero wordmark and stat value onto the latter two. No pixel changes."
```

---

### Task 2: The `PageHeader` component

**Files:**
- Create: `src/components/ui/pageHeader.tsx`
- Create: `src/components/ui/pageHeader.scss`
- Test: `src/components/ui/pageHeader.test.tsx`

**Interfaces:**
- Consumes: `display-page` and `display-section` from Task 1.
- Produces: default export `PageHeader` from `~/components/ui/pageHeader`, with props `{ variant?: 'page' | 'section'; supTitle?: string; title: ReactNode; align?: 'start' | 'center'; aside?: ReactNode; children?: ReactNode }`. Emits `<header class="page-header [page-header--section] [page-header--center] [page-header--with-aside]">` containing `div.page-header-text` > optional `p.page-header-sup`, `h1|h2.page-header-main`, optional `p.page-header-body`; then optional `div.page-header-aside`.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/pageHeader.test.tsx`:

```tsx
// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import PageHeader from './pageHeader'

afterEach(cleanup)

describe('PageHeader', () => {
  it('renders a level-1 heading for the page variant', () => {
    render(<PageHeader variant="page" supTitle="About" title="Your stake, our engine" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Your stake, our engine' })).toBeTruthy()
  })

  it('renders a level-2 heading for the section variant', () => {
    render(<PageHeader variant="section" supTitle="Who we serve" title="From personal wallets" />)
    expect(screen.getByRole('heading', { level: 2, name: 'From personal wallets' })).toBeTruthy()
  })

  it('defaults to the page variant', () => {
    render(<PageHeader title="Get in touch" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Get in touch' })).toBeTruthy()
  })

  it('renders the suptitle when supplied', () => {
    const { container } = render(<PageHeader supTitle="News" title="What's new" />)
    expect(container.querySelector('.page-header-sup')?.textContent).toBe('News')
  })

  it('omits the suptitle when the prop is absent', () => {
    const { container } = render(<PageHeader variant="section" title="Earn Yield" />)
    expect(container.querySelector('.page-header-sup')).toBeNull()
  })

  it('renders a ReactNode title with its nested markup intact', () => {
    render(
      <PageHeader
        variant="section"
        title={<>Small, robust, and <span className="about-mark">decentralized</span></>}
      />,
    )
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.querySelector('.about-mark')?.textContent).toBe('decentralized')
  })

  it('renders the body only when children are supplied', () => {
    const { container: without } = render(<PageHeader title="Bare" />)
    expect(without.querySelector('.page-header-body')).toBeNull()
    cleanup()
    const { container: with_ } = render(<PageHeader title="Bodied">Some copy</PageHeader>)
    expect(with_.querySelector('.page-header-body')?.textContent).toBe('Some copy')
  })

  it('renders the aside only when supplied', () => {
    const { container: without } = render(<PageHeader title="Bare" />)
    expect(without.querySelector('.page-header-aside')).toBeNull()
    cleanup()
    const { container: with_ } = render(
      <PageHeader title="Flare Validator" aside={<button type="button">Pick</button>} />,
    )
    expect(with_.querySelector('.page-header-aside')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pick' })).toBeTruthy()
  })

  it('applies the section modifier class only for the section variant', () => {
    const { container: page } = render(<PageHeader variant="page" title="A" />)
    expect(page.querySelector('.page-header--section')).toBeNull()
    cleanup()
    const { container: section } = render(<PageHeader variant="section" title="B" />)
    expect(section.querySelector('.page-header--section')).toBeTruthy()
  })

  it('applies the center modifier class only when align is center', () => {
    const { container: start } = render(<PageHeader variant="section" title="A" />)
    expect(start.querySelector('.page-header--center')).toBeNull()
    cleanup()
    const { container: centered } = render(
      <PageHeader variant="section" align="center" title="Earn Yield" />,
    )
    expect(centered.querySelector('.page-header--center')).toBeTruthy()
  })

  it('applies the with-aside modifier class only when an aside is supplied', () => {
    const { container: without } = render(<PageHeader title="A" />)
    expect(without.querySelector('.page-header--with-aside')).toBeNull()
    cleanup()
    const { container: with_ } = render(<PageHeader title="B" aside={<span>x</span>} />)
    expect(with_.querySelector('.page-header--with-aside')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- src/components/ui/pageHeader.test.tsx`
Expected: FAIL — `Failed to resolve import "./pageHeader"`.

- [ ] **Step 3: Write the component**

Create `src/components/ui/pageHeader.tsx`:

```tsx
import type { ReactNode } from "react"
import './pageHeader.scss'

// The site's title standard, in one place. Before this component the same
// suptitle + title block was hand-built in seven files, and the files said so
// themselves — news.scss carried the comment "Matches .about-header-main and
// .contact-header-main exactly". A comment asserting that is a shared
// component with the extraction step missing.
//
// `variant` is one decision that fixes five things at once: display ramp,
// heading level, max-width, line-height and body size. Across all seven copies
// those five were already perfectly correlated, so binding them loses no
// expressiveness — and it means a call site cannot pick a size that
// contradicts its place in the document outline, which keeps the heading-order
// a11y rule satisfied by construction.
const PageHeader = ({ variant = 'page', supTitle, title, align = 'start', aside, children }: {
  variant?: 'page' | 'section'
  supTitle?: string
  // Renderable rather than a string: /about wraps words in
  // <span className="about-mark">, and a string prop would push that call site
  // back to hand-built markup — reopening the drift this component closes.
  title: ReactNode
  align?: 'start' | 'center'
  // Page-level controls, rendered below the title stack. Currently the
  // multi-validator dropdown on the two validator pages.
  aside?: ReactNode
  // Body copy beneath the title, rendered into a <p> because both current
  // consumers are a single paragraph of inline content. Sized by variant.
  children?: ReactNode
}) => {
  const Heading = variant === 'page' ? 'h1' : 'h2'
  const className = [
    'page-header',
    variant === 'section' && 'page-header--section',
    align === 'center' && 'page-header--center',
    aside && 'page-header--with-aside',
  ].filter(Boolean).join(' ')

  return (
    <header className={className}>
      <div className="page-header-text">
        {supTitle && <p className="page-header-sup">{supTitle}</p>}
        <Heading className="page-header-main">{title}</Heading>
        {children && <p className="page-header-body">{children}</p>}
      </div>
      {aside && <div className="page-header-aside">{aside}</div>}
    </header>
  )
}

export default PageHeader
```

- [ ] **Step 4: Write the stylesheet**

Create `src/components/ui/pageHeader.scss`:

```scss
@use '../../assets/css/tokens' as t;

// Styles for the site's one title block. See pageHeader.tsx for why variant
// binds five properties together, and
// docs/superpowers/specs/2026-08-21-display-type-consistency-design.md for the
// measurements behind each value here — every one is the majority of the seven
// hand-built copies this replaces.

.page-header {
    max-width: 880px;
    margin-bottom: 32px;
}

.page-header--section {
    max-width: 720px;
}

.page-header--center {
    margin-left: auto;
    margin-right: auto;
    text-align: center;
}

// Column layout only when there is an aside to place. align-items keeps the
// aside at its natural width rather than stretching it to the text column.
.page-header--with-aside {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
}

// Groups the suptitle + title + body so the aside can sit outside them.
.page-header-text {
    min-width: 0;
}

.page-header-sup {
    font-family: var(--font-sans);
    font-size: t.$text-xs;
    font-weight: t.$weight-medium;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--main-color);
    margin: 0 0 12px;
}

.page-header-main {
    font-family: t.$font-display;
    font-weight: t.$weight-extrabold;
    letter-spacing: -0.02em;
    line-height: 1.05;
    color: var(--heading-color);
    margin: 0;

    @include t.display-page;
}

.page-header--section .page-header-main {
    line-height: 1.1;

    @include t.display-section;
}

.page-header-body {
    font-family: var(--font-sans);
    font-size: t.$text-lg;
    line-height: 1.5;
    color: var(--main-color);
    margin: 24px 0 0;
}

.page-header--section .page-header-body {
    font-size: t.$text-base;
}

.page-header-aside {
    flex: 0 0 auto;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test -- src/components/ui/pageHeader.test.tsx`
Expected: PASS, 11 tests.

- [ ] **Step 6: Typecheck and lint**

```bash
npx tsc -p tsconfig.json --noEmit && pnpm lint
```
Expected: no errors from `pageHeader.tsx` or `pageHeader.test.tsx`. Pre-existing warnings elsewhere are the documented ratchet backlog and are expected.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/pageHeader.tsx src/components/ui/pageHeader.scss src/components/ui/pageHeader.test.tsx
git commit -m "feat(ui): add PageHeader, the site's one title block

Seven files hand-built the same suptitle + title markup; two of them carried
comments asserting they matched the others exactly. variant binds ramp,
heading level, max-width, line-height and body size together because all five
were already correlated across every copy."
```

---

### Task 3: Migrate `/about` — four headers

The largest call site: one page header with a body, and three section headers, one of which carries nested markup in its title.

**Files:**
- Modify: `src/pages/about/index.tsx` (four `<header>` blocks)
- Modify: `src/pages/about/about.scss` (delete the seven header rule blocks listed in Step 4 — by selector, not by line number, since earlier deletions shift later lines. `.about-mark`, currently at line 84, must survive.)

**Interfaces:**
- Consumes: `PageHeader` from Task 2.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Import `PageHeader` in `src/pages/about/index.tsx`**

Add to the existing import block: `import PageHeader from '~/components/ui/pageHeader'`

- [ ] **Step 2: Replace the `Mission` page header**

Replace the whole `<header className="about-header">…</header>` block with:

```tsx
            <PageHeader supTitle="About" title="Your stake, our engine">
                StakeCore runs blockchain node infrastructure — a redundant
                cluster we build, orchestrate, and monitor ourselves. Validator
                duty and core protocol signing on Flare, Avalanche, and Songbird
                are what it carries today, and we are actively taking it onto
                more networks. RPC and archive nodes, indexers, relayers, and
                attestation services are the same shape of work, so{' '}
                <span className="about-mark">
                    any network is a candidate
                </span>
                . From individual holders to protocols, custodians, and
                treasuries, anyone can delegate or stake their native tokens with
                us, earning rewards with a{' '}
                <span className="about-mark">
                    risk profile close to that of simply holding the asset
                </span>
                .
            </PageHeader>
```

The heading text `Your stake, our engine` and its `h1` level are pinned by the e2e route fixture — do not reword or change the level.

- [ ] **Step 3: Replace the three section headers**

In `Audiences`:

```tsx
            <PageHeader
                variant="section"
                supTitle="Who we serve"
                title="From personal wallets to institutional treasuries"
            />
```

In `Stack`:

```tsx
            <PageHeader
                variant="section"
                supTitle="Infrastructure"
                title={<>Small, robust, and{' '}<span className="about-mark">decentralized</span></>}
            />
```

In `ValueProps`:

```tsx
            <PageHeader
                variant="section"
                supTitle="Why StakeCore"
                title="Four things worth knowing"
            />
```

- [ ] **Step 4: Delete the superseded rules from `about.scss`**

Delete these seven rule blocks entirely: `.about-header`, `.about-header-sup`, `.about-header-main`, `.about-header-body`, `.about-section-header`, `.about-section-header-sup`, `.about-section-header-main`.

**Keep `.about-mark`** — it is an inline emphasis accent used in both headings and body copy, unrelated to the header system.

Verify nothing else references the deleted classes:

```bash
grep -rn 'about-header\|about-section-header' src/ && echo "STILL REFERENCED — fix before continuing" || echo "clean"
```
Expected: `clean`.

- [ ] **Step 5: Run the unit tests and typecheck**

```bash
pnpm test && npx tsc -p tsconfig.json --noEmit
```
Expected: all pass.

- [ ] **Step 6: Verify the route renders with its pinned heading**

```bash
pnpm test:e2e -- e2e/routes.spec.ts
```
Expected: PASS, including `/about` → `Your stake, our engine` at level 1.

- [ ] **Step 7: Visual check**

Use the project's `verify` skill to load `/#/about` at 375px, 768px and 1280px. Confirm: the suptitle still reads `About` in uppercase grey above the title; the title ramps 36/56/72; the body paragraph sits 24px below the title with both `.about-mark` underlines intact; the three section headers ramp 28/40.

Expected deltas versus before: the page header's bottom spacing goes 16px → 32px and its suptitle gap 16px → 12px. Nothing else moves.

- [ ] **Step 8: Commit**

```bash
git add src/pages/about/index.tsx src/pages/about/about.scss
git commit -m "refactor(about): move its four headers onto PageHeader"
```

---

### Task 4: Migrate `/contact` and `/news`

Two small page headers, grouped because each is a single two-line replacement and neither has a body or an aside.

**Files:**
- Modify: `src/pages/contact.tsx:9-12`
- Modify: `src/components/sections/contact/contact.scss` (delete `.contact-header`, `.contact-header-sup`, `.contact-header-main`)
- Modify: `src/pages/news/index.tsx:9-12`
- Modify: `src/pages/news/news.scss` (delete `.news-header`, `.news-header-sup`, `.news-header-main`)

**Interfaces:**
- Consumes: `PageHeader` from Task 2.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the contact header**

In `src/pages/contact.tsx`, add `import PageHeader from '~/components/ui/pageHeader'` and replace:

```tsx
        <header className="contact-header">
          <p className="contact-header-sup">Contact</p>
          <h1 className="contact-header-main">Get in touch</h1>
        </header>
```

with:

```tsx
        <PageHeader supTitle="Contact" title="Get in touch" />
```

- [ ] **Step 2: Replace the news header**

In `src/pages/news/index.tsx`, add `import PageHeader from '~/components/ui/pageHeader'` and replace:

```tsx
            <header className="news-header">
                <p className="news-header-sup">News</p>
                <h1 className="news-header-main">What's new</h1>
            </header>
```

with:

```tsx
            <PageHeader supTitle="News" title="What's new" />
```

- [ ] **Step 3: Delete the superseded rules**

Delete `.contact-header`, `.contact-header-sup`, `.contact-header-main` from `contact.scss`, and `.news-header`, `.news-header-sup`, `.news-header-main` from `news.scss`.

```bash
grep -rn 'contact-header\|news-header' src/ && echo "STILL REFERENCED" || echo "clean"
```
Expected: `clean`.

- [ ] **Step 4: Run tests, typecheck and the route spec**

```bash
pnpm test && npx tsc -p tsconfig.json --noEmit && pnpm test:e2e -- e2e/routes.spec.ts
```
Expected: all pass, including `/contact` → `Get in touch` and `/news` → `What's new` at level 1.

- [ ] **Step 5: Visual check**

Load `/#/contact` and `/#/news` at 375px and 1280px. Expected deltas: both gain `max-width` 720px → 880px, so their titles wrap later on wide screens. News additionally loses 16px of bottom spacing (48 → 32) and 4px of suptitle gap (16 → 12). Confirm the news feed still starts clear of the header.

- [ ] **Step 6: Commit**

```bash
git add src/pages/contact.tsx src/components/sections/contact/contact.scss src/pages/news/index.tsx src/pages/news/news.scss
git commit -m "refactor(contact,news): move their page headers onto PageHeader"
```

---

### Task 5: Migrate the two home-page section headers

**Files:**
- Modify: `src/components/sections/proposal.tsx:9-11`
- Modify: `src/components/sections/proposal.scss` (delete `.pricing-header-section`, `.pricing-header-sup`, `.pricing-header-main`)
- Modify: `src/components/sections/portfolio.tsx:22-28`
- Modify: `src/components/sections/portfolio.scss` (delete `.protocols-header`, `.protocols-title`, `.protocols-blurb`)

**Interfaces:**
- Consumes: `PageHeader` from Task 2.
- Produces: nothing consumed by later tasks.

**Careful:** `proposal.scss` contains **two** similarly named things. `.pricing-header-section` is the section header being replaced; `.pricing-header` is the inner header of an individual pricing `Card` and must be left alone. Delete by exact selector, not by prefix match.

- [ ] **Step 1: Replace the proposal header**

In `src/components/sections/proposal.tsx`, add `import PageHeader from '~/components/ui/pageHeader'` and replace:

```tsx
                <header className="pricing-header-section">
                    <h2 className="pricing-header-main">Earn Yield</h2>
                </header>
```

with:

```tsx
                <PageHeader variant="section" align="center" title="Earn Yield" />
```

- [ ] **Step 2: Replace the portfolio header**

In `src/components/sections/portfolio.tsx`, add `import PageHeader from '~/components/ui/pageHeader'` and replace:

```tsx
                <header className="protocols-header">
                    <h2 className="protocols-title">Protocols</h2>
                    <p className="protocols-blurb">
                        Validator and protocol-signing services on Flare, Avalanche, and
                        the Songbird canary network. Each protocol specifies its own rules
                        and reward structure.
                    </p>
                </header>
```

with:

```tsx
                <PageHeader variant="section" title="Protocols">
                    Validator and protocol-signing services on Flare, Avalanche, and
                    the Songbird canary network. Each protocol specifies its own rules
                    and reward structure.
                </PageHeader>
```

- [ ] **Step 3: Delete the superseded rules**

From `proposal.scss` delete only `.pricing-header-section`, `.pricing-header-sup` and `.pricing-header-main`. From `portfolio.scss` delete `.protocols-header`, `.protocols-title` and `.protocols-blurb`.

```bash
grep -rn 'pricing-header-section\|pricing-header-sup\|pricing-header-main\|protocols-header\|protocols-title\|protocols-blurb' src/ && echo "STILL REFERENCED" || echo "clean"
grep -rn 'pricing-header' src/components/sections/proposal.scss || echo "WARNING: the Card's .pricing-header was deleted too — restore it"
```
Expected: `clean`, then the `.pricing-header` Card rule still listed.

- [ ] **Step 4: Run tests, typecheck and the route spec**

```bash
pnpm test && npx tsc -p tsconfig.json --noEmit && pnpm test:e2e -- e2e/routes.spec.ts
```
Expected: all pass. `/` → `StakeCore` is the hero `h1` and is unaffected by these two `h2`s.

- [ ] **Step 5: Visual check**

Load `/` at 375px, 768px and 1280px. Expected deltas: the "Protocols" heading shrinks from 56px to 40px at `lg` and 44px to 40px at `md` — **this is the largest intended visual change in the whole effort**, decided deliberately. Its blurb stays at `$text-base` (16px). The centred "Earn Yield" heading is unchanged. Confirm "Protocols" still reads as a section heading against the tiles below it and has not become visually weaker than the tile titles.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/proposal.tsx src/components/sections/proposal.scss src/components/sections/portfolio.tsx src/components/sections/portfolio.scss
git commit -m "refactor(home): move both section headers onto PageHeader

The Protocols heading snaps from its own 32/44/56 ramp to the shared section
ramp, shrinking 56px to 40px at lg — the one deliberate visual change here."
```

---

### Task 6: Migrate the four protocol pages, and clear the specificity trap

The riskiest task: the protocol title is sized by **element selectors**, not by its class, and those selectors outrank the component's.

**Files:**
- Modify: `src/pages/protocols/fsp/page.tsx:44`
- Modify: `src/pages/protocols/validator/page.tsx:101-105`
- Delete: `src/pages/protocols/title.tsx`
- Modify: `src/pages/protocols/protocols.scss` — delete `.project-title`, `.project-title-text`, `.project-title-aside`, `.project-title-sup`, `.project-title-main`, and the three `h1 { font-size: … }` rules at lines 13, 154 and 167

**Interfaces:**
- Consumes: `PageHeader` from Task 2.
- Produces: nothing. `ProjectTitle` ceases to exist; its `rightSlot` prop maps to `PageHeader`'s `aside`, and its `suptitle` prop maps to `supTitle`.

- [ ] **Step 1: Replace the FSP page's title**

In `src/pages/protocols/fsp/page.tsx`, remove `import ProjectTitle from "../title"`, add `import PageHeader from '~/components/ui/pageHeader'`, and replace:

```tsx
      <ProjectTitle title={config.title} suptitle={config.suptitle} />
```

with:

```tsx
      <div className="container">
        <PageHeader supTitle={config.suptitle} title={config.title} />
      </div>
```

The wrapper is required because `PageHeader` does not render `.container` itself. `ProjectTitle` did, as a *sibling* of the page's `<div className="container pt-30">` below it — so this is a move, not a new nesting level.

- [ ] **Step 2: Replace the validator page's title**

In `src/pages/protocols/validator/page.tsx`, remove `import ProjectTitle from "../title"`, add `import PageHeader from '~/components/ui/pageHeader'`, and replace:

```tsx
      <ProjectTitle
        title={title}
        suptitle={suptitle}
        rightSlot={picker}
      />
```

with:

```tsx
      <div className="container">
        <PageHeader supTitle={suptitle} title={title} aside={picker} />
      </div>
```

- [ ] **Step 3: Delete `title.tsx`**

```bash
git rm src/pages/protocols/title.tsx
grep -rn 'ProjectTitle\|from "../title"' src/ && echo "STILL REFERENCED" || echo "clean"
```
Expected: `clean`.

- [ ] **Step 4: Clear the specificity trap in `protocols.scss`**

Delete the five `.project-title*` rule blocks, **and** the three `h1` element rules:

- Line 13, inside `.single-project-page-design`: `h1 { font-size: t.$text-2xl; }`
- Line 154, inside the `@include t.up(md)` block: `h1 { font-size: 48px; }`
- Line 167, inside the `@include t.up(lg)` block: `h1 { font-size: t.$text-hero; }`

These are the whole point of this task. `.single-project-page-design h1` has specificity 0,1,1 and **outranks** `.page-header-main` at 0,1,0. Left in place, the component's ramp never applies and the migration silently changes nothing while appearing to succeed.

Verify they are gone:

```bash
grep -n 'h1' src/pages/protocols/protocols.scss && echo "REVIEW: an h1 rule remains" || echo "clean"
grep -rn 'project-title' src/ && echo "STILL REFERENCED" || echo "clean"
```

- [ ] **Step 5: Confirm the ramp actually took effect in the built CSS**

```bash
pnpm build >/dev/null 2>&1
grep -c 'single-project-page-design h1' dist/assets/*.css
```
Expected: `0`. A non-zero count means an element rule survived and is still overriding the component.

- [ ] **Step 6: Run tests, typecheck and the full route spec**

```bash
pnpm test && npx tsc -p tsconfig.json --noEmit && pnpm test:e2e -- e2e/routes.spec.ts
```
Expected: all pass, including all four protocol routes at level 1 — `Flare Systems Protocol`, `Songbird Systems Protocol`, `Flare Validator`, `Avalanche Validator`.

- [ ] **Step 7: Visual check, including the aside**

Load `/#/flare/fsp` and `/#/flare/validator` at 375px, 768px and 1280px. Expected deltas: the title ramp changes from 40/48/64 to 36/56/72 — slightly smaller on mobile, notably larger at `lg`. On the validator route, confirm the multi-validator dropdown still sits **below** the title at its natural width and has not stretched to the text column or jumped beside the title.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(protocols): move ProjectTitle onto PageHeader

Also deletes the three .single-project-page-design h1 element rules that
sized the title. At 0,1,1 they outrank .page-header-main at 0,1,0, so leaving
them would have silently overridden the shared ramp while the migration
looked successful."
```

---

### Task 7: Sweep and document

**Files:**
- Modify: `CLAUDE.md` (the `### Styling` section)
- Possibly modify: `src/assets/css/about.scss`, `news.scss`, `contact.scss`, `proposal.scss`, `portfolio.scss`, `protocols.scss` — remove any `@use '…tokens' as t;` left unused after the deletions

**Interfaces:**
- Consumes: everything above.
- Produces: nothing.

- [ ] **Step 1: Confirm every hand-built header is gone**

```bash
cd /workspaces/stakecore-frontend
grep -rn 'header-sup\|header-main\|-title-sup\|-title-main' src/ && echo "REVIEW EACH HIT" || echo "clean"
```
Expected: `clean`.

- [ ] **Step 2: Confirm the display ramps are the only source of title sizes**

```bash
grep -rhoE 'font-size:\s*[0-9]+px' src --include=*.scss --include=*.css | grep -oE '[0-9]+' | sort -n | uniq -c | awk '$2>=24'
```
Expected: only sizes from `style.css`'s bare `h1`–`h6` element rules (58, 30, 24) and any component-local sizes outside the title system. **None** of 32, 34, 36, 40, 44, 48, 50, 56, 60 or 72 should remain in the seven migrated files. The `style.css` element rules are explicitly out of scope per the spec.

- [ ] **Step 3: Remove now-unused token imports**

For each of the six stylesheets edited in Tasks 3-6, check whether it still uses `t.`:

```bash
for f in src/pages/about/about.scss src/pages/news/news.scss src/components/sections/contact/contact.scss src/components/sections/proposal.scss src/components/sections/portfolio.scss src/pages/protocols/protocols.scss; do
  if grep -q "@use.*tokens" "$f" && ! grep -q 't\.\$\|t\.up(\|t\.down(\|t\.display-' "$f"; then echo "UNUSED IMPORT: $f"; fi
done
```

Delete the `@use` line from any file listed. If none are listed, skip this step.

- [ ] **Step 4: Document the system in `CLAUDE.md`**

Append to the `### Styling` section, after the paragraph ending "consumed via `@use '...tokens' as t;`":

```markdown
Display type is different from body type and does not live in the `$text-*`
scale. A title's size is a **ramp** across breakpoints, and a Sass variable
holds one number — which is why `$text-xl` / `$text-2xl` / `$text-hero` sat at
one usage each while fourteen distinct raw pixel sizes accumulated in component
files. Four mixins in `_tokens.scss` carry the whole ramp instead:
`display-page` (36/56/72), `display-section` (28/40), `display-hero` (32/48/60,
the home wordmark only) and `display-stat` (34/50/60, hero figures — kept
separate from `display-hero` so a title change cannot silently resize every
statistic beside it).

Titles themselves go through [pageHeader.tsx](src/components/ui/pageHeader.tsx),
which is the only place the suptitle-plus-title block exists. Its `variant`
prop binds five things that were already perfectly correlated across the seven
hand-built copies it replaced: display ramp, heading level (`page`→`h1`,
`section`→`h2`), `max-width`, `line-height` and body size. They are not
separately settable on purpose — binding the level to the variant is what keeps
`heading-order` correct by construction, and the e2e fixture in
[routes.ts](e2e/fixtures/routes.ts) pins a named level-1 heading on all eight
routes. **Do not size a title in a page stylesheet.** If a new title does not
fit `page` or `section`, add a variant to the component rather than a
`font-size` to the page — a per-page size is exactly how the previous drift
started, and two of those files ended up carrying comments asserting they
matched the others exactly.
```

- [ ] **Step 5: Full verification sweep**

```bash
npx tsc -p tsconfig.json --noEmit && pnpm lint && pnpm test && pnpm build && pnpm test:e2e
```
Expected: typecheck clean; lint reports only the pre-existing warn-level ratchet backlog and exits 0; all unit tests pass; build succeeds; **all** e2e specs pass, including `a11y.spec.ts` — the accessibility scan is the real gate on heading structure across all eight routes plus the wallet picker.

If `a11y.spec.ts` reports a new `heading-order` finding, it is logged rather than gated (it is a `best-practice` rule), but investigate it anyway: it would mean a variant was chosen that contradicts a page's outline.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "docs(claude): record the display ramps and the PageHeader rule"
```

---

## Verification summary

| Gate | Command | Covers |
| --- | --- | --- |
| Types | `npx tsc -p tsconfig.json --noEmit` | Prop shapes across all seven call sites |
| Lint | `pnpm lint` | Exits 0; existing warn backlog expected |
| Unit | `pnpm test` | The 11 `PageHeader` tests plus 329 existing |
| Build | `pnpm build` | Sass compiles; ramps emit |
| E2E | `pnpm test:e2e` | Named level-1 heading on all 8 routes; axe scan of 8 page states |
| Visual | `verify` skill | The five affected pages at 375 / 768 / 1280px |

## Intended visual changes

Everything else must be pixel-identical. If something moves that is not on this list, it is a bug.

| Where | Change |
| --- | --- |
| Home "Protocols" heading | 32/44/56 → 28/40 — shrinks 16px at `lg`. The largest change. |
| Protocol page titles ×4 | 40/48/64 → 36/56/72 — smaller at mobile, larger at `lg` |
| `/contact`, `/news` titles | `max-width` 720px → 880px, so they wrap later |
| `/news` header | bottom spacing 48px → 32px, suptitle gap 16px → 12px, title gap 16px → 0 |
| `/about` page header | bottom spacing 16px → 32px, suptitle gap 16px → 12px |
| Hero wordmark and stats | **none** — Task 1 is a pure rename |
