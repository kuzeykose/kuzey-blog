import { INK, Pt, Shape, Sketch, rgba, shade } from './sketch'
import { C } from './palette'
import { Part, paint, pts } from './art-common'

// Art for the Lower Manhattan spread, seen from the harbour looking north.

// A building block with a grid of windows.
function block(s: Sketch, shape: Shape, color: string, win = C.window, lit = 0.45): Part {
  return {
    shape,
    color,
    ink: 0.02,
    detail: () => {
      const w = shape.maxX - shape.minX
      const h = shape.maxY - shape.minY
      const cols = Math.max(2, Math.round(w / 0.17))
      const rows = Math.max(2, Math.round(h / 0.22))
      const cellW = (w - w * 0.24) / cols
      const cellH = (h - 0.32) / rows
      s.windows(shape.minX + w * 0.12 + cellW * 0.22, shape.minY + 0.14 + cellH * 0.22, cols, rows, cellW * 0.55, cellH * 0.55, cellW * 0.45, cellH * 0.45, {
        color: win,
        lit,
        frame: false,
      })
    },
  }
}

// ---------------------------------------------------------------------------
// The Financial District skyline behind.

export function downtownSkyline(s: Sketch) {
  const W = s.w
  const parts: Part[] = []
  for (let x = 0.1; x < W - 0.4; x += s.r(0.55, 0.9)) {
    parts.push({ shape: s.rect(x, 0, s.r(0.45, 0.8), s.r(1.8, 3.0), 0.003), color: C.hazeLight, ink: 0.014 })
  }
  for (let x = 0.0; x < W - 0.5; x += s.r(0.7, 1.1)) {
    parts.push(block(s, s.rect(x, 0, s.r(0.55, 0.9), s.r(2.0, 3.2), 0.003), s.pick([C.haze, C.hazeDark, '#b3bfd2']), '#7b8aa6', 0.35))
  }
  // 3 World Trade: glass with its X-bracing.
  const three = s.rect(1.6, 0, 0.75, 4.0, 0.003)
  parts.push({
    shape: three,
    color: '#7f97ad',
    ink: 0.02,
    detail: () => {
      s.windows(1.68, 0.25, 4, 16, 0.1, 0.12, 0.07, 0.11, { color: '#4e6680', lit: 0.3, frame: false })
      for (let y = 0.3; y < 3.8; y += 0.95) {
        s.line([[1.6, y], [2.35, y + 0.95]], 0.02, '#2f3b4a', 0)
        s.line([[2.35, y], [1.6, y + 0.95]], 0.02, '#2f3b4a', 0)
      }
    },
  })
  // 70 Pine: limestone setbacks to an Art Deco crown.
  parts.push(
    block(s, s.poly(pts(5.2, 0, 6.0, 0, 6.0, 2.8, 5.88, 2.8, 5.88, 3.3, 5.75, 3.3, 5.72, 3.7, 5.62, 4.2, 5.52, 3.7, 5.48, 3.3, 5.33, 3.3, 5.33, 2.8, 5.2, 2.8), 0.003), '#ddd0b6')
  )
  // 40 Wall Street: a green pyramid and its spire.
  parts.push(block(s, s.rect(7.0, 0, 0.75, 3.3, 0.003), '#d4c2a2'))
  parts.push({ shape: s.poly(pts(6.98, 3.3, 7.77, 3.3, 7.375, 3.95), 0.003), color: C.copper, ink: 0.018, hatch: { angle: 0.6, gap: 0.03, alpha: 0.3 } })
  s.strip([[7.375, 3.95], [7.375, 4.3]], 0.02, 0.03)
  // 56 Leonard: glass boxes stacked like a game of Jenga.
  const jenga: Shape[] = []
  for (let k = 0; k < 9; k++) {
    const y = 1.6 + k * 0.28
    const off = Math.sin(k * 2.3) * 0.12
    jenga.push(s.rect(9.3 + off, y, 0.7, 0.3, 0.002))
  }
  parts.push(block(s, s.rect(9.35, 0, 0.6, 1.62, 0.003), '#9fb3c4', '#4e6680', 0.3))
  jenga.forEach((shape) => parts.push({ shape, color: '#a9bfd0', ink: 0.014, detail: () => s.windows(shape.minX + 0.06, shape.minY + 0.07, 4, 1, 0.1, 0.14, 0.06, 0, { color: '#4e6680', lit: 0.4, frame: false }) }))
  // Old Downtown in front: banks and offices.
  for (let x = 0.05; x < W - 0.4; x += s.r(0.65, 1.0)) {
    parts.push(block(s, s.rect(x, 0, s.r(0.6, 0.95), s.r(1.0, 1.8), 0.003), s.pick([C.limestone, C.brick, C.cream, C.brownstone, C.limestoneDark]), C.window, 0.5))
  }
  paint(s, parts)
}

