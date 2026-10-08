import { INK, Pt, Sketch, rgba, shade } from './sketch'
import { C } from './palette'
import { Part, paint, pts, waterTower } from './art-common'
import { blobs, person } from './art-street'

// Art for the Brooklyn spread.

// ---------------------------------------------------------------------------
// DUMBO: the Manhattan Bridge framed between the warehouses on Washington
// Street, with the Empire State peeking through the tower.

export function dumbo(s: Sketch) {
  const W = s.w
  const mid = W / 2
  const inner = 1.75
  const lTop = (x: number) => 3.65 - (0.65 * x) / inner
  const rTop = (x: number) => 3.0 + (0.65 * (x - (W - inner))) / inner
  const brick = '#a8533b'
  const brick2 = '#8e4636'

  // Bridge first (it is behind the warehouses).
  const towerTop = 4.95
  const legs = [mid - 0.46, mid + 0.2]
  const legW = 0.26
  const deckY = 2.2
  const cable = (x: number) => {
    const u = Math.abs(x - mid) / (W / 2)
    return towerTop - 0.25 - 1.0 * Math.sqrt(u)
  }
  const cableLine: Pt[] = []
  for (let x = 0.05; x <= W - 0.05; x += 0.05) cableLine.push([x, cable(x)])
  for (let x = 0.2; x < W - 0.15; x += 0.16) {
    if (Math.abs(x - mid) < 0.45) continue
    s.strip([[x, deckY + 0.2], [x, cable(x)]], 0.008, 0.028)
  }
  s.strip(cableLine, 0.03, 0.05)
  const deck = s.rect(0.2, deckY, W - 0.4, 0.22, 0.003)
  const portal = s.rect(legs[0] + legW, deckY + 0.22, legs[1] - legs[0] - legW, towerTop - 0.65 - deckY - 0.22, 0)
  const towerShapes = legs.map((x) => s.rect(x, deckY - 0.3, legW, towerTop - deckY + 0.3, 0.003))
  const cap = s.poly(pts(legs[0] - 0.06, towerTop - 0.65, legs[1] + legW + 0.06, towerTop - 0.65, legs[1] + legW + 0.03, towerTop, legs[0] - 0.03, towerTop), 0.003)
  const steel = '#7f96ab'
  paint(s, [
    {
      shape: portal,
      color: '#e7d7d0',
      ink: 0.012,
      detail: () => {
        // The Empire State, far away through the arch.
        const ex = (legs[0] + legW + legs[1]) / 2
        const esb = s.poly(pts(ex - 0.09, deckY + 0.22, ex + 0.09, deckY + 0.22, ex + 0.09, 3.35, ex + 0.06, 3.35, ex + 0.06, 3.55, ex + 0.025, 3.55, ex + 0.01, 3.85, ex - 0.01, 3.85, ex - 0.025, 3.55, ex - 0.06, 3.55, ex - 0.06, 3.35, ex - 0.09, 3.35), 0)
        s.fill(esb, '#a5a9c2')
        s.glow(s.rect(ex - 0.05, 3.35, 0.1, 0.2, 0), '#ffe2a3')
      },
    },
    {
      shape: deck,
      color: '#6d7d8f',
      ink: 0.018,
      detail: () => {
        for (let x = 0.25; x < W - 0.25; x += 0.12) s.line([[x, deckY + 0.02], [x + 0.06, deckY + 0.2]], 0.006, rgba('#e8eef2', 0.5), 0)
        for (let x = 0.4; x < W - 0.3; x += 0.45) s.glow(s.ellipse(x, deckY + 0.24, 0.025, 0.025), '#ffe2a3')
      },
    },
    ...towerShapes.map((t, i) => ({
      shape: t,
      color: steel,
      ink: 0.018,
      detail: () => {
        const x = legs[i]
        for (let y = deckY; y < towerTop - 0.7; y += 0.32) {
          s.line([[x, y], [x + legW, y + 0.32]], 0.008, rgba(INK, 0.5), 0)
          s.line([[x + legW, y], [x, y + 0.32]], 0.008, rgba(INK, 0.5), 0)
        }
      },
      hatch: i ? { angle: 1.3, gap: 0.03, alpha: 0.25 } : undefined,
    })),
    {
      shape: cap,
      color: steel,
      ink: 0.018,
      detail: () => {
        s.ink(s.custom((p) => p.arc((legs[0] + legW + legs[1]) / 2, towerTop - 0.65, (legs[1] - legs[0] - legW) / 2, 0, Math.PI, false), pts(0, 0, 1, 1)), 0.014)
        for (const x of [legs[0] - 0.03, legs[1] + legW + 0.03]) s.glow(s.ellipse(x, towerTop + 0.02, 0.04, 0.04), '#ffffff')
      },
    },
  ])

  // Warehouses in perspective down the street.
  const quad = (x0: number, x1: number, f0: number, f1: number, top: (x: number) => number) =>
    s.poly([[x0, top(x0) * f0], [x1, top(x1) * f0], [x1, top(x1) * f1], [x0, top(x0) * f1]], 0)
  const facade = (x0: number, x1: number, top: (x: number) => number, cols: number) => {
    const rows = 7
    for (let j = 1; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const a = x0 + ((x1 - x0) * (i + 0.25)) / cols
        const b = x0 + ((x1 - x0) * (i + 0.75)) / cols
        const win = quad(a, b, (j + 0.2) / (rows + 0.4), (j + 0.75) / (rows + 0.4), top)
        s.fill(win, C.window)
        if (s.rnd() < 0.55) s.glow(win, '#ffd27a')
      }
    }
  }
  const left = s.poly([[0, 0], [inner, 0], [inner, lTop(inner)], [0, lTop(0)]], 0.004)
  const right = s.poly([[W - inner, 0], [W, 0], [W, rTop(W)], [W - inner, rTop(W - inner)]], 0.004)
  const street = s.poly(pts(inner, 0, W - inner, 0, mid + 0.25, 0.75, mid - 0.25, 0.75), 0)
  paint(s, [
    {
      shape: street,
      color: '#9b9187',
      ink: 0.016,
      detail: () => {
        for (let y = 0.05; y < 0.75; y += 0.07) {
          const half = (W - 2 * inner) / 2 - ((W - 2 * inner) / 2 - 0.25) * (y / 0.75)
          for (let x = mid - half; x < mid + half; x += 0.11 - y * 0.08) {
            s.fill(s.ellipse(x + s.r(-0.01, 0.01), y, 0.04 - y * 0.03, 0.018 - y * 0.012), rgba('#5f574f', 0.6))
          }
        }
      },
    },
    {
      shape: left,
      color: brick,
      ink: 0.028,
      detail: () => {
        facade(0.08, inner - 0.05, lTop, 4)
        // A faded painted sign on the brick.
        s.text('DUMBO', 0.82, lTop(0.82) * 0.86, 0.26, { color: rgba('#f4e9d6', 0.75), font: 'Helvetica, Arial, sans-serif' })
        s.fill(quad(0, inner, 0, 0.12, lTop), shade(brick, -0.2))
      },
    },
    {
      shape: right,
      color: brick2,
      ink: 0.028,
      detail: () => {
        facade(W - inner + 0.05, W - 0.08, rTop, 4)
        s.fill(quad(W - inner, W, 0, 0.12, rTop), shade(brick2, -0.2))
        s.hatch(right, { angle: 1.2, gap: 0.05, alpha: 0.18 })
      },
    },
    ...waterTower(s, W - 0.9, rTop(W - 0.9) - 0.02, 0.9),
  ])
}

