import { INK, Pt, Shape, Sketch, rgba, shade } from './sketch'
import { C } from './palette'
import { Part, paint, pts } from './art-common'
import { person } from './art-street'

// Art for the Midtown spread, looking north up Fifth Avenue.

const SANS = 'Helvetica, Arial, sans-serif'

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

// Bulbs round a lit sign.
function bulbs(s: Sketch, x: number, y: number, w: number, h: number, n: number) {
  for (let k = 0; k <= n; k++) {
    for (const by of [y, y + h]) {
      const bulb = s.ellipse(x + (w * k) / n, by, 0.016, 0.016)
      s.fill(bulb, '#fff1c2')
      s.glow(bulb, '#fff1c2')
    }
  }
}

// ---------------------------------------------------------------------------
// Midtown behind: the MetLife Building over Park Avenue, Citigroup Center's
// slanted roof, the Bank of America tower's spire.

export function midtownSkyline(s: Sketch) {
  const W = s.w
  const parts: Part[] = []
  for (let x = 0.1; x < W - 0.4; x += s.r(0.55, 0.9)) {
    parts.push({ shape: s.rect(x, 0, s.r(0.45, 0.8), s.r(1.8, 3.0), 0.003), color: C.hazeLight, ink: 0.014 })
  }
  for (let x = 0.0; x < W - 0.5; x += s.r(0.7, 1.1)) {
    parts.push(block(s, s.rect(x, 0, s.r(0.55, 0.9), s.r(2.0, 3.0), 0.003), s.pick([C.haze, C.hazeDark, '#b3bfd2']), '#7b8aa6', 0.35))
  }
  // Bank of America Tower, tapering to its spire.
  parts.push(block(s, s.poly(pts(2.0, 0, 2.75, 0, 2.75, 3.3, 2.55, 3.9, 2.42, 3.9, 2.4, 4.4, 2.37, 3.9, 2.0, 3.6), 0.003), '#9fb3c4', '#4e6680', 0.35))
  // Citigroup Center: a white tower with its roof cut at forty-five degrees.
  const citi = s.poly(pts(6.5, 0, 7.3, 0, 7.3, 3.0, 6.5, 3.8), 0.003)
  parts.push({
    shape: citi,
    color: '#e9e6df',
    ink: 0.02,
    detail: () => {
      for (let y = 0.3; y < 3.7; y += 0.12) s.fill(s.rect(6.5, y, 0.8, 0.05, 0), '#5d6b85')
      s.glow(s.rect(6.5, 0.3, 0.8, 2.6, 0), '#3a3020')
    },
  })
  // The MetLife Building, broad across Park Avenue.
  const metlife = s.poly(pts(9.0, 0, 10.8, 0, 10.8, 3.2, 10.6, 3.45, 9.2, 3.45, 9.0, 3.2), 0.003)
  parts.push({
    ...block(s, metlife, '#b9b4a8', '#55657c', 0.45),
    detail: () => {
      s.windows(9.1, 0.3, 14, 14, 0.07, 0.11, 0.055, 0.09, { color: '#55657c', lit: 0.45, frame: false })
      s.fill(s.rect(9.4, 3.0, 1.0, 0.28, 0), '#3a3a42')
      s.text('MetLife', 9.9, 3.06, 0.16, { color: '#9fd0ff', glow: '#9fd0ff', font: SANS })
    },
  })
  for (let x = 0.05; x < W - 0.4; x += s.r(0.65, 1.0)) {
    parts.push(block(s, s.rect(x, 0, s.r(0.6, 0.95), s.r(1.0, 1.8), 0.003), s.pick([C.limestone, C.brick, C.cream, C.brownstone, C.limestoneDark]), C.window, 0.5))
  }
  paint(s, parts)
}

// ---------------------------------------------------------------------------
// 30 Rockefeller Plaza: a limestone slab in tight vertical stripes, stepping
// back as it rises, the observation deck on top.