// ---------------------------------------------------------------------------
// The Oculus: white ribs fanning up like a bird let go from a child's hands.

export function oculus(s: Sketch) {
  const W = s.w
  const cx = W / 2
  const ribs = 15
  // Each wing is a comb of ribs: rooted along the spine, tips sweeping up
  // and out towards the ends.
  const root = (d: number, t: number): Pt => [cx + d * (0.12 + 1.25 * t), 0.58 - 0.12 * t]
  const tip = (d: number, t: number): Pt => [cx + d * (0.3 + (W / 2 - 0.38) * t), 1.0 + 0.92 * t]
  const wings = [-1, 1].map((d) => {
    const line: Pt[] = []
    for (let k = 0; k <= 12; k++) line.push(root(d, k / 12))
    for (let k = 12; k >= 0; k--) line.push(tip(d, k / 12))
    return s.poly(line, 0.002)
  })
  const spine = s.custom(
    (p) => {
      p.moveTo(cx - 1.45, 0.08)
      p.lineTo(cx + 1.45, 0.08)
      p.quadraticCurveTo(cx + 1.5, 0.42, cx, 0.66)
      p.quadraticCurveTo(cx - 1.5, 0.42, cx - 1.45, 0.08)
      p.closePath()
    },
    pts(cx - 1.5, 0.08, cx + 1.5, 0.66)
  )
  const base = s.rect(cx - 1.5, 0, 3.0, 0.1, 0)
  paint(s, [
    ...wings.map((shape) => ({
      shape,
      color: '#cdd9e0',
      ink: 0.016,
      detail: () => s.glow(shape, '#a8946a'),
    })),
    {
      shape: spine,
      color: '#f4f2ec',
      ink: 0.018,
      detail: () => {
        const glass = s.rect(cx - 0.45, 0.08, 0.9, 0.26, 0)
        s.fill(glass, '#a9c3c9')
        s.glow(glass, '#ffd99a')
        for (let x = cx - 0.4; x < cx + 0.45; x += 0.1) s.line([[x, 0.08], [x, 0.34]], 0.008, '#f4f2ec', 0)
      },
    },
    { shape: base, color: '#bdb8ac', ink: 0.012 },
  ])
  // The ribs in white steel.
  for (const d of [-1, 1]) {
    for (let k = 0; k < ribs; k++) {
      const t = k / (ribs - 1)
      const a = root(d, t)
      const b = tip(d, t)
      s.strip([a, b], 0.03, 0.015, '#fbfaf6')
      // (The ribs stay dark against the lit glass after dark.)
      const g = s.glowCtx
      if (g) {
        g.strokeStyle = '#000'
        g.lineWidth = 0.035
        g.beginPath()
        g.moveTo(a[0], a[1])
        g.lineTo(b[0], b[1])
        g.stroke()
      }
    }
  }
  s.strip([[cx, 0.1], [cx, 0.7]], 0.05, 0.02, '#fbfaf6')
}

// ---------------------------------------------------------------------------
// Trinity Church at the head of Wall Street: soot-dark Gothic and a spire.

