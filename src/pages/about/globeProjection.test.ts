import { describe, it, expect } from 'vitest'
import { project, dragRotation, greatCircleArc } from './globeProjection'

const R = 100

describe('project', () => {
  it('puts the projection centre at the origin of the disc', () => {
    const p = project(12, 34, 12, 34, R)
    expect(p.x).toBeCloseTo(0, 10)
    expect(p.y).toBeCloseTo(0, 10)
    expect(p.visible).toBe(true)
  })

  it('places a point 90° east of centre on the limb of the disc', () => {
    const p = project(90, 0, 0, 0, R)
    expect(p.x).toBeCloseTo(R, 10)
    expect(p.y).toBeCloseTo(0, 10)
  })

  it('flips visibility either side of the limb', () => {
    // Exactly 90° away is a measure-zero tie, and floating point decides it
    // either way (cos(π/2) is 6e-17, not 0). It does not matter: such a
    // point is edge-on and lands on the limb circle whichever face claims
    // it. What must hold is that either side of the limb resolves correctly.
    expect(project(89.9, 0, 0, 0, R).visible).toBe(true)
    expect(project(90.1, 0, 0, 0, R).visible).toBe(false)
  })

  it('hides the antipode of the projection centre', () => {
    expect(project(180, 0, 0, 0, R).visible).toBe(false)
    expect(project(-155, -20, 25, 20, R).visible).toBe(false)
  })

  it('projects the north pole upward on screen when the globe is tilted north', () => {
    const p = project(0, 90, 0, 30, R)
    expect(p.x).toBeCloseTo(0, 10)
    // Canvas y grows downward, so "up on screen" is negative.
    expect(p.y).toBeCloseTo(-R * Math.cos(30 * Math.PI / 180), 10)
    expect(p.y).toBeLessThan(0)
    expect(p.visible).toBe(true)
  })

  it('shows the north pole only while the globe tilts north', () => {
    expect(project(0, 90, 0, 30, R).visible).toBe(true)
    expect(project(0, 90, 0, -30, R).visible).toBe(false)
  })

  it('partitions every point between the two faces exactly once', () => {
    // The draw loop renders the far face then the near face, selecting with
    // `visible !== nearFace`. That only covers the sphere without double
    // -drawing if `visible` is a strict boolean for every input.
    for (let lon = -180; lon <= 180; lon += 11) {
      for (let lat = -90; lat <= 90; lat += 11) {
        expect(typeof project(lon, lat, 47, 30, R).visible).toBe('boolean')
      }
    }
  })

  it('sweeps points westward across the disc as the centre longitude advances', () => {
    // Increasing centreLon spins the globe eastward under a fixed viewer,
    // so a fixed city drifts to the left — if this inverts, the globe
    // spins backwards.
    const at0 = project(0, 0, 0, 0, R)
    const at10 = project(0, 0, 10, 0, R)
    const at20 = project(0, 0, 20, 0, R)
    expect(at0.x).toBeCloseTo(0, 10)
    expect(at10.x).toBeLessThan(at0.x)
    expect(at20.x).toBeLessThan(at10.x)
  })

  it('is periodic in longitude', () => {
    const a = project(15, 40, 0, 30, R)
    const b = project(15 + 360, 40, 0, 30, R)
    expect(b.x).toBeCloseTo(a.x, 8)
    expect(b.y).toBeCloseTo(a.y, 8)
    expect(b.visible).toBe(a.visible)
  })

  it('keeps every projected point inside the disc', () => {
    for (let lon = -180; lon <= 180; lon += 7) {
      for (let lat = -90; lat <= 90; lat += 7) {
        const p = project(lon, lat, 33, 30, R)
        expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(R + 1e-9)
      }
    }
  })

  it('scales linearly with radius', () => {
    const small = project(40, 20, 10, 30, 50)
    const large = project(40, 20, 10, 30, 100)
    expect(large.x).toBeCloseTo(small.x * 2, 10)
    expect(large.y).toBeCloseTo(small.y * 2, 10)
  })
})

