import { INK, PAPER, Shape, Sketch, rgba, shade } from './sketch'
import { C } from './palette'
import { Part, paint, pts } from './art-common'

// Outline a group of overlapping blobs: a thick ink stroke underneath, the
// fill on top, so only the outer contour stays inked.
function blobs(s: Sketch, circles: [number, number, number][], color: string, shadow: string, inkW = 0.03) {
  const c = s.ctx
  const path = new Path2D()
  circles.forEach(([x, y, r]) => {
    path.moveTo(x + r, y)
    path.arc(x, y, r, 0, Math.PI * 2)
  })
  c.save()
  c.fillStyle = PAPER
  c.strokeStyle = PAPER
  c.lineWidth = 0.15
  c.stroke(path)
  c.fill(path)
  c.strokeStyle = INK
  c.lineWidth = inkW * 2
  c.stroke(path)
  c.fillStyle = color
  c.fill(path)
  c.clip(path)
  let top = -Infinity
  let low = Infinity
  circles.forEach(([, y, r]) => {
    top = Math.max(top, y + r)
    low = Math.min(low, y - r)
  })
  // One soft gradient over the whole group: light on top, shadowed below.
  const g = c.createLinearGradient(0, low, 0, top)
  g.addColorStop(0, shadow)
  g.addColorStop(0.55, 'rgba(255,255,255,0)')
  g.addColorStop(1, 'rgba(255,255,255,0.4)')
  c.fillStyle = g
  c.fill(path)
  // A few dry-brush highlights.
  circles.forEach(([x, y, r]) => {
    const hl = c.createRadialGradient(x - r * 0.25, y + r * 0.35, 0, x - r * 0.25, y + r * 0.35, r * 0.6)
    hl.addColorStop(0, 'rgba(255,255,255,0.35)')
    hl.addColorStop(1, 'rgba(255,255,255,0)')
    c.fillStyle = hl
    c.fillRect(x - r, y - r, r * 2, r * 2)
  })
  c.restore()
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  circles.forEach(([x, y, r]) => {
    minX = Math.min(minX, x - r)
    minY = Math.min(minY, y - r)
    maxX = Math.max(maxX, x + r)
    maxY = Math.max(maxY, y + r)
  })
  return { path, pts: [], minX, minY, maxX, maxY } as Shape
}

// ---------------------------------------------------------------------------