export function trinityChurch(s: Sketch) {
  const W = s.w
  const stone = '#7a6558'
  const nave = s.poly(pts(0.05, 0, W - 0.05, 0, W - 0.05, 1.1, W / 2 + 0.2, 1.55, W / 2 - 0.2, 1.55, 0.05, 1.1), 0.003)
  const tower = s.rect(W / 2 - 0.3, 0, 0.6, 2.35, 0.003)
  const spire = s.poly(pts(W / 2 - 0.3, 2.35, W / 2 + 0.3, 2.35, W / 2, 3.55), 0.003)
  const pinnacles = [-1, 1].map((d) => s.poly(pts(W / 2 + d * 0.3 - 0.05, 2.35, W / 2 + d * 0.3 + 0.05, 2.35, W / 2 + d * 0.3, 2.62), 0))
  const pointed = (x: number, y: number, w: number, h: number) =>
    s.custom(
      (p) => {
        p.moveTo(x, y)
        p.lineTo(x, y + h - w / 2)
        p.quadraticCurveTo(x, y + h, x + w / 2, y + h + w * 0.2)
        p.quadraticCurveTo(x + w, y + h, x + w, y + h - w / 2)
        p.lineTo(x + w, y)
        p.closePath()
      },
      pts(x, y, x + w, y + h + w * 0.2)
    )
  paint(s, [
    {
      shape: nave,
      color: shade(stone, 0.05),
      ink: 0.02,
      detail: () => {
        for (const x of [0.15, W - 0.33]) {
          const win = pointed(x, 0.35, 0.18, 0.5)
          s.fill(win, '#3d4a63')
          s.glow(win, '#ffc873')
        }
      },
    },
    {
      shape: tower,
      color: stone,
      ink: 0.022,
      detail: () => {
        const door = pointed(W / 2 - 0.13, 0, 0.26, 0.45)
        s.fill(door, '#3a2c26')
        const rose = pointed(W / 2 - 0.1, 0.9, 0.2, 0.55)
        s.fill(rose, '#3d4a63')
        s.glow(rose, '#ffc873')
        const clock = s.ellipse(W / 2, 1.85, 0.12, 0.12)
        s.fill(clock, '#f1e7cf')
        s.ink(clock, 0.01)
        s.glow(clock, '#e9d29a')
        s.hatch(tower, { angle: 1.3, gap: 0.035, alpha: 0.3 })
      },
    },
    { shape: spire, color: shade(stone, -0.05), ink: 0.02, hatch: { angle: 1.0, gap: 0.04, alpha: 0.35 } },
    ...pinnacles.map((shape) => ({ shape, color: stone, ink: 0.01 })),
  ])
  s.strip([[W / 2, 3.55], [W / 2, 3.68]], 0.02, 0.025, '#d9b45a')
  s.strip([[W / 2 - 0.05, 3.63], [W / 2 + 0.05, 3.63]], 0.02, 0.025, '#d9b45a')
  // Headstones in the churchyard.
  for (const x of [0.15, 0.3, W - 0.3, W - 0.16]) {
    const stoneShape = s.custom(
      (p) => {
        p.moveTo(x - 0.05, 0)
        p.lineTo(x - 0.05, 0.12)
        p.arc(x, 0.12, 0.05, Math.PI, 0, true)
        p.lineTo(x + 0.05, 0)
        p.closePath()
      },
      pts(x - 0.05, 0, x + 0.05, 0.17)
    )
    s.fill(stoneShape, '#9a958c')
    s.ink(stoneShape, 0.008)
  }
}

// ---------------------------------------------------------------------------
// The New York Stock Exchange: six columns and a flag as big as the front.

