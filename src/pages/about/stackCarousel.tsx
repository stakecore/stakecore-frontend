import { type CSSProperties, type RefObject, useLayoutEffect, useRef, useState } from 'react'
import { useMarquee } from '~/utils/useMarquee'
import { STACK_LOGOS } from './stackLogos'
import './stackCarousel.scss'

// The tech-stack marquee on the about page: what we run, grouped by the job
// each thing does. Static content, so it shares the scroll loop with the
// hero activity feed (useMarquee) but none of its data handling.
//
// Two rules govern what may be added here:
//
//   • Only software we actually run. This sits under a heading that sells
//     the cluster; a logo here is a claim about production, not a wish list.
//   • The groups are the point. A flat row of fourteen logos says nothing —
//     "HAProxy balances internally, Traefik publishes outward" is the
//     information, and the group label is what carries it.

export interface StackItem {
  name: string
  /** Key into STACK_LOGOS. Omitted for brands set as type — see below. */
  slug?: string
}

export interface StackGroup {
  label: string
  items: StackItem[]
}

// HAProxy carries no `slug` deliberately: the only SVG it publishes is a
// fine-stroked 64px drawing whose lines fall below a pixel at glyph size, and
// its own branding is a wordmark anyway, so setting it as type is the
// faithful treatment rather than a fallback. Everything else has a mark —
// including Loki, whose glyph comes from Grafana rather than Simple Icons
// (see scripts/gen-stack-logos.mjs).

// Top row: what runs the workloads and moves traffic to them.
const RUNTIME_GROUPS: StackGroup[] = [
  {
    label: 'Orchestration & secrets',
    items: [
      { name: 'Nomad', slug: 'nomad' },
      { name: 'Consul', slug: 'consul' },
      { name: 'Vault', slug: 'vault' },
    ],
  },
  {
    // Ordered outside-in, matching the prose above the carousel: between
    // sites, then inside the cluster, then out to the public.
    label: 'Networking & ingress',
    items: [
      { name: 'WireGuard', slug: 'wireguard' },
      { name: 'HAProxy' },
      { name: 'Traefik', slug: 'traefikproxy' },
    ],
  },
  {
    label: 'Observability',
    items: [
      { name: 'Prometheus', slug: 'prometheus' },
      { name: 'Grafana', slug: 'grafana' },
      { name: 'Loki', slug: 'loki' },
    ],
  },
]

// Bottom row: how it ships, where it lives, and who helps run it.
const PLATFORM_GROUPS: StackGroup[] = [
  {
    label: 'Delivery',
    items: [
      { name: 'Docker', slug: 'docker' },
      { name: 'GitHub Actions', slug: 'githubactions' },
    ],
  },
  {
    label: 'Hosting',
    items: [
      { name: 'OVH', slug: 'ovh' },
      { name: 'Hetzner', slug: 'hetzner' },
      // The GitHub mark rather than the GitHub Pages one: that is a wordmark
      // that turns to mush at glyph size (see scripts/gen-stack-logos.mjs).
      { name: 'GitHub Pages', slug: 'github' },
    ],
  },
  {
    // Named for the job, like every other group, rather than for the
    // relationship this once carried ("Assisted by"). Ordered the way the
    // job runs: the alert arrives, then it gets worked. The boundary on
    // Claude's half — engineers approve anything that lands — is in the
    // prose above the carousel, because a label cannot carry it.
    //
    // Telegram is here and not in Observability on purpose. That group
    // collects and visualises signals; Telegram does neither, it carries
    // one to a human. Filing it there would repeat the mistake that put
    // WireGuard under Delivery.
    label: 'Alerting & triage',
    items: [
      { name: 'Telegram', slug: 'telegram' },
      { name: 'Claude', slug: 'claude' },
    ],
  },
]

// The two rows scroll opposite ways, which is the whole reason for the split:
// a single long row reads as one belt, while two counter-moving ones read as
// a machine. Named constants rather than a slice of a flat list so moving a
// group between rows is an obvious edit and not an off-by-one.
export const STACK_ROWS: StackGroup[][] = [RUNTIME_GROUPS, PLATFORM_GROUPS]

/** Every group, in reading order. The rows above are the layout. */
export const STACK_GROUPS: StackGroup[] = STACK_ROWS.flat()

const Item = ({ item }: { item: StackItem }) => {
  const logo = item.slug ? STACK_LOGOS[item.slug] : undefined

  return (
    <li
      className={`stack-item${logo ? '' : ' stack-item--wordmark'}`}
      data-slug={item.slug}
      // Per-item brand colour, consumed by the hover/focus rule. Inline
      // because it is data from the generated file, not a design token.
      style={logo ? ({ '--stack-brand': logo.hex } as CSSProperties) : undefined}
    >
      {logo && (
        // Sized in both dimensions so the row cannot reflow, and hidden from
        // assistive tech: the visible name beside it is the accessible label,
        // and announcing both would read every brand twice.
        <svg
          className="stack-item-glyph"
          viewBox="0 0 24 24"
          width={26}
          height={26}
          aria-hidden="true"
          focusable="false"
        >
          <path d={logo.path} fill="currentColor" />
        </svg>
      )}
      <span className="stack-item-name">{item.name}</span>
    </li>
  )
}

