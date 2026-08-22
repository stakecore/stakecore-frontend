// Generates src/pages/about/stackLogos.ts — the brand glyphs for the tech
// stack carousel on the about page.
//
//   node scripts/gen-stack-logos.mjs
//
// Source is Simple Icons (CC0-1.0), which ships every brand as a single
// 24×24 path plus its official hex. We inline the path data rather than
// depend on the package or ship 21 separate SVG files: the whole set is
// ~30kB of string in a lazy route chunk, against 21 extra requests and a
// 3400-icon dependency for the twenty-one we use. The logos themselves remain trademarks of their
// owners; naming the software you run is nominative use.
//
// A single path is also what makes the carousel's hover treatment work.
// The glyph renders as `fill="currentColor"`, so it inherits the muted ink
// colour at rest and its own brand hex on hover/focus — no duplicate
// colour assets, and no `filter: grayscale()` repaint on a moving row.
//
// Brands Simple Icons does not carry go in EXTRA below, fetched from the
// vendor's own site. Anything with no mark that reads at 26px is left out
// of both lists and set as type by stackCarousel.tsx — adding a slug
// without checking how its mark survives that size is how the row ends up
// with one illegible smudge in it.
//
// A vendor mark rarely arrives in the shape this file needs, so an EXTRA
// entry may set two optional fields, each documented at its use below:
// `flatten` waives the one-fill check for a mark whose tones are shading
// rather than meaning, and `fit` rescales a mark that does not already fill
// its own box. Both are opt-in: applied by default they would silently change
// the marks already committed here.
//
// Re-run after changing SLUGS or EXTRA; the output is committed.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const VERSION = '16.28.0'
const BASE = `https://cdn.jsdelivr.net/npm/simple-icons@${VERSION}`

// Keyed by the slug used in stackCarousel.tsx's roster.
const SLUGS = [
  'nomad',
  'consul',
  'vault',
  'traefikproxy',
  'prometheus',
  'grafana',
  'sentry',
  'docker',
  'postgresql',
  'redis',
  // The certificate authority, not a piece of software we run: Traefik's ACME
  // resolver issues the public certs from it, so it belongs with the ingress.
  'letsencrypt',
  'wireguard',
  'githubactions',
  'ovh',
  'hetzner',
  // The GitHub mark, not `githubpages`: that one is a wordmark whose glyphs
  // occupy a ~3px band of the 24x24 box and turn to mush at row size.
  'github',
  'telegram',
  'claude',
]

// Marks Simple Icons does not publish, taken from the vendor instead. Each
// still has to reduce to one flat-coloured path, or it cannot be tinted with
// currentColor and does not belong in the row.
const EXTRA = {
  alloy: {
    title: 'Alloy',
    // Grafana orange, the same hex as Loki below: Alloy has no brand colour of
    // its own, and the glyph draws itself in the house colour.
    hex: '#FF671D',
    // Simple Icons carries no `alloy` slug. This is Grafana's own 24x24
    // navigation glyph, from the same set as the Loki mark below and found the
    // same way (the SVGs linked off the product page) — one flat path on a
    // 10%-opacity rounded-rect plate, which the <path> match skips.
    url: 'https://a-us.storyblok.com/f/1022730/24x24/902703be3f/icon-nav-alloy.svg',
  },
  loki: {
    title: 'Loki',
    hex: '#FF671D',
    // Grafana's own 24x24 navigation glyph. The headline logo
    // (/static/img/logos/logo-loki.svg) is 48x56 and fills its fourteen
    // shapes with fourteen linear gradients, so it cannot take currentColor;
    // this one draws the same shapes flat, already square and already scaled
    // for glyph size. It sits on a 10%-opacity rounded-rect plate, which is
    // a <rect> and so is skipped by the <path> match below.
    url: 'https://a-us.storyblok.com/f/1022730/24x24/e041973a44/icon-nav-loki.svg',
  },
  healthchecks: {
    title: 'Healthchecks.io',
    // The green of the pulse. The plate's dark green never reaches the row:
    // like Alloy's and Loki's, that plate is a <rect>, so the <path> match
    // skips it for free.
    hex: '#22BC66',
    // The standalone logo, deliberately not /static/img/favicon.svg. The
    // favicon draws the same mark for 16px, with strokes so heavy that
    // flattening fuses its two pulses into one blob — an arrowhead, not a
    // heartbeat. This one keeps the trace thin enough to still read as a
    // pulse at row size.
    url: 'https://healthchecks.io/static/img/logo.svg',
    // Two tones tracing one continuous pulse rather than two marks, so
    // collapsing them to a single colour keeps the silhouette. Checked against
    // the vendor original at 26px before setting this.
    flatten: true,
    // The pulse spans 64% of the plate. Left alone it would render a third
    // smaller than every Simple Icons glyph beside it, which all fill their
    // own box.
    fit: true,
  },
}

const OUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/pages/about/stackLogos.ts',
)

const get = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return res.text()
}

// The icon SVG is a single <path d="…"/>; the hex lives in the data file.
const extractPath = (svg, slug) => {
  const m = svg.match(/ d="([^"]+)"/)
  if (!m) throw new Error(`no path found in ${slug}.svg`)
  if (svg.match(/<path/g).length !== 1) {
    throw new Error(`${slug}.svg is not a single path — it will not tint`)
  }
  return m[1]
}