export function thirtyRock(s: Sketch) {
  const W = s.w
  const stone = '#ddd3bf'
  const steps: [number, number][] = [
    [0.0, 1.6],
    [0.18, 3.4],
    [0.36, 4.7],
    [0.52, 5.7],
    [0.66, 6.15],
  ]
  // One outline, setting back symmetrically.
  const line: Pt[] = [[0.05, 0]]
  steps.forEach(([inset, top], i) => {
    line.push([0.05 + inset, i ? steps[i - 1][1] : 0], [0.05 + inset, top])
  })
  for (let i = steps.length - 1; i >= 0; i--) {
    const [inset, top] = steps[i]
    line.push([W - 0.05 - inset, top], [W - 0.05 - inset, i ? steps[i - 1][1] : 0])
  }
  line.push([W - 0.05, 0])
  const slab = s.poly(line, 0.002)
  paint(s, [
    {
      shape: slab,
      color: stone,
      ink: 0.024,
      detail: () => {
        const c = s.ctx
        c.save()
        c.clip(slab.path)
        // Window strips between the piers.
        for (let x = 0.12; x < W - 0.1; x += 0.085) {
          c.fillStyle = 'rgba(70,80,100,0.45)'
          c.fillRect(x, 0.5, 0.035, 5.6)
        }
        c.restore()
        s.windows(0.12, 0.6, Math.round((W - 0.2) / 0.085), 22, 0.035, 0.12, 0.05, 0.13, { color: '#3e4c66', lit: 0.4, frame: false })
        const lobby = s.rect(W / 2 - 0.35, 0, 0.7, 0.45, 0)
        s.fill(lobby, '#3a3a42')
        s.glow(lobby, '#ffd99a')
        // Gilded relief over the entrance.
        s.fill(s.rect(W / 2 - 0.4, 0.48, 0.8, 0.16, 0), '#d9b45a')
        s.text('30', W / 2, 5.85, 0.16, { color: rgba(INK, 0.7), font: SANS })
        s.hatch(s.rect(W - 0.5, 0, 0.45, 6.2, 0), { angle: 1.25, gap: 0.04, alpha: 0.18 })
      },
    },
  ])
  // The deck's rail and a mast.
  s.strip([[0.71, 6.15], [0.71, 6.25], [W - 0.71, 6.25], [W - 0.71, 6.15]], 0.012, 0.025)
  s.strip([[W / 2, 6.15], [W / 2, 6.38]], 0.016, 0.025)
}

// The sunken plaza: golden Prometheus over the rink, flags all round.
export function rockRink(s: Sketch) {
  const W = s.w
  const wall = s.rect(0.1, 0, W - 0.2, 0.9, 0.003)
  const ice = s.rect(0.05, 0, W - 0.1, 0.22, 0.002)
  const ring = s.ellipse(W / 2, 0.82, 0.42, 0.3)
  const gold = '#d9a93a'
  const prometheus = s.custom(
    (p) => {
      const cx = W / 2
      p.moveTo(cx - 0.32, 0.62)
      p.quadraticCurveTo(cx - 0.1, 0.75, cx + 0.05, 0.9)
      p.lineTo(cx + 0.22, 1.08)
      p.lineTo(cx + 0.26, 1.03)
      p.lineTo(cx + 0.12, 0.86)
      p.quadraticCurveTo(cx + 0.2, 0.8, cx + 0.3, 0.72)
      p.lineTo(cx + 0.24, 0.68)
      p.quadraticCurveTo(cx + 0.05, 0.72, cx - 0.28, 0.56)
      p.closePath()
    },
    pts(W / 2 - 0.32, 0.56, W / 2 + 0.3, 1.08)
  )
  // A ring of flagpoles along the top of the plaza.
  const flags = ['#c8202f', '#2a4fb0', '#f7c948', '#18a558', '#f4f1ea', '#7b2fbf', '#ff7a1a', '#2a9df4', '#c8202f', '#18a558', '#f7c948', '#2a4fb0']
  flags.forEach((col, k) => {
    const x = 0.2 + (k * (W - 0.4)) / (flags.length - 1)
    s.strip([[x, 0.9], [x, 1.45]], 0.012, 0.02)
    const flag = s.poly(pts(x, 1.45, x + 0.17, 1.4, x + 0.17, 1.3, x, 1.33), 0)
    s.fill(flag, col)
    s.ink(flag, 0.006)
  })
  paint(s, [
    {
      shape: wall,
      color: '#9a958c',
      ink: 0.02,
      detail: () => {
        for (let x = 0.4; x < W - 0.2; x += 0.4) s.line([[x, 0.22], [x, 0.9]], 0.008, rgba(INK, 0.3), 0)
        s.fill(s.rect(0.1, 0.75, W - 0.2, 0.15, 0), '#b9b4a8')
        // A row of little trees along the plaza edge.
        for (let x = 0.3; x < W - 0.2; x += 0.55) s.fill(s.ellipse(x, 0.95, 0.12, 0.08), '#5f8f4a')
      },
    },
    {
      shape: ring,
      color: shade(gold, -0.1),
      ink: 0.014,
      detail: () => {
        s.fill(s.ellipse(W / 2, 0.82, 0.32, 0.21), '#9a958c')
        s.glow(ring, '#a8822a')
      },
    },
    { shape: prometheus, color: gold, ink: 0.014, detail: () => s.glow(prometheus, '#ffcf55') },
    {
      shape: ice,
      color: '#d9ecf2',
      ink: 0.016,
      detail: () => {
        for (let i = 0; i < 10; i++) s.line([[s.r(0.2, W - 0.6), s.r(0.04, 0.18)], [s.r(0.2, W - 0.2), s.r(0.04, 0.18)]], 0.006, 'rgba(120,150,170,0.5)', 0)
        s.glow(ice, '#7a8a90')
      },
    },
  ])
  const flame = s.ellipse(W / 2 + 0.27, 1.12, 0.04, 0.06)
  s.fill(flame, '#ff9a3c')
  s.glow(flame, '#ffb347')
}

