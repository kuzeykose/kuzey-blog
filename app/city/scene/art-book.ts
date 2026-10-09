import { INK, mulberry32, rgba, shade } from './sketch'
import { C } from './palette'

// Canvases for the book itself: the printed spread, cloth, page edges, the
// table and the surfaces of the stepped platform.

export const PAGE_W = 8.2
export const PAGE_D = 10.8

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = Math.round(w)
  c.height = Math.round(h)
  return c
}

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, seed: number) {
  const img = ctx.getImageData(0, 0, w, h)
  const rnd = mulberry32(seed)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * amount
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
}

// ---------------------------------------------------------------------------
// The printed spreads: storybook maps drawn in spread coordinates (x across
// the book with the gutter at 0, z towards the reader), then split in two at
// the gutter.

type Line = [number, number][]
type LabelOpts = { italic?: boolean; color?: string; spacing?: number }

const X0 = -PAGE_W
const X1 = PAGE_W
const Z0 = -PAGE_D / 2
const Z1 = PAGE_D / 2

class MapSheet {
  readonly cv: HTMLCanvasElement
  readonly c: CanvasRenderingContext2D
  readonly rnd: () => number

  constructor(seed: number, ppu = 120) {
    this.cv = canvas(PAGE_W * 2 * ppu, PAGE_D * ppu)
    this.c = this.cv.getContext('2d', { willReadFrequently: true })!
    this.rnd = mulberry32(seed)
    const c = this.c
    c.setTransform(ppu, 0, 0, ppu, PAGE_W * ppu, (PAGE_D / 2) * ppu)
    c.lineJoin = 'round'
    c.lineCap = 'round'
    // Paper with a few foxing stains.
    c.fillStyle = '#f5eedd'
    c.fillRect(X0, Z0, X1 - X0, Z1 - Z0)
    for (let i = 0; i < 40; i++) this.bloom(this.r(X0, X1), this.r(Z0, Z1), this.r(0.3, 1.4), 'rgba(214,190,150,0.10)')
  }

  r(a: number, b: number) {
    return a + (b - a) * this.rnd()
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.rnd() * arr.length)]
  }

  bloom(x: number, z: number, rad: number, color: string) {
    const g = this.c.createRadialGradient(x, z, 0, x, z, rad)
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    this.c.fillStyle = g
    this.c.fillRect(x - rad, z - rad, rad * 2, rad * 2)
  }

  // A wavy shoreline running front to back at x ≈ base.
  shore(base: number, amp: number, seed: number): Line {
    const out: Line = []
    const rr = mulberry32(seed)
    const p1 = rr() * 6
    const p2 = rr() * 6
    for (let z = Z0 - 0.2; z <= Z1 + 0.2; z += 0.1) {
      out.push([base + Math.sin(z * 0.55 + p1) * amp + Math.sin(z * 1.7 + p2) * amp * 0.3, z])
    }
    return out
  }

  // A shore running across the page at z ≈ base.
  coast(base: number, amp: number, seed: number): Line {
    const out: Line = []
    const rr = mulberry32(seed)
    const p1 = rr() * 6
    const p2 = rr() * 6
    for (let x = X0 - 0.2; x <= X1 + 0.2; x += 0.1) {
      out.push([x, base + Math.sin(x * 0.4 + p1) * amp + Math.sin(x * 1.3 + p2) * amp * 0.3])
    }
    return out
  }

  // Fill a region with watercolour water, engraved ripples along `shores`
  // (each pushed out in direction [dx, dz]) and little wave ticks.
  water(region: Path2D, shores: [Line, number, number][], color: string = C.water, deep: string = C.waterDeep) {
    const c = this.c
    c.save()
    c.clip(region)
    c.fillStyle = color
    c.fillRect(X0, Z0, X1 - X0, Z1 - Z0)
    for (let i = 0; i < 60; i++) {
      this.bloom(this.r(X0, X1), this.r(Z0, Z1), this.r(0.4, 1.6), rgba(this.rnd() < 0.5 ? deep : '#b9d6dd', 0.35))
    }
    shores.forEach(([line, dx, dz]) => {
      for (let k = 1; k <= 4; k++) {
        c.strokeStyle = rgba('#3d6b80', 0.35 - k * 0.06)
        c.lineWidth = 0.014
        c.beginPath()
        line.forEach(([x, z], i) => (i ? c.lineTo(x + dx * k * 0.14, z + dz * k * 0.14) : c.moveTo(x + dx * k * 0.14, z + dz * k * 0.14)))
        c.stroke()
      }
    })
    c.strokeStyle = rgba('#3d6b80', 0.5)
    c.lineWidth = 0.016
    for (let i = 0; i < 140; i++) {
      const x = this.r(X0 + 0.3, X1 - 0.3)
      const z = this.r(Z0 + 0.3, Z1 - 0.3)
      c.beginPath()
      c.moveTo(x - 0.12, z)
      c.quadraticCurveTo(x - 0.06, z - 0.06, x, z)
      c.quadraticCurveTo(x + 0.06, z + 0.06, x + 0.12, z)
      c.stroke()
    }
    c.restore()
  }

  fill(region: Path2D, color: string) {
    const c = this.c
    c.save()
    c.clip(region)
    c.fillStyle = color
    c.fillRect(X0, Z0, X1 - X0, Z1 - Z0)
    c.restore()
  }

  // A street drawn as a pale band with inked kerbs.
  road(draw: () => void, w: number) {
    const c = this.c
    c.strokeStyle = rgba(INK, 0.55)
    c.lineWidth = w + 0.03
    c.beginPath()
    draw()
    c.stroke()
    c.strokeStyle = '#fbf6ea'
    c.lineWidth = w
    c.beginPath()
    draw()
    c.stroke()
  }

  ink(lines: Line[], width = 0.03) {
    const c = this.c
    c.strokeStyle = INK
    c.lineWidth = width
    lines.forEach((line) => {
      c.beginPath()
      line.forEach(([x, z], i) => (i ? c.lineTo(x, z) : c.moveTo(x, z)))
      c.stroke()
    })
  }

  // Piers sticking out from a shoreline into the water on side `dir`.
  piers(line: Line, dir: number, from = Z0 + 0.6, to = Z1 - 0.3, step = 0.75) {
    const c = this.c
    for (let z = from; z < to; z += step) {
      const p = line.reduce((best, q) => (Math.abs(q[1] - z) < Math.abs(best[1] - z) ? q : best))
      c.fillStyle = '#e6d6b6'
      c.strokeStyle = INK
      c.lineWidth = 0.014
      c.beginPath()
      c.rect(dir < 0 ? p[0] - 0.42 : p[0] - 0.02, z - 0.06, 0.44, 0.12)
      c.fill()
      c.stroke()
    }
  }

  boat(x: number, z: number, len: number, hull: string, deck: string, ang = 0) {
    const c = this.c
    c.save()
    c.translate(x, z)
    c.rotate(ang)
    // Wake.
    c.strokeStyle = 'rgba(255,255,255,0.8)'
    c.lineWidth = 0.02
    for (let k = 1; k <= 3; k++) {
      c.beginPath()
      c.moveTo(-len / 2 - k * 0.12, -0.04 * k)
      c.lineTo(-len / 2 - k * 0.12 - 0.25, -0.1 * k)
      c.moveTo(-len / 2 - k * 0.12, 0.04 * k)
      c.lineTo(-len / 2 - k * 0.12 - 0.25, 0.1 * k)
      c.stroke()
    }
    c.fillStyle = hull
    c.strokeStyle = INK
    c.lineWidth = 0.018
    c.beginPath()
    c.moveTo(-len / 2, -len * 0.2)
    c.lineTo(len * 0.25, -len * 0.2)
    c.quadraticCurveTo(len / 2 + len * 0.1, 0, len * 0.25, len * 0.2)
    c.lineTo(-len / 2, len * 0.2)
    c.closePath()
    c.fill()
    c.stroke()
    c.fillStyle = deck
    c.fillRect(-len * 0.32, -len * 0.1, len * 0.52, len * 0.2)
    c.strokeRect(-len * 0.32, -len * 0.1, len * 0.52, len * 0.2)
    c.fillStyle = rgba(INK, 0.6)
    for (let k = 0; k < 4; k++) c.fillRect(-len * 0.26 + k * len * 0.12, -len * 0.04, len * 0.05, len * 0.08)
    c.restore()
  }

  dotted(draw: () => void) {
    const c = this.c
    c.setLineDash([0.06, 0.07])
    c.strokeStyle = rgba(INK, 0.5)
    c.lineWidth = 0.014
    c.beginPath()
    draw()
    c.stroke()
    c.setLineDash([])
  }

  // `north` turns the rose (0 = north at the top of the page).
  compass(x: number, z: number, north = 0) {
    const c = this.c
    c.save()
    c.translate(x, z)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2 + north
      const len = i % 2 ? 0.32 : 0.58
      c.fillStyle = i % 2 ? '#e8dcc0' : i === 0 ? C.red : '#2f4566'
      c.strokeStyle = INK
      c.lineWidth = 0.012
      c.beginPath()
      c.moveTo(0, 0)
      c.lineTo(Math.cos(a - 0.25) * len * 0.3, Math.sin(a - 0.25) * len * 0.3)
      c.lineTo(Math.cos(a) * len, Math.sin(a) * len)
      c.lineTo(Math.cos(a + 0.25) * len * 0.3, Math.sin(a + 0.25) * len * 0.3)
      c.closePath()
      c.fill()
      c.stroke()
    }
    c.beginPath()
    c.arc(0, 0, 0.42, 0, Math.PI * 2)
    c.stroke()
    // The N stays upright, just past the north point.
    const r = Math.cos(north) > 0 ? 0.66 : 0.86
    c.fillStyle = INK
    c.translate(Math.sin(north) * r, -Math.cos(north) * r)
    c.scale(0.002, 0.002)
    c.font = 'bold 100px Georgia, serif'
    c.textAlign = 'center'
    c.fillText('N', 0, 0)
    c.restore()
  }

  label(t: string, x: number, z: number, size: number, rot = 0, o: LabelOpts = {}) {
    const c = this.c
    c.save()
    c.translate(x, z)
    c.rotate(rot)
    c.scale(size / 100, size / 100)
    c.font = `${o.italic ? 'italic ' : ''}600 100px Georgia, "Times New Roman", serif`
    ;(c as any).letterSpacing = `${o.spacing ?? 18}px`
    c.textAlign = 'center'
    c.fillStyle = o.color ?? rgba(INK, 0.75)
    c.fillText(t, 0, 0)
    c.restore()
  }

  // A ribbon-ended title plate.
  cartouche(x: number, z: number, title: string, sub: string) {
    const c = this.c
    c.save()
    c.translate(x, z)
    c.fillStyle = '#fbf3df'
    c.strokeStyle = INK
    c.lineWidth = 0.02
    c.beginPath()
    c.moveTo(-1.55, -0.3)
    c.lineTo(1.55, -0.3)
    c.lineTo(1.35, 0.0)
    c.lineTo(1.55, 0.3)
    c.lineTo(-1.55, 0.3)
    c.lineTo(-1.35, 0.0)
    c.closePath()
    c.fill()
    c.stroke()
    c.restore()
    this.label(title, x, z + 0.07, 0.3, 0, { italic: true, spacing: 2, color: INK })
    this.label(sub, x, z + 0.25, 0.1, 0, { italic: true, spacing: 2 })
  }

  // Page frames, page numbers and the shadow down the gutter, then split.
  finish(pages: [string, string]) {
    const c = this.c
    c.strokeStyle = rgba(INK, 0.55)
    for (const [a, b] of [
      [X0 + 0.3, -0.35],
      [0.35, X1 - 0.3],
    ]) {
      c.lineWidth = 0.025
      c.strokeRect(a, Z0 + 0.3, b - a, PAGE_D - 0.6)
      c.lineWidth = 0.01
      c.strokeRect(a + 0.08, Z0 + 0.38, b - a - 0.16, PAGE_D - 0.76)
    }
    this.label(pages[0], X0 + 0.65, Z1 - 0.06, 0.16, 0, { spacing: 0 })
    this.label(pages[1], X1 - 0.65, Z1 - 0.06, 0.16, 0, { spacing: 0 })

    const gl = c.createLinearGradient(-0.9, 0, 0.9, 0)
    gl.addColorStop(0, 'rgba(70,50,30,0)')
    gl.addColorStop(0.42, 'rgba(70,50,30,0.12)')
    gl.addColorStop(0.5, 'rgba(70,50,30,0.32)')
    gl.addColorStop(0.58, 'rgba(70,50,30,0.12)')
    gl.addColorStop(1, 'rgba(70,50,30,0)')
    c.fillStyle = gl
    c.fillRect(-0.9, Z0, 1.8, PAGE_D)

    c.setTransform(1, 0, 0, 1, 0, 0)
    noise(c, this.cv.width, this.cv.height, 14, 9)
    const half = (left: boolean) => {
      const h = canvas(this.cv.width / 2, this.cv.height)
      h.getContext('2d')!.drawImage(this.cv, left ? 0 : -this.cv.width / 2, 0)
      return h
    }
    return { left: half(true), right: half(false) }
  }
}