// One full pass of a row's groups. Repeated as many times as the row needs to
// have somewhere to wrap to (see useCopiesToFill); every copy after the first
// is inert to assistive tech.
const Half = ({ groups, clone = false }: { groups: StackGroup[], clone?: boolean }) => (
  <div className="stack-carousel-half" aria-hidden={clone || undefined}>
    {groups.map(group => (
      <div className="stack-group" key={group.label}>
        <p className="stack-group-label">{group.label}</p>
        <ul className="stack-group-items">
          {group.items.map(item => (
            <Item key={item.name} item={item} />
          ))}
        </ul>
      </div>
    ))}
  </div>
)

// Slower than the hero feed's 30px/s: that one is glanceable cards, this one
// is names people actually read as they pass. The two rows run at different
// rates rather than mirrored ones — matched speeds make the pair read as a
// single belt sliding apart, and the eye locks onto the symmetry.
const TOP_SPEED = 25
const BOTTOM_SPEED = -21

// A duplicated track only wraps seamlessly when one copy is at least as wide
// as the viewport: scrollLeft stops at scrollWidth - clientWidth, so with two
// copies of a narrower run the wrap point sits past the end of the scroll
// range and can never be reached. These rows are short — eight items and six
// — so at desktop widths two copies is exactly that failure. Count the copies
// needed instead of assuming, and re-count on resize.
const MIN_COPIES = 2

const useCopiesToFill = (ref: RefObject<HTMLElement | null>) => {
  const [copies, setCopies] = useState(MIN_COPIES)

  useLayoutEffect(() => {
    // Not named `fit` — Biome reads that as a focused Jasmine test.
    const recount = () => {
      const el = ref.current
      const one = el?.firstElementChild?.firstElementChild
      if (!el || !(one instanceof HTMLElement)) return
      const period = one.offsetWidth
      // No layout yet (or a test environment that computes none) — leave the
      // count alone; the observer below re-runs once there is something to
      // measure.
      if (period <= 0) return
      // Travel available is (copies - 1) × period, and one full period has to
      // fit inside it — hence the + 1 rather than a bare ceiling.
      setCopies(Math.max(MIN_COPIES, Math.ceil(el.clientWidth / period) + 1))
    }

    recount()
    const ro = new ResizeObserver(recount)
    const el = ref.current
    if (el) {
      ro.observe(el)
      if (el.firstElementChild) ro.observe(el.firstElementChild)
    }
    return () => ro.disconnect()
  }, [ref])

  return copies
}

const Row = ({ groups, speed, label }: {
  groups: StackGroup[], speed: number, label: string
}) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const copies = useCopiesToFill(ref)
  useMarquee(ref, { speed, copies })

  // A <section> with an accessible name rather than a div with role="group":
  // it names the region for assistive tech without an explicit role, and it
  // gives screen-reader users a landmark to jump to. The two rows carry
  // different names so a landmark list does not show the same entry twice.
  //
  // The tabIndex below is where two lint rules pull opposite ways. Biome's
  // noNoninteractiveTabindex says don't put non-interactive elements in the
  // tab order; axe's scrollable-region-focusable (WCAG 2.1.1 A) says a scroll
  // container whose content holds no focusable elements MUST be focusable, or
  // a keyboard user cannot scroll it at all. These rows have no links in
  // them, so axe is right and Biome's heuristic is wrong here — and the e2e
  // a11y sweep gates on axe. Being focusable also lets useMarquee's focusin
  // pause hold a row still while it is being read.
  //
  // The fade mask sits on the non-scrolling wrapper so the browser can keep
  // the scroll composited.
  return (
    <div className="stack-carousel-mask">
      <section
        ref={ref}
        className="stack-carousel"
        aria-label={label}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: scroll container with no focusable content — see above
        tabIndex={0}
      >
        <div className="stack-carousel-track">
          {Array.from({ length: copies }, (_, i) => (
            // Only the leading copy is exposed; the rest exist purely to give
            // the loop somewhere to wrap to.
            // biome-ignore lint/suspicious/noArrayIndexKey: the copies are identical by construction and distinguished only by position, so the index IS the identity — and raising `copies` then appends rather than reshuffling.
            <Half key={i} groups={groups} clone={i > 0} />
          ))}
        </div>
      </section>
    </div>
  )
}

const StackCarousel = () => (
  <div className="stack-carousel-rows">
    <Row
      groups={RUNTIME_GROUPS}
      speed={TOP_SPEED}
      label="Technology we run on: orchestration, routing and observability"
    />
    <Row
      groups={PLATFORM_GROUPS}
      speed={BOTTOM_SPEED}
      label="Technology we run on: delivery, hosting, alerting and triage"
    />
  </div>
)

export default StackCarousel