// A figure skater, arms out, scarf flying.
export function skater(s: Sketch, coat: string, scarf: string) {
  const W = s.w
  const parts = person(s, W / 2, 0.06, 0.85, { coat, scarf, hat: 'beanie', skirt: true })
  paint(s, parts, 0.04)
  // Arms out for balance.
  for (const d of [-1, 1]) s.strip([[W / 2 + d * 0.05, 0.68], [W / 2 + d * 0.26, 0.62]], 0.04, 0.03, coat)
  // Blades.
  for (const d of [-1, 1]) s.strip([[W / 2 + d * 0.04 - 0.06, 0.04], [W / 2 + d * 0.04 + 0.07, 0.04]], 0.014, 0.02, '#c9d1d6')
}

// ---------------------------------------------------------------------------
// Radio City Music Hall: the neon sign up the corner and the long marquee.

export function radioCity(s: Sketch) {
  const W = s.w
  const body = s.rect(0.08, 0, W - 0.16, 4.1, 0.003)
  const blade = s.rect(0.15, 1.5, 0.5, 2.85, 0.003)
  const marquee = s.rect(0.05, 0.85, W - 0.1, 0.55, 0.003)
  paint(s, [
    block(s, body, '#c9bba3', '#3e4c66', 0.55),
    {
      shape: blade,
      color: '#1f2a5a',
      ink: 0.02,
      detail: () => {
        s.glow(blade, '#10183a')
        'RADIO'.split('').forEach((ch, k) => s.text(ch, 0.4, 4.05 - k * 0.27, 0.22, { color: '#ff3b46', glow: '#ff3b46', font: SANS }))
        'CITY'.split('').forEach((ch, k) => s.text(ch, 0.4, 2.62 - k * 0.27, 0.22, { color: '#ff3b46', glow: '#ff3b46', font: SANS }))
      },
    },
    {
      shape: marquee,
      color: '#1f2a5a',
      ink: 0.02,
      detail: () => {
        s.glow(marquee, '#10183a')
        s.text('RADIO CITY', W / 2, 1.13, 0.18, { color: '#ff3b46', glow: '#ff3b46', font: SANS })
        s.text('MUSIC HALL', W / 2, 0.93, 0.12, { color: '#ff3b46', glow: '#ff3b46', font: SANS, spacing: 4 })
        bulbs(s, 0.1, 0.88, W - 0.2, 0.49, 20)
      },
    },
  ])
  const doors = s.rect(0.35, 0, W - 0.7, 0.6, 0)
  s.fill(doors, '#4a3a30')
  s.glow(doors, '#7a5a34')
  s.ink(doors, 0.012)
}

// ---------------------------------------------------------------------------
// St. Patrick's Cathedral: white marble Gothic and its twin spires.