const between = (a: Line, b: Line) => {
  const p = new Path2D()
  a.forEach(([x, z], i) => (i ? p.lineTo(x, z) : p.moveTo(x, z)))
  for (let i = b.length - 1; i >= 0; i--) p.lineTo(b[i][0], b[i][1])
  p.closePath()
  return p
}

// Manhattan between the Hudson and the East River, with Liberty Island.
export function manhattanSpread(first: number) {
  const m = new MapSheet(42)
  const { c } = m
  const west = m.shore(-3.4, 0.25, 3)
  const east = m.shore(3.15, 0.22, 4)
  const brooklyn = m.shore(7.05, 0.18, 5)
  const farLeft: Line = [[X0 - 1, Z0 - 1], [X0 - 1, Z1 + 1]]
  const farRight: Line = [[X1 + 1, Z0 - 1], [X1 + 1, Z1 + 1]]

  const water = new Path2D()
  water.addPath(between(farLeft, west))
  water.addPath(between(east, brooklyn))
  m.water(water, [
    [west, -1, 0],
    [east, 1, 0],
    [brooklyn, -1, 0],
  ])
  const manhattan = between(west, east)
  const bk = between(brooklyn, farRight)
  m.fill(manhattan, C.land)
  m.fill(bk, C.land)

  // Street grid on Manhattan.
  c.save()
  c.clip(manhattan)
  const avenues = [-2.75, -1.6, -0.5, 0.6, 1.7, 2.75]
  const streets: number[] = []
  for (let z = Z0 + 0.25; z < Z1; z += 0.62) streets.push(z)
  // Blocks get a light hatch.
  c.strokeStyle = rgba(INK, 0.12)
  c.lineWidth = 0.01
  for (let x = X0; x < X1; x += 0.09) {
    c.beginPath()
    c.moveTo(x, Z0)
    c.lineTo(x + 3, Z1)
    c.stroke()
  }
  // Central Park.
  c.fillStyle = '#b8cf98'
  c.fillRect(-1.6, Z0 + 0.2, 3.3, 2.3)
  for (let i = 0; i < 70; i++) {
    c.fillStyle = rgba(C.greenDark, 0.55)
    c.beginPath()
    c.arc(m.r(-1.5, 1.6), m.r(Z0 + 0.3, Z0 + 2.4), m.r(0.05, 0.11), 0, Math.PI * 2)
    c.fill()
  }
  c.fillStyle = rgba('#8fb6c4', 0.9)
  c.beginPath()
  c.ellipse(0.3, Z0 + 1.0, 0.55, 0.28, 0.2, 0, Math.PI * 2)
  c.fill()
  avenues.forEach((x) =>
    m.road(() => {
      c.moveTo(x, Z0 - 1)
      c.lineTo(x, Z1 + 1)
    }, 0.16)
  )
  streets.forEach((z) =>
    m.road(() => {
      c.moveTo(X0, z)
      c.lineTo(X1, z)
    }, 0.09)
  )
  // Broadway cuts across the grid.
  m.road(() => {
    c.moveTo(-3.4, Z1 + 0.5)
    c.bezierCurveTo(-1.5, 2.5, 0.5, 0.0, 2.2, Z0 - 0.5)
  }, 0.2)
  // Crosswalk stripes at a few front intersections.
  c.fillStyle = rgba(INK, 0.55)
  for (const x of [-1.6, -0.5, 0.6, 1.7]) {
    for (const z of streets.filter((z) => z > 2.4)) {
      for (let k = -3; k <= 3; k++) c.fillRect(x + k * 0.035 - 0.012, z - 0.13, 0.016, 0.07)
    }
  }
  c.restore()

  m.ink([west, east, brooklyn])
  m.piers(west, -1)
  m.piers(east, 1)

  // Brooklyn: little rows of houses and trees.
  c.save()
  c.clip(bk)
  for (let z = Z0 + 0.35; z < Z1 - 0.3; z += 0.42) {
    for (let x = 7.35; x < X1 - 0.25; x += 0.3) {
      if (m.rnd() < 0.3) {
        c.fillStyle = rgba(C.greenDark, 0.45)
        c.beginPath()
        c.arc(x + 0.1, z + 0.12, m.r(0.06, 0.1), 0, Math.PI * 2)
        c.fill()
      } else {
        c.fillStyle = rgba(m.rnd() < 0.5 ? C.brick : C.brownstone, 0.28)
        c.strokeStyle = rgba(INK, 0.3)
        c.lineWidth = 0.008
        const w = m.r(0.14, 0.22)
        const d = m.r(0.18, 0.26)
        c.fillRect(x, z, w, d)
        c.strokeRect(x, z, w, d)
      }
    }
  }
  c.restore()

  // Liberty Island with its star fort.
  const lx = -5.6
  const lz = 1.2
  c.fillStyle = '#e9dcbc'
  c.strokeStyle = INK
  c.lineWidth = 0.025
  c.beginPath()
  c.ellipse(lx, lz, 0.95, 0.62, -0.2, 0, Math.PI * 2)
  c.fill()
  c.stroke()
  c.fillStyle = '#bfd3a2'
  c.beginPath()
  c.ellipse(lx, lz, 0.82, 0.5, -0.2, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#d8c7a4'
  c.beginPath()
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2
    const rr = i % 2 ? 0.28 : 0.45
    const x = lx + Math.cos(a) * rr
    const z = lz + Math.sin(a) * rr * 0.75
    i ? c.lineTo(x, z) : c.moveTo(x, z)
  }
  c.closePath()
  c.fill()
  c.lineWidth = 0.015
  c.stroke()

  m.boat(-6.7, 3.6, 0.9, '#ee7d33', '#fff4df', -0.35)
  m.boat(-4.3, -2.4, 0.45, '#f6f0e2', '#9c6b48', 1.2)
  m.boat(5.3, -2.6, 0.5, C.red, '#2f4566', 2.0)
  m.boat(6.2, 3.0, 0.55, '#2f4566', '#f6f0e2', -1.4)
  // Dotted ferry route out to the island.
  m.dotted(() => {
    c.moveTo(-3.5, 4.4)
    c.quadraticCurveTo(-5.0, 3.2, -5.1, 1.75)
  })
  m.compass(5.6, 4.15)

  m.label('HUDSON  RIVER', -7.35, -1.2, 0.3, -Math.PI / 2, { color: rgba('#2f5468', 0.8) })
  m.label('EAST  RIVER', 5.15, -1.6, 0.26, Math.PI / 2, { color: rgba('#2f5468', 0.8) })
  m.label('BROOKLYN', 7.7, 0.4, 0.2, Math.PI / 2)
  m.label('Liberty Island', -5.6, 2.15, 0.14, 0, { italic: true, spacing: 2 })
  m.label('Broadway', -2.05, 3.9, 0.15, -0.95, { italic: true, spacing: 4 })
  m.label('Central Park', 0.05, Z0 + 2.35, 0.13, 0, { italic: true, spacing: 2 })
  m.label('M A N H A T T A N', 0, 4.95, 0.22, 0, { spacing: 10 })
  m.cartouche(-5.7, 4.55, 'New York', '· the city, in paper ·')
  return m.finish([String(first), String(first + 1)])
}

