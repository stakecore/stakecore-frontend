# One display type scale, and a PageHeader that enforces it

Date: 2026-08-21

## Goal

Stop page and section titles drifting. Today the same visual element is built
six times in six files, and title sizes are written as raw pixels in fourteen
distinct values. Replace both with four named ramps — page, section, hero,
stat — and one `PageHeader` component that every title goes through.

The symptom this fixes is visible in the commit log: `fix(news): give the page
a suptitle, per the site's title standard`. A standard that has to be applied
by hand, page by page, is not a standard — it is a habit, and habits lapse.

## What was measured

Body type is disciplined. Display type is not:

| Token | Usages |
| --- | --- |
| `$text-xs` / `$text-sm` / `$text-base` / `$text-lg` | 26 / 20 / 9 / 12 |
| `$text-xl` / `$text-2xl` / `$text-hero` | 1 / 1 / 1 |

Alongside those three usages sit fourteen distinct raw pixel sizes at 24px and
above (24, 28, 30, 32, 34, 36, 40, 44, 48, 50, 56, 58, 60, 72), plus orphans
between the scale steps (10, 11, 13, 17, 18, 22, `0.875rem`, `0.55em`).

**The scale was not ignored out of laziness — it was the wrong shape.** A
display size is a *ramp* across breakpoints; a Sass variable holds one number.
Every title author therefore hand-rolled a ramp, and the flat tokens went
unused precisely where the need was greatest.

Grouped by role, the two title categories each have a clear majority and
exactly one dissenter. The home hero stands outside that contest: it holds two
display-scale elements, and they are not two titles.

| Role | Winner | Dissenter |
| --- | --- | --- |
| Page title (`h1`) | **36 → 56 → 72** — about, contact, news | 40 → 48 → 64 — protocols |
| Section title (`h2`) | **28 → 40** — about ×3, proposal | 32 → 44 → 56 — home "Protocols" |
| Home hero | *not a contest* | `.hero-wordmark` 32 → 48 → 60 *and* `.hero-stat-value` 34 → 50 → 60 |

`.hero-wordmark` is the home page's `<h1>StakeCore</h1>`. `.hero-stat-value` is
a `<div>` holding a formatted statistic, carrying `text-transform: uppercase`,
`line-height: 1` and `font-variant-numeric: tabular-nums` — it is a numeric
readout, not a title. The two converge at 60px at `lg`, so the pairing is
deliberate, but they have different jobs and are tuned differently. They are
therefore **named separately rather than merged**: collapsing them would couple
a stat readout to a title ramp, so that a future change to the hero title would
silently resize every statistic beside it.

The second finding is the duplicated markup. Six `-sup` rules exist, and six of
their seven declarations are byte-identical — only the trailing margin differs
(16px on about and news, 12px on the other four). The six `-main` rules share
`font-family`, `font-weight`, `letter-spacing` and `color` exactly, differing
in the ramp, in `line-height`, and in margin. The codebase already documents
its own duplication:

```scss
.news-header-sup {
    // Matches .about-header-sup and .project-title-sup.
.news-header-main {
    // Matches .about-header-main and .contact-header-main exactly — the
    // three inner-page titles share one scale.
```

A comment asserting "matches X exactly" is a shared component with the
extraction step missing.

Of the remaining variation, one part is signal and the rest is drift.

**Signal:** `line-height` is 1.05 on every page-ramp title and 1.1 on every
section-ramp title, without exception — it tracks the variant, so the component
can bind it rather than expose it.

**Drift:** `max-width` is 880px on the about and protocols page headers but
720px on the contact and news page headers, and 720px on both section headers —
so the page headers disagree among themselves. Bottom spacing is 16 / 32 / 48 /
32 / 32px with no discernible rule.

## Decisions

| Question | Decision |
| --- | --- |
| Ramps expressed as | Sass **mixins**, not variables — a ramp is not a scalar |
| How many display ramps | Four: `display-page`, `display-section`, `display-hero`, `display-stat` |
| Page ramp | 36 → 56 → 72 (the three-way winner) |
| Section ramp | 28 → 40 (the four-way winner) |
| Hero ramp | 32 → 48 → 60 — `.hero-wordmark` only |
| Stat ramp | 34 → 50 → 60 — `.hero-stat-value`, named rather than merged into the hero ramp |
| Protocols title | Snaps 40/48/64 → page ramp |
| Home "Protocols" title | Snaps 32/44/56 → section ramp (shrinks 56→40 at lg) |
| Component | One `PageHeader`, variant-driven |
| Variant ↔ heading level | Bound: `page`→`h1`, `section`→`h2` |
| `max-width` | Bound to variant: 880px page, 720px section |
| `line-height` | Bound to variant: 1.05 page, 1.1 section — it already tracks it |
| Bottom spacing | Standardised to the majority values (below); pages override via a layout class if genuinely needed |
| `.container` | **Not** rendered by the component |
| `$text-*` scale | Unchanged — it works for body and small text |

Rejected, with reasons:

- **Two sibling components (`PageHeader` + `SectionHeader`).** Reads cleanly at
  the call site with no invalid prop combinations. But the `-sup` styling is
  byte-identical across both, so it has to live in a shared mixin or a third
  internal component anyway — the duplication comes back one level down, which
  is the thing being fixed.
- **A thin primitive (`SupTitle` / `DisplayTitle`) composed per page.** Maximum
  flexibility, minimum enforcement. Pages keep their own layout classes and
  spacing, which re-creates today's situation with better-named parts.
- **An SCSS mixin only, leaving the markup alone.** Zero JSX change and no risk
  to the e2e specs, but each new page still has to remember to opt in. That is
  the failure mode being fixed, not a mitigation of it.
- **Tokenizing all six existing ramps as-is (zero pixel change).** Makes the
  code consistent and the screen not. Six named ramps instead of two renames
  the problem.
- **A third `display-section-lead` ramp to spare the home title.** Zero visual
  change, but a named exception is the escape hatch every future title reaches
  for. Preferred a real 56→40 shrink over a permanent third tier.
- **Merging `.hero-stat-value` into `display-hero`.** They differ by only 2px
  at two breakpoints and converge at the third, so merging looks free. It is
  not: it makes the hero title's size a hidden dependency of every statistic
  rendered beside it. Naming the second ramp costs one mixin and keeps the
  coupling explicit.
- **Fluid `clamp()` ramps.** Removes the breakpoint jumps entirely, but changes
  sizes at every intermediate width — a larger visual diff than this effort is
  scoped for. Worth revisiting once the ramps are centralised, since it then
  becomes a three-line change.

## The token layer

Added to [_tokens.scss](../../../src/assets/css/_tokens.scss), below the
existing `$text-*` scale:

```scss
// A display title's size is a RAMP across breakpoints, not a scalar — which is
// why the $text-* scale above went unused at the display end while fourteen
// raw px values accumulated. Each mixin emits the whole ramp, so a title site
// states its ROLE and never its pixels.
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
// two would make a future hero-title change silently resize every figure. See
// "What was measured" above.
@mixin display-stat {
    font-size: 34px;
    @include up(md) { font-size: 50px; }
    @include up(lg) { font-size: 60px; }
}
```

`$text-xl`, `$text-2xl` and `$text-hero` lose their only three consumers when
protocols migrates. They are left in place — they remain valid steps of the
scale — but nothing should reach for them for a title again.

## The component

`src/components/ui/pageHeader.tsx` and `pageHeader.scss`, matching the existing
`ui/` naming convention.

```tsx
const PageHeader = ({ variant = 'page', supTitle, title, align, aside, children }: {
  variant?: 'page' | 'section'
  supTitle?: string
  title: ReactNode      // ReactNode: /about wraps a word in .about-mark
  align?: 'start' | 'center'
  aside?: ReactNode     // the validator dropdown on the two validator pages
  children?: ReactNode  // body paragraph, currently /about only
}) => {
  const Heading = variant === 'page' ? 'h1' : 'h2'
  ...
}
```

Markup:

```jsx
<header className={classes}>
  <div className="page-header-text">
    {supTitle && <p className="page-header-sup">{supTitle}</p>}
    <Heading className="page-header-main">{title}</Heading>
    {children && <div className="page-header-body">{children}</div>}
  </div>
  {aside && <div className="page-header-aside">{aside}</div>}
</header>
```

Classes: `.page-header` with `--section` and `--center` modifiers (matching the
BEM-modifier style already used by `.about-grid--two` and `.about-tile--wide`),
plus `-text`, `-sup`, `-main`, `-body`, `-aside`.

Three properties of this shape are load-bearing:

- **`variant` drives ramp, heading level, `max-width` and `line-height` as one
  decision.**
  Across all six existing headers, page-ramp titles are `h1` and section-ramp
  titles are `h2` without exception. Binding them means the `heading-order`
  relationship cannot be broken by a call site, and a page cannot pick a size
  that contradicts its position in the document outline.
- **`title` is `ReactNode`, not `string`.** `.about-section-header-main`
  contains a `<span className="about-mark">`; a `string` prop would force that
  call site back to hand-built markup and reopen the drift.
- **The component does not render `.container`.** Five of six call sites
  already sit inside one. `ProjectTitle` currently renders its own, as a
  *sibling* of the page's other container rather than nested inside it, so its
  two call sites gain an explicit wrapper — a move, not an unnesting.

### Spacing

The four spacing values are settled by majority rather than left to the call
site, since that is where the drift lives:

| Property | Value | Currently |
| --- | --- | --- |
| `.page-header` margin-bottom | **32px** | 32 on contact, proposal, about-section, protocols; 48 news; 16 about |
| `.page-header-sup` margin-bottom | **12px** | 12 on contact, proposal, about-section, protocols; 16 about, news |
| `.page-header-main` margin | **0** | 0 on contact, proposal, about-section, protocols; 24 about, 16 news |
| `.page-header-body` margin-top | **24px** | about only, the sole body consumer, currently expressed as the title's 24px bottom margin |