export function taxi(s: Sketch) {
  const body = s.custom(
    (p) => {
      p.moveTo(0.06, 0.2)
      p.lineTo(1.94, 0.2)
      p.quadraticCurveTo(2.0, 0.22, 1.99, 0.42)
      p.lineTo(1.86, 0.52)
      p.lineTo(1.42, 0.56)
      p.quadraticCurveTo(1.3, 0.8, 1.16, 0.83)
      p.lineTo(0.58, 0.84)
      p.quadraticCurveTo(0.42, 0.8, 0.36, 0.57)
      p.lineTo(0.06, 0.53)
      p.quadraticCurveTo(0.0, 0.4, 0.06, 0.2)
      p.closePath()
    },
    pts(0, 0.2, 2.0, 0.84)
  )
  const sign = s.poly(pts(0.78, 0.83, 1.0, 0.83, 0.97, 0.95, 0.81, 0.95), 0)
  const winF = s.poly(pts(0.92, 0.58, 1.33, 0.58, 1.18, 0.79, 0.92, 0.79), 0.002)
  const winR = s.poly(pts(0.44, 0.58, 0.86, 0.58, 0.86, 0.79, 0.6, 0.79), 0.002)
  const wheels = [0.45, 1.58].map((x) => s.ellipse(x, 0.18, 0.17, 0.17))
  const arches = [0.45, 1.58].map((x) => s.ellipse(x, 0.2, 0.21, 0.2))

  s.border([body, sign, ...wheels], 0.07)
  s.wash(body, C.taxi, { edge: 0.3 })
  arches.forEach((a) => s.fill(a, shade(C.taxi, -0.35)))
  s.hatch(s.rect(0, 0.2, 2.0, 0.14, 0), { angle: 0.5, gap: 0.04, alpha: 0.3 })
  // Checker band.
  for (let i = 0; i < 26; i++) {
    const x = 0.12 + i * 0.07
    if (x > 1.9) break
    s.fill(s.rect(x, i % 2 ? 0.38 : 0.415, 0.035, 0.035, 0), INK)
    s.fill(s.rect(x + 0.035, i % 2 ? 0.415 : 0.38, 0.035, 0.035, 0), INK)
  }
  ;[winF, winR].forEach((w) => {
    s.wash(w, '#5b7090', { edge: 0.1 })
    s.ink(w, 0.016)
    s.glow(w, '#ffd27a')
  })
  s.fill(s.poly(pts(0.98, 0.6, 1.06, 0.6, 1.0, 0.77, 0.96, 0.77), 0), 'rgba(255,255,255,0.35)')
  s.fill(s.poly(pts(0.5, 0.6, 0.58, 0.6, 0.6, 0.77, 0.56, 0.77), 0), 'rgba(255,255,255,0.35)')
  // Doors, handles, bumpers, lights.
  s.line([[0.88, 0.22], [0.88, 0.8]], 0.012)
  s.line([[1.36, 0.24], [1.36, 0.55]], 0.012)
  s.line([[0.72, 0.5], [0.8, 0.5]], 0.018)
  s.line([[1.2, 0.5], [1.28, 0.5]], 0.018)
  s.fill(s.rect(1.9, 0.2, 0.1, 0.08, 0), C.steel)
  s.fill(s.rect(0.0, 0.2, 0.1, 0.08, 0), C.steel)
  const head = s.ellipse(1.95, 0.45, 0.035, 0.05)
  s.fill(head, '#fff6d6')
  s.glow(head, '#fff2c0')
  const tail = s.rect(0.04, 0.42, 0.05, 0.07, 0)
  s.fill(tail, C.red)
  s.glow(tail, '#ff3b2f')
  s.text('NYC TAXI', 1.12, 0.26, 0.075, { color: INK, font: 'Helvetica, Arial, sans-serif' })
  s.ink(body, 0.026)
  s.wash(sign, '#fff4d6', { edge: 0.1 })
  s.text('TAXI', 0.89, 0.86, 0.065, { color: INK, glow: '#ffe28a', font: 'Helvetica, Arial, sans-serif' })
  s.glow(sign, '#ffe9a8')
  s.ink(sign, 0.014)
  wheels.forEach((w, i) => {
    s.fill(w, '#2c2a30')
    const x = i ? 1.58 : 0.45
    const hub = s.ellipse(x, 0.18, 0.08, 0.08)
    s.fill(hub, '#d9dde0')
    s.ink(hub, 0.01)
    s.ink(w, 0.02)
  })
}

// ---------------------------------------------------------------------------