// ---------------------------------------------------------------------------
// Coney Island's Wonder Wheel: the steel frame and booth...

export function wonderFrame(s: Sketch) {
  const W = s.w
  const hub: Pt = [W / 2, s.h - 0.18]
  const cream = '#f2ead6'
  for (const [x, y] of [
    [W / 2 - 0.85, 0.5],
    [W / 2 + 0.85, 0.5],
    [W / 2 - 0.45, 0.5],
    [W / 2 + 0.45, 0.5],
  ] as Pt[]) {
    s.strip([[x, y], hub], 0.05, 0.04, '#d8d0bc')
    s.line([[x, y], hub], 0.012)
  }
  for (let k = 1; k < 5; k++) {
    const f = k / 5
    const y = 0.5 + (hub[1] - 0.5) * f
    const dx = 0.85 * (1 - f)
    s.strip([[W / 2 - dx, y], [W / 2 + dx, y]], 0.018, 0.03, '#d8d0bc')
  }
  const booth = s.custom(
    (p) => {
      p.moveTo(0.15, 0)
      p.lineTo(W - 0.15, 0)
      p.lineTo(W - 0.15, 0.42)
      p.quadraticCurveTo(W / 2, 0.78, 0.15, 0.42)
      p.closePath()
    },
    pts(0.15, 0, W - 0.15, 0.78)
  )
  paint(s, [
    {
      shape: booth,
      color: C.red,
      ink: 0.022,
      detail: () => {
        s.text('WONDER WHEEL', W / 2, 0.24, 0.17, { color: cream, glow: '#ffe28a', font: 'Helvetica, Arial, sans-serif' })
        for (let k = 0; k <= 16; k++) {
          const t = k / 16
          const x = 0.2 + (W - 0.4) * t
          const y = 0.45 + 0.3 * Math.sin(Math.PI * t) - 0.02
          const bulb = s.ellipse(x, y, 0.022, 0.022)
          s.fill(bulb, '#fff1c2')
          s.glow(bulb, '#fff1c2')
        }
      },
    },
  ])
}

// ...and the wheel itself, which turns about its hub (the centre of the art).
export function wonderWheel(s: Sketch) {
  const cx = s.w / 2
  const cy = s.h / 2
  const R = Math.min(cx, cy) - 0.12
  const r2 = R - 0.16
  const spokes = 16
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2
    s.strip([[cx, cy], [cx + Math.cos(a) * r2, cy + Math.sin(a) * r2]], 0.014, 0.03, '#d8d0bc')
  }
  const ring = (r: number, w: number) => {
    const path: Pt[] = []
    for (let k = 0; k <= 72; k++) path.push([cx + Math.cos((k / 72) * Math.PI * 2) * r, cy + Math.sin((k / 72) * Math.PI * 2) * r])
    s.strip(path, w, 0.04, '#e9dfc7')
    return path
  }
  ring(R, 0.05)
  ring(r2, 0.035)
  // Zig-zag truss between the rings.
  const zig: Pt[] = []
  for (let k = 0; k <= 48; k++) {
    const a = (k / 48) * Math.PI * 2
    const r = k % 2 ? R : r2
    zig.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  s.line(zig, 0.01, rgba(INK, 0.7), 0)
  // Lights round the rim.
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2
    const bulb = s.ellipse(cx + Math.cos(a) * (R + 0.005), cy + Math.sin(a) * (R + 0.005), 0.022, 0.022)
    const color = ['#ff6b6b', '#ffd36b', '#7fd0ff', '#9dff9d'][k % 4]
    s.fill(bulb, '#fff6dc')
    s.glow(bulb, color)
  }
  // Cars hung round the rim.
  const cars: Part[] = []
  const colors = [C.red, '#3f6fb0', C.taxi, C.greenDark, '#d06aa6', '#ec7a2c']
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.13
    const x = cx + Math.cos(a) * (R - 0.02)
    const y = cy + Math.sin(a) * (R - 0.02)
    const car = s.custom(
      (p) => {
        p.moveTo(x - 0.11, y - 0.02)
        p.lineTo(x + 0.11, y - 0.02)
        p.quadraticCurveTo(x + 0.12, y - 0.2, x, y - 0.21)
        p.quadraticCurveTo(x - 0.12, y - 0.2, x - 0.11, y - 0.02)
        p.closePath()
      },
      pts(x - 0.12, y - 0.21, x + 0.12, y)
    )
    cars.push({
      shape: car,
      color: colors[i % colors.length],
      ink: 0.012,
      detail: () => {
        s.fill(s.rect(x - 0.07, y - 0.11, 0.14, 0.05, 0), rgba('#fff6dc', 0.85))
        s.glow(s.rect(x - 0.07, y - 0.11, 0.14, 0.05, 0), '#ffe2a3')
      },
    })
  }
  const hub = s.ellipse(cx, cy, 0.16, 0.16)
  paint(s, [
    ...cars,
    {
      shape: hub,
      color: C.red,
      ink: 0.016,
      detail: () => {
        const star = s.poly(
          Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2 + Math.PI / 2
            const r = i % 2 ? 0.04 : 0.1
            return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt
          }),
          0
        )
        s.fill(star, '#ffe28a')
        s.glow(star, '#ffe28a')
      },
    },
  ])
}

// ---------------------------------------------------------------------------
// The Cyclone: a wooden roller coaster, white lattice and a red track.