export function stPatricks(s: Sketch) {
  const W = s.w
  const marble = '#efebe2'
  const front = s.poly(pts(0.35, 0, W - 0.35, 0, W - 0.35, 1.7, W / 2, 2.35, 0.35, 1.7), 0.003)
  const towers = [0.05, W - 0.6].map((x) => s.rect(x, 0, 0.55, 2.2, 0.003))
  const spires = [0.05, W - 0.6].map((x) => s.poly(pts(x, 2.2, x + 0.55, 2.2, x + 0.275, 3.9), 0.003))
  const rose = s.ellipse(W / 2, 1.45, 0.3, 0.3)
  const arch = (x: number, y: number, w: number, h: number) =>
    s.custom(
      (p) => {
        p.moveTo(x, y)
        p.lineTo(x, y + h - w / 2)
        p.quadraticCurveTo(x, y + h, x + w / 2, y + h + w * 0.25)
        p.quadraticCurveTo(x + w, y + h, x + w, y + h - w / 2)
        p.lineTo(x + w, y)
        p.closePath()
      },
      pts(x, y, x + w, y + h + w * 0.25)
    )
  paint(s, [
    {
      shape: front,
      color: marble,
      ink: 0.022,
      detail: () => {
        const door = arch(W / 2 - 0.22, 0, 0.44, 0.75)
        s.fill(door, '#7a5a34')
        s.ink(door, 0.012)
        s.line([[W / 2, 0], [W / 2, 0.8]], 0.01, rgba(INK, 0.5), 0)
      },
    },
    ...towers.map((shape) => ({
      shape,
      color: marble,
      ink: 0.022,
      detail: () => {
        const win = arch(shape.minX + 0.17, 1.0, 0.2, 0.55)
        s.fill(win, '#3d4a63')
        s.glow(win, '#ffc873')
        const door = arch(shape.minX + 0.14, 0, 0.26, 0.45)
        s.fill(door, '#7a5a34')
        s.hatch(shape, { angle: 1.3, gap: 0.04, alpha: 0.15 })
      },
    })),
    ...spires.map((shape) => ({
      shape,
      color: shade(marble, -0.04),
      ink: 0.02,
      detail: () => {
        // Crockets climbing the edges.
        for (let k = 1; k < 9; k++) {
          const t = k / 9
          for (const side of [0, 1]) {
            const x = side ? shape.maxX - t * 0.275 : shape.minX + t * 0.275
            s.fill(s.ellipse(x, 2.2 + t * 1.7, 0.025, 0.02), shade(marble, -0.15))
          }
        }
        s.line([[(shape.minX + shape.maxX) / 2, 2.25], [(shape.minX + shape.maxX) / 2, 3.7]], 0.008, rgba(INK, 0.35), 0)
      },
    })),
    {
      shape: rose,
      color: '#3d4a63',
      ink: 0.018,
      detail: () => {
        s.glow(rose, '#ffb85c')
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2
          s.line([[W / 2, 1.45], [W / 2 + Math.cos(a) * 0.3, 1.45 + Math.sin(a) * 0.3]], 0.012, marble, 0)
        }
        s.fill(s.ellipse(W / 2, 1.45, 0.08, 0.08), marble)
      },
    },
  ])
  for (const shape of spires) {
    const x = (shape.minX + shape.maxX) / 2
    s.strip([[x, 3.9], [x, 4.0]], 0.014, 0.02)
    s.strip([[x - 0.04, 3.96], [x + 0.04, 3.96]], 0.014, 0.02)
  }
}

// ---------------------------------------------------------------------------
// Grand Central Terminal: three great windows, the clock, and Mercury with
// his companions on top.