export function hotDogCart(s: Sketch) {
  const canopy = s.custom(
    (p) => {
      p.moveTo(0.05, 1.18)
      p.quadraticCurveTo(0.7, 1.75, 1.35, 1.18)
      p.closePath()
    },
    pts(0.05, 1.18, 1.35, 1.48)
  )
  const pole = s.rect(0.67, 0.72, 0.035, 0.5, 0)
  const cart = s.rect(0.15, 0.24, 1.0, 0.5, 0.004)
  const counter = s.rect(0.1, 0.72, 1.1, 0.07, 0.002)
  const wheel = s.ellipse(0.42, 0.17, 0.17, 0.17)
  const leg = s.rect(1.0, 0, 0.05, 0.25, 0)
  const vendorBody = s.custom(
    (p) => {
      p.moveTo(0.88, 0.79)
      p.quadraticCurveTo(0.86, 1.02, 0.98, 1.04)
      p.lineTo(1.12, 1.04)
      p.quadraticCurveTo(1.22, 1.02, 1.2, 0.79)
      p.closePath()
    },
    pts(0.86, 0.79, 1.22, 1.04)
  )
  const vendorHead = s.ellipse(1.05, 1.11, 0.07, 0.075)
  const cap = s.custom(
    (p) => {
      p.moveTo(0.97, 1.13)
      p.quadraticCurveTo(1.05, 1.24, 1.13, 1.13)
      p.lineTo(1.19, 1.12)
      p.closePath()
    },
    pts(0.97, 1.12, 1.19, 1.2)
  )
  const handle = s.rect(1.15, 0.5, 0.18, 0.03, 0)

  paint(s, [
    { shape: pole, color: C.steelDark, ink: 0.012 },
    { shape: vendorBody, color: '#ffffff', ink: 0.016, detail: () => s.line([[1.04, 0.8], [1.04, 1.03]], 0.008, rgba(INK, 0.4)) },
    {
      shape: vendorHead,
      color: C.skin,
      ink: 0.014,
      detail: () => {
        s.fill(s.ellipse(1.07, 1.11, 0.009, 0.009), INK)
        s.fill(s.ellipse(1.11, 1.085, 0.02, 0.012), '#e79a86', 0.6)
      },
    },
    { shape: cap, color: C.red, ink: 0.012 },
    { shape: handle, color: C.steelDark, ink: 0.01 },
    {
      shape: cart,
      color: '#d7dde0',
      detail: () => {
        s.fill(s.rect(0.22, 0.34, 0.86, 0.26, 0), '#fff6e2')
        s.text('HOT DOGS', 0.65, 0.41, 0.11, { color: C.red, font: 'Helvetica, Arial, sans-serif' })
        s.hatch(cart, { angle: 1.3, gap: 0.04, alpha: 0.15 })
      },
      ink: 0.02,
    },
    { shape: counter, color: C.steel, ink: 0.014 },
    { shape: leg, color: C.steelDark, ink: 0.01 },
    {
      shape: wheel,
      color: '#2c2a30',
      ink: 0.016,
      detail: () => s.fill(s.ellipse(0.42, 0.17, 0.06, 0.06), '#d9dde0'),
    },
    {
      shape: canopy,
      color: C.taxi,
      ink: 0.02,
      detail: () => {
        const c = s.ctx
        c.save()
        c.clip(canopy.path)
        for (let i = 0; i < 6; i += 2) {
          const a0 = 0.05 + (1.3 * i) / 6
          const a1 = 0.05 + (1.3 * (i + 1)) / 6
          c.fillStyle = '#3f6fb0'
          c.beginPath()
          c.moveTo(0.7, 1.5)
          c.lineTo(a0, 1.1)
          c.lineTo(a1, 1.1)
          c.closePath()
          c.fill()
        }
        c.restore()
      },
    },
  ])
}

// ---------------------------------------------------------------------------

export function steamStack(s: Sketch) {
  const pipe = s.poly(pts(0.2, 0, 0.5, 0, 0.44, 0.85, 0.26, 0.85), 0.003)
  s.border([pipe], 0.07)
  s.wash(pipe, '#ffffff')
  const c = s.ctx
  c.save()
  c.clip(pipe.path)
  for (let i = 0; i < 5; i += 1) {
    if (i % 2) continue
    c.fillStyle = '#ec7a2c'
    c.fillRect(0, i * 0.17, 1, 0.17)
  }
  c.restore()
  s.hatch(s.rect(0.38, 0, 0.12, 0.85, 0), { angle: 1.3, gap: 0.03, alpha: 0.3 })
  s.ink(pipe, 0.02)
  blobs(
    s,
    [
      [0.35, 0.95, 0.13],
      [0.3, 1.12, 0.15],
      [0.42, 1.28, 0.17],
      [0.3, 1.46, 0.16],
      [0.4, 1.62, 0.13],
      [0.32, 1.75, 0.09],
    ],
    '#fbfaf6',
    'rgba(120,130,150,0.35)',
    0.016
  )
}

// ---------------------------------------------------------------------------