// Disjoint subpaths concatenated into one `d` render exactly as the separate
// elements did, so a flat multi-path mark collapses to the single-path shape
// the rest of this file assumes. Verified against the fourteen shapes of the
// Loki glyph, which do not overlap.
// It holds only while every path is self-locating, which is checked below
// rather than assumed: all three merged marks are absolute throughout today,
// and a vendor switching to relative coordinates is exactly the change that
// would break this quietly.
const mergePaths = (svg, slug, { flatten = false } = {}) => {
  const ds = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1])
  if (ds.length === 0) throw new Error(`no paths found in ${slug}`)
  // A leading `m` is relative to the current point: the origin inside a path's
  // own element, but after concatenation wherever the previous subpath began.
  // The shapes would land at plausible coordinates nothing downstream checks,
  // scattered across the box — so refuse the merge instead.
  if (ds.length > 1 && ds.some(d => /^\s*m/.test(d))) {
    throw new Error(`${slug} merges a path with a relative moveto — its subpaths would scatter`)
  }
  const fills = new Set(
    [...svg.matchAll(/<path[^>]*\sfill="([^"]+)"/g)].map(m => m[1].toLowerCase()),
  )
  // Multiple fills normally mean the mark carries information in its colours,
  // which currentColor would destroy. `flatten` is the opt-out for a mark whose
  // tones are shading within one shape — set it only after looking at the
  // flattened result at row size, since this check is the only thing standing
  // between a two-tone logo and an unreadable blob.
  if (fills.size > 1 && !flatten) {
    throw new Error(`${slug} uses ${fills.size} fills — it will not tint as one colour`)
  }
  return ds.join(' ')
}

// Scales a path to fill the 24×24 box the carousel renders it in, preserving
// aspect ratio and centring the remainder. Only straight-line commands are
// handled, which is exact arithmetic — a curve or arc would need its control
// points transformed too, so this throws on one rather than emitting a mark
// that is quietly the wrong shape.
const fitToBox = (d, slug) => {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? []
  const subpaths = []
  let pts = null
  let x = 0
  let y = 0
  let cmd = null
  let i = 0
  const num = () => Number.parseFloat(toks[i++])
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++]
    switch (cmd) {
      case 'z': case 'Z': cmd = null; break
      // A moveto starts a subpath; the coordinate pairs that follow it without
      // a command letter of their own are linetos, not more movetos.
      case 'm': x += num(); y += num(); pts = [[x, y]]; subpaths.push(pts); cmd = 'l'; break
      case 'M': x = num(); y = num(); pts = [[x, y]]; subpaths.push(pts); cmd = 'L'; break
      case 'l': x += num(); y += num(); pts.push([x, y]); break
      case 'L': x = num(); y = num(); pts.push([x, y]); break
      case 'h': x += num(); pts.push([x, y]); break
      case 'H': x = num(); pts.push([x, y]); break
      case 'v': y += num(); pts.push([x, y]); break
      case 'V': y = num(); pts.push([x, y]); break
      default: throw new Error(`${slug}: cannot fit a path using '${cmd}' — straight lines only`)
    }
  }
  const all = subpaths.flat()
  const xs = all.map(p => p[0])
  const ys = all.map(p => p[1])
  const [minX, minY] = [Math.min(...xs), Math.min(...ys)]
  const [w, h] = [Math.max(...xs) - minX, Math.max(...ys) - minY]
  const scale = 24 / Math.max(w, h)
  const [ox, oy] = [(24 - w * scale) / 2, (24 - h * scale) / 2]
  const r = n => +(n).toFixed(3)
  return subpaths
    .map(p => `M${p.map(([px, py]) => `${r((px - minX) * scale + ox)} ${r((py - minY) * scale + oy)}`).join('L')}Z`)
    .join('')
}

const main = async () => {
  const data = JSON.parse(await get(`${BASE}/data/simple-icons.json`))
  const bySlug = new Map(data.map(i => [i.slug ?? slugify(i.title), i]))

  const entries = []
  for (const slug of SLUGS) {
    const meta = bySlug.get(slug)
    if (!meta) throw new Error(`unknown simple-icons slug: ${slug}`)
    const svg = await get(`${BASE}/icons/${slug}.svg`)
    entries.push({
      slug,
      title: meta.title,
      hex: `#${meta.hex}`,
      path: extractPath(svg, slug),
    })
  }

  for (const [slug, meta] of Object.entries(EXTRA)) {
    const svg = await get(meta.url)
    let path = mergePaths(svg, slug, { flatten: meta.flatten })
    if (meta.fit) path = fitToBox(path, slug)
    entries.push({ slug, title: meta.title, hex: meta.hex, path })
  }

  const body = entries
    .map(e => `  ${e.slug}: {\n    title: '${e.title.replace(/'/g, "\\'")}',\n    hex: '${e.hex}',\n    path: '${e.path}',\n  },`)
    .join('\n')

  const out = `// GENERATED by scripts/gen-stack-logos.mjs — do not edit by hand.
// Source: Simple Icons ${VERSION} (CC0-1.0). Each mark is a single 24×24
// path so it can be tinted with currentColor; \`hex\` is the brand's own
// colour, revealed on hover. See the script header before adding a slug.

export interface StackLogo {
  /** Brand name as Simple Icons spells it. */
  title: string
  /** Official brand colour, used for the hover reveal. */
  hex: string
  /** Single path covering the whole 24×24 viewBox. */
  path: string
}

export const STACK_LOGOS: Record<string, StackLogo> = {
${body}
}
`
  await fs.writeFile(OUT_PATH, out)
  console.log(`wrote ${OUT_PATH} — ${entries.length} glyphs, ${out.length} bytes`)
}

// simple-icons omits `slug` when it is just the lowercased, stripped title.
const slugify = (title) =>
  title.toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]/g, '')

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