export function grandCentral(s: Sketch) {
  const W = s.w
  const stone = '#e3d6bd'
  const body = s.rect(0.05, 0, W - 0.1, 1.75, 0.003)
  const attic = s.rect(0.25, 1.75, W - 0.5, 0.3, 0.003)
  const windows = [-1, 0, 1].map((k) => {
    const cx = W / 2 + k * 0.95
    return s.custom(
      (p) => {
        p.moveTo(cx - 0.33, 0.35)
        p.lineTo(cx - 0.33, 1.2)
        p.arc(cx, 1.2, 0.33, Math.PI, 0, true)
        p.lineTo(cx + 0.33, 0.35)
        p.closePath()
      },
      pts(cx - 0.33, 0.35, cx + 0.33, 1.53)
    )
  })
  const clock = s.ellipse(W / 2, 1.95, 0.2, 0.2)
  const group = s.custom(
    (p) => {
      const cx = W / 2
      p.moveTo(cx - 0.6, 2.05)
      p.lineTo(cx + 0.6, 2.05)
      p.quadraticCurveTo(cx + 0.45, 2.3, cx + 0.25, 2.25)
      p.lineTo(cx + 0.12, 2.55)
      p.lineTo(cx + 0.02, 2.6)
      p.lineTo(cx - 0.12, 2.4)
      p.lineTo(cx - 0.25, 2.25)
      p.quadraticCurveTo(cx - 0.45, 2.3, cx - 0.6, 2.05)
      p.closePath()
    },
    pts(W / 2 - 0.6, 2.05, W / 2 + 0.6, 2.6)
  )
  paint(s, [
    {
      shape: body,
      color: stone,
      ink: 0.022,
      detail: () => {
        // Paired columns between the windows.
        for (const k of [-1.5, -0.5, 0.5, 1.5]) {
          for (const d of [-0.07, 0.07]) s.fill(s.rect(W / 2 + k * 0.95 + d - 0.035, 0.3, 0.07, 1.3, 0), shade(stone, -0.08))
        }
        s.fill(s.rect(0.05, 1.6, W - 0.1, 0.12, 0), shade(stone, -0.06))
        s.text('GRAND CENTRAL TERMINAL', W / 2, 1.62, 0.075, { color: rgba(INK, 0.75), spacing: 3 })
        for (const k of [-1, 0, 1]) {
          const door = s.rect(W / 2 + k * 0.95 - 0.2, 0, 0.4, 0.3, 0)
          s.fill(door, '#3a2c26')
          s.glow(door, '#b98a4a')
        }
      },
    },
    ...windows.map((shape) => ({
      shape,
      color: '#7d93a8',
      ink: 0.018,
      detail: () => {
        s.glow(shape, '#c9a463')
        for (let x = shape.minX + 0.11; x < shape.maxX - 0.05; x += 0.11) {
          s.line([[x, 0.35], [x, 1.5]], 0.01, rgba(INK, 0.5), 0)
          s.glow(s.rect(x - 0.008, 0.35, 0.016, 1.2, 0), '#000')
        }
        for (let y = 0.6; y < 1.5; y += 0.25) {
          s.line([[shape.minX, y], [shape.maxX, y]], 0.01, rgba(INK, 0.5), 0)
          s.glow(s.rect(shape.minX, y - 0.008, shape.maxX - shape.minX, 0.016, 0), '#000')
        }
      },
    })),
    { shape: attic, color: shade(stone, 0.03), ink: 0.018 },
    { shape: group, color: '#5f8f7a', ink: 0.016, hatch: { angle: 0.7, gap: 0.03, alpha: 0.3 } },
    {
      shape: clock,
      color: '#f1e7cf',
      ink: 0.016,
      detail: () => {
        s.glow(clock, '#d9c48c')
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2
          s.fill(s.ellipse(W / 2 + Math.cos(a) * 0.15, 1.95 + Math.sin(a) * 0.15, 0.015, 0.015), '#c8202f')
        }
        const hands = [s.poly(pts(W / 2 - 0.01, 1.95, W / 2 + 0.01, 1.95, W / 2, 2.07), 0), s.poly(pts(W / 2, 1.96, W / 2, 1.94, W / 2 + 0.12, 1.92), 0)]
        hands.forEach((h) => {
          s.fill(h, INK)
          s.glow(h, '#000')
        })
      },
    },
  ])
}

// ---------------------------------------------------------------------------
// The New York Public Library on Fifth Avenue.