export function cyclone(s: Sketch) {
  const W = s.w
  const track = (x: number) => {
    // A tall first hill, a drop, a smaller hill and a banked turn.
    const hills: [number, number, number][] = [
      [0.75, 2.05, 0.55],
      [2.25, 1.35, 0.5],
      [3.45, 1.05, 0.45],
    ]
    let y = 0.45
    hills.forEach(([cx, h, w]) => {
      y = Math.max(y, h * Math.exp(-((x - cx) ** 2) / (2 * w * w)))
    })
    return y
  }
  const top: Pt[] = []
  for (let x = 0.05; x <= W - 0.05; x += 0.05) top.push([x, track(x)])
  // Lattice: posts and cross braces under the track.
  for (let x = 0.12; x < W - 0.05; x += 0.16) {
    const y = track(x)
    s.strip([[x, 0], [x, y - 0.02]], 0.014, 0.03, '#efe6d1')
  }
  for (let x = 0.12; x < W - 0.2; x += 0.16) {
    const y0 = track(x)
    const y1 = track(x + 0.16)
    for (let y = 0; y < Math.min(y0, y1) - 0.2; y += 0.3) {
      s.strip([[x, y], [x + 0.16, y + 0.3]], 0.007, 0.022, '#efe6d1')
      s.strip([[x + 0.16, y], [x, y + 0.3]], 0.007, 0.022, '#efe6d1')
    }
  }
  s.strip(top.map(([x, y]) => [x, y - 0.06] as Pt), 0.012, 0.03, '#efe6d1')
  // The red track itself.
  s.strip(top, 0.07, 0.04, C.red)
  s.line(top, 0.012, INK, 0)
  for (let x = 0.2; x < W - 0.1; x += 0.3) s.glow(s.ellipse(x, track(x) + 0.02, 0.025, 0.025), '#ffe28a')

  // A train on the first drop, riders with their arms up.
  const cars: Part[] = []
  for (let i = 0; i < 3; i++) {
    const x = 1.05 + i * 0.26
    const y = track(x)
    const slope = (track(x + 0.05) - track(x - 0.05)) / 0.1
    const a = Math.atan(slope)
    const c = Math.cos(a)
    const sn = Math.sin(a)
    const corner = (dx: number, dy: number): Pt => [x + dx * c - dy * sn, y + 0.03 + dx * sn + dy * c]
    const car = s.poly([corner(-0.12, 0), corner(0.12, 0), corner(0.12, 0.14), corner(-0.12, 0.14)], 0)
    cars.push({
      shape: car,
      color: i === 0 ? C.taxi : C.red,
      ink: 0.012,
      detail: () => {
        const [hx, hy] = corner(0, 0.2)
        s.fill(s.ellipse(hx, hy, 0.045, 0.045), C.skin)
        s.line([[hx - 0.03, hy], [hx - 0.08, hy + 0.1]], 0.012)
        s.line([[hx + 0.03, hy], [hx + 0.08, hy + 0.1]], 0.012)
      },
    })
  }
  const sign = s.rect(0.15, 0.05, 1.05, 0.34, 0.003)
  paint(s, [
    ...cars,
    {
      shape: sign,
      color: '#f6efe0',
      ink: 0.016,
      detail: () => s.text('Cyclone', 0.675, 0.13, 0.2, { color: C.red, glow: '#ff6a52', weight: 'italic 700' }),
    },
  ])
}

// ---------------------------------------------------------------------------
// The Parachute Jump: a tall red steel tower with its umbrella crown.

export function parachuteJump(s: Sketch) {
  const W = s.w
  const mid = W / 2
  const red = '#c9473a'
  const topY = s.h - 0.7
  const halfAt = (y: number) => 0.32 - 0.24 * (y / topY)
  // Lattice tower as strips.
  for (const side of [-1, 1]) s.strip([[mid + side * halfAt(0), 0], [mid + side * halfAt(topY), topY]], 0.035, 0.04, red)
  for (let y = 0; y < topY - 0.1; y += 0.28) {
    const a = halfAt(y)
    const b = halfAt(y + 0.28)
    s.strip([[mid - a, y], [mid + b, y + 0.28]], 0.012, 0.025, red)
    s.strip([[mid + a, y], [mid - b, y + 0.28]], 0.012, 0.025, red)
    s.strip([[mid - a, y], [mid + a, y]], 0.012, 0.025, red)
    s.glow(s.ellipse(mid, y + 0.14, 0.03, 0.03), '#ff7a6a')
  }
  // The crown: a ring of arms like an open umbrella frame.
  const ringY = topY + 0.25
  const rx = W / 2 - 0.08
  const ry = 0.16
  const ring: Pt[] = []
  for (let k = 0; k <= 48; k++) ring.push([mid + Math.cos((k / 48) * Math.PI * 2) * rx, ringY + Math.sin((k / 48) * Math.PI * 2) * ry])
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    s.strip([[mid, topY + 0.45], [mid + Math.cos(a) * rx, ringY + Math.sin(a) * ry]], 0.014, 0.025, red)
    s.strip([[mid, topY], [mid + Math.cos(a) * rx * 0.9, ringY + Math.sin(a) * ry * 0.9]], 0.01, 0.022, red)
  }
  s.strip(ring, 0.035, 0.04, red)
  ring.forEach(([x, y], k) => {
    if (k % 4 === 0) s.glow(s.ellipse(x, y, 0.035, 0.035), '#ffd0c8')
  })
  // A lone parachute dangling from one arm.
  const chute = s.custom(
    (p) => {
      p.moveTo(mid + rx - 0.42, ringY - 0.55)
      p.quadraticCurveTo(mid + rx - 0.2, ringY - 0.3, mid + rx + 0.02, ringY - 0.55)
      p.closePath()
    },
    pts(mid + rx - 0.42, ringY - 0.55, mid + rx + 0.02, ringY - 0.35)
  )
  s.strip([[mid + rx - 0.02, ringY - 0.08], [mid + rx - 0.2, ringY - 0.42]], 0.006, 0.02)
  const cap = s.ellipse(mid, topY + 0.5, 0.08, 0.06)
  paint(s, [
    { shape: chute, color: '#f6f0e2', ink: 0.012, detail: () => s.line([[mid + rx - 0.2, ringY - 0.42], [mid + rx - 0.2, ringY - 0.62]], 0.008) },
    { shape: cap, color: red, ink: 0.012 },
  ])
}

// ---------------------------------------------------------------------------
// A side wall covered in a big painted BROOKLYN mural.

