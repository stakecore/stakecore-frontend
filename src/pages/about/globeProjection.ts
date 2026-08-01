// Orthographic projection — the maths behind the spinning globe.
//
// Kept apart from the component so it can be tested as plain functions
// with no canvas and no DOM. An orthographic projection is the view of a
// sphere from infinitely far away: it looks like a globe rather than a
// fisheye, and points on the far side project onto the same disc as the
// near side, so visibility has to be tested separately from position.

const DEG = Math.PI / 180

export interface ProjectedPoint {
  /** Offset from the disc centre, in pixels, +x right. */
  x: number
  /** Offset from the disc centre, in pixels, +y DOWN (canvas convention). */
  y: number
  /** True when the point lies on the near face of the sphere. */
  visible: boolean
}

/**
 * Project a lon/lat onto the disc.
 *
 * `centreLon` is what spinning changes — increasing it rotates the globe
 * eastward under a fixed viewer. `centreLat` tilts the pole toward or away
 * from the viewer.
 */
export function project(
  lonDeg: number,
  latDeg: number,
  centreLonDeg: number,
  centreLatDeg: number,
  radius: number,
): ProjectedPoint {
  const lambda = (lonDeg - centreLonDeg) * DEG
  const phi = latDeg * DEG
  const phi0 = centreLatDeg * DEG

  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)
  const cosPhi0 = Math.cos(phi0)
  const sinPhi0 = Math.sin(phi0)
  const cosLambda = Math.cos(lambda)

  // cos of the angular distance from the projection centre. Positive means
  // the point is within 90° of centre, i.e. on the hemisphere facing us.
  const cosC = sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosLambda

  return {
    x: radius * cosPhi * Math.sin(lambda),
    // The standard formula yields +y northward; canvas y grows downward,
    // so negate once here rather than at every call site.
    y: -radius * (cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosLambda),
    visible: cosC > 0,
  }
}

/** Tilt limit for interactive rotation — far enough to explore either
 * hemisphere, short of the disorienting pole-on view. */
export const MAX_TILT_DEG = 60

/**
 * Apply a pointer drag to the view centre, drag-follows-finger.
 *
 * A drag of `radius` pixels rotates by one radian, so the surface under the
 * pointer tracks it at the disc centre regardless of globe size. Dragging
 * right decreases centreLon (the surface sweeps rightward with the pointer);
 * dragging down increases centreLat (north tilts into view). Longitude wraps
 * to (-180, 180]; latitude clamps to ±MAX_TILT_DEG.
 */
export function dragRotation(
  centreLonDeg: number,
  centreLatDeg: number,
  dxPx: number,
  dyPx: number,
  radius: number,
): { lon: number, lat: number } {
  let lon = centreLonDeg - dxPx / radius / DEG
  // Shift into [0, 360), then down to (-180, 180].
  lon = ((lon % 360) + 360) % 360
  if (lon > 180) lon -= 360

  const lat = Math.max(
    -MAX_TILT_DEG,
    Math.min(MAX_TILT_DEG, centreLatDeg + dyPx / radius / DEG),
  )

  return { lon, lat }
}

/**
 * Lat/lon mesh as a list of polylines, each a flat [lon, lat, lon, lat, ...].
 *
 * Meridians run pole to pole, parallels run all the way around; both are
 * emitted densely enough that the projected curve stays smooth without
 * per-segment subdivision at draw time.
 */
export function graticule(stepDeg = 30, resolutionDeg = 5): number[][] {
  const lines: number[][] = []

  for (let lon = -180; lon < 180; lon += stepDeg) {
    const line: number[] = []
    for (let lat = -90; lat <= 90; lat += resolutionDeg) line.push(lon, lat)
    lines.push(line)
  }

  // Skip the poles themselves — a parallel at ±90° is a single point.
  for (let lat = -90 + stepDeg; lat < 90; lat += stepDeg) {
    const line: number[] = []
    for (let lon = -180; lon <= 180; lon += resolutionDeg) line.push(lon, lat)
    lines.push(line)
  }

  return lines
}
