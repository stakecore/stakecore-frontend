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
 * Sample a great-circle arc between two points as a flat [lon, lat, …]
 * polyline — the shape `strokeLines` consumes, so an arc is drawn by the
 * existing near/far machinery with no special case.
 *
 * The interpolation is a slerp on the unit sphere, not a lerp of the
 * lon/lat pair. Between two points at the same latitude those differ
 * visibly: the true great circle bows toward the pole, which is exactly
 * the shape that makes a transatlantic link read as a link rather than a
 * ruled line. A lerp would draw the parallel instead.
 */
export function greatCircleArc(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number,
  steps = 24,
): number[] {
  const toVec = (lonDeg: number, latDeg: number) => {
    const lon = lonDeg * DEG
    const lat = latDeg * DEG
    const cosLat = Math.cos(lat)
    return [cosLat * Math.cos(lon), cosLat * Math.sin(lon), Math.sin(lat)] as const
  }

  const a = toVec(lon1, lat1)
  const b = toVec(lon2, lat2)
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  const omega = Math.acos(dot)
  const sinOmega = Math.sin(omega)

  const out: number[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    let x: number
    let y: number
    let z: number
    // Coincident (or near-coincident) endpoints make sinOmega vanish and
    // the slerp weights blow up; fall back to a plain lerp, which is exact
    // in that limit anyway.
    if (sinOmega < 1e-9) {
      x = a[0] + (b[0] - a[0]) * t
      y = a[1] + (b[1] - a[1]) * t
      z = a[2] + (b[2] - a[2]) * t
    } else {
      const wa = Math.sin((1 - t) * omega) / sinOmega
      const wb = Math.sin(t * omega) / sinOmega
      x = a[0] * wa + b[0] * wb
      y = a[1] * wa + b[1] * wb
      z = a[2] * wa + b[2] * wb
    }
    out.push(Math.atan2(y, x) / DEG, Math.asin(Math.min(1, Math.max(-1, z))) / DEG)
  }
  return out
}