export function mural(s: Sketch) {
  const W = s.w
  const H = s.h - 0.85
  const wall = s.rect(0, 0, W, H, 0.004)
  const parts: Part[] = [
    {
      shape: wall,
      color: '#b25c43',
      ink: 0.028,
      detail: () => {
        // Brick courses.
        for (let y = 0.1; y < H; y += 0.1) s.line([[0, y], [W, y]], 0.005, rgba('#6e3022', 0.35), 0)
        // Painted backdrop: a sunburst behind the letters.
        const c = s.ctx
        c.save()
        c.clip(wall.path)
        const cx = W / 2
        const cy = H * 0.72
        for (let k = 0; k < 16; k++) {
          const a0 = (k / 16) * Math.PI * 2
          const a1 = ((k + 0.5) / 16) * Math.PI * 2
          c.fillStyle = k % 2 ? '#f2b84b' : '#ea7a59'
          c.beginPath()
          c.moveTo(cx, cy)
          c.lineTo(cx + Math.cos(a0) * 3, cy + Math.sin(a0) * 3)
          c.lineTo(cx + Math.cos(a1) * 3, cy + Math.sin(a1) * 3)
          c.closePath()
          c.fill()
        }
        c.restore()
        s.fill(s.ellipse(cx, cy, 0.62, 0.62), '#3f6fb0', 0.9)
        // Chunky letters, each its own colour, with a drop shadow.
        const letters = ['B', 'R', 'O', 'O', 'K', 'L', 'Y', 'N']
        const colors = ['#f6f0e2', C.taxi, '#7fd0ff', '#9de07a', '#ff8fb1', '#f6f0e2', C.taxi, '#7fd0ff']
        letters.forEach((ch, i) => {
          const row = i < 4 ? 0 : 1
          const col = i % 4
          const x = 0.34 + col * ((W - 0.68) / 3)
          const y = row ? H * 0.6 : H * 0.8
          s.text(ch, x + 0.04, y - 0.04, 0.48, { color: INK, font: 'Impact, "Arial Black", sans-serif' })
          s.text(ch, x, y, 0.48, { color: colors[i], glow: colors[i], font: 'Impact, "Arial Black", sans-serif' })
        })
        // Paint drips.
        for (let k = 0; k < 9; k++) {
          const x = s.r(0.2, W - 0.2)
          const y = s.r(H * 0.2, H * 0.3)
          s.line([[x, y], [x, y - s.r(0.08, 0.25)]], 0.02, s.pick(['#ff8fb1', C.taxi, '#7fd0ff']), 0)
        }
      },
    },
    { shape: s.rect(-0.04, H - 0.12, W + 0.08, 0.14, 0.002), color: shade('#b25c43', -0.15), ink: 0.018 },
    ...waterTower(s, W * 0.55, H + 0.02, 0.95),
  ]
  paint(s, parts)
}

// ---------------------------------------------------------------------------
// A carousel: striped canopy, gilded poles, lights. Horses are separate
// pieces so they can ride up and down.

export const CAROUSEL_POLES = [0.55, 1.15, 1.85, 2.45]

export function carousel(s: Sketch) {
  const W = s.w
  const baseTop = 0.42
  const canopyY = s.h - 0.75
  const gold = '#d9b45c'
  for (const x of CAROUSEL_POLES) s.strip([[x, baseTop], [x, canopyY]], 0.03, 0.03, gold)
  const base = s.custom(
    (p) => {
      p.moveTo(0.05, 0.08)
      p.quadraticCurveTo(W / 2, -0.06, W - 0.05, 0.08)
      p.lineTo(W - 0.05, baseTop)
      p.quadraticCurveTo(W / 2, baseTop - 0.12, 0.05, baseTop)
      p.closePath()
    },
    pts(0.05, 0, W - 0.05, baseTop)
  )
  const drum = s.rect(W / 2 - 0.35, baseTop, 0.7, canopyY - baseTop, 0.003)
  const roof = s.custom(
    (p) => {
      p.moveTo(-0.02, canopyY)
      p.lineTo(W + 0.02, canopyY)
      p.lineTo(W / 2 + 0.12, s.h - 0.15)
      p.lineTo(W / 2 - 0.12, s.h - 0.15)
      p.closePath()
    },
    pts(-0.02, canopyY, W + 0.02, s.h - 0.15)
  )
  const valance = s.custom(
    (p) => {
      p.moveTo(-0.02, canopyY + 0.02)
      const n = 12
      for (let i = 0; i < n; i++) {
        const x0 = -0.02 + ((W + 0.04) * i) / n
        const x1 = -0.02 + ((W + 0.04) * (i + 1)) / n
        p.quadraticCurveTo((x0 + x1) / 2, canopyY - 0.2, x1, canopyY + 0.02)
      }
      p.lineTo(W + 0.02, canopyY + 0.1)
      p.lineTo(-0.02, canopyY + 0.1)
      p.closePath()
    },
    pts(-0.02, canopyY - 0.2, W + 0.02, canopyY + 0.1)
  )
  const finial = s.poly(pts(W / 2 - 0.05, s.h - 0.15, W / 2 + 0.05, s.h - 0.15, W / 2, s.h - 0.02), 0)
  paint(s, [
    {
      shape: drum,
      color: '#e9d3a8',
      ink: 0.016,
      detail: () => {
        for (let k = 0; k < 3; k++) {
          const panel = s.rect(W / 2 - 0.3 + k * 0.21, baseTop + 0.25, 0.18, 0.7, 0)
          s.fill(panel, ['#d06aa6', '#3f6fb0', '#2f9b7a'][k], 0.85)
          s.ink(panel, 0.008)
        }
        s.glow(s.rect(W / 2 - 0.3, baseTop + 0.25, 0.6, 0.7, 0), '#ffcf7a')
      },
    },
    {
      shape: base,
      color: C.red,
      ink: 0.02,
      detail: () => {
        for (let k = 0; k <= 20; k++) {
          const t = k / 20
          const x = 0.1 + (W - 0.2) * t
          const y = baseTop - 0.06 - 0.12 * Math.sin(Math.PI * t) + 0.06
          const bulb = s.ellipse(x, y - 0.06, 0.02, 0.02)
          s.fill(bulb, '#fff1c2')
          s.glow(bulb, '#fff1c2')
        }
        s.line([[0.08, 0.2], [W - 0.08, 0.2]], 0.012, gold, 0)
      },
    },
    {
      shape: roof,
      color: '#f6efe0',
      ink: 0.02,
      detail: () => {
        const c = s.ctx
        c.save()
        c.clip(roof.path)
        for (let k = 0; k < 12; k += 2) {
          c.fillStyle = C.red
          c.beginPath()
          c.moveTo(W / 2, s.h - 0.15)
          c.lineTo(-0.02 + ((W + 0.04) * k) / 12, canopyY)
          c.lineTo(-0.02 + ((W + 0.04) * (k + 1)) / 12, canopyY)
          c.closePath()
          c.fill()
        }
        c.restore()
      },
    },
    {
      shape: valance,
      color: gold,
      ink: 0.016,
      detail: () => {
        for (let i = 0; i < 12; i++) {
          const x = -0.02 + ((W + 0.04) * (i + 0.5)) / 12
          const bulb = s.ellipse(x, canopyY + 0.04, 0.025, 0.025)
          s.fill(bulb, '#fff1c2')
          s.glow(bulb, '#fff1c2')
        }
      },
    },
    { shape: finial, color: gold, ink: 0.012 },
  ])
  // Pennant on top.
  s.strip([[W / 2, s.h - 0.02], [W / 2, s.h + 0.02]], 0.01, 0.02)
}

