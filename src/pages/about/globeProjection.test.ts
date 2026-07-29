import { describe, it, expect } from 'vitest'
import { project, graticule } from './globeProjection'

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

describe('graticule', () => {
  it('emits a meridian per step plus the parallels between the poles', () => {
    const lines = graticule(30, 5)
    // 12 meridians (360/30) + 5 parallels (-60..60 by 30)
    expect(lines).toHaveLength(17)
  })

  it('emits flat lon/lat pairs within valid ranges', () => {
    for (const line of graticule()) {
      expect(line.length % 2).toBe(0)
      expect(line.length).toBeGreaterThanOrEqual(4)
      for (let i = 0; i < line.length; i += 2) {
        expect(line[i]).toBeGreaterThanOrEqual(-180)
        expect(line[i]).toBeLessThanOrEqual(180)
        expect(line[i + 1]).toBeGreaterThanOrEqual(-90)
        expect(line[i + 1]).toBeLessThanOrEqual(90)
      }
    }
  })

  it('omits degenerate parallels at the poles', () => {
    for (const line of graticule()) {
      const lats = []
      for (let i = 1; i < line.length; i += 2) lats.push(line[i])
      const isParallel = new Set(lats).size === 1
      if (isParallel) expect(Math.abs(lats[0])).toBeLessThan(90)
    }
  })
})