export function streetLamp(s: Sketch) {
  const green = '#2f4a3c'
  const pole = s.poly(pts(0.08, 0, 0.2, 0, 0.17, 0.25, 0.155, 1.85, 0.125, 1.85, 0.11, 0.25), 0.002)
  const lantern = s.poly(pts(0.35, 1.62, 0.49, 1.62, 0.53, 1.76, 0.31, 1.76), 0.002)
  const hood = s.poly(pts(0.29, 1.76, 0.55, 1.76, 0.42, 1.86), 0.002)
  s.strip(
    [
      [0.14, 1.83],
      [0.25, 1.98],
      [0.4, 1.96],
      [0.42, 1.86],
    ],
    0.03,
    0.05,
    green
  )
  paint(s, [
    { shape: pole, color: green, ink: 0.014 },
    { shape: hood, color: green, ink: 0.012 },
    {
      shape: lantern,
      color: '#fff1c9',
      ink: 0.012,
      detail: () => s.line([[0.42, 1.62], [0.42, 1.76]], 0.006),
    },
  ])
  s.glow(lantern, '#ffd98a')
}

// ---------------------------------------------------------------------------

export function streetTree(s: Sketch) {
  const trunk = s.poly(pts(0.58, 0, 0.72, 0, 0.69, 0.75, 0.61, 0.75), 0.003)
  const guard = s.rect(0.38, 0, 0.54, 0.18, 0)
  s.border([trunk, guard], 0.06)
  s.wash(trunk, '#7a5a44')
  s.ink(trunk, 0.016)
  s.strip([[0.38, 0.18], [0.92, 0.18]], 0.014, 0.04)
  for (let x = 0.38; x <= 0.93; x += 0.09) s.strip([[x, 0], [x, 0.18]], 0.01, 0.03)
  blobs(
    s,
    [
      [0.65, 0.95, 0.32],
      [0.38, 1.1, 0.28],
      [0.92, 1.12, 0.29],
      [0.55, 1.38, 0.3],
      [0.85, 1.42, 0.27],
      [0.68, 1.62, 0.22],
    ],
    C.leaf,
    'rgba(50,90,50,0.55)'
  )
  const c = s.ctx
  c.save()
  for (let i = 0; i < 26; i++) {
    const x = s.r(0.2, 1.1)
    const y = s.r(0.8, 1.75)
    c.strokeStyle = rgba(C.greenDark, 0.8)
    c.lineWidth = 0.012
    c.beginPath()
    c.arc(x, y, 0.04, 0.2, 2.6)
    c.stroke()
  }
  c.restore()
}

// ---------------------------------------------------------------------------
// People. Built from simple parts; feet at (x, y), height H.

type PersonOpts = {
  coat: string
  legs?: string
  hair?: string
  skin?: string
  hat?: 'fedora' | 'beret' | 'beanie'
  hold?: 'briefcase' | 'coffee' | 'umbrella' | 'leash' | 'balloon' | 'paper'
  skirt?: boolean
  scarf?: string
}