// A carousel horse, mid-gallop, facing left or right.
export function carouselHorse(s: Sketch, body: string, saddle: string, face: 1 | -1) {
  const W = s.w
  const X = (x: number) => (face > 0 ? x : W - x)
  const horse = s.custom(
    (p) => {
      const P = (x: number, y: number): [number, number] => [X(x), y]
      p.moveTo(...P(0.12, 0.3))
      p.quadraticCurveTo(...P(0.1, 0.42), ...P(0.2, 0.44))
      p.lineTo(...P(0.42, 0.44))
      p.quadraticCurveTo(...P(0.48, 0.58), ...P(0.52, 0.66))
      p.quadraticCurveTo(...P(0.6, 0.7), ...P(0.64, 0.62))
      p.lineTo(...P(0.6, 0.56))
      p.quadraticCurveTo(...P(0.54, 0.52), ...P(0.5, 0.42))
      p.lineTo(...P(0.56, 0.28))
      p.lineTo(...P(0.5, 0.26))
      p.lineTo(...P(0.44, 0.34))
      p.lineTo(...P(0.4, 0.3))
      p.lineTo(...P(0.24, 0.3))
      p.lineTo(...P(0.18, 0.16))
      p.lineTo(...P(0.13, 0.17))
      p.lineTo(...P(0.17, 0.3))
      p.closePath()
    },
    pts(0.08, 0.14, W - 0.05, 0.72)
  )
  const saddleShape = s.ellipse(X(0.31), 0.45, 0.08, 0.035)
  paint(s, [
    {
      shape: horse,
      color: body,
      ink: 0.012,
      detail: () => {
        s.fill(saddleShape, saddle)
        s.fill(s.ellipse(X(0.58), 0.64, 0.01, 0.01), INK)
        // Mane and tail.
        s.line([[X(0.47), 0.48], [X(0.5), 0.6], [X(0.56), 0.68]], 0.02, saddle, 0)
        s.line([[X(0.12), 0.38], [X(0.05), 0.3], [X(0.07), 0.2]], 0.02, saddle, 0)
      },
    },
  ])
}

// ---------------------------------------------------------------------------

export function welcomeSign(s: Sketch) {
  const W = s.w
  const blue = '#1f5aa6'
  const postL = s.rect(0.32, 0, 0.07, 0.75, 0)
  const postR = s.rect(W - 0.39, 0, 0.07, 0.75, 0)
  const panel = s.rect(0.08, 0.68, W - 0.16, s.h - 0.7, 0.003)
  paint(s, [
    { shape: postL, color: C.steelDark, ink: 0.012 },
    { shape: postR, color: C.steelDark, ink: 0.012 },
    {
      shape: panel,
      color: blue,
      ink: 0.02,
      detail: () => {
        s.ink(s.rect(0.14, 0.74, W - 0.28, s.h - 0.82, 0), 0.016, '#f6f2e6')
        s.text('WELCOME TO', W / 2, s.h - 0.32, 0.13, { color: '#f6f2e6', font: 'Helvetica, Arial, sans-serif', spacing: 6 })
        s.text('BROOKLYN', W / 2, s.h - 0.6, 0.26, { color: '#ffffff', font: 'Helvetica, Arial, sans-serif', weight: '800' })
        s.text('How Sweet It Is!', W / 2, 0.83, 0.15, { color: '#f6f2e6', weight: 'italic 600' })
      },
      hatch: { angle: 1.1, gap: 0.06, alpha: 0.08 },
    },
  ])
}

export function beachUmbrella(s: Sketch, color: string) {
  const W = s.w
  const top: Pt = [W / 2 + 0.05, s.h - 0.32]
  s.strip([[W / 2 - 0.05, 0.02], top], 0.025, 0.035, '#8b6f55')
  const canopy = s.custom(
    (p) => {
      p.moveTo(0.05, s.h - 0.5)
      p.quadraticCurveTo(W / 2, s.h + 0.1, W - 0.05, s.h - 0.5)
      p.closePath()
    },
    pts(0.05, s.h - 0.5, W - 0.05, s.h - 0.2)
  )
  const sand = s.custom(
    (p) => {
      p.moveTo(0.15, 0)
      p.quadraticCurveTo(W / 2, 0.16, W - 0.15, 0)
      p.closePath()
    },
    pts(0.15, 0, W - 0.15, 0.08)
  )
  const towel = s.rect(W * 0.55, 0.02, 0.4, 0.07, 0)
  paint(s, [
    { shape: sand, color: '#f1dfae', ink: 0.012 },
    { shape: towel, color: '#7fd0ff', ink: 0.01 },
    {
      shape: canopy,
      color: '#f6f0e2',
      ink: 0.018,
      detail: () => {
        const c = s.ctx
        c.save()
        c.clip(canopy.path)
        for (let k = 0; k < 8; k += 2) {
          c.fillStyle = color
          c.beginPath()
          c.moveTo(W / 2, s.h - 0.2)
          c.lineTo(0.05 + ((W - 0.1) * k) / 8, s.h - 0.5)
          c.lineTo(0.05 + ((W - 0.1) * (k + 1)) / 8, s.h - 0.5)
          c.closePath()
          c.fill()
        }
        c.restore()
      },
    },
  ])
}

export function beachgoers(s: Sketch) {
  paint(s, [
    ...person(s, 0.42, 0, 1.15, { coat: '#f2a65a', hold: 'icecream', skirt: true, hat: 'beret', hair: '#5b3a24', skin: '#c99772' }),
    ...person(s, 1.08, 0, 0.72, { coat: '#7fd0ff', hold: 'bucket', hat: 'beanie' }),
  ])
}