export function publicLibrary(s: Sketch) {
  const W = s.w
  const marble = '#ece4d2'
  const body = s.rect(0.05, 0.25, W - 0.1, 1.25, 0.003)
  const steps = s.rect(0.4, 0, W - 0.8, 0.27, 0.002)
  const frieze = s.rect(0.05, 1.5, W - 0.1, 0.28, 0.003)
  const arches = [-1, 0, 1].map((k) => {
    const cx = W / 2 + k * 0.5
    return s.custom(
      (p) => {
        p.moveTo(cx - 0.17, 0.27)
        p.lineTo(cx - 0.17, 0.95)
        p.arc(cx, 0.95, 0.17, Math.PI, 0, true)
        p.lineTo(cx + 0.17, 0.27)
        p.closePath()
      },
      pts(cx - 0.17, 0.27, cx + 0.17, 1.12)
    )
  })
  paint(s, [
    { shape: steps, color: shade(marble, -0.06), ink: 0.016, detail: () => { for (let y = 0.07; y < 0.27; y += 0.07) s.line([[0.4, y], [W - 0.4, y]], 0.008, rgba(INK, 0.35), 0) } },
    {
      shape: body,
      color: marble,
      ink: 0.022,
      detail: () => {
        // Paired columns, and the wings' tall windows.
        for (const k of [-1.5, -0.5, 0.5, 1.5]) {
          for (const d of [-0.05, 0.05]) s.fill(s.rect(W / 2 + k * 0.5 + d - 0.025, 0.27, 0.05, 1.2, 0), shade(marble, -0.1))
        }
        for (const x of [0.2, 0.5, W - 0.62, W - 0.32]) {
          const win = s.rect(x, 0.55, 0.14, 0.55, 0)
          s.fill(win, '#3d4a63')
          s.glow(win, '#c9a463')
        }
        // Banners between the columns.
        for (const [k, col] of [
          [-1, '#c8202f'],
          [1, '#2a4fb0'],
        ] as [number, string][]) {
          const banner = s.rect(W / 2 + k * 0.5 - 0.09, 0.9, 0.18, 0.5, 0)
          s.fill(banner, col)
          s.ink(banner, 0.008)
        }
      },
    },
    ...arches.map((shape) => ({ shape, color: '#3a2c26', ink: 0.014, detail: () => s.glow(shape, '#a8875a') })),
    {
      shape: frieze,
      color: shade(marble, 0.02),
      ink: 0.018,
      detail: () => s.text('THE NEW YORK PUBLIC LIBRARY', W / 2, 1.58, 0.085, { color: rgba(INK, 0.75), spacing: 3 }),
    },
  ])
  // Statues along the top.
  for (const k of [-1.5, -0.5, 0.5, 1.5]) {
    const st = s.poly(pts(W / 2 + k * 0.5 - 0.05, 1.78, W / 2 + k * 0.5 + 0.05, 1.78, W / 2 + k * 0.5 + 0.03, 1.98, W / 2 + k * 0.5 - 0.03, 1.98), 0)
    s.border([st], 0.03)
    s.fill(st, marble)
    s.ink(st, 0.008)
  }
}

// One of the library's marble lions, lying on its plinth. `face` is 1 to
// face right, -1 to face left.
export function libraryLion(s: Sketch, face: 1 | -1) {
  const W = s.w
  const marble = '#e9e0cc'
  const fx = (x: number) => (face > 0 ? x : W - x)
  const plinth = s.rect(0.05, 0, W - 0.1, 0.26, 0.002)
  const body = s.custom(
    (p) => {
      p.moveTo(fx(0.1), 0.26)
      p.lineTo(fx(0.84), 0.26)
      p.lineTo(fx(0.84), 0.31)
      p.lineTo(fx(0.62), 0.33)
      p.quadraticCurveTo(fx(0.4), 0.48, fx(0.16), 0.42)
      p.quadraticCurveTo(fx(0.06), 0.36, fx(0.1), 0.26)
      p.closePath()
    },
    pts(0.06, 0.26, W - 0.06, 0.48)
  )
  const cx = fx(0.64)
  // A scalloped mane round the face, the face with its muzzle.
  const mane = s.union(
    [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
      const a = (k / 8) * Math.PI * 2
      return s.ellipse(cx + Math.cos(a) * 0.1, 0.52 + Math.sin(a) * 0.1, 0.06, 0.06)
    })
  )
  const head = s.ellipse(cx + face * 0.02, 0.52, 0.085, 0.09)
  const muzzle = s.ellipse(cx + face * 0.06, 0.48, 0.045, 0.035)
  paint(s, [
    { shape: plinth, color: '#c9bfa8', ink: 0.016 },
    { shape: body, color: marble, ink: 0.016, hatch: { angle: 0.4, gap: 0.03, alpha: 0.15 } },
    { shape: mane, color: shade(marble, -0.05), ink: 0.014, hatch: { angle: 1.0, gap: 0.03, alpha: 0.18 } },
    {
      shape: head,
      color: marble,
      ink: 0.012,
      detail: () => {
        s.fill(s.ellipse(cx + face * 0.035, 0.56, 0.01, 0.01), INK)
        s.fill(s.ellipse(cx - face * 0.02, 0.56, 0.01, 0.01), INK)
      },
    },
    {
      shape: muzzle,
      color: shade(marble, 0.04),
      ink: 0.01,
      detail: () => s.fill(s.poly(pts(cx + face * 0.075 - 0.015, 0.5, cx + face * 0.075 + 0.015, 0.5, cx + face * 0.075, 0.485), 0), '#6b5a4a'),
    },
  ])
  // The tail curling over the haunch.
  s.strip([[fx(0.14), 0.38], [fx(0.05), 0.46], [fx(0.08), 0.52]], 0.022, 0.025, marble)
}

