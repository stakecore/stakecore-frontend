// Generates src/pages/about/coastlines.ts — the world coastline rings used
// by the spinning globe on the about page.
//
//   node scripts/gen-coastlines.mjs
//
// Source is Natural Earth 110m land, shipped as TopoJSON by world-atlas.
// We decode it here rather than at runtime so the app ships plain number
// arrays and no topojson-client dependency.
//
// Three reductions, in order:
//   1. Drop rings under MIN_RING_POINTS — tiny islands that render as a
//      single sub-pixel speck at globe scale.
//   2. Douglas–Peucker at SIMPLIFY_TOLERANCE degrees. At the ~300px the
//      about page gives the globe, 1° of arc is under 2px, so 0.5° is
//      below one pixel — visually lossless at that size.
//   3. Round to one decimal (~11km), which is likewise sub-pixel.
//
// Result at the current settings: ~1.4k points, ~15KB raw / ~4.6KB gzipped.
// Re-run after changing any constant below; the output is committed.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json'
const MIN_RING_POINTS = 12
const SIMPLIFY_TOLERANCE = 0.5
const COORD_DECIMALS = 1

const OUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/pages/about/coastlines.ts',
)

// --- TopoJSON decoding ------------------------------------------------
// Arcs are delta-encoded against a quantized integer grid; `transform`
// carries the scale/translate back to lon/lat degrees.

function decodeArcs(topology) {
  const { scale: [sx, sy], translate: [tx, ty] } = topology.transform
  return topology.arcs.map(arc => {
    let x = 0, y = 0
    return arc.map(([dx, dy]) => {
      x += dx
      y += dy
      return [x * sx + tx, y * sy + ty]
    })
  })
}

// A ring is a list of arc indices. A negative index ~i means "arc i,
// reversed" — that's how TopoJSON shares a boundary between two shapes
// that traverse it in opposite directions.
function ringToPoints(ringArcIdxs, arcs) {
  const pts = []
  for (const idx of ringArcIdxs) {
    const arc = arcs[idx < 0 ? ~idx : idx]
    const oriented = idx < 0 ? [...arc].reverse() : arc
    // Consecutive arcs share an endpoint; skip the duplicate join.
    for (const p of (pts.length ? oriented.slice(1) : oriented)) pts.push(p)
  }
  return pts
}

function extractRings(topology) {
  const arcs = decodeArcs(topology)
  const land = topology.objects.land
  const geometries = land.geometries ?? [land]
  const rings = []
  for (const geom of geometries) {
    const polygons = geom.type === 'Polygon' ? [geom.arcs] : geom.arcs
    for (const polygon of polygons) {
      for (const ring of polygon) rings.push(ringToPoints(ring, arcs))
    }
  }
  return rings
}

// --- Simplification ---------------------------------------------------

function perpendicularDistance(p, a, b) {
  const [x, y] = p, [x1, y1] = a, [x2, y2] = b
  const dx = x2 - x1, dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(x - x1, y - y1)
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq))
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))
}

function douglasPeucker(points, tolerance) {
  if (points.length < 3) return points
  const last = points.length - 1
  let maxDist = 0, maxIdx = 0
  for (let i = 1; i < last; i++) {
    const d = perpendicularDistance(points[i], points[0], points[last])
    if (d > maxDist) { maxDist = d; maxIdx = i }
  }
  if (maxDist <= tolerance) return [points[0], points[last]]
  return [
    ...douglasPeucker(points.slice(0, maxIdx + 1), tolerance).slice(0, -1),
    ...douglasPeucker(points.slice(maxIdx), tolerance),
  ]
}

// --- Main -------------------------------------------------------------

const response = await fetch(SOURCE_URL)
if (!response.ok) {
  throw new Error(`Failed to fetch ${SOURCE_URL}: HTTP ${response.status}`)
}
const topology = await response.json()

const rawRings = extractRings(topology)
const rings = rawRings
  .filter(ring => ring.length >= MIN_RING_POINTS)
  .map(ring => douglasPeucker(ring, SIMPLIFY_TOLERANCE))
  // Simplification can collapse a small ring into a degenerate sliver.
  .filter(ring => ring.length >= 4)

// Flatten each ring to [lon, lat, lon, lat, ...] — half the array objects
// of a nested [[lon, lat], ...] form, and the draw loop reads it directly.
const flattened = rings.map(ring =>
  ring.flatMap(([lon, lat]) => [+lon.toFixed(COORD_DECIMALS), +lat.toFixed(COORD_DECIMALS)]),
)

const totalPoints = flattened.reduce((sum, r) => sum + r.length / 2, 0)
const body = flattened.map(ring => `  [${ring.join(',')}],`).join('\n')

const file = `// GENERATED FILE — do not edit by hand.
//
// Regenerate with:  node scripts/gen-coastlines.mjs
//
// World coastlines from Natural Earth 110m land (via world-atlas), decoded
// from TopoJSON, simplified with Douglas–Peucker at ${SIMPLIFY_TOLERANCE}° and rounded to
// ${COORD_DECIMALS} decimal place. ${rings.length} rings, ${totalPoints} points.
//
// Each ring is a flat array of alternating longitude/latitude degrees:
// [lon0, lat0, lon1, lat1, ...]. Rings are closed polygons — the globe
// strokes them as outlines rather than filling them.

export const COASTLINE_RINGS: readonly (readonly number[])[] = [
${body}
]
`

await fs.writeFile(OUT_PATH, file, 'utf8')
console.log(
  `Wrote ${OUT_PATH}\n` +
  `  ${rings.length} rings, ${totalPoints} points, ${(file.length / 1024).toFixed(1)}KB`,
)