function person(s: Sketch, x: number, y: number, H: number, o: PersonOpts): Part[] {
  const skin = o.skin ?? C.skin
  const legs = o.legs ?? '#3a3a48'
  const sh = y + H * 0.78
  const hip = y + H * 0.4
  const hem = y + H * (o.skirt ? 0.3 : 0.28)
  const parts: Part[] = []

  // Legs and shoes.
  for (const d of [-1, 1]) {
    const lx = x + d * H * 0.05
    parts.push({
      shape: s.poly(pts(lx - H * 0.035, y + H * 0.03, lx + H * 0.035, y + H * 0.03, lx + H * 0.04, hip, lx - H * 0.04, hip), 0.002),
      color: o.skirt ? skin : legs,
      ink: 0.012,
    })
    parts.push({ shape: s.ellipse(lx + d * H * 0.02, y + H * 0.025, H * 0.055, H * 0.028), color: '#2b2522', ink: 0.01 })
  }
  // Coat.
  const coat = s.custom(
    (p) => {
      p.moveTo(x - H * 0.17, hem)
      p.lineTo(x + H * 0.17, hem)
      p.quadraticCurveTo(x + H * 0.16, sh - H * 0.1, x + H * 0.14, sh)
      p.quadraticCurveTo(x, sh + H * 0.045, x - H * 0.14, sh)
      p.quadraticCurveTo(x - H * 0.16, sh - H * 0.1, x - H * 0.17, hem)
      p.closePath()
    },
    pts(x - H * 0.17, hem, x + H * 0.17, sh + H * 0.04)
  )
  parts.push({
    shape: coat,
    color: o.coat,
    ink: 0.016,
    detail: () => {
      s.line([[x, sh], [x, hem]], 0.008, rgba(INK, 0.6))
      for (let k = 0; k < 3; k++) s.fill(s.ellipse(x + H * 0.03, sh - H * (0.08 + k * 0.1), H * 0.01, H * 0.01), INK)
      s.line([[x - H * 0.14, hip], [x + H * 0.14, hip]], 0.01, rgba(INK, 0.4))
    },
    hatch: { angle: 1.2, gap: 0.03, alpha: 0.18 },
  })
  if (o.scarf) {
    parts.push({ shape: s.rect(x - H * 0.08, sh - H * 0.03, H * 0.16, H * 0.05, 0.001), color: o.scarf, ink: 0.01 })
  }
  // Arms.
  const arm = (d: number, hx: number, hy: number) => {
    const ax = x + d * H * 0.13
    const ay = sh - H * 0.03
    const nx = -(hy - ay)
    const ny = hx - ax
    const l = Math.hypot(nx, ny) || 1
    const w = H * 0.035
    parts.push({
      shape: s.poly(
        [
          [ax + (nx / l) * w, ay + (ny / l) * w],
          [hx + (nx / l) * w * 0.8, hy + (ny / l) * w * 0.8],
          [hx - (nx / l) * w * 0.8, hy - (ny / l) * w * 0.8],
          [ax - (nx / l) * w, ay - (ny / l) * w],
        ],
        0.001
      ),
      color: shade(o.coat, -0.08),
      ink: 0.012,
    })
    parts.push({ shape: s.ellipse(hx, hy, H * 0.028, H * 0.028), color: skin, ink: 0.008 })
  }
  const hold = o.hold
  const right: [number, number] =
    hold === 'umbrella' || hold === 'balloon'
      ? [x + H * 0.2, y + H * 0.72]
      : hold === 'coffee'
        ? [x + H * 0.17, y + H * 0.58]
        : [x + H * 0.2, y + H * 0.42]
  const left: [number, number] = hold === 'paper' ? [x - H * 0.12, y + H * 0.55] : [x - H * 0.2, y + H * 0.42]
  arm(-1, left[0], left[1])
  arm(1, right[0], right[1])

  // Head.
  const hy = y + H * 0.88
  const r = H * 0.075
  parts.push({ shape: s.rect(x - H * 0.025, sh - H * 0.01, H * 0.05, H * 0.05, 0), color: skin, ink: false })
  parts.push({
    shape: s.ellipse(x, hy, r, r * 1.08),
    color: skin,
    ink: 0.012,
    detail: () => {
      s.fill(s.ellipse(x - r * 0.35, hy, r * 0.1, r * 0.12), INK)
      s.fill(s.ellipse(x + r * 0.35, hy, r * 0.1, r * 0.12), INK)
      s.fill(s.ellipse(x - r * 0.55, hy - r * 0.35, r * 0.2, r * 0.12), '#e48f7c', 0.5)
      s.fill(s.ellipse(x + r * 0.55, hy - r * 0.35, r * 0.2, r * 0.12), '#e48f7c', 0.5)
      s.line([[x - r * 0.2, hy - r * 0.45], [x, hy - r * 0.55], [x + r * 0.2, hy - r * 0.45]], 0.006, INK, 0)
    },
  })
  if (o.hat === 'fedora') {
    parts.push({ shape: s.ellipse(x, hy + r * 0.75, r * 1.55, r * 0.28), color: '#3d3533', ink: 0.01 })
    parts.push({ shape: s.poly(pts(x - r * 0.85, hy + r * 0.8, x + r * 0.85, hy + r * 0.8, x + r * 0.7, hy + r * 1.6, x - r * 0.7, hy + r * 1.6), 0.001), color: '#3d3533', ink: 0.01, detail: () => s.fill(s.rect(x - r * 0.83, hy + r * 0.8, r * 1.66, r * 0.22, 0), C.redDark) })
  } else if (o.hat === 'beret') {
    parts.push({ shape: s.ellipse(x + r * 0.2, hy + r * 0.85, r * 1.15, r * 0.45, -0.15), color: C.red, ink: 0.01 })
  } else if (o.hat === 'beanie') {
    parts.push({ shape: s.custom((p) => p.arc(x, hy + r * 0.3, r * 1.02, 0, Math.PI, false), pts(x - r, hy, x + r, hy + r * 1.4)), color: C.taxi, ink: 0.01 })
    parts.push({ shape: s.ellipse(x, hy + r * 1.38, r * 0.25, r * 0.25), color: '#f7f1e3', ink: 0.008 })
  } else {
    parts.push({
      shape: s.custom(
        (p) => {
          p.arc(x, hy + r * 0.1, r * 1.08, -0.2, Math.PI + 0.2, false)
          p.closePath()
        },
        pts(x - r, hy, x + r, hy + r * 1.2)
      ),
      color: o.hair ?? C.hair,
      ink: 0.01,
    })
  }

  // Props.
  if (hold === 'briefcase') {
    parts.push({ shape: s.rect(right[0] - H * 0.06, right[1] - H * 0.16, H * 0.14, H * 0.12, 0.001), color: '#6b4430', ink: 0.012 })
  } else if (hold === 'coffee') {
    parts.push({ shape: s.poly(pts(right[0] - H * 0.03, right[1] - H * 0.02, right[0] + H * 0.03, right[1] - H * 0.02, right[0] + H * 0.035, right[1] + H * 0.08, right[0] - H * 0.035, right[1] + H * 0.08), 0), color: '#f4ecdc', ink: 0.008, detail: () => s.fill(s.rect(right[0] - H * 0.034, right[1] + H * 0.015, H * 0.068, H * 0.03, 0), C.brick) })
  } else if (hold === 'paper') {
    parts.push({ shape: s.rect(left[0] - H * 0.1, left[1] - H * 0.06, H * 0.18, H * 0.2, 0.001), color: '#f2ede0', ink: 0.01, detail: () => { for (let k = 0; k < 5; k++) s.line([[left[0] - H * 0.08, left[1] + H * (0.1 - k * 0.03)], [left[0] + H * 0.06, left[1] + H * (0.1 - k * 0.03)]], 0.005, rgba(INK, 0.5), 0) } })
  }
  return parts
}