export function stockExchange(s: Sketch) {
  const W = s.w
  const stone = '#ece3cf'
  const base = s.rect(0.05, 0, W - 0.1, 0.25, 0.003)
  const entablature = s.rect(0.1, 1.75, W - 0.2, 0.3, 0.003)
  const pediment = s.poly(pts(0.05, 2.05, W - 0.05, 2.05, W / 2, 2.5), 0.003)
  const cols = [0, 1, 2, 3, 4, 5].map((k) => s.rect(0.28 + k * ((W - 0.76) / 5), 0.25, 0.2, 1.5, 0.002))
  const flag = s.rect(0.55, 0.45, W - 1.1, 1.22, 0.002)
  paint(s, [
    {
      shape: s.rect(0.1, 0.25, W - 0.2, 1.5, 0.003),
      color: '#c8bba0',
      ink: 0.016,
      detail: () => s.glow(s.rect(0.15, 0.25, W - 0.3, 1.5, 0), '#a08050'),
    },
    ...cols.map((shape) => ({
      shape,
      color: stone,
      ink: 0.016,
      detail: () => {
        for (let k = 1; k < 4; k++) s.line([[shape.minX + k * 0.05, 0.28], [shape.minX + k * 0.05, 1.72]], 0.006, rgba(INK, 0.3), 0)
      },
    })),
    {
      shape: flag,
      color: '#f4f1ea',
      ink: 0.014,
      detail: () => {
        const fw = W - 1.1
        // Floodlit at night, each stripe in its own colour.
        s.glow(flag, '#6e6a62')
        for (let k = 0; k < 13; k += 2) {
          const stripe = s.rect(0.55, 0.45 + k * (1.22 / 13), fw, 1.22 / 13, 0)
          s.fill(stripe, '#c8202f')
          s.glow(stripe, '#6a141a')
        }
        const canton = s.rect(0.55, 0.45 + 1.22 * (6 / 13), fw * 0.4, 1.22 * (7 / 13), 0)
        s.fill(canton, '#2a3f7a')
        s.glow(canton, '#141c3a')
        for (let i = 0; i < 20; i++) s.fill(s.ellipse(0.6 + (i % 5) * fw * 0.075 + 0.02, 0.45 + 1.22 * (6 / 13) + 0.06 + Math.floor(i / 5) * 0.14, 0.018, 0.018), '#ffffff')
        // Folds where it hangs.
        for (let x = 0.75; x < W - 0.6; x += 0.3) s.line([[x, 0.45], [x, 1.67]], 0.012, 'rgba(0,0,0,0.12)', 0)
      },
    },
    {
      shape: entablature,
      color: stone,
      ink: 0.018,
      detail: () => s.text('NEW YORK STOCK EXCHANGE', W / 2, 1.83, 0.1, { color: rgba(INK, 0.8), spacing: 3 }),
    },
    {
      shape: pediment,
      color: shade(stone, -0.03),
      ink: 0.018,
      detail: () => {
        for (let k = -3; k <= 3; k++) {
          const h = 0.28 - Math.abs(k) * 0.06
          s.fill(s.rect(W / 2 + k * 0.17 - 0.04, 2.08, 0.08, h, 0), shade(stone, -0.15))
        }
      },
    },
    { shape: base, color: shade(stone, -0.05), ink: 0.016 },
  ])
}

// ---------------------------------------------------------------------------
// The Woolworth Building: white terracotta Gothic under a copper crown.