// ---------------------------------------------------------------------------
// A red double-decker sightseeing bus, waving tourists up top.

export function tourBus(s: Sketch) {
  const W = s.w
  const red = '#c8202f'
  const lower = s.custom(
    (p) => {
      p.moveTo(0.05, 0.18)
      p.lineTo(W - 0.05, 0.18)
      p.lineTo(W - 0.05, 0.85)
      p.quadraticCurveTo(W - 0.06, 1.0, W - 0.2, 1.0)
      p.lineTo(0.12, 1.0)
      p.quadraticCurveTo(0.05, 1.0, 0.05, 0.9)
      p.closePath()
    },
    pts(0.05, 0.18, W - 0.05, 1.0)
  )
  const deck = s.rect(0.08, 1.0, W - 0.25, 0.22, 0.002)
  const wheels = [0.55, W - 0.6].map((x) => s.ellipse(x, 0.17, 0.16, 0.16))
  // Tourists up top: heads over the rail, one with a camera, one waving.
  const coats = ['#3f6fb0', '#f7c948', '#18a558', '#7b2fbf', '#ff7a1a']
  coats.forEach((col, k) => {
    const x = 0.35 + k * 0.48
    const body = s.ellipse(x, 1.28, 0.09, 0.1)
    const head = s.ellipse(x, 1.42, 0.055, 0.06)
    s.border([body, head], 0.03)
    s.fill(body, col)
    s.ink(body, 0.008)
    s.fill(head, s.pick([C.skin, C.skinDark, '#e0b48c']))
    s.ink(head, 0.008)
    if (k === 1) s.strip([[x + 0.06, 1.3], [x + 0.14, 1.5]], 0.03, 0.02, col)
  })
  paint(s, [
    ...wheels.map((shape) => ({ shape, color: '#2c2a30', ink: 0.016 })),
    {
      shape: lower,
      color: red,
      ink: 0.022,
      detail: () => {
        s.windows(0.15, 0.5, 8, 1, 0.22, 0.28, 0.08, 0, { color: '#3d4a63', lit: 0.8 })
        s.text('SIGHTSEEING', W / 2, 0.24, 0.13, { color: '#f7c948', font: SANS, spacing: 4 })
        const front = s.rect(W - 0.2, 0.45, 0.13, 0.4, 0)
        s.fill(front, '#9fc9e6')
        s.glow(front, '#ffe2a3')
        wheels.forEach((_, i) => s.fill(s.ellipse(i ? W - 0.6 : 0.55, 0.2, 0.2, 0.19), shade(red, -0.25)))
      },
    },
    {
      shape: deck,
      color: shade(red, -0.05),
      ink: 0.016,
      detail: () => s.line([[0.08, 1.2], [W - 0.17, 1.2]], 0.02, '#f1e7cf', 0),
    },
  ])
  for (const x of [0.55, W - 0.6]) {
    const hub = s.ellipse(x, 0.17, 0.06, 0.06)
    s.fill(hub, '#d9dde0')
    s.ink(hub, 0.01)
  }
}