export function commuters(s: Sketch) {
  paint(s, [
    ...person(s, 0.42, 0, 1.2, { coat: '#6d7a8c', hat: 'fedora', hold: 'briefcase', scarf: C.red }),
    ...person(s, 1.12, 0, 1.12, { coat: C.ochre, hat: 'beret', hold: 'coffee', skirt: true, hair: '#7a3d22' }),
  ])
}

export function readerAndKid(s: Sketch) {
  const parts = [
    ...person(s, 0.45, 0, 1.18, { coat: C.greenDark, hold: 'paper', hair: '#c9a26b', scarf: C.taxi }),
    ...person(s, 1.15, 0, 0.78, { coat: C.red, hat: 'beanie', hold: 'balloon', skin: '#c99772' }),
  ]
  // The kid's balloon on a paper-strip string.
  const bx = 1.15 + 0.78 * 0.2
  const by = 0.78 * 0.72
  s.strip([[bx, by], [bx + 0.05, by + 0.55], [bx + 0.1, 1.45]], 0.008, 0.035)
  const balloon = s.custom(
    (p) => {
      p.ellipse(bx + 0.1, 1.62, 0.15, 0.18, 0, 0, Math.PI * 2)
    },
    pts(bx - 0.05, 1.44, bx + 0.25, 1.8)
  )
  const knot = s.poly(pts(bx + 0.07, 1.42, bx + 0.13, 1.42, bx + 0.1, 1.46), 0)
  paint(s, [
    ...parts,
    {
      shape: balloon,
      color: C.red,
      ink: 0.016,
      detail: () => s.fill(s.ellipse(bx + 0.05, 1.68, 0.03, 0.05, 0.4), 'rgba(255,255,255,0.6)'),
    },
    { shape: knot, color: C.redDark, ink: 0.008 },
  ])
}