export function woolworth(s: Sketch) {
  const W = s.w
  const terracotta = '#efe6d2'
  const base = s.rect(0.05, 0, W - 0.1, 2.4, 0.003)
  const shaft = s.rect(0.3, 2.35, W - 0.6, 1.95, 0.003)
  const crown = s.poly(pts(0.4, 4.3, W - 0.4, 4.3, W - 0.52, 4.75, W / 2 + 0.12, 5.05, W / 2, 5.35, W / 2 - 0.12, 5.05, 0.52, 4.75), 0.003)
  const piers = (shape: Shape, step: number) => () => {
    for (let x = shape.minX + step; x < shape.maxX - 0.02; x += step) s.line([[x, shape.minY + 0.1], [x, shape.maxY]], 0.016, shade(terracotta, -0.15), 0)
    s.windows(shape.minX + 0.07, shape.minY + 0.15, Math.round((shape.maxX - shape.minX - 0.1) / step), Math.round((shape.maxY - shape.minY - 0.2) / 0.2), step * 0.5, 0.12, step * 0.5, 0.08, { color: '#4a5670', lit: 0.5, frame: false })
  }
  paint(s, [
    { shape: base, color: terracotta, ink: 0.022, detail: piers(base, 0.14) },
    { shape: shaft, color: terracotta, ink: 0.022, detail: piers(shaft, 0.14) },
    {
      shape: crown,
      color: C.copper,
      ink: 0.02,
      detail: () => {
        s.hatch(crown, { angle: 1.1, gap: 0.03, alpha: 0.3 })
        for (const x of [0.6, W / 2, W - 0.6]) {
          const dormer = s.rect(x - 0.04, 4.45, 0.08, 0.14, 0)
          s.fill(dormer, '#3d4a63')
          s.glow(dormer, '#ffd27a')
        }
      },
    },
  ])
  // Gothic pinnacles at the corners of each setback.
  for (const [x, y] of [
    [0.1, 2.4],
    [W - 0.1, 2.4],
    [0.35, 4.3],
    [W - 0.35, 4.3],
  ] as Pt[]) {
    const pin = s.poly(pts(x - 0.05, y, x + 0.05, y, x, y + 0.3), 0)
    s.border([pin], 0.03)
    s.fill(pin, terracotta)
    s.ink(pin, 0.01)
  }
  s.strip([[W / 2, 5.35], [W / 2, 5.5]], 0.02, 0.025, '#d9b45a')
}

// 8 Spruce Street: stainless steel that ripples like a curtain.
export function eightSpruce(s: Sketch) {
  const W = s.w
  const top = 5.3
  const tower = s.poly(pts(0.2, 0, W - 0.2, 0, W - 0.2, top - 0.6, W - 0.45, top - 0.6, W - 0.45, top - 0.2, W - 0.7, top - 0.2, W - 0.7, top, 0.2, top), 0.003)
  const podium = s.rect(0.05, 0, W - 0.1, 0.65, 0.003)
  paint(s, [
    {
      shape: tower,
      color: '#c9d1d6',
      ink: 0.022,
      detail: () => {
        // Each floor bulges a little differently: shade the ripples.
        const c = s.ctx
        c.save()
        c.clip(tower.path)
        for (let y = 0.65; y < top; y += 0.12) {
          for (let x = 0.2; x < W - 0.2; x += 0.04) {
            const v = Math.sin(x * 7 + Math.sin(y * 1.3) * 2.2)
            c.fillStyle = v > 0 ? `rgba(255,255,255,${0.35 * v})` : `rgba(40,50,70,${-0.3 * v})`
            c.fillRect(x, y, 0.04, 0.12)
          }
        }
        c.restore()
        s.windows(0.28, 0.75, 6, 22, 0.09, 0.1, 0.1, 0.12, { color: '#55657c', lit: 0.4, frame: false })
      },
    },
    { shape: podium, color: '#b07a5a', ink: 0.02, detail: () => s.windows(0.15, 0.12, 7, 2, 0.12, 0.14, 0.08, 0.1, { lit: 0.6 }) },
  ])
}

// ---------------------------------------------------------------------------
// The Charging Bull, head down, tail up, its nose and horns rubbed gold.

