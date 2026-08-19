// Generates src/pages/about/stackLogos.ts — the brand glyphs for the tech
// stack carousel on the about page.
//
//   node scripts/gen-stack-logos.mjs
//
// Source is Simple Icons (CC0-1.0), which ships every brand as a single
// 24×24 path plus its official hex. We inline the path data rather than
// depend on the package or ship 18 separate SVG files: the whole set is
// ~26kB of string in a lazy route chunk, against 18 extra requests and a
// 3400-icon dependency for the eighteen we use. The logos themselves remain trademarks of their
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
  'docker',
  'postgresql',
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
const mergePaths = (svg, slug) => {
  const ds = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1])
  if (ds.length === 0) throw new Error(`no paths found in ${slug}`)
  const fills = new Set(
    [...svg.matchAll(/<path[^>]*\sfill="([^"]+)"/g)].map(m => m[1].toLowerCase()),
  )
  if (fills.size > 1) {
    throw new Error(`${slug} uses ${fills.size} fills — it will not tint as one colour`)
  }
  return ds.join(' ')
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
    entries.push({
      slug,
      title: meta.title,
      hex: meta.hex,
      path: mergePaths(svg, slug),
    })
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