export function dogWalker(s: Sketch) {
  const H = 1.22
  const x = 1.15
  // Umbrella.
  const ux = x + H * 0.2
  const uy = H * 1.12
  const canopy = s.custom(
    (p) => {
      p.moveTo(ux - 0.42, uy)
      p.quadraticCurveTo(ux, uy + 0.45, ux + 0.42, uy)
      const n = 5
      for (let i = n; i > 0; i--) {
        const x1 = ux + 0.42 - (0.84 * i) / n
        const x0 = ux + 0.42 - (0.84 * (i - 1)) / n
        p.quadraticCurveTo((x0 + x1) / 2, uy + 0.07, x1, uy)
      }
      p.closePath()
    },
    pts(ux - 0.42, uy, ux + 0.42, uy + 0.25)
  )
  // Dachshund trotting ahead on its leash, facing left.
  const dx = 0.42
  const X = (a: number) => dx - a
  const dog = s.custom(
    (p) => {
      p.moveTo(X(-0.2), 0.12)
      p.quadraticCurveTo(X(-0.22), 0.22, X(-0.12), 0.23)
      p.lineTo(X(0.12), 0.23)
      p.quadraticCurveTo(X(0.16), 0.3, X(0.22), 0.29)
      p.quadraticCurveTo(X(0.29), 0.27, X(0.26), 0.2)
      p.lineTo(X(0.17), 0.15)
      p.lineTo(X(0.15), 0.04)
      p.lineTo(X(0.11), 0.04)
      p.lineTo(X(0.1), 0.12)
      p.lineTo(X(-0.12), 0.12)
      p.lineTo(X(-0.13), 0.04)
      p.lineTo(X(-0.17), 0.04)
      p.closePath()
    },
    pts(X(0.29), 0.04, X(-0.22), 0.3)
  )
  s.strip([[ux, H * 0.72], [ux, uy + 0.2]], 0.014, 0.04)
  paint(s, [
    ...person(s, x, 0, H, { coat: '#b9b0d6', hold: 'umbrella', skirt: true, hair: '#2d2420', scarf: '#ffffff' }),
    {
      shape: canopy,
      color: C.red,
      ink: 0.018,
      detail: () => {
        for (let i = 1; i < 5; i++) {
          const xx = ux - 0.42 + (0.84 * i) / 5
          s.line([[ux, uy + 0.22], [xx, uy + 0.03]], 0.008, rgba(INK, 0.6))
        }
      },
    },
    {
      shape: dog,
      color: '#9a5b37',
      ink: 0.012,
      detail: () => {
        s.fill(s.ellipse(X(0.22), 0.26, 0.012, 0.012), INK)
        s.fill(s.ellipse(X(0.15), 0.22, 0.04, 0.05, -0.4), shade('#9a5b37', -0.3))
        s.fill(s.rect(X(0.12), 0.2, 0.05, 0.03, 0), C.red)
      },
    },
  ])
  // Leash from her free hand to the collar, drawn on top.
  s.strip(
    [
      [x - H * 0.2, H * 0.42],
      [(x - H * 0.2 + X(0.1)) / 2, 0.3],
      [X(0.1), 0.22],
    ],
    0.012,
    0.03
  )
}

// ---------------------------------------------------------------------------
// Things in the sky.