export function chargingBull(s: Sketch) {
  const bronze = '#7d5a34'
  const gold = '#d9b45a'
  const legs: [number, number, number, number][] = [
    [0.55, 0.42, 0.42, 0.04],
    [0.72, 0.42, 0.78, 0.04],
    [1.3, 0.45, 1.22, 0.04],
    [1.45, 0.45, 1.6, 0.06],
  ]
  legs.forEach(([x0, y0, x1, y1]) => s.strip([[x0, y0], [x1, y1]], 0.1, 0.04, shade(bronze, -0.1)))
  const tail = s.custom(
    (p) => {
      p.moveTo(0.4, 0.78)
      p.quadraticCurveTo(0.15, 0.95, 0.12, 1.12)
      p.quadraticCurveTo(0.2, 0.98, 0.42, 0.86)
      p.closePath()
    },
    pts(0.12, 0.78, 0.42, 1.12)
  )
  const body = s.custom(
    (p) => {
      p.moveTo(0.38, 0.5)
      p.quadraticCurveTo(0.35, 0.9, 0.7, 0.92)
      p.quadraticCurveTo(1.1, 1.08, 1.45, 1.02)
      p.quadraticCurveTo(1.66, 0.95, 1.7, 0.7)
      p.quadraticCurveTo(1.6, 0.4, 1.3, 0.38)
      p.quadraticCurveTo(0.9, 0.32, 0.38, 0.5)
      p.closePath()
    },
    pts(0.35, 0.32, 1.7, 1.08)
  )
  const head = s.custom(
    (p) => {
      p.moveTo(1.55, 0.88)
      p.quadraticCurveTo(1.82, 0.85, 1.92, 0.5)
      p.quadraticCurveTo(1.93, 0.36, 1.82, 0.36)
      p.quadraticCurveTo(1.68, 0.48, 1.55, 0.6)
      p.closePath()
    },
    pts(1.55, 0.36, 1.93, 0.88)
  )
  const horns = [0, 1].map((k) =>
    s.custom(
      (p) => {
        const x = 1.72 + k * 0.08
        p.moveTo(x, 0.8)
        p.quadraticCurveTo(x + 0.05, 1.0, x + 0.2, 1.02)
        p.quadraticCurveTo(x + 0.05, 0.95, x + 0.06, 0.78)
        p.closePath()
      },
      pts(1.72, 0.78, 2.0, 1.02)
    )
  )
  paint(s, [
    { shape: tail, color: bronze, ink: 0.012 },
    { shape: body, color: bronze, ink: 0.02, hatch: { angle: 0.5, gap: 0.035, alpha: 0.3 }, detail: () => s.fill(s.ellipse(1.05, 0.95, 0.3, 0.05), 'rgba(255,220,150,0.25)') },
    { shape: head, color: shade(bronze, 0.04), ink: 0.018, detail: () => s.fill(s.ellipse(1.86, 0.42, 0.07, 0.05), gold) },
    ...horns.map((shape) => ({ shape, color: gold, ink: 0.012 })),
  ])
  s.fill(s.ellipse(1.76, 0.66, 0.02, 0.02), INK)
  const plinth = s.rect(0.25, 0, 1.6, 0.06, 0)
  s.border([plinth], 0.03)
  s.fill(plinth, '#6b6a66')
  s.ink(plinth, 0.01)
}

// Fearless Girl: hands on hips, chin up, staring the bull down. Faces left.
export function fearlessGirl(s: Sketch) {
  const W = s.w
  const bronze = '#7d5a34'
  const cx = W / 2
  const legs = [-1, 1].map((d) => s.poly(pts(cx + d * 0.05 - 0.025, 0.05, cx + d * 0.05 + 0.025, 0.05, cx + d * 0.04 + 0.02, 0.38, cx + d * 0.04 - 0.02, 0.38), 0))
  const dress = s.poly(pts(cx - 0.13, 0.36, cx + 0.13, 0.36, cx + 0.07, 0.68, cx - 0.07, 0.68), 0.002)
  const arms = [-1, 1].map((d) => s.poly(pts(cx + d * 0.06, 0.66, cx + d * 0.17, 0.55, cx + d * 0.1, 0.46, cx + d * 0.12, 0.44, cx + d * 0.2, 0.55, cx + d * 0.08, 0.7), 0))
  const head = s.ellipse(cx - 0.01, 0.78, 0.07, 0.08)
  const pony = s.custom(
    (p) => {
      p.moveTo(cx + 0.05, 0.82)
      p.quadraticCurveTo(cx + 0.16, 0.84, cx + 0.15, 0.68)
      p.quadraticCurveTo(cx + 0.1, 0.78, cx + 0.04, 0.76)
      p.closePath()
    },
    pts(cx + 0.04, 0.68, cx + 0.16, 0.84)
  )
  const plinth = s.rect(cx - 0.18, 0, 0.36, 0.05, 0)
  paint(
    s,
    [
      ...legs.map((shape) => ({ shape, color: bronze, ink: 0.01 })),
      { shape: dress, color: bronze, ink: 0.012, hatch: { angle: 1.2, gap: 0.03, alpha: 0.3 } },
      ...arms.map((shape) => ({ shape, color: bronze, ink: 0.01 })),
      { shape: pony, color: shade(bronze, -0.08), ink: 0.01 },
      { shape: head, color: bronze, ink: 0.012, detail: () => s.fill(s.ellipse(cx - 0.05, 0.79, 0.01, 0.012), INK) },
      { shape: plinth, color: '#6b6a66', ink: 0.01 },
    ],
    0.04
  )
}