// A seagull on the boardwalk, eyeing your lunch.
export function seagull(s: Sketch) {
  const body = s.custom(
    (p) => {
      p.moveTo(0.08, 0.22)
      p.quadraticCurveTo(0.1, 0.34, 0.3, 0.34)
      p.quadraticCurveTo(0.42, 0.36, 0.44, 0.42)
      p.quadraticCurveTo(0.5, 0.48, 0.55, 0.44)
      p.lineTo(0.62, 0.42)
      p.lineTo(0.54, 0.4)
      p.quadraticCurveTo(0.5, 0.32, 0.46, 0.26)
      p.quadraticCurveTo(0.4, 0.14, 0.24, 0.16)
      p.closePath()
    },
    pts(0.08, 0.14, 0.62, 0.48)
  )
  const wing = s.custom(
    (p) => {
      p.moveTo(0.14, 0.26)
      p.quadraticCurveTo(0.26, 0.32, 0.38, 0.28)
      p.lineTo(0.3, 0.22)
      p.closePath()
    },
    pts(0.14, 0.22, 0.38, 0.32)
  )
  s.strip([[0.28, 0.0], [0.27, 0.16]], 0.012, 0.025, '#e0a24a')
  s.strip([[0.34, 0.0], [0.33, 0.16]], 0.012, 0.025, '#e0a24a')
  paint(s, [
    {
      shape: body,
      color: '#f8f6f0',
      ink: 0.012,
      detail: () => {
        s.fill(s.ellipse(0.5, 0.43, 0.012, 0.012), INK)
        s.fill(s.poly(pts(0.55, 0.43, 0.63, 0.42, 0.55, 0.405), 0), '#f2b13c')
      },
    },
    { shape: wing, color: '#9aa3ad', ink: 0.01 },
  ])
}

// ---------------------------------------------------------------------------
// Prospect Park: the Soldiers' and Sailors' Arch at Grand Army Plaza, with a
// chariot group on top. The archway itself is cut out of the paper.

export function grandArmyArch(s: Sketch) {
  const W = s.w
  const stone = '#ddd0b4'
  const bodyTop = s.h - 0.85
  const body = s.rect(0, 0, W, bodyTop, 0.004)
  const attic = s.rect(0.12, bodyTop - 0.5, W - 0.24, 0.5, 0.003)
  const opening = s.custom(
    (p) => {
      const w = W * 0.36
      const x0 = (W - w) / 2
      p.moveTo(x0, 0)
      p.lineTo(x0, bodyTop * 0.48)
      p.arc(W / 2, bodyTop * 0.48, w / 2, Math.PI, 0, true)
      p.lineTo(x0 + w, 0)
      p.closePath()
    },
    pts((W - W * 0.36) / 2, 0, (W + W * 0.36) / 2, bodyTop * 0.48 + W * 0.18)
  )
  // The quadriga: a chariot, four horses rearing, a figure with a flag.
  const bronze = '#5f8f7a'
  const base = s.rect(W / 2 - 0.55, bodyTop, 1.1, 0.12, 0.002)
  const horses = s.custom(
    (p) => {
      const y = bodyTop + 0.12
      p.moveTo(W / 2 - 0.5, y)
      p.lineTo(W / 2 + 0.5, y)
      p.lineTo(W / 2 + 0.48, y + 0.18)
      p.quadraticCurveTo(W / 2 + 0.5, y + 0.36, W / 2 + 0.42, y + 0.42)
      p.lineTo(W / 2 + 0.34, y + 0.32)
      p.lineTo(W / 2 + 0.18, y + 0.3)
      p.lineTo(W / 2 - 0.18, y + 0.3)
      p.lineTo(W / 2 - 0.34, y + 0.32)
      p.lineTo(W / 2 - 0.42, y + 0.42)
      p.quadraticCurveTo(W / 2 - 0.5, y + 0.36, W / 2 - 0.48, y + 0.18)
      p.closePath()
    },
    pts(W / 2 - 0.5, bodyTop, W / 2 + 0.5, bodyTop + 0.55)
  )
  const rider = s.poly(pts(W / 2 - 0.08, bodyTop + 0.3, W / 2 + 0.08, bodyTop + 0.3, W / 2 + 0.05, bodyTop + 0.62, W / 2 - 0.05, bodyTop + 0.62), 0)
  s.strip([[W / 2 + 0.07, bodyTop + 0.5], [W / 2 + 0.14, bodyTop + 0.84]], 0.012, 0.025)
  const flag = s.poly(pts(W / 2 + 0.14, bodyTop + 0.84, W / 2 + 0.36, bodyTop + 0.78, W / 2 + 0.13, bodyTop + 0.7), 0)
  paint(s, [
    {
      shape: body,
      color: stone,
      ink: 0.028,
      detail: () => {
        // Paired columns either side of the arch, and rusticated courses.
        for (const x of [0.22, 0.46, W - 0.54, W - 0.3]) {
          s.fill(s.rect(x, 0.35, 0.1, bodyTop - 0.95, 0), shade(stone, -0.08))
          s.line([[x, 0.35], [x, bodyTop - 0.6]], 0.01, rgba(INK, 0.5), 0)
          s.line([[x + 0.1, 0.35], [x + 0.1, bodyTop - 0.6]], 0.01, rgba(INK, 0.5), 0)
        }
        for (let y = 0.12; y < 0.35; y += 0.11) s.line([[0, y], [W, y]], 0.008, rgba(INK, 0.4), 0)
        // Relief panels and the keystone.
        for (const x of [0.62, W - 0.86]) s.fill(s.rect(x, bodyTop * 0.55, 0.24, 0.5, 0), rgba(bronze, 0.7))
        s.fill(s.poly(pts(W / 2 - 0.08, bodyTop * 0.48 + W * 0.18 + 0.02, W / 2 + 0.08, bodyTop * 0.48 + W * 0.18 + 0.02, W / 2 + 0.05, bodyTop * 0.48 + W * 0.18 - 0.14, W / 2 - 0.05, bodyTop * 0.48 + W * 0.18 - 0.14), 0), shade(stone, -0.15))
        s.hatch(s.rect(W - 0.3, 0, 0.3, bodyTop, 0), { angle: 1.25, gap: 0.04, alpha: 0.3 })
      },
    },
    {
      shape: attic,
      color: shade(stone, 0.05),
      ink: 0.02,
      detail: () => s.text('TO THE DEFENDERS OF THE UNION', W / 2, bodyTop - 0.3, 0.075, { color: rgba(INK, 0.7), spacing: 3 }),
    },
    { shape: base, color: shade(stone, -0.1), ink: 0.014 },
    { shape: horses, color: bronze, ink: 0.016, hatch: { angle: 0.6, gap: 0.03, alpha: 0.3 } },
    { shape: rider, color: bronze, ink: 0.012 },
    { shape: flag, color: bronze, ink: 0.01 },
  ])
  // Cut the archway out, then ink its edge.
  const c = s.ctx
  c.save()
  c.globalCompositeOperation = 'destination-out'
  c.fill(opening.path)
  c.restore()
  s.ink(opening, 0.024)
  s.glow(s.rect(0.2, bodyTop - 0.5, W - 0.4, 0.06, 0), '#ffe2a3')
}