export function hotAirBalloon(s: Sketch, colors: [string, string]) {
  const cx = s.w / 2
  const cy = 1.15
  const r = 0.52
  const env = s.custom(
    (p) => {
      p.moveTo(cx - 0.17, 0.5)
      p.quadraticCurveTo(cx - r * 0.9, 0.8, cx - r, cy)
      p.arc(cx, cy, r, Math.PI, 0, true)
      p.quadraticCurveTo(cx + r * 0.9, 0.8, cx + 0.17, 0.5)
      p.closePath()
    },
    pts(cx - r, 0.5, cx + r, cy + r)
  )
  const basket = s.poly(pts(cx - 0.11, 0.08, cx + 0.11, 0.08, cx + 0.13, 0.26, cx - 0.13, 0.26), 0.002)
  for (const d of [-1, 1]) s.strip([[cx + d * 0.16, 0.5], [cx + d * 0.11, 0.26]], 0.008, 0.03)
  paint(s, [
    {
      shape: env,
      color: colors[0],
      ink: 0.022,
      detail: () => {
        const c = s.ctx
        c.save()
        c.clip(env.path)
        for (let k = 0; k < 5; k++) {
          const rx = r * (1 - k * 0.22)
          if (k % 2 === 0) continue
          c.fillStyle = colors[1]
          c.beginPath()
          c.ellipse(cx, cy - 0.1, rx, r * 1.25, 0, 0, Math.PI * 2)
          c.fill()
          c.fillStyle = colors[0]
          c.beginPath()
          c.ellipse(cx, cy - 0.1, rx - r * 0.11, r * 1.25, 0, 0, Math.PI * 2)
          c.fill()
        }
        c.restore()
        for (let k = -2; k <= 2; k++) {
          const xx = cx + k * r * 0.4
          s.line([[cx + k * 0.06, 0.5], [xx, cy], [cx + k * r * 0.25, cy + r * 0.92]], 0.008, rgba(INK, 0.45))
        }
        s.hatch(s.rect(cx + r * 0.3, 0.5, r, r * 2, 0), { angle: 1.2, gap: 0.035, alpha: 0.2 })
      },
    },
    {
      shape: basket,
      color: '#a8784f',
      ink: 0.012,
      detail: () => s.hatch(basket, { angle: 0.8, gap: 0.025, alpha: 0.35 }),
    },
  ])
}

export function blimp(s: Sketch) {
  const body = s.ellipse(1.3, 0.6, 1.1, 0.34)
  const finT = s.poly(pts(0.25, 0.68, 0.55, 0.72, 0.38, 1.0, 0.15, 1.0), 0.002)
  const finB = s.poly(pts(0.25, 0.52, 0.55, 0.48, 0.38, 0.22, 0.15, 0.22), 0.002)
  const gondola = s.poly(pts(1.15, 0.28, 1.62, 0.28, 1.56, 0.17, 1.2, 0.17), 0.002)
  paint(s, [
    { shape: finT, color: C.navy, ink: 0.016 },
    { shape: finB, color: C.navy, ink: 0.016 },
    {
      shape: body,
      color: '#e9e4da',
      ink: 0.022,
      detail: () => {
        const c = s.ctx
        c.save()
        c.clip(body.path)
        c.fillStyle = C.navy
        c.fillRect(0, 0.5, 3, 0.2)
        c.fillStyle = C.red
        c.fillRect(0, 0.47, 3, 0.03)
        c.fillRect(0, 0.7, 3, 0.03)
        c.restore()
        s.text('NEW YORK', 1.38, 0.54, 0.13, { color: '#fff4dc', glow: '#ffe28a' })
        s.hatch(s.rect(0.2, 0.26, 2.2, 0.16, 0), { angle: 0.3, gap: 0.04, alpha: 0.18 })
        for (const x of [0.6, 0.95, 1.65, 2.0]) s.line([[x, 0.3], [x - 0.02, 0.92]], 0.006, rgba(INK, 0.3))
      },
    },
    {
      shape: gondola,
      color: '#c6ccd0',
      ink: 0.012,
      detail: () => s.windows(1.24, 0.2, 4, 1, 0.05, 0.04, 0.04, 0, { frame: false, lit: 1 }),
    },
  ])
}

export function cloud(s: Sketch) {
  blobs(
    s,
    [
      [0.38, 0.3, 0.26],
      [0.78, 0.48, 0.36],
      [1.22, 0.42, 0.32],
      [1.58, 0.28, 0.22],
      [1.0, 0.24, 0.24],
    ],
    '#fffdf6',
    'rgba(120,150,190,0.45)',
    0.022
  )
}