// ---------------------------------------------------------------------------
// The waterfront: Castle Clinton, the ferry, a tall ship at the Seaport.

export function castleClinton(s: Sketch) {
  const W = s.w
  const stone = '#a8705a'
  const wall = s.custom(
    (p) => {
      p.moveTo(0.05, 0)
      p.lineTo(W - 0.05, 0)
      p.lineTo(W - 0.05, 0.55)
      p.quadraticCurveTo(W / 2, 0.75, 0.05, 0.55)
      p.closePath()
    },
    pts(0.05, 0, W - 0.05, 0.75)
  )
  const gate = s.custom(
    (p) => {
      p.moveTo(W / 2 - 0.13, 0)
      p.lineTo(W / 2 - 0.13, 0.25)
      p.arc(W / 2, 0.25, 0.13, Math.PI, 0, true)
      p.lineTo(W / 2 + 0.13, 0)
      p.closePath()
    },
    pts(W / 2 - 0.13, 0, W / 2 + 0.13, 0.38)
  )
  paint(s, [
    {
      shape: wall,
      color: stone,
      ink: 0.02,
      detail: () => {
        for (let y = 0.1; y < 0.7; y += 0.1) s.line([[0.05, y], [W - 0.05, y]], 0.006, rgba(INK, 0.3), 0)
        for (let x = 0.25; x < W - 0.2; x += 0.3) {
          if (Math.abs(x - W / 2) < 0.25) continue
          const gun = s.rect(x, 0.3, 0.07, 0.1, 0)
          s.fill(gun, '#3a2c26')
        }
        s.hatch(s.rect(W - 0.5, 0, 0.45, 0.75, 0), { angle: 1.2, gap: 0.035, alpha: 0.2 })
      },
    },
    { shape: gate, color: '#3a2c26', ink: 0.014, detail: () => s.glow(gate, '#ffc873') },
  ])
  s.strip([[W / 2, 0.68], [W / 2, 1.0]], 0.014, 0.025)
  const flag = s.poly(pts(W / 2, 1.0, W / 2 + 0.24, 0.94, W / 2, 0.88), 0)
  s.fill(flag, C.red)
  s.ink(flag, 0.008)
}