// A big round park tree in late-afternoon light.
export function parkTree(s: Sketch, leaf: string, shadow: string) {
  const W = s.w
  const trunk = s.poly(pts(W / 2 - 0.09, 0, W / 2 + 0.09, 0, W / 2 + 0.06, 0.9, W / 2 - 0.06, 0.9), 0.003)
  s.border([trunk], 0.06)
  s.wash(trunk, '#6e4f3a')
  s.ink(trunk, 0.016)
  s.strip([[W / 2, 0.75], [W / 2 - 0.3, 1.1]], 0.04, 0.04, '#6e4f3a')
  s.strip([[W / 2, 0.65], [W / 2 + 0.32, 1.0]], 0.04, 0.04, '#6e4f3a')
  const r = W / 2 - 0.1
  blobs(
    s,
    [
      [W / 2, 1.2, r * 0.62],
      [W / 2 - r * 0.5, 1.4, r * 0.55],
      [W / 2 + r * 0.5, 1.42, r * 0.56],
      [W / 2 - r * 0.2, 1.8, r * 0.6],
      [W / 2 + r * 0.3, 1.85, r * 0.55],
      [W / 2, 2.15, r * 0.45],
    ],
    leaf,
    shadow
  )
  const c = s.ctx
  c.save()
  for (let i = 0; i < 30; i++) {
    c.strokeStyle = rgba(INK, 0.35)
    c.lineWidth = 0.012
    c.beginPath()
    c.arc(s.r(0.25, W - 0.25), s.r(1.0, 2.3), 0.05, 0.2, 2.6)
    c.stroke()
  }
  c.restore()
}

// ---------------------------------------------------------------------------
// A soft-serve ice cream truck with a giant cone on the roof.

export function iceCreamTruck(s: Sketch) {
  const W = s.w
  const body = s.custom(
    (p) => {
      p.moveTo(0.05, 0.2)
      p.lineTo(W - 0.05, 0.2)
      p.lineTo(W - 0.05, 0.62)
      p.quadraticCurveTo(W - 0.06, 0.78, W - 0.28, 0.82)
      p.lineTo(W - 0.48, 1.02)
      p.lineTo(0.12, 1.02)
      p.quadraticCurveTo(0.05, 1.0, 0.05, 0.9)
      p.closePath()
    },
    pts(0.05, 0.2, W - 0.05, 1.02)
  )
  const window_ = s.rect(0.32, 0.5, 0.86, 0.38, 0.002)
  const cab = s.poly(pts(W - 0.46, 0.62, W - 0.12, 0.62, W - 0.32, 0.92, W - 0.46, 0.92), 0)
  const wheels = [0.42, W - 0.48].map((x) => s.ellipse(x, 0.18, 0.16, 0.16))
  const coneBody = s.poly(pts(0.72, 1.12, 0.94, 1.12, 0.83, 1.02), 0)
  const scoop: [number, number, number][] = [
    [0.83, 1.22, 0.14],
    [0.83, 1.36, 0.11],
    [0.84, 1.47, 0.07],
  ]
  const tip = s.poly(pts(0.81, 1.52, 0.86, 1.52, 0.86, 1.6), 0)
  s.strip([[0.83, 1.02], [0.83, 0.98]], 0.06, 0.04)
  paint(s, [
    ...wheels.map((w) => ({ shape: w, color: '#2c2a30', ink: 0.018 })),
    {
      shape: body,
      color: '#f8f6ef',
      ink: 0.026,
      detail: () => {
        s.fill(s.rect(0.05, 0.2, W - 0.1, 0.14, 0), '#6fb1e0')
        s.fill(s.rect(0.05, 0.36, W - 0.1, 0.05, 0), '#f39cc0')
        s.text('SOFT ICE CREAM', 0.75, 0.25, 0.075, { color: '#ffffff', font: 'Helvetica, Arial, sans-serif', glow: '#d8f0ff' })
        s.hatch(s.rect(W - 0.5, 0.2, 0.45, 0.82, 0), { angle: 1.2, gap: 0.04, alpha: 0.15 })
        wheels.forEach((_, i) => s.fill(s.ellipse(i ? W - 0.48 : 0.42, 0.2, 0.2, 0.19), shade('#f8f6ef', -0.25)))
      },
    },
    {
      shape: window_,
      color: '#fff1c9',
      ink: 0.016,
      detail: () => {
        s.glow(window_, '#ffe2a3')
        // The server leaning out, and the menu.
        s.fill(s.ellipse(0.98, 0.72, 0.07, 0.075), C.skin)
        s.fill(s.rect(0.92, 0.5, 0.13, 0.16, 0), '#ffffff')
        s.fill(s.poly(pts(0.92, 0.79, 1.04, 0.79, 0.98, 0.84), 0), '#ffffff')
        s.text('CONES', 0.55, 0.78, 0.06, { color: C.redDark, font: 'Helvetica, Arial, sans-serif' })
        s.text('SHAKES', 0.55, 0.69, 0.06, { color: '#3f6fb0', font: 'Helvetica, Arial, sans-serif' })
        s.text('SUNDAES', 0.55, 0.6, 0.06, { color: C.redDark, font: 'Helvetica, Arial, sans-serif' })
      },
    },
    { shape: cab, color: '#9fc9e6', ink: 0.016, detail: () => s.glow(cab, '#ffe2a3') },
    { shape: coneBody, color: '#d9a35c', ink: 0.014, hatch: { angle: 0.8, gap: 0.02, alpha: 0.4 } },
  ])
  // Soft-serve swirl on the cone, then wheel hubs.
  blobs(s, scoop, '#fffaf0', 'rgba(230,170,190,0.5)', 0.016)
  s.border([tip], 0.03)
  s.fill(tip, '#fffaf0')
  s.ink(tip, 0.012)
  s.glow(s.ellipse(0.83, 1.3, 0.15, 0.2), '#fff4e0')
  wheels.forEach((_, i) => {
    const hub = s.ellipse(i ? W - 0.48 : 0.42, 0.18, 0.07, 0.07)
    s.fill(hub, '#d9dde0')
    s.ink(hub, 0.01)
  })
}

// ---------------------------------------------------------------------------
// Williamsburg: a giant Greek-style deli coffee cup, steaming.