// Brooklyn: the East River on the left with Manhattan's shore beyond, a
// tilted street grid, Prospect Park, and Coney Island's beach on the
// Atlantic along the front.
export function brooklynSpread(first: number) {
  const m = new MapSheet(77)
  const { c } = m
  // Manhattan ends at the Battery; Brooklyn's shore swings west past Red
  // Hook, leaving room for Downtown and Atlantic Avenue.
  const ease = (a: number, b: number, v: number) => {
    const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
    return t * t * (3 - 2 * t)
  }
  const manhattanShore = m.shore(-7.3, 0.15, 11).map(([x, z]) => [x - 1.8 * ease(-1.2, 0.4, z), z] as [number, number])
  const shore = m.shore(-4.5, 0.3, 12).map(([x, z]) => [x - 2.9 * ease(-1.6, 1.0, z), z] as [number, number])
  const beach = m.coast(2.75, 0.18, 13)
  const surf = beach.map(([x, z]) => [x, z + 0.75] as [number, number])
  const farLeft: Line = [[X0 - 1, Z0 - 1], [X0 - 1, Z1 + 1]]
  const front: Line = [[X1 + 1, Z1 + 1], [X0 - 1, Z1 + 1]]

  const river = between(manhattanShore, shore)
  m.water(river, [
    [shore, -1, 0],
    [manhattanShore, 1, 0],
  ])
  const ocean = new Path2D()
  surf.forEach(([x, z], i) => (i ? ocean.lineTo(x, z) : ocean.moveTo(x, z)))
  front.forEach(([x, z]) => ocean.lineTo(x, z))
  ocean.closePath()
  m.water(ocean, [[surf, 0, 1]], '#86b7cc', '#5f9ab4')
  m.fill(between(farLeft, manhattanShore), C.land)

  // Brooklyn itself, bounded by the river and the beach.
  const land = new Path2D()
  shore.forEach(([x, z], i) => (i ? land.lineTo(x, z) : land.moveTo(x, z)))
  land.lineTo(X1 + 1, Z1 + 1)
  land.lineTo(X1 + 1, Z0 - 1)
  land.closePath()
  c.save()
  c.clip(land)
  // Stop the land at the sand.
  const dry = new Path2D()
  dry.moveTo(X0 - 1, Z0 - 1)
  dry.lineTo(X1 + 1, Z0 - 1)
  for (let i = beach.length - 1; i >= 0; i--) dry.lineTo(beach[i][0], beach[i][1])
  dry.closePath()
  c.clip(dry)
  c.fillStyle = C.land
  c.fillRect(X0, Z0, X1 - X0, Z1 - Z0)
  // Light hatching on the blocks, then a grid tilted like Brooklyn's.
  c.strokeStyle = rgba(INK, 0.12)
  c.lineWidth = 0.01
  for (let x = X0 - 4; x < X1; x += 0.09) {
    c.beginPath()
    c.moveTo(x, Z0)
    c.lineTo(x + 3, Z1)
    c.stroke()
  }
  c.save()
  c.rotate(-0.3)
  for (let x = X0 - 4; x < X1 + 4; x += 1.05) {
    m.road(() => {
      c.moveTo(x, Z0 - 4)
      c.lineTo(x, Z1 + 4)
    }, 0.12)
  }
  for (let z = Z0 - 4; z < Z1 + 4; z += 0.6) {
    m.road(() => {
      c.moveTo(X0 - 4, z)
      c.lineTo(X1 + 4, z)
    }, 0.08)
  }
  c.restore()
  // Ocean Parkway runs down to the sea.
  m.road(() => {
    c.moveTo(1.4, Z0 - 0.5)
    c.bezierCurveTo(1.6, -1, 0.6, 1.5, 0.9, Z1)
  }, 0.2)
  // Prospect Park with its lake and Grand Army Plaza.
  c.fillStyle = '#b8cf98'
  c.beginPath()
  c.moveTo(2.4, -4.4)
  c.lineTo(5.6, -4.1)
  c.lineTo(6.1, -1.6)
  c.lineTo(3.0, -1.1)
  c.closePath()
  c.fill()
  c.strokeStyle = rgba(INK, 0.5)
  c.lineWidth = 0.02
  c.stroke()
  for (let i = 0; i < 80; i++) {
    c.fillStyle = rgba(C.greenDark, 0.55)
    c.beginPath()
    c.arc(m.r(2.7, 5.8), m.r(-4.1, -1.5), m.r(0.05, 0.11), 0, Math.PI * 2)
    c.fill()
  }
  c.fillStyle = rgba('#8fb6c4', 0.9)
  c.beginPath()
  c.ellipse(4.6, -2.0, 0.6, 0.3, -0.2, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#fbf6ea'
  c.strokeStyle = INK
  c.lineWidth = 0.015
  c.beginPath()
  c.arc(2.3, -4.55, 0.28, 0, Math.PI * 2)
  c.fill()
  c.stroke()
  // Rows of houses and trees in the neighbourhoods.
  for (let i = 0; i < 260; i++) {
    const x = m.r(-4.2, X1 - 0.3)
    const z = m.r(Z0 + 0.3, 2.5)
    if (x > 2.3 && x < 6.2 && z > -4.5 && z < -1.0) continue
    if (m.rnd() < 0.3) {
      c.fillStyle = rgba(C.greenDark, 0.4)
      c.beginPath()
      c.arc(x, z, m.r(0.05, 0.09), 0, Math.PI * 2)
      c.fill()
    } else {
      c.fillStyle = rgba(m.rnd() < 0.5 ? C.brick : C.brownstone, 0.22)
      c.fillRect(x, z, m.r(0.12, 0.2), m.r(0.14, 0.22))
    }
  }
  c.restore()

  // Sand, the boardwalk and beach umbrellas.
  const sand = between(beach, surf)
  m.fill(sand, '#f1dfae')
  c.save()
  c.clip(sand)
  for (let i = 0; i < 260; i++) {
    c.fillStyle = rgba('#c9a868', m.r(0.2, 0.5))
    c.fillRect(m.r(X0, X1), m.r(1.5, Z1), 0.015, 0.015)
  }
  for (let i = 0; i < 26; i++) {
    const x = m.r(-3.8, X1 - 0.6)
    const z = m.r(beach[0][1] + 0.25, beach[0][1] + 0.65)
    c.fillStyle = [C.red, C.taxi, '#3f6fb0', '#f6f0e2'][i % 4]
    c.beginPath()
    c.arc(x, z, 0.09, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = rgba(INK, 0.5)
    c.lineWidth = 0.008
    c.stroke()
  }
  c.restore()
  c.strokeStyle = '#a77b4f'
  c.lineWidth = 0.14
  c.beginPath()
  beach.forEach(([x, z], i) => (i ? c.lineTo(x, z + 0.08) : c.moveTo(x, z + 0.08)))
  c.stroke()
  c.strokeStyle = rgba(INK, 0.45)
  c.lineWidth = 0.008
  for (let x = X0; x < X1; x += 0.07) {
    const p = beach.reduce((best, q) => (Math.abs(q[0] - x) < Math.abs(best[0] - x) ? q : best))
    c.beginPath()
    c.moveTo(x, p[1] + 0.01)
    c.lineTo(x, p[1] + 0.15)
    c.stroke()
  }

  m.ink([manhattanShore, shore, beach])
  m.piers(shore, -1, Z0 + 0.6, -0.8, 0.85)
  // Manhattan's waterfront across the river.
  c.save()
  c.clip(between(farLeft, manhattanShore))
  for (let z = Z0 + 0.3; z < Z1 - 0.3; z += 0.36) {
    for (let x = X0 + 0.25; x < -7.4; x += 0.26) {
      c.fillStyle = rgba(m.rnd() < 0.5 ? C.slate : C.brick, 0.3)
      c.fillRect(x, z, 0.16, 0.24)
    }
  }
  c.restore()

  m.boat(-5.9, -3.1, 0.55, '#2f4566', '#f6f0e2', 1.6)
  m.boat(-7.85, 2.5, 0.75, '#ee7d33', '#fff4df', -1.5)
  m.boat(-2.5, 4.7, 0.6, '#f6f0e2', '#9c6b48', 0.15)
  m.boat(4.8, 4.9, 0.5, C.red, '#f6f0e2', 3.0)
  m.dotted(() => {
    c.moveTo(-7.85, 1.8)
    c.quadraticCurveTo(-6.6, -1.0, -6.0, -3.6)
  })
  m.compass(6.6, 4.45)

  m.label('EAST  RIVER', -5.95, -2.3, 0.28, -Math.PI / 2, { color: rgba('#2f5468', 0.8) })
  m.label('MANHATTAN', -7.75, -2.6, 0.18, -Math.PI / 2)
  m.label('B R O O K L Y N', 0.6, -0.4, 0.26, -0.3, { spacing: 10 })
  m.label('Prospect Park', 4.35, -1.45, 0.14, -0.1, { italic: true, spacing: 2 })
  m.label('DUMBO', -3.6, -4.3, 0.13, 0, { spacing: 6 })
  m.label('Williamsburg', -3.4, -2.2, 0.13, -0.3, { italic: true, spacing: 2 })
  m.label('Coney Island', 2.6, 2.45, 0.15, 0, { italic: true, spacing: 2 })
  m.label('A T L A N T I C   O C E A N', 1.2, 5.0, 0.2, 0, { color: rgba('#2f5468', 0.85), spacing: 8 })
  m.cartouche(-4.4, 4.4, 'Brooklyn', '· how sweet it is ·')
  return m.finish([String(first), String(first + 1)])
}

// ---------------------------------------------------------------------------
// Central Park, looking south: Central Park South along the back, Fifth
// Avenue down the left, Central Park West down the right, and the
// Reservoir at the front.
export function centralParkSpread(first: number) {
  const m = new MapSheet(91)
  const { c } = m
  const east = -7.0
  const west = 7.0
  const south = -4.45

  // The city round the park.
  c.fillStyle = C.land
  c.fillRect(X0, Z0, X1 - X0, Z1 - Z0)
  for (let z = Z0 + 0.1; z < Z1; z += 0.42) {
    for (const [a, b] of [
      [X0, east - 0.2],
      [west + 0.2, X1],
    ]) {
      for (let x = a + 0.05; x < b - 0.1; x += 0.24) {
        c.fillStyle = rgba(m.pick([C.brick, C.brownstone, C.slate, C.limestoneDark]), 0.3)
        c.fillRect(x, z, 0.18, 0.3)
      }
    }
  }
  for (let x = X0; x < X1; x += 0.5) {
    c.fillStyle = rgba(m.pick([C.brick, C.limestoneDark, C.slate]), 0.3)
    c.fillRect(x, Z0 + 0.1, 0.4, south - Z0 - 0.4)
  }
  for (const x of [east, west]) {
    m.road(() => {
      c.moveTo(x, Z0 - 1)
      c.lineTo(x, Z1 + 1)
    }, 0.24)
  }
  m.road(() => {
    c.moveTo(X0 - 1, south)
    c.lineTo(X1 + 1, south)
  }, 0.22)

  // The park itself.
  const park = new Path2D()
  park.rect(east + 0.16, south + 0.16, west - east - 0.32, Z1 - south)
  m.fill(park, '#b8cf98')
  c.save()
  c.clip(park)
  // Lawns, then trees in their October colours.
  for (let i = 0; i < 14; i++) m.bloom(m.r(east, west), m.r(south, Z1), m.r(0.6, 1.4), 'rgba(214,230,170,0.5)')
  const leaves = ['#6f9a55', '#557f4b', '#7fa860', '#d98b3c', '#c9583a', '#e6bb4c', '#e3923f']
  for (let i = 0; i < 900; i++) {
    c.fillStyle = rgba(m.pick(leaves), m.r(0.55, 0.85))
    c.beginPath()
    c.arc(m.r(east + 0.2, west - 0.2), m.r(south + 0.2, Z1), m.r(0.05, 0.11), 0, Math.PI * 2)
    c.fill()
  }
  // The drives looping round, and the Terrace Drive across.
  const drives = () => {
    c.moveTo(-3.6, south)
    c.bezierCurveTo(-5.4, -2.6, -4.6, 0.6, -5.8, Z1 + 0.5)
    c.moveTo(3.8, south)
    c.bezierCurveTo(5.4, -2.8, 4.4, 1.2, 5.9, Z1 + 0.5)
    c.moveTo(-5.1, -2.0)
    c.bezierCurveTo(-2.5, -2.3, 2.5, -1.7, 5.0, -2.0)
  }
  m.road(drives, 0.16)
  // Footpaths winding between.
  c.strokeStyle = '#f1e8d0'
  c.lineWidth = 0.055
  c.beginPath()
  for (let i = 0; i < 9; i++) {
    const x = m.r(east + 0.5, west - 0.5)
    const z = m.r(south + 0.3, Z1 - 0.5)
    c.moveTo(x, z)
    c.bezierCurveTo(x + m.r(-1.5, 1.5), z + m.r(0.3, 1.2), x + m.r(-1.5, 1.5), z + m.r(1.0, 2.0), x + m.r(-1, 1), z + m.r(1.8, 2.8))
  }
  c.stroke()

  // Water: the Pond, the Lake, Turtle Pond and the Reservoir.
  const pond = (cx: number, cz: number, rx: number, rz: number, seed: number): Line => {
    const rr = mulberry32(seed)
    const p1 = rr() * 6
    const p2 = rr() * 6
    const out: Line = []
    for (let k = 0; k <= 72; k++) {
      const a = (k / 72) * Math.PI * 2
      const w = 1 + 0.12 * Math.sin(a * 3 + p1) + 0.06 * Math.sin(a * 7 + p2)
      out.push([cx + Math.cos(a) * rx * w, cz + Math.sin(a) * rz * w])
    }
    return out
  }
  const ponds = [pond(-2.3, -2.5, 1.5, 0.55, 21), pond(3.8, 0.25, 3.0, 1.25, 22), pond(-2.4, 2.05, 0.9, 0.35, 23), pond(0.6, 4.7, 5.0, 1.1, 24)]
  const water = new Path2D()
  ponds.forEach((line) => line.forEach(([x, z], i) => (i ? water.lineTo(x, z) : water.moveTo(x, z))))
  m.water(water, [])
  m.ink(ponds, 0.022)
  // The jogging track round the Reservoir.
  m.dotted(() => {
    const track = pond(0.6, 4.7, 5.35, 1.4, 24)
    track.forEach(([x, z], i) => (i ? c.lineTo(x, z) : c.moveTo(x, z)))
  })
  c.restore()
  c.strokeStyle = INK
  c.lineWidth = 0.03
  c.stroke(park)

  // Strawberry Fields: the IMAGINE mosaic.
  c.save()
  c.translate(6.2, 2.5)
  c.scale(1, 0.85)
  c.fillStyle = '#f1ece0'
  c.beginPath()
  c.arc(0, 0, 0.42, 0, Math.PI * 2)
  c.fill()
  for (let k = 0; k < 16; k++) {
    c.fillStyle = k % 2 ? rgba(INK, 0.65) : '#d9d2c2'
    c.beginPath()
    c.moveTo(0, 0)
    c.arc(0, 0, 0.42, (k / 16) * Math.PI * 2, ((k + 1) / 16) * Math.PI * 2)
    c.closePath()
    c.fill()
  }
  c.fillStyle = '#f1ece0'
  c.beginPath()
  c.arc(0, 0, 0.2, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 0.012
  c.beginPath()
  c.arc(0, 0, 0.42, 0, Math.PI * 2)
  c.stroke()
  c.restore()
  m.label('IMAGINE', 6.2, 2.53, 0.065, 0, { color: INK, spacing: 1 })

  m.label('FIFTH  AVENUE', east, 1.2, 0.13, -Math.PI / 2, { color: rgba(INK, 0.7), spacing: 6 })
  m.label('CENTRAL  PARK  WEST', west, 1.2, 0.13, Math.PI / 2, { color: rgba(INK, 0.7), spacing: 6 })
  m.label('C E N T R A L   P A R K', -0.6, 3.3, 0.22, 0, { spacing: 10 })
  m.label('The Lake', 5.7, 1.65, 0.13, -0.05, { italic: true, spacing: 2, color: rgba('#2f5468', 0.85) })
  m.label('The Pond', -3.3, -1.75, 0.12, 0, { italic: true, spacing: 2, color: rgba('#2f5468', 0.85) })
  m.label('Turtle Pond', -1.3, 2.62, 0.1, 0, { italic: true, spacing: 2, color: rgba('#2f5468', 0.85) })
  m.label('The Reservoir', 2.6, 4.45, 0.15, 0, { italic: true, spacing: 2, color: rgba('#2f5468', 0.85) })
  m.label('Strawberry Fields', 6.2, 3.15, 0.1, 0, { italic: true, spacing: 2 })
  m.cartouche(-4.6, 4.5, 'Central Park', '· the city’s backyard ·')
  m.compass(6.6, 4.45, Math.PI)
  return m.finish([String(first), String(first + 1)])
}

// ---------------------------------------------------------------------------
// Times Square, looking south: Broadway and Seventh Avenue cross in a
// bowtie of plazas between 42nd Street at the back and Duffy Square at the
// front.
export function timesSquareSpread(first: number) {
  const m = new MapSheet(57)
  const { c } = m
  const sixth = -7.0
  const eighth = 7.0
  const streets = [-4.0, -2.75, -1.5, -0.25, 1.0, 2.25, 3.5, 4.75]
  // Broadway runs back-left to front-right, Seventh Avenue the other way.
  const broadway = (z: number) => -2.8 + ((z - Z0) / PAGE_D) * 5.8
  const seventh = (z: number) => 2.2 - ((z - Z0) / PAGE_D) * 5.6

  // Blocks crammed with buildings, and their signs.
  c.fillStyle = C.land
  c.fillRect(X0, Z0, X1 - X0, Z1 - Z0)
  for (let i = 0; i < 700; i++) {
    c.fillStyle = rgba(m.pick([C.brick, C.brownstone, C.slate, C.limestoneDark, C.terracotta]), 0.28)
    c.fillRect(m.r(X0, X1), m.r(Z0, Z1), m.r(0.15, 0.32), m.r(0.18, 0.34))
  }
  for (let i = 0; i < 260; i++) {
    c.fillStyle = rgba(m.pick(['#ff4f8b', '#ffd23f', '#3fc1ff', '#7cff6b', '#ff8a3d', '#b48cff']), 0.55)
    c.fillRect(m.r(X0, X1), m.r(Z0, Z1), m.r(0.06, 0.16), 0.05)
  }
  for (const z of streets) {
    m.road(() => {
      c.moveTo(X0 - 1, z)
      c.lineTo(X1 + 1, z)
    }, 0.16)
  }
  for (const x of [sixth, eighth]) {
    m.road(() => {
      c.moveTo(x, Z0 - 1)
      c.lineTo(x, Z1 + 1)
    }, 0.24)
  }
  // The bowtie: everything between the two avenues becomes plaza.
  const plaza = new Path2D()
  plaza.moveTo(broadway(Z0), Z0)
  plaza.lineTo(seventh(Z0), Z0)
  plaza.lineTo(seventh(Z1), Z1)
  plaza.lineTo(broadway(Z1), Z1)
  plaza.closePath()
  m.fill(plaza, '#e3d3cb')
  c.save()
  c.clip(plaza)
  c.strokeStyle = rgba(INK, 0.1)
  c.lineWidth = 0.008
  for (let x = X0; x < X1; x += 0.12) {
    c.beginPath()
    c.moveTo(x, Z0)
    c.lineTo(x + 2, Z1)
    c.stroke()
  }
  // Red tables and chairs out in the plazas.
  for (let i = 0; i < 70; i++) {
    c.fillStyle = rgba(C.red, 0.75)
    c.beginPath()
    c.arc(m.r(-3, 3), m.r(Z0, Z1), 0.05, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
  for (const f of [broadway, seventh]) {
    m.road(() => {
      c.moveTo(f(Z0 - 1), Z0 - 1)
      c.lineTo(f(Z1 + 1), Z1 + 1)
    }, 0.28)
  }
  // Duffy Square's red steps, printed small at the front.
  c.fillStyle = rgba(C.red, 0.8)
  c.fillRect(-0.9, 3.75, 1.6, 0.5)
  c.strokeStyle = INK
  c.lineWidth = 0.012
  c.strokeRect(-0.9, 3.75, 1.6, 0.5)

  // The subway: 42 St – Times Sq and its lines.
  const lines: [string, string][] = [
    ['N', '#fccc0a'],
    ['Q', '#fccc0a'],
    ['R', '#fccc0a'],
    ['W', '#fccc0a'],
    ['1', '#ee352e'],
    ['2', '#ee352e'],
    ['3', '#ee352e'],
    ['7', '#b933ad'],
    ['S', '#808183'],
  ]
  lines.forEach(([name, col], i) => {
    const x = -6.2 + i * 0.3
    c.fillStyle = col
    c.beginPath()
    c.arc(x, -3.4, 0.12, 0, Math.PI * 2)
    c.fill()
    m.label(name, x, -3.36, 0.12, 0, { color: col === '#fccc0a' ? INK : '#ffffff', spacing: 0 })
  })
  m.label('42 St – Times Sq', -5.0, -3.05, 0.12, 0, { spacing: 2 })

  const angle = (f: (z: number) => number) => Math.atan2(1, f(1) - f(0)) - Math.PI / 2
  m.label('B R O A D W A Y', broadway(3.0) + 0.22, 3.0, 0.15, angle(broadway), { spacing: 6 })
  m.label('7 T H   A V E N U E', seventh(3.0) - 0.22, 3.0, 0.15, angle(seventh), { spacing: 6 })
  m.label('6TH AVE', sixth, 0.4, 0.12, -Math.PI / 2, { color: rgba(INK, 0.7), spacing: 6 })
  m.label('8TH AVE', eighth, 0.4, 0.12, Math.PI / 2, { color: rgba(INK, 0.7), spacing: 6 })
  streets.slice(0, 7).forEach((z, i) => m.label(`W ${42 + i} ST`, -5.4, z + 0.05, 0.1, 0, { color: rgba(INK, 0.7), spacing: 3 }))
  m.label('T I M E S   S Q U A R E', 0.0, 2.85, 0.2, 0, { spacing: 10 })
  m.label('Duffy Square', -0.1, 4.45, 0.11, 0, { italic: true, spacing: 2 })
  m.label('Theater District', 4.6, 2.9, 0.14, 0, { italic: true, spacing: 2 })
  m.cartouche(-4.6, 4.5, 'Times Square', '· the crossroads of the world ·')
  m.compass(6.6, 4.45, Math.PI)
  return m.finish([String(first), String(first + 1)])
}

// ---------------------------------------------------------------------------
// Lower Manhattan from the harbour: the island narrows to the Battery at the
// front, the Hudson on the left, the East River on the right.
export function lowerManhattanSpread(first: number) {
  const m = new MapSheet(63)
  const { c } = m
  // The island: shores running front to back, curving in to the tip.
  const island = new Path2D()
  const west: Line = []
  const east: Line = []
  for (let z = Z0 - 0.2; z <= 2.9; z += 0.1) {
    const t = Math.max(0, (z + 0.5) / 3.4)
    west.push([-6.0 + 3.2 * t * t + Math.sin(z * 1.7) * 0.1, z])
    east.push([6.1 - 6.0 * t * t + Math.sin(z * 1.3 + 1) * 0.12, z])
  }
  west.forEach(([x, z], i) => (i ? island.lineTo(x, z) : island.moveTo(x, z)))
  for (let i = east.length - 1; i >= 0; i--) island.lineTo(east[i][0], east[i][1])
  island.closePath()
  const sea = new Path2D()
  sea.rect(X0 - 1, Z0 - 1, X1 - X0 + 2, Z1 - Z0 + 2)
  m.water(sea, [
    [west, -1, 0],
    [east, 1, 0],
  ])
  m.fill(island, C.land)
  c.save()
  c.clip(island)
  c.strokeStyle = rgba(INK, 0.12)
  c.lineWidth = 0.01
  for (let x = X0 - 4; x < X1; x += 0.09) {
    c.beginPath()
    c.moveTo(x, Z0)
    c.lineTo(x + 3, Z1)
    c.stroke()
  }
  for (let i = 0; i < 420; i++) {
    c.fillStyle = rgba(m.pick([C.brick, C.limestoneDark, C.slate, C.brownstone]), 0.22)
    c.fillRect(m.r(-7, 7), m.r(Z0, 3), m.r(0.12, 0.24), m.r(0.14, 0.26))
  }
  // The old, crooked street plan.
  const streets = () => {
    // Broadway down the middle to Bowling Green, and West Street.
    c.moveTo(-0.3, Z0 - 0.5)
    c.bezierCurveTo(-0.5, -2, -0.8, 0.2, -1.1, 1.6)
    c.moveTo(-5.7, Z0 - 0.5)
    c.bezierCurveTo(-5.6, -1, -4.6, 1.6, -3.0, 2.6)
    // Water Street along the East River.
    c.moveTo(5.5, Z0 - 0.5)
    c.bezierCurveTo(5.2, -1, 3.0, 1.8, 0.4, 2.6)
    for (const z of [-3.9, -2.9, -1.9, -0.9]) {
      c.moveTo(-5.8, z)
      c.lineTo(5.8, z + 0.4)
    }
  }
  m.road(streets, 0.12)
  // Wall Street, from Trinity Church to the river.
  m.road(() => {
    c.moveTo(0.0, -1.5)
    c.lineTo(5.6, -0.9)
  }, 0.16)
  // Parks: City Hall Park, Bowling Green, the Battery.
  for (const [cx, cz, rx, rz] of [
    [1.0, -4.7, 1.0, 0.5],
    [-1.2, 1.7, 0.35, 0.22],
    [-3.2, 2.5, 2.4, 0.75],
  ]) {
    c.fillStyle = '#b8cf98'
    c.beginPath()
    c.ellipse(cx, cz, rx, rz, 0, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = rgba(INK, 0.4)
    c.lineWidth = 0.015
    c.stroke()
    for (let i = 0; i < rx * 30; i++) {
      c.fillStyle = rgba(m.pick([C.greenDark, '#d98b3c', '#7fa860']), 0.6)
      c.beginPath()
      c.arc(cx + m.r(-rx, rx) * 0.8, cz + m.r(-rz, rz) * 0.7, 0.06, 0, Math.PI * 2)
      c.fill()
    }
  }
  // The memorial: two square pools where the towers stood.
  for (const [x, z] of [
    [-4.7, -2.7],
    [-3.7, -3.6],
  ]) {
    c.fillStyle = '#5f7f92'
    c.fillRect(x - 0.32, z - 0.32, 0.64, 0.64)
    c.fillStyle = '#2f4a5a'
    c.fillRect(x - 0.12, z - 0.12, 0.24, 0.24)
    c.strokeStyle = INK
    c.lineWidth = 0.015
    c.strokeRect(x - 0.32, z - 0.32, 0.64, 0.64)
  }
  c.restore()
  m.ink([west, east])
  m.piers(east, 1, -4.6, 1.4, 0.9)
  // The Brooklyn Bridge heading off over the East River.
  m.road(() => {
    c.moveTo(3.4, -4.5)
    c.lineTo(X1 + 1, -3.4)
  }, 0.2)
  for (const x of [6.9, 7.8]) {
    c.fillStyle = '#c9b791'
    c.fillRect(x - 0.08, -3.95 + (x - 6.9) * 0.18 - 0.1, 0.16, 0.2)
    c.strokeStyle = INK
    c.lineWidth = 0.012
    c.strokeRect(x - 0.08, -3.95 + (x - 6.9) * 0.18 - 0.1, 0.16, 0.2)
  }
  // The ferry's way out to Staten Island.
  m.dotted(() => {
    c.moveTo(0.4, 2.9)
    c.quadraticCurveTo(1.6, 4.0, 2.2, Z1)
  })
  m.boat(-6.6, 1.2, 0.6, '#2f4566', '#f6f0e2', 1.4)
  m.boat(5.3, 4.6, 0.5, C.red, '#f6f0e2', 0.3)

  m.label('HUDSON  RIVER', -7.2, -1.4, 0.24, -Math.PI / 2, { color: rgba('#2f5468', 0.8) })
  m.label('EAST  RIVER', 7.35, -0.6, 0.24, Math.PI / 2, { color: rgba('#2f5468', 0.8) })
  m.label('UPPER  NEW  YORK  BAY', 3.6, 5.0, 0.18, 0, { color: rgba('#2f5468', 0.85), spacing: 8 })
  m.label('F I N A N C I A L   D I S T R I C T', 1.2, 0.2, 0.18, -0.05, { spacing: 8 })
  m.label('WALL ST', 3.4, -0.95, 0.11, 0.1, { color: rgba(INK, 0.7), spacing: 4 })
  m.label('BROADWAY', -0.75, -0.6, 0.11, -1.4, { color: rgba(INK, 0.7), spacing: 4 })
  m.label('Battery Park', -2.6, 2.9, 0.13, 0, { italic: true, spacing: 2 })
  m.label('Bowling Green', -1.2, 2.05, 0.09, 0, { italic: true, spacing: 1 })
  m.label('9/11 Memorial', -4.2, -2.15, 0.1, 0, { italic: true, spacing: 1 })
  m.label('South Street Seaport', 5.0, 1.6, 0.1, -0.5, { italic: true, spacing: 1 })
  m.label('to Staten Island', 2.6, 4.35, 0.09, 0, { italic: true, spacing: 1 })
  m.cartouche(-4.6, 4.5, 'Lower Manhattan', '· where the city began ·')
  m.compass(6.6, 4.45)
  return m.finish([String(first), String(first + 1)])
}

// ---------------------------------------------------------------------------
// Midtown, looking north up Fifth Avenue: Rockefeller Center and Radio City
// on the left, St. Patrick's across the avenue, Grand Central on Park
// Avenue and the library at 42nd Street.
export function midtownSpread(first: number) {
  const m = new MapSheet(71)
  const { c } = m
  const avenues: [number, string][] = [
    [-5.3, 'AVENUE OF THE AMERICAS'],
    [0.2, 'FIFTH AVENUE'],
    [2.0, 'MADISON AVE'],
    [3.9, 'PARK AVE'],
    [6.0, 'LEXINGTON AVE'],
  ]
  const streets = [2.0, 0.9, -0.2, -1.3, -2.4, -3.5, -4.6]

  c.fillStyle = C.land
  c.fillRect(X0, Z0, X1 - X0, Z1 - Z0)
  for (let i = 0; i < 640; i++) {
    c.fillStyle = rgba(m.pick([C.brick, C.limestoneDark, C.slate, C.brownstone, C.limestone]), 0.25)
    c.fillRect(m.r(X0, X1), m.r(Z0, Z1), m.r(0.15, 0.3), m.r(0.15, 0.3))
  }
  // Bryant Park behind the library, and Rockefeller Center's plaza and
  // Channel Gardens.
  c.fillStyle = '#b8cf98'
  c.fillRect(-7.6, 1.2, 2.1, 1.1)
  for (let i = 0; i < 40; i++) {
    c.fillStyle = rgba(m.pick([C.greenDark, '#d98b3c', '#7fa860']), 0.6)
    c.beginPath()
    c.arc(m.r(-7.5, -5.6), m.r(1.25, 2.25), 0.06, 0, Math.PI * 2)
    c.fill()
  }
  c.strokeStyle = rgba(INK, 0.4)
  c.lineWidth = 0.015
  c.strokeRect(-7.6, 1.2, 2.1, 1.1)
  c.fillStyle = '#e3d6c8'
  c.fillRect(-2.6, -2.6, 2.6, 1.8)
  c.fillStyle = '#b8cf98'
  c.fillRect(-1.5, -0.8, 0.4, 0.9)
  c.strokeRect(-2.6, -2.6, 2.6, 1.8)

  for (const z of streets) {
    m.road(() => {
      c.moveTo(X0 - 1, z)
      c.lineTo(X1 + 1, z)
    }, 0.14)
  }
  for (const [x] of avenues) {
    m.road(() => {
      c.moveTo(x, Z0 - 1)
      c.lineTo(x, Z1 + 1)
    }, x === 0.2 ? 0.3 : 0.22)
  }
  // Grand Central sits across Park Avenue; the viaduct wraps round it.
  c.fillStyle = '#d6c8ad'
  c.fillRect(2.8, -0.3, 2.2, 1.0)
  c.strokeStyle = INK
  c.lineWidth = 0.015
  c.strokeRect(2.8, -0.3, 2.2, 1.0)

  avenues.forEach(([x, name]) => m.label(name, x + 0.02, 3.6, 0.1, -Math.PI / 2, { color: rgba(INK, 0.7), spacing: 4 }))
  streets.forEach((z, i) => m.label(`${42 + i * 2} ST`, 7.4, z + 0.04, 0.09, 0, { color: rgba(INK, 0.7), spacing: 3 }))
  m.label('Bryant Park', -6.55, 2.55, 0.11, 0, { italic: true, spacing: 2 })
  m.label('Rockefeller Center', -1.3, -0.45, 0.11, 0, { italic: true, spacing: 2 })
  m.label('M I D T O W N', 2.4, 3.3, 0.22, 0, { spacing: 10 })
  m.cartouche(-4.6, 4.5, 'Midtown', '· the heart of the city ·')
  m.compass(6.6, 4.45)
  return m.finish([String(first), String(first + 1)])
}

// ---------------------------------------------------------------------------
// DUMBO, looking north across the East River: Manhattan's shore at the
// back, the two bridges crossing over, the waterfront park, and cobbled
// streets with old trolley tracks.
export function dumboSpread(first: number) {
  const m = new MapSheet(83)
  const { c } = m
  const shore = m.coast(-2.35, 0.12, 31)
  const farShore = m.coast(-4.75, 0.08, 32)
  const top: Line = [[X0 - 1, Z0 - 1], [X1 + 1, Z0 - 1]]
  const front: Line = [[X1 + 1, Z1 + 1], [X0 - 1, Z1 + 1]]

  m.water(
    (() => {
      const p = new Path2D()
      farShore.forEach(([x, z], i) => (i ? p.lineTo(x, z) : p.moveTo(x, z)))
      for (let i = shore.length - 1; i >= 0; i--) p.lineTo(shore[i][0], shore[i][1])
      p.closePath()
      return p
    })(),
    [
      [shore, 0, -1],
      [farShore, 0, 1],
    ]
  )
  const land = new Path2D()
  shore.forEach(([x, z], i) => (i ? land.lineTo(x, z) : land.moveTo(x, z)))
  front.forEach(([x, z]) => land.lineTo(x, z))
  land.closePath()
  const manhattan = new Path2D()
  top.forEach(([x, z], i) => (i ? manhattan.lineTo(x, z) : manhattan.moveTo(x, z)))
  for (let i = farShore.length - 1; i >= 0; i--) manhattan.lineTo(farShore[i][0], farShore[i][1])
  manhattan.closePath()
  m.fill(manhattan, C.land)
  m.fill(land, C.land)

  c.save()
  c.clip(land)
  // Brick blocks between cobbled streets.
  for (let i = 0; i < 380; i++) {
    c.fillStyle = rgba(m.pick([C.brick, C.brickDark, C.brownstone, C.limestoneDark]), 0.26)
    c.fillRect(m.r(X0, X1), m.r(-2.2, Z1), m.r(0.15, 0.3), m.r(0.15, 0.3))
  }
  // Brooklyn Bridge Park along the water, with Pebble Beach between the
  // bridges.
  c.fillStyle = '#b8cf98'
  c.fillRect(X0, -2.5, X1 - X0, 0.75)
  for (let i = 0; i < 70; i++) {
    c.fillStyle = rgba(m.pick([C.greenDark, '#d98b3c', '#7fa860']), 0.6)
    c.beginPath()
    c.arc(m.r(X0, X1), m.r(-2.3, -1.8), m.r(0.04, 0.08), 0, Math.PI * 2)
    c.fill()
  }
  c.fillStyle = '#d6cfc2'
  c.beginPath()
  c.ellipse(-2.6, -2.15, 1.2, 0.25, 0, 0, Math.PI * 2)
  c.fill()
  for (let i = 0; i < 90; i++) {
    c.fillStyle = rgba(m.pick(['#9a958c', '#b9b4a8', '#7d7468']), 0.8)
    c.beginPath()
    c.arc(-2.6 + m.r(-1.1, 1.1), -2.15 + m.r(-0.2, 0.2), 0.025, 0, Math.PI * 2)
    c.fill()
  }
  // Cobbled streets: Water, Front and York running across, Main, Washington
  // and Jay running down to the water.
  const across = [-1.2, 0.2, 1.6, 3.0]
  const down = [-0.4, 3.5, 5.9]
  const cobbles = (draw: () => void, w: number) => {
    m.road(draw, w)
    c.save()
    c.lineWidth = w * 0.7
    c.setLineDash([0.025, 0.03])
    c.strokeStyle = rgba(INK, 0.18)
    c.beginPath()
    draw()
    c.stroke()
    c.restore()
  }
  for (const z of across) {
    cobbles(() => {
      c.moveTo(X0 - 1, z)
      c.lineTo(X1 + 1, z)
    }, 0.2)
  }
  for (const x of down) {
    cobbles(() => {
      c.moveTo(x, -1.8)
      c.lineTo(x, Z1 + 1)
    }, 0.2)
  }
  // Old trolley tracks along Water Street.
  c.strokeStyle = rgba(INK, 0.55)
  c.lineWidth = 0.012
  for (const dz of [-0.03, 0.03]) {
    c.beginPath()
    c.moveTo(X0, -1.2 + dz)
    c.lineTo(X1, -1.2 + dz)
    c.stroke()
  }
  // The carousel's pavilion by the water.
  c.fillStyle = '#e3d6c8'
  c.fillRect(-1.8, -1.95, 2.8, 0.5)
  c.strokeStyle = INK
  c.lineWidth = 0.015
  c.strokeRect(-1.8, -1.95, 2.8, 0.5)
  c.restore()
  m.ink([shore, farShore])
  // The park's old piers reaching out into the river.
  for (const x of [-6.2, 1.6, 5.0, 6.9]) {
    c.fillStyle = '#e6d6b6'
    c.strokeStyle = INK
    c.lineWidth = 0.014
    c.beginPath()
    c.rect(x - 0.25, -3.0, 0.5, 0.7)
    c.fill()
    c.stroke()
  }

  // The two bridges striding over everything to Manhattan.
  for (const [x, w] of [
    [-3.7, 0.5],
    [3.5, 0.55],
  ]) {
    m.road(() => {
      c.moveTo(x, Z0 - 1)
      c.lineTo(x, Z1 + 1)
    }, w)
    c.strokeStyle = rgba(INK, 0.35)
    c.lineWidth = 0.01
    for (let z = Z0; z < Z1; z += 0.2) {
      c.beginPath()
      c.moveTo(x - w / 2, z)
      c.lineTo(x + w / 2, z + 0.1)
      c.stroke()
    }
  }
  for (let i = 0; i < 6; i++) m.boat(m.r(-6, 6), m.r(-4.3, -2.8), m.r(0.35, 0.55), m.pick([C.red, '#2f4566', '#f6f0e2']), '#f6f0e2', m.r(-0.3, 0.3) + (i % 2 ? Math.PI : 0))

  m.label('EAST  RIVER', 0.0, -3.4, 0.24, 0, { color: rgba('#2f5468', 0.8), spacing: 10 })
  m.label('MANHATTAN', 0.0, -4.95, 0.14, 0, { spacing: 8 })
  m.label('D U M B O', 2.2, 2.45, 0.24, 0, { spacing: 10 })
  m.label('Brooklyn Bridge Park', 1.9, -1.93, 0.11, 0, { italic: true, spacing: 2 })
  m.label('Pebble Beach', -2.6, -1.78, 0.09, 0, { italic: true, spacing: 1 })
  m.label('WATER ST', -5.8, -1.15, 0.09, 0, { color: rgba(INK, 0.7), spacing: 3 })
  m.label('FRONT ST', -5.8, 0.25, 0.09, 0, { color: rgba(INK, 0.7), spacing: 3 })
  m.label('YORK ST', -5.8, 1.65, 0.09, 0, { color: rgba(INK, 0.7), spacing: 3 })
  m.label('WASHINGTON ST', 3.55, 3.8, 0.09, -Math.PI / 2, { color: rgba(INK, 0.7), spacing: 3 })
  m.label('MAIN ST', -0.35, 3.8, 0.09, -Math.PI / 2, { color: rgba(INK, 0.7), spacing: 3 })
  m.cartouche(-4.6, 4.5, 'DUMBO', '· down under the Manhattan Bridge overpass ·')
  m.compass(6.6, 4.45)
  return m.finish([String(first), String(first + 1)])
}

// ---------------------------------------------------------------------------

export function cloth(color: string, seed = 1) {
  const s = 512
  const cv = canvas(s, s)
  const c = cv.getContext('2d', { willReadFrequently: true })!
  c.fillStyle = color
  c.fillRect(0, 0, s, s)
  const rnd = mulberry32(seed)
  for (let i = 0; i < s; i += 2) {
    c.fillStyle = `rgba(255,255,255,${rnd() * 0.05})`
    c.fillRect(0, i, s, 1)
    c.fillStyle = `rgba(0,0,0,${rnd() * 0.08})`
    c.fillRect(i, 0, 1, s)
  }
  noise(c, s, s, 18, seed + 1)
  return cv
}

// Front cover: cloth with gold-stamped title and skyline. Drawn the right
// way up; the texture is rotated where it is used.
export function coverArt(w: number, h: number, base: string) {
  const ppu = 90
  const cv = canvas(w * ppu, h * ppu)
  const c = cv.getContext('2d')!
  c.drawImage(cloth(base, 3), 0, 0, cv.width, cv.height)
  c.scale(ppu, ppu)
  const gold = c.createLinearGradient(0, 0, w, h)
  gold.addColorStop(0, '#e9cd85')
  gold.addColorStop(0.5, '#c79b45')
  gold.addColorStop(1, '#e7c77a')
  c.strokeStyle = gold
  c.fillStyle = gold
  c.lineWidth = 0.05
  c.strokeRect(0.45, 0.45, w - 0.9, h - 0.9)
  c.lineWidth = 0.02
  c.strokeRect(0.6, 0.6, w - 1.2, h - 1.2)
  // Corner stars.
  for (const [x, y] of [
    [0.6, 0.6],
    [w - 0.6, 0.6],
    [0.6, h - 0.6],
    [w - 0.6, h - 0.6],
  ]) {
    c.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 ? 0.07 : 0.17
      i ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
    }
    c.closePath()
    c.fill()
  }
  const text = (t: string, y: number, size: number, style = '700', spacing = 0) => {
    c.save()
    c.translate(w / 2, y)
    c.scale(size / 100, size / 100)
    c.font = `${style} 100px Georgia, "Times New Roman", serif`
    ;(c as any).letterSpacing = `${spacing}px`
    c.textAlign = 'center'
    c.fillText(t, 0, 0)
    c.restore()
  }
  text('NEW YORK', h * 0.27, 1.15, '700', 8)
  text('a pop-up city', h * 0.27 + 0.75, 0.42, 'italic 400', 2)
  // Gold line skyline.
  c.lineWidth = 0.035
  c.beginPath()
  const base0 = h * 0.72
  const sky: [number, number][] = [
    [1.1, 0], [1.1, -0.9], [1.5, -0.9], [1.5, -1.5], [1.8, -1.5], [1.8, -1.0], [2.2, -1.0], [2.2, -2.1],
    [2.35, -2.1], [2.45, -2.9], [2.55, -2.1], [2.7, -2.1], [2.7, -1.2], [3.1, -1.2], [3.1, -1.9], [3.35, -2.3],
    [3.6, -1.9], [3.6, -0.8], [w / 2 - 0.35, -0.8], [w / 2 - 0.35, -2.4], [w / 2 - 0.2, -2.4], [w / 2 - 0.2, -2.8],
    [w / 2 - 0.08, -2.8], [w / 2 - 0.08, -3.1], [w / 2, -3.6], [w / 2 + 0.08, -3.1], [w / 2 + 0.08, -2.8],
    [w / 2 + 0.2, -2.8], [w / 2 + 0.2, -2.4], [w / 2 + 0.35, -2.4], [w / 2 + 0.35, -1.1], [w - 3.3, -1.1],
    [w - 3.3, -1.7], [w - 2.9, -1.7], [w - 2.9, -0.7], [w - 2.5, -0.7], [w - 2.5, -1.9], [w - 2.1, -1.9],
    [w - 2.1, -1.2], [w - 1.6, -1.2], [w - 1.6, -0.6], [w - 1.1, -0.6], [w - 1.1, 0],
  ]
  sky.forEach(([x, y], i) => (i ? c.lineTo(x, base0 + y) : c.moveTo(x, base0 + y)))
  c.stroke()
  c.beginPath()
  c.moveTo(0.9, base0 + 0.02)
  c.lineTo(w - 0.9, base0 + 0.02)
  c.stroke()
  for (let i = 0; i < 4; i++) {
    c.beginPath()
    c.moveTo(1.4 + i * 0.25, base0 + 0.25 + i * 0.12)
    c.lineTo(w - 1.4 - i * 0.25, base0 + 0.25 + i * 0.12)
    c.stroke()
  }
  text('· MMXXVI ·', h - 1.05, 0.28, '400', 6)
  return cv
}

export function pageEdges() {
  const cv = canvas(512, 128)
  const c = cv.getContext('2d')!
  c.fillStyle = '#efe6d2'
  c.fillRect(0, 0, 512, 128)
  const rnd = mulberry32(11)
  for (let y = 0; y < 128; y += 3) {
    c.fillStyle = `rgba(120,100,70,${0.12 + rnd() * 0.18})`
    c.fillRect(0, y, 512, 1)
  }
  return cv
}

export function tableTop() {
  const cv = canvas(512, 512)
  const c = cv.getContext('2d', { willReadFrequently: true })!
  c.fillStyle = '#ffffff'
  c.fillRect(0, 0, 512, 512)
  const rnd = mulberry32(21)
  for (let i = 0; i < 512; i += 2) {
    c.fillStyle = `rgba(150,120,80,${rnd() * 0.035})`
    c.fillRect(0, i, 512, 1)
    c.fillStyle = `rgba(150,120,80,${rnd() * 0.025})`
    c.fillRect(i, 0, 1, 512)
  }
  noise(c, 512, 512, 10, 22)
  return cv
}

// Surfaces of the stepped platform (1 world unit = 256px, tiling).
export function sidewalk() {
  const cv = canvas(256, 256)
  const c = cv.getContext('2d', { willReadFrequently: true })!
  c.fillStyle = '#ddd6c6'
  c.fillRect(0, 0, 256, 256)
  c.strokeStyle = rgba(INK, 0.4)
  c.lineWidth = 3
  c.strokeRect(1.5, 1.5, 253, 253)
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(128, 0)
  c.lineTo(128, 256)
  c.moveTo(0, 128)
  c.lineTo(256, 128)
  c.stroke()
  noise(c, 256, 256, 22, 31)
  return cv
}

export function asphalt() {
  const cv = canvas(256, 256)
  const c = cv.getContext('2d', { willReadFrequently: true })!
  c.fillStyle = '#7f7b80'
  c.fillRect(0, 0, 256, 256)
  noise(c, 256, 256, 26, 41)
  return cv
}

// Road markings for the top step, covering x in [-1.6, 1.6], z in [-0.7, 1.7].
export function roadTop() {
  const ppu = 160
  const w = 3.2
  const d = 2.4
  const cv = canvas(w * ppu, d * ppu)
  const c = cv.getContext('2d', { willReadFrequently: true })!
  c.drawImage(asphalt(), 0, 0, cv.width, cv.height)
  c.scale(ppu, ppu)
  c.translate(1.6, 0.7)
  // Double yellow centre line and dashed lane lines.
  c.fillStyle = '#f2c84b'
  c.fillRect(-1.6, 0.22, 3.2, 0.03)
  c.fillRect(-1.6, 0.28, 3.2, 0.03)
  c.fillStyle = '#f4f0e6'
  for (let x = -1.6; x < 1.6; x += 0.4) c.fillRect(x, -0.25, 0.22, 0.025)
  // Zebra crossing at the front.
  for (let x = -0.6; x <= 0.6; x += 0.16) c.fillRect(x, 0.72, 0.09, 0.45)
  c.strokeStyle = rgba('#f4f0e6', 0.7)
  c.lineWidth = 0.02
  c.beginPath()
  c.ellipse(1.0, 0.6, 0.06, 0.06, 0, 0, Math.PI * 2)
  c.stroke()
  return cv
}

// Curb wall that wraps around each step. Tiles every unit across and every
// step height up.
export function curb() {
  const cv = canvas(256, 96)
  const c = cv.getContext('2d', { willReadFrequently: true })!
  c.fillStyle = '#cdbfa1'
  c.fillRect(0, 0, 256, 96)
  c.strokeStyle = rgba(INK, 0.35)
  c.lineWidth = 2
  for (let y = 24; y < 96; y += 24) {
    c.beginPath()
    c.moveTo(0, y)
    c.lineTo(256, y)
    c.stroke()
    const off = (y / 24) % 2 ? 0 : 32
    for (let x = off; x < 256; x += 64) {
      c.beginPath()
      c.moveTo(x, y - 24)
      c.lineTo(x, y)
      c.stroke()
    }
  }
  c.fillStyle = shade('#cdbfa1', 0.25)
  c.fillRect(0, 0, 256, 10)
  c.fillStyle = INK
  c.fillRect(0, 0, 256, 4)
  c.fillRect(0, 93, 256, 3)
  noise(c, 256, 96, 16, 51)
  return cv
}