describe('dragRotation', () => {
  const DEG_PER_RADIUS = 180 / Math.PI // one radian of surface travel

  it('spins the surface after a horizontal drag: dragging right turns the centre westward', () => {
    // Drag-follows-finger: the point under the pointer should move the way
    // the pointer moves. `project` sweeps points westward (leftward) as
    // centreLon advances, so a rightward drag must DECREASE centreLon.
    const r = dragRotation(0, 30, R, 0, R)
    expect(r.lon).toBeCloseTo(-DEG_PER_RADIUS, 10)
    expect(r.lat).toBe(30)
  })

  it('tilts north into view on a downward drag', () => {
    // Increasing centreLat moves the visible surface downward on screen
    // (canvas y grows down), so dragging down must INCREASE centreLat.
    const r = dragRotation(0, 0, 0, R, R)
    expect(r.lat).toBeCloseTo(DEG_PER_RADIUS, 10)
    expect(r.lon).toBe(0)
  })

  it('scales rotation inversely with radius so a drag feels the same at any size', () => {
    const small = dragRotation(0, 0, 10, 0, 100)
    const large = dragRotation(0, 0, 10, 0, 200)
    expect(small.lon).toBeCloseTo(large.lon * 2, 10)
  })

  it('clamps the tilt so the globe cannot be dragged into a pole-on view', () => {
    expect(dragRotation(0, 59, 0, 10_000, R).lat).toBe(60)
    expect(dragRotation(0, -59, 0, -10_000, R).lat).toBe(-60)
  })

  it('wraps longitude across the antimeridian instead of accumulating', () => {
    const westward = dragRotation(-179, 30, R, 0, R) // -179 − 57.3 → wraps
    expect(westward.lon).toBeGreaterThan(0)
    expect(westward.lon).toBeLessThanOrEqual(180)

    const eastward = dragRotation(179, 30, -R, 0, R) // 179 + 57.3 → wraps
    expect(eastward.lon).toBeLessThan(0)
    expect(eastward.lon).toBeGreaterThanOrEqual(-180)
  })

  it('is a no-op for a zero-length drag', () => {
    const r = dragRotation(-25, 30, 0, 0, R)
    expect(r).toEqual({ lon: -25, lat: 30 })
  })
})

describe('greatCircleArc', () => {
  const lonsLats = (arc: number[]) => {
    const pts: [number, number][] = []
    for (let i = 0; i < arc.length; i += 2) {
      const lon = arc[i]
      const lat = arc[i + 1]
      if (lon == null || lat == null) break
      pts.push([lon, lat])
    }
    return pts
  }

  it('starts and ends on the two endpoints', () => {
    const pts = lonsLats(greatCircleArc(-73.87, 45.31, 24.94, 60.17, 16))
    expect(pts[0]?.[0]).toBeCloseTo(-73.87, 6)
    expect(pts[0]?.[1]).toBeCloseTo(45.31, 6)
    expect(pts.at(-1)?.[0]).toBeCloseTo(24.94, 6)
    expect(pts.at(-1)?.[1]).toBeCloseTo(60.17, 6)
  })

  it('emits the requested number of segments', () => {
    expect(lonsLats(greatCircleArc(0, 0, 90, 0, 8))).toHaveLength(9)
  })

  // Along the equator the great circle IS the parallel, so latitude must
  // stay at zero and longitude advance evenly — the easiest case to get
  // wrong by interpolating lon/lat linearly instead of on the sphere.
  it('keeps an equatorial arc on the equator', () => {
    const pts = lonsLats(greatCircleArc(0, 0, 80, 0, 8))
    for (const [lon, lat] of pts) {
      expect(lat).toBeCloseTo(0, 9)
      expect(Number.isFinite(lon)).toBe(true)
    }
    expect(pts[4]?.[0]).toBeCloseTo(40, 6)
  })

  // A meridian arc keeps longitude fixed while latitude sweeps.
  it('keeps a north-south arc on one meridian', () => {
    const pts = lonsLats(greatCircleArc(11.08, 20, 11.08, 60, 8))
    for (const [lon] of pts) expect(lon).toBeCloseTo(11.08, 6)
    expect(pts[4]?.[1]).toBeCloseTo(40, 6)
  })

  // The whole reason for slerping rather than lerping: between two points
  // at the same high latitude the great circle bulges poleward, and a
  // linear interpolation would draw a straight parallel instead.
  it('bows poleward between two points at the same high latitude', () => {
    const pts = lonsLats(greatCircleArc(-73.87, 50, 24.94, 50, 16))
    const mid = pts[8]
    expect(mid?.[1]).toBeGreaterThan(50)
  })

  it('handles coincident endpoints without producing NaN', () => {
    const pts = lonsLats(greatCircleArc(11.08, 49.45, 11.08, 49.45, 8))
    for (const [lon, lat] of pts) {
      expect(Number.isNaN(lon)).toBe(false)
      expect(Number.isNaN(lat)).toBe(false)
    }
  })
})