export function coffeeCup(s: Sketch) {
  const W = s.w
  const top = 1.25
  const cup = s.poly(pts(0.28, 0, W - 0.28, 0, W - 0.1, top, 0.1, top), 0.003)
  const lid = s.custom(
    (p) => {
      p.moveTo(0.04, top - 0.02)
      p.lineTo(W - 0.04, top - 0.02)
      p.lineTo(W - 0.08, top + 0.1)
      p.lineTo(0.08, top + 0.1)
      p.closePath()
    },
    pts(0.04, top - 0.02, W - 0.04, top + 0.1)
  )
  const blue = '#1f5aa6'
  const meander = (y: number, h: number) => {
    // A white Greek key band across the cup.
    const xAt = (yy: number) => 0.28 - ((0.28 - 0.1) * yy) / top
    s.fill(s.poly(pts(xAt(y), y, W - xAt(y), y, W - xAt(y + h), y + h, xAt(y + h), y + h), 0), '#f6f2e6')
    const c = s.ctx
    c.save()
    c.strokeStyle = blue
    c.lineWidth = 0.018
    const step = 0.12
    for (let x = xAt(y) + 0.02; x < W - xAt(y) - step; x += step) {
      c.beginPath()
      c.moveTo(x, y + 0.02)
      c.lineTo(x, y + h - 0.025)
      c.lineTo(x + step * 0.7, y + h - 0.025)
      c.lineTo(x + step * 0.7, y + h * 0.45)
      c.lineTo(x + step * 0.35, y + h * 0.45)
      c.stroke()
    }
    c.restore()
  }
  paint(s, [
    {
      shape: cup,
      color: blue,
      ink: 0.026,
      detail: () => {
        meander(0.06, 0.16)
        meander(top - 0.26, 0.16)
        s.text('WE ARE HAPPY', W / 2, 0.76, 0.12, { color: '#f6f2e6', spacing: 4 })
        s.text('TO SERVE YOU', W / 2, 0.58, 0.12, { color: '#f6f2e6', spacing: 4 })
        // Little amphorae either side.
        for (const x of [0.32, W - 0.32]) {
          const amph = s.custom(
            (p) => {
              p.moveTo(x - 0.03, 0.32)
              p.quadraticCurveTo(x - 0.09, 0.42, x - 0.035, 0.5)
              p.lineTo(x - 0.025, 0.56)
              p.lineTo(x + 0.025, 0.56)
              p.lineTo(x + 0.035, 0.5)
              p.quadraticCurveTo(x + 0.09, 0.42, x + 0.03, 0.32)
              p.closePath()
            },
            pts(x - 0.09, 0.32, x + 0.09, 0.56)
          )
          s.fill(amph, '#f6f2e6')
        }
        s.fill(s.poly(pts(W - 0.32, 0.05, W - 0.18, 0.05, W - 0.1, top - 0.02, W - 0.22, top - 0.02), 0), 'rgba(255,255,255,0.12)')
        s.hatch(s.rect(0.1, 0, 0.22, top, 0), { angle: 1.3, gap: 0.035, alpha: 0.25 })
      },
    },
    { shape: lid, color: '#f4f1ea', ink: 0.018 },
  ])
  blobs(
    s,
    [
      [W / 2 - 0.05, top + 0.25, 0.13],
      [W / 2 + 0.08, top + 0.42, 0.15],
      [W / 2 - 0.06, top + 0.6, 0.12],
      [W / 2 + 0.04, top + 0.74, 0.08],
    ],
    '#fbfaf6',
    'rgba(120,130,150,0.35)',
    0.014
  )
}

// A Williamsburg cyclist on a fixie: beanie, beard, tote bag.
export function cyclist(s: Sketch) {
  const wheelR = 0.26
  const back: Pt = [0.32, wheelR + 0.02]
  const front: Pt = [1.22, wheelR + 0.02]
  const ring = (c: Pt) => {
    const path: Pt[] = []
    for (let k = 0; k <= 36; k++) path.push([c[0] + Math.cos((k / 36) * Math.PI * 2) * wheelR, c[1] + Math.sin((k / 36) * Math.PI * 2) * wheelR])
    s.strip(path, 0.035, 0.035, '#2c2a30')
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI
      s.line([[c[0] - Math.cos(a) * wheelR, c[1] - Math.sin(a) * wheelR], [c[0] + Math.cos(a) * wheelR, c[1] + Math.sin(a) * wheelR]], 0.005, rgba(INK, 0.6), 0)
    }
  }
  ring(back)
  ring(front)
  const crank: Pt = [0.72, 0.3]
  const seat: Pt = [0.62, 0.7]
  const bars: Pt = [1.1, 0.78]
  const frameColor = '#e05a6f'
  s.strip([back, crank, [1.02, 0.66], front], 0.03, 0.03, frameColor)
  s.strip([back, seat, crank], 0.03, 0.03, frameColor)
  s.strip([seat, [1.02, 0.66], bars], 0.03, 0.03, frameColor)
  s.strip([[0.54, 0.72], [0.72, 0.72]], 0.04, 0.03)
  // Rider leaning into the handlebars.
  const torso = s.poly(pts(0.58, 0.74, 0.74, 0.74, 0.98, 1.16, 0.84, 1.24), 0.002)
  const thigh = s.poly(pts(0.62, 0.72, 0.72, 0.78, 0.86, 0.56, 0.78, 0.5), 0.001)
  const shin = s.poly(pts(0.8, 0.54, 0.86, 0.56, 0.8, 0.3, 0.74, 0.3), 0.001)
  const arm = s.poly(pts(0.9, 1.16, 0.96, 1.12, 1.12, 0.82, 1.08, 0.78), 0.001)
  const head = s.ellipse(1.0, 1.36, 0.1, 0.11)
  const beanie = s.custom((p) => p.arc(1.0, 1.4, 0.105, 0, Math.PI, false), pts(0.9, 1.4, 1.1, 1.52))
  const beard = s.custom(
    (p) => {
      p.moveTo(0.94, 1.32)
      p.quadraticCurveTo(1.0, 1.18, 1.1, 1.3)
      p.closePath()
    },
    pts(0.94, 1.2, 1.1, 1.32)
  )
  const tote = s.rect(0.52, 0.86, 0.2, 0.24, 0.002)
  paint(s, [
    { shape: shin, color: '#2f4566', ink: 0.01 },
    { shape: thigh, color: '#2f4566', ink: 0.01 },
    { shape: tote, color: '#efe2c4', ink: 0.01, detail: () => s.text('NY', 0.62, 0.94, 0.07, { color: INK, font: 'Helvetica, Arial, sans-serif' }) },
    { shape: torso, color: '#c9764a', ink: 0.012, hatch: { angle: 0.6, gap: 0.03, alpha: 0.2 } },
    { shape: arm, color: shade('#c9764a', -0.1), ink: 0.01 },
    { shape: head, color: C.skin, ink: 0.012, detail: () => s.fill(s.ellipse(1.04, 1.37, 0.01, 0.012), INK) },
    { shape: beard, color: '#5b3a24', ink: 0.008 },
    { shape: beanie, color: '#e2a03c', ink: 0.01 },
  ])
}