In every row the majority is the same four call sites, and the two dissenters
are about and news — which is consistent with them being the pages whose header
is followed immediately by other content.

## Migration

| Call site | Change | Visual delta |
| --- | --- | --- |
| [about header](../../../src/pages/about/index.tsx) | `variant="page"` + body | block padding 16 → 32 margin, sup 16 → 12 |
| [about sections](../../../src/pages/about/index.tsx) ×3 | `variant="section"` | none |
| [contact](../../../src/pages/contact.tsx) | `variant="page"` | max-width 720 → 880 |
| [news](../../../src/pages/news/index.tsx) | `variant="page"` | max-width 720 → 880; block margin 48 → 32, sup 16 → 12, title 16 → 0 |
| [proposal](../../../src/components/sections/proposal.tsx) | `variant="section" align="center"` | none |
| [protocols](../../../src/pages/protocols/title.tsx) | `variant="page"` + `aside` | ramp 40/48/64 → 36/56/72 |

Two ramp-only changes fall outside the component, because the hero and the home
"Protocols" block are not suptitle headers:

- [hero.scss](../../../src/components/sections/hero.scss) — `.hero-wordmark`
  takes `display-hero` and `.hero-stat-value` takes `display-stat`. Both keep
  their current pixel values exactly; this is a naming change only.
- [portfolio.scss](../../../src/components/sections/portfolio.scss) —
  `.protocols-title` takes `display-section`, shrinking 56 → 40 at `lg`. This
  is the single largest visual change in the effort and was decided
  deliberately.

Once migrated, the six per-page rule blocks (`.about-header-*`,
`.about-section-header-*`, `.contact-header-*`, `.news-header-*`,
`.pricing-header-*`, `.project-title-*`) are deleted. `.about-header-body`
folds into `.page-header-body`; `.about-mark` is unrelated and stays.

### The specificity trap

Protocols does not size its title through `.project-title-main` — that rule has
no `font-size` at all. The size comes from three `h1` element rules nested
under `.single-project-page-design` at
[protocols.scss:13](../../../src/pages/protocols/protocols.scss),
[:154](../../../src/pages/protocols/protocols.scss) and
[:167](../../../src/pages/protocols/protocols.scss).

`.single-project-page-design h1` has specificity 0,1,1 and **outranks**
`.page-header-main` at 0,1,0. If those three rules are left behind, the
component's ramp is silently overridden and the migration looks like it worked
while changing nothing. They must be deleted, not merely superseded.

The same hazard exists globally in a milder form: `style.css` sizes bare `h1`
through `h6` as element selectors, so any heading without an explicit class
falls into them. Out of scope here, noted below.

## Testing

The regression net already exists and needs no new work:
[e2e/fixtures/routes.ts](../../../e2e/fixtures/routes.ts) pins a named
**level-1** heading on all eight routes, asserted by
[routes.spec.ts](../../../e2e/routes.spec.ts) and again by
[a11y.spec.ts](../../../e2e/a11y.spec.ts). A wrong heading level, a lost
suptitle-to-title relationship, or a dropped title fails CI immediately. No
unit tests currently touch the affected markup.

Added: `src/components/ui/pageHeader.test.tsx`, covering

- the variant ↔ level invariant — `page` renders `h1`, `section` renders `h2`
- suptitle omitted when the prop is absent (the proposal case)
- a `ReactNode` title rendering nested markup (the `.about-mark` case)
- `aside` and `children` rendering only when supplied

Per the repo convention the file declares `// @vitest-environment happy-dom`
and calls `afterEach(cleanup)` itself, since there is no global setup file.

Also run before merge: `npx tsc -p tsconfig.json --noEmit`, `pnpm lint`,
`pnpm test`, `pnpm test:e2e`, and a visual pass over `/`, `/about`, `/contact`,
`/news` and one protocol route at mobile, md and lg widths.

## Out of scope

Named here so they are recognisably deferred rather than missed:

- **The two hand-mirrored token sources.** `_tokens.scss` holds Sass variables
  and `style.css`'s `:root` holds CSS custom properties covering much of the
  same ground, kept in step by hand — the comments say *"mirrors
  _tokens.scss"*. Nothing enforces it. Collapsing them into one generated
  source is a separate effort.
- **Bare `h1`–`h6` element sizing in `style.css`.** `h2` at 22px is smaller
  than `h3` at 30px, which is its own inconsistency, and these rules are what
  every unclassed heading silently inherits.
- **Remaining orphan sizes** — 10, 11, 13, 17, 18px and the lone `0.875rem` and
  `0.55em` — in components outside the title system.
- **CSS lint enforcement.** Nothing mechanically checks any of this: Biome's
  formatter is off, there is no Prettier config file, no stylelint, no
  `.editorconfig`. Without a gate, this design relies on the component being
  the path of least resistance — which is the main reason the component was
  preferred over a mixin.
