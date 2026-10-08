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
// The printed spread: a storybook map of Manhattan between its two rivers.
// Drawn in spread coordinates (x across, z towards the reader) and split in
// two at the gutter.

export function spread(ppu = 120) {
  const W = PAGE_W * 2
  const D = PAGE_D
  const cv = canvas(W * ppu, D * ppu)
  const c = cv.getContext('2d', { willReadFrequently: true })!
  const rnd = mulberry32(42)
  const r = (a: number, b: number) => a + (b - a) * rnd()
  c.setTransform(ppu, 0, 0, ppu, PAGE_W * ppu, (D / 2) * ppu)
  c.lineJoin = 'round'
  c.lineCap = 'round'
  const X0 = -PAGE_W
  const X1 = PAGE_W
  const Z0 = -D / 2
  const Z1 = D / 2

  // Paper.
  c.fillStyle = '#f5eedd'
  c.fillRect(X0, Z0, W, D)
  for (let i = 0; i < 40; i++) {
    const x = r(X0, X1)
    const z = r(Z0, Z1)
    const rad = r(0.3, 1.4)
    const g = c.createRadialGradient(x, z, 0, x, z, rad)
    g.addColorStop(0, 'rgba(214,190,150,0.10)')
    g.addColorStop(1, 'rgba(214,190,150,0)')
    c.fillStyle = g
    c.fillRect(x - rad, z - rad, rad * 2, rad * 2)
  }

  // Shorelines.
  const shore = (base: number, amp: number, seed: number) => {
    const out: [number, number][] = []
    const rr = mulberry32(seed)
    const p1 = rr() * 6
    const p2 = rr() * 6
    for (let z = Z0 - 0.2; z <= Z1 + 0.2; z += 0.1) {
      out.push([base + Math.sin(z * 0.55 + p1) * amp + Math.sin(z * 1.7 + p2) * amp * 0.3, z])
    }
    return out
  }
  const west = shore(-3.4, 0.25, 3)
  const east = shore(3.15, 0.22, 4)
  const brooklyn = shore(7.05, 0.18, 5)

  const water = new Path2D()
  water.moveTo(X0 - 1, Z0 - 1)
  west.forEach(([x, z]) => water.lineTo(x, z))
  water.lineTo(X0 - 1, Z1 + 1)
  water.closePath()
  water.moveTo(east[0][0], east[0][1])
  east.forEach(([x, z]) => water.lineTo(x, z))
  for (let i = brooklyn.length - 1; i >= 0; i--) water.lineTo(brooklyn[i][0], brooklyn[i][1])
  water.closePath()

  c.save()
  c.clip(water)
  c.fillStyle = C.water
  c.fillRect(X0, Z0, W, D)
  for (let i = 0; i < 60; i++) {
    const x = r(X0, X1)
    const z = r(Z0, Z1)
    const rad = r(0.4, 1.6)
    const g = c.createRadialGradient(x, z, 0, x, z, rad)
    g.addColorStop(0, rgba(rnd() < 0.5 ? C.waterDeep : '#b9d6dd', 0.35))
    g.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = g
    c.fillRect(x - rad, z - rad, rad * 2, rad * 2)
  }
  // Engraved ripple lines following each shore.
  const echo = (line: [number, number][], dir: number) => {
    for (let k = 1; k <= 4; k++) {
      c.strokeStyle = rgba('#3d6b80', 0.35 - k * 0.06)
      c.lineWidth = 0.014
      c.beginPath()
      line.forEach(([x, z], i) => (i ? c.lineTo(x + dir * k * 0.14, z) : c.moveTo(x + dir * k * 0.14, z)))
      c.stroke()
    }
  }
  echo(west, -1)
  echo(east, 1)
  echo(brooklyn, -1)
  // Little wave ticks.
  c.strokeStyle = rgba('#3d6b80', 0.5)
  c.lineWidth = 0.016
  for (let i = 0; i < 140; i++) {
    const x = r(X0 + 0.3, X1 - 0.3)
    const z = r(Z0 + 0.3, Z1 - 0.3)
    c.beginPath()
    c.moveTo(x - 0.12, z)
    c.quadraticCurveTo(x - 0.06, z - 0.06, x, z)
    c.quadraticCurveTo(x + 0.06, z + 0.06, x + 0.12, z)
    c.stroke()
  }
  c.restore()

  // Land.
  const land = (pts: [number, number][], other: number) => {
    const p = new Path2D()
    pts.forEach(([x, z], i) => (i ? p.lineTo(x, z) : p.moveTo(x, z)))
    p.lineTo(other, Z1 + 1)
    p.lineTo(other, Z0 - 1)
    p.closePath()
    return p
  }
  const manhattan = new Path2D()
  west.forEach(([x, z], i) => (i ? manhattan.lineTo(x, z) : manhattan.moveTo(x, z)))
  for (let i = east.length - 1; i >= 0; i--) manhattan.lineTo(east[i][0], east[i][1])
  manhattan.closePath()
  const bk = land(brooklyn, X1 + 1)

  for (const p of [manhattan, bk]) {
    c.save()
    c.clip(p)
    c.fillStyle = C.land
    c.fillRect(X0, Z0, W, D)
    c.restore()
  }

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
    const x = r(-1.5, 1.6)
    const z = r(Z0 + 0.3, Z0 + 2.4)
    c.fillStyle = rgba(C.greenDark, 0.55)
    c.beginPath()
    c.arc(x, z, r(0.05, 0.11), 0, Math.PI * 2)
    c.fill()
  }
  c.fillStyle = rgba('#8fb6c4', 0.9)
  c.beginPath()
  c.ellipse(0.3, Z0 + 1.0, 0.55, 0.28, 0.2, 0, Math.PI * 2)
  c.fill()
  // Roads.
  const road = (draw: () => void, w: number) => {
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
  avenues.forEach((x) => road(() => {
    c.moveTo(x, Z0 - 1)
    c.lineTo(x, Z1 + 1)
  }, 0.16))
  streets.forEach((z) => road(() => {
    c.moveTo(X0, z)
    c.lineTo(X1, z)
  }, 0.09))
  // Broadway cuts across the grid.
  road(() => {
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

  // Shore ink.
  c.strokeStyle = INK
  c.lineWidth = 0.03
  ;[west, east, brooklyn].forEach((line) => {
    c.beginPath()
    line.forEach(([x, z], i) => (i ? c.lineTo(x, z) : c.moveTo(x, z)))
    c.stroke()
  })
  // Piers along the shores.
  for (let z = Z0 + 0.6; z < Z1 - 0.3; z += 0.75) {
    for (const [line, dir] of [
      [west, -1],
      [east, 1],
    ] as [[number, number][], number][]) {
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

  // Brooklyn: little rows of houses and trees.
  c.save()
  c.clip(bk)
  for (let z = Z0 + 0.35; z < Z1 - 0.3; z += 0.42) {
    for (let x = 7.35; x < X1 - 0.25; x += 0.3) {
      if (rnd() < 0.3) {
        c.fillStyle = rgba(C.greenDark, 0.45)
        c.beginPath()
        c.arc(x + 0.1, z + 0.12, r(0.06, 0.1), 0, Math.PI * 2)
        c.fill()
      } else {
        c.fillStyle = rgba(rnd() < 0.5 ? C.brick : C.brownstone, 0.28)
        c.strokeStyle = rgba(INK, 0.3)
        c.lineWidth = 0.008
        const w = r(0.14, 0.22)
        const d = r(0.18, 0.26)
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

  // Boats.
  const boat = (x: number, z: number, len: number, hull: string, deck: string, ang = 0) => {
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
  boat(-6.7, 3.6, 0.9, '#ee7d33', '#fff4df', -0.35)
  boat(-4.3, -2.4, 0.45, '#f6f0e2', '#9c6b48', 1.2)
  boat(5.3, -2.6, 0.5, C.red, '#2f4566', 2.0)
  boat(6.2, 3.0, 0.55, '#2f4566', '#f6f0e2', -1.4)
  // Dotted ferry route out to the island.
  c.setLineDash([0.06, 0.07])
  c.strokeStyle = rgba(INK, 0.5)
  c.lineWidth = 0.014
  c.beginPath()
  c.moveTo(-3.5, 4.4)
  c.quadraticCurveTo(-5.0, 3.2, -5.1, 1.75)
  c.stroke()
  c.setLineDash([])

  // Compass rose.
  const cx = 5.6
  const cz = 4.15
  c.save()
  c.translate(cx, cz)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2
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
  c.fillStyle = INK
  c.scale(0.002, 0.002)
  c.font = 'bold 100px Georgia, serif'
  c.textAlign = 'center'
  c.fillText('N', 0, -330)
  c.restore()

  // Labels.
  const label = (t: string, x: number, z: number, size: number, rot = 0, o: { italic?: boolean; color?: string; spacing?: number } = {}) => {
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
  label('HUDSON  RIVER', -7.35, -1.2, 0.3, -Math.PI / 2, { color: rgba('#2f5468', 0.8) })
  label('EAST  RIVER', 5.15, -1.6, 0.26, Math.PI / 2, { color: rgba('#2f5468', 0.8) })
  label('BROOKLYN', 7.7, 0.4, 0.2, Math.PI / 2)
  label('Liberty Island', -5.6, 2.15, 0.14, 0, { italic: true, spacing: 2 })
  label('Broadway', -2.05, 3.9, 0.15, -0.95, { italic: true, spacing: 4 })
  label('Central Park', 0.05, Z0 + 2.35, 0.13, 0, { italic: true, spacing: 2 })
  label('M A N H A T T A N', 0, 4.95, 0.22, 0, { spacing: 10 })

  // Title cartouche in the harbour.
  c.save()
  c.translate(-5.7, 4.55)
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
  label('New York', -5.7, 4.62, 0.3, 0, { italic: true, spacing: 2, color: INK })
  label('· the city, in paper ·', -5.7, 4.8, 0.1, 0, { italic: true, spacing: 2 })

  // Page frames and numbers.
  c.strokeStyle = rgba(INK, 0.55)
  for (const [a, b] of [
    [X0 + 0.3, -0.35],
    [0.35, X1 - 0.3],
  ]) {
    c.lineWidth = 0.025
    c.strokeRect(a, Z0 + 0.3, b - a, D - 0.6)
    c.lineWidth = 0.01
    c.strokeRect(a + 0.08, Z0 + 0.38, b - a - 0.16, D - 0.76)
  }
  label('14', X0 + 0.65, Z1 - 0.06, 0.16, 0, { spacing: 0 })
  label('15', X1 - 0.65, Z1 - 0.06, 0.16, 0, { spacing: 0 })

  // Shade into the gutter.
  const gl = c.createLinearGradient(-0.9, 0, 0.9, 0)
  gl.addColorStop(0, 'rgba(70,50,30,0)')
  gl.addColorStop(0.42, 'rgba(70,50,30,0.12)')
  gl.addColorStop(0.5, 'rgba(70,50,30,0.32)')
  gl.addColorStop(0.58, 'rgba(70,50,30,0.12)')
  gl.addColorStop(1, 'rgba(70,50,30,0)')
  c.fillStyle = gl
  c.fillRect(-0.9, Z0, 1.8, D)

  c.setTransform(1, 0, 0, 1, 0, 0)
  noise(c, cv.width, cv.height, 14, 9)

  const half = (left: boolean) => {
    const h = canvas(cv.width / 2, cv.height)
    h.getContext('2d')!.drawImage(cv, left ? 0 : -cv.width / 2, 0)
    return h
  }
  return { left: half(true), right: half(false) }
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
