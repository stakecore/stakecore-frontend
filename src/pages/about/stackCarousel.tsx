import { type CSSProperties, useRef } from 'react'
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
//   • The groups are the point. A flat row of thirteen logos says nothing —
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

// HAProxy and Loki carry no `slug` deliberately. Neither publishes a mark
// that survives being shrunk to glyph size (see scripts/gen-stack-logos.mjs),
// and both are wordmarks in their own branding, so setting them as type is
// the faithful treatment rather than a fallback.
export const STACK_GROUPS: StackGroup[] = [
  {
    label: 'Orchestration & secrets',
    items: [
      { name: 'Nomad', slug: 'nomad' },
      { name: 'Consul', slug: 'consul' },
      { name: 'Vault', slug: 'vault' },
    ],
  },
  {
    label: 'Load balancing & ingress',
    items: [
      { name: 'HAProxy' },
      { name: 'Traefik', slug: 'traefikproxy' },
    ],
  },
  {
    label: 'Observability',
    items: [
      { name: 'Prometheus', slug: 'prometheus' },
      { name: 'Grafana', slug: 'grafana' },
      { name: 'Loki' },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { name: 'Docker', slug: 'docker' },
      { name: 'WireGuard', slug: 'wireguard' },
      { name: 'GitHub Actions', slug: 'githubactions' },
    ],
  },
  {
    label: 'Hosting',
    items: [
      { name: 'OVH', slug: 'ovh' },
      { name: 'Hetzner', slug: 'hetzner' },
    ],
  },
  {
    label: 'Assisted by',
    items: [
      { name: 'Claude', slug: 'claude' },
    ],
  },
]

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

// One full pass of the roster. Rendered twice so the marquee has identical
// halves to wrap between; the second is inert to assistive tech.
const Half = ({ clone = false }: { clone?: boolean }) => (
  <div className="stack-carousel-half" aria-hidden={clone || undefined}>
    {STACK_GROUPS.map(group => (
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

const StackCarousel = () => {
  const ref = useRef<HTMLDivElement | null>(null)
  // Slower than the hero feed's 30px/s: that one is glanceable cards, this
  // one is names people actually read as they pass.
  useMarquee(ref, { speed: 25 })

  // A <section> with an accessible name rather than a div with role="group":
  // it names the region for assistive tech without an explicit role, and it
  // gives screen-reader users a landmark to jump to.
  //
  // The tabIndex below is where two lint rules pull opposite ways. Biome's
  // noNoninteractiveTabindex says don't put non-interactive elements in the
  // tab order; axe's scrollable-region-focusable (WCAG 2.1.1 A) says a scroll
  // container whose content holds no focusable elements MUST be focusable, or
  // a keyboard user cannot scroll it at all. This row has no links in it, so
  // axe is right and Biome's heuristic is wrong here — and the e2e a11y sweep
  // gates on axe. Being focusable also lets useMarquee's focusin pause hold
  // the row still while it is being read.
  //
  // The fade mask sits on the non-scrolling wrapper so the browser can keep
  // the scroll composited.
  return (
    <div className="stack-carousel-mask">
      <section
        ref={ref}
        className="stack-carousel"
        aria-label="Technology we run on"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: scroll container with no focusable content — see above
        tabIndex={0}
      >
        <div className="stack-carousel-track">
          <Half />
          <Half clone />
        </div>
      </section>
    </div>
  )
}

export default StackCarousel