export function statenFerry(s: Sketch) {
  const W = s.w
  const orange = '#f0782a'
  const hull = s.custom(
    (p) => {
      p.moveTo(0.05, 0.4)
      p.lineTo(W - 0.05, 0.4)
      p.quadraticCurveTo(W - 0.2, 0.1, W - 0.4, 0.08)
      p.lineTo(0.4, 0.08)
      p.quadraticCurveTo(0.2, 0.1, 0.05, 0.4)
      p.closePath()
    },
    pts(0.05, 0.08, W - 0.05, 0.4)
  )
  const decks = s.rect(0.3, 0.4, W - 0.6, 0.38, 0.002)
  const top = s.rect(0.6, 0.78, W - 1.2, 0.16, 0.002)
  const cabins = [0.75, W - 0.95].map((x) => s.rect(x, 0.94, 0.2, 0.12, 0.002))
  paint(s, [
    {
      shape: hull,
      color: orange,
      ink: 0.02,
      detail: () => {
        s.fill(s.rect(0.05, 0.33, W - 0.1, 0.05, 0), '#f6f0e2')
        s.text('STATEN ISLAND', W / 2, 0.16, 0.1, { color: '#f6f0e2', font: 'Helvetica, Arial, sans-serif', spacing: 3 })
      },
    },
    {
      shape: decks,
      color: orange,
      ink: 0.018,
      detail: () => {
        s.windows(0.38, 0.47, 18, 2, 0.07, 0.09, 0.055, 0.07, { color: '#3d4a63', lit: 0.7, frame: false })
      },
    },
    { shape: top, color: '#f6f0e2', ink: 0.014 },
    ...cabins.map((shape) => ({ shape, color: '#f6f0e2', ink: 0.012, detail: () => s.fill(s.rect(shape.minX + 0.03, shape.minY + 0.03, 0.14, 0.05, 0), '#3d4a63') })),
  ])
  for (const x of [0.1, W - 0.1]) {
    for (let k = 1; k <= 2; k++) s.line([[x, 0.05 - k * 0.0], [x + (x < W / 2 ? -1 : 1) * 0.25 * k, 0.02]], 0.012, 'rgba(255,255,255,0.8)', 0)
  }
}

export function tallShip(s: Sketch) {
  const W = s.w
  const hull = s.custom(
    (p) => {
      p.moveTo(0.05, 0.45)
      p.lineTo(W - 0.1, 0.5)
      p.lineTo(W - 0.2, 0.08)
      p.lineTo(0.3, 0.08)
      p.quadraticCurveTo(0.1, 0.2, 0.05, 0.45)
      p.closePath()
    },
    pts(0.05, 0.08, W - 0.1, 0.5)
  )
  const masts = [0.55, 1.05, 1.5]
  masts.forEach((x, i) => {
    const h = i === 1 ? 2.35 : 2.1
    s.strip([[x, 0.45], [x, h]], 0.03, 0.03, '#5a3d2e')
    for (let k = 0; k < 3; k++) {
      const y = 1.0 + k * 0.42
      const half = 0.3 - k * 0.06
      s.strip([[x - half, y], [x + half, y]], 0.02, 0.025, '#5a3d2e')
      // Furled sail along the yard.
      const sail = s.ellipse(x, y - 0.03, half * 0.9, 0.035)
      s.fill(sail, '#efe6d0')
      s.ink(sail, 0.006)
    }
  })
  // Rigging down to the rails, and the bowsprit.
  for (const x of masts) {
    s.strip([[x, 2.0], [x - 0.35, 0.48]], 0.006, 0.015)
    s.strip([[x, 2.0], [x + 0.35, 0.49]], 0.006, 0.015)
  }
  s.strip([[W - 0.12, 0.5], [W - 0.02, 0.75], [1.5, 2.0]], 0.012, 0.02, '#5a3d2e')
  paint(s, [
    {
      shape: hull,
      color: '#1f1c22',
      ink: 0.018,
      detail: () => {
        s.fill(s.rect(0.08, 0.3, W - 0.2, 0.06, 0), '#f1e7cf')
        for (let x = 0.3; x < W - 0.3; x += 0.18) s.fill(s.rect(x, 0.31, 0.06, 0.04, 0), '#1f1c22')
        const lamps = s.rect(0.2, 0.38, 0.06, 0.05, 0)
        s.fill(lamps, '#ffe7a8')
        s.glow(lamps, '#ffd27a')
      },
    },
  ])
  const flag = s.poly(pts(0.12, 0.85, 0.32, 0.8, 0.12, 0.72), 0)
  s.strip([[0.12, 0.45], [0.12, 0.85]], 0.012, 0.02)
  s.fill(flag, C.red)
  s.ink(flag, 0.006)
}
