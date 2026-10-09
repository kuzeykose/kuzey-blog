import { INK, Pt, Shape, Sketch, rgba, tint } from './sketch'
import { C } from './palette'
import { Part, awning, paint, pts } from './art-common'
import { blobs, person } from './art-street'

// Art for the Coney Island spread, looking north from the ocean: the surf
// and the beach in front, the boardwalk, and the rides behind.

const SANS = 'Helvetica, Arial, sans-serif'

function block(s: Sketch, shape: Shape, color: string, lit = 0.45): Part {
  return {
    shape,
    color,
    ink: 0.02,
    detail: () => {
      const w = shape.maxX - shape.minX
      const h = shape.maxY - shape.minY
      const cols = Math.max(2, Math.round(w / 0.17))
      const rows = Math.max(2, Math.round(h / 0.22))
      const cw = (w * 0.76) / cols
      const ch = (h - 0.3) / rows
      s.windows(shape.minX + w * 0.12 + cw * 0.22, shape.minY + 0.14 + ch * 0.22, cols, rows, cw * 0.55, ch * 0.55, cw * 0.45, ch * 0.45, { lit, frame: false })
    },
  }
}

const limb = (s: Sketch, a: Pt, b: Pt, w0: number, w1 = w0): Shape => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  const nx = -(b[1] - a[1]) / l
  const ny = (b[0] - a[0]) / l
  return s.poly(
    [
      [a[0] + nx * w0, a[1] + ny * w0],
      [b[0] + nx * w1, b[1] + ny * w1],
      [b[0] - nx * w1, b[1] - ny * w1],
      [a[0] - nx * w0, a[1] - ny * w0],
    ],
    0.001
  )
}

// ---------------------------------------------------------------------------
// Brooklyn behind the rides: low blocks along Mermaid Avenue, red-brick
// housing towers, and the Stillwell Avenue terminal's long roof.

export function coneyBackdrop(s: Sketch) {
  const W = s.w
  const parts: Part[] = []
  for (const [x, w, h] of [
    [0.5, 0.8, 2.6],
    [2.3, 0.7, 3.1],
    [4.4, 0.85, 2.4],
    [8.4, 0.8, 2.9],
    [10.4, 0.75, 3.2],
    [11.5, 0.7, 2.5],
  ]) {
    parts.push(block(s, s.rect(x, 0, w, h, 0.003), s.pick(['#a8573f', '#b8705a', '#c9b08f']), 0.4))
  }
  for (let x = 0.05; x < W - 0.4; x += s.r(0.5, 0.85)) {
    parts.push(block(s, s.rect(x, 0, s.r(0.45, 0.8), s.r(0.6, 1.2), 0.003), s.pick([C.brick, C.limestone, C.cream, C.brownstone, C.limestoneDark]), 0.5))
  }
  const shed = s.custom(
    (p) => {
      p.moveTo(5.6, 0)
      p.lineTo(5.6, 0.7)
      p.quadraticCurveTo(6.6, 1.25, 7.6, 0.7)
      p.lineTo(7.6, 0)
      p.closePath()
    },
    pts(5.6, 0, 7.6, 1.0)
  )
  parts.push({
    shape: shed,
    color: '#9fb6c4',
    ink: 0.018,
    detail: () => {
      for (let x = 5.75; x < 7.5; x += 0.15) s.line([[x, 0.1], [x, 0.95 - Math.abs(x - 6.6) * 0.25]], 0.008, rgba(INK, 0.4), 0)
      s.glow(shed, '#5a4628')
      s.text('STILLWELL AV', 6.6, 0.25, 0.1, { color: '#f4f1ea', font: SANS, spacing: 2 })
    },
  })
  paint(s, parts)
}

// ---------------------------------------------------------------------------
// The Thunderbolt: a red steel coaster, straight up the lift hill, down the
// drop and round the loop.

export function thunderbolt(s: Sketch) {
  const red = '#c8202f'
  const loopC: Pt = [1.95, 0.98]
  const R = 0.62
  const loop: Pt[] = []
  for (let k = 0; k <= 48; k++) {
    const a = -Math.PI / 2 + (k / 48) * Math.PI * 2
    loop.push([loopC[0] + Math.cos(a) * R, loopC[1] + Math.sin(a) * R])
  }
  const path: Pt[] = [
    [0.05, 0.35],
    [0.72, 2.18],
    [0.86, 2.28],
    [1.0, 2.12],
    [1.28, 0.5],
    [1.45, 0.36],
    [loopC[0], loopC[1] - R],
  ]
  const exit: Pt[] = [
    [loopC[0], loopC[1] - R],
    [2.55, 0.38],
    [2.95, 0.6],
  ]
  // Grey legs down to the ground, then the track over them.
  const legs: [number, number][] = [
    [0.2, 0.75],
    [0.42, 1.35],
    [0.62, 1.9],
    [0.86, 2.26],
    [1.12, 1.4],
    [1.38, 0.38],
    [2.62, 0.4],
    [2.88, 0.55],
  ]
  for (const [x, y] of legs) s.strip([[x, 0], [x, y]], 0.025, 0.025, '#8d979e')
  s.strip([[loopC[0], 0], [loopC[0], loopC[1] - R]], 0.03, 0.025, '#8d979e')
  for (const line of [path, loop, exit]) {
    s.strip(line, 0.06, 0.035, red)
    s.line(line, 0.008, rgba('#2a0d0d', 0.6), 0)
  }
  // A train clanking up the lift.
  const cars = [0, 1, 2].map((k) => {
    const t = 0.35 + k * 0.17
    const x = 0.05 + (0.72 - 0.05) * t
    const y = 0.35 + (2.18 - 0.35) * t + 0.08
    return s.poly(pts(x - 0.09, y - 0.18, x + 0.07, y + 0.21, x + 0.15, y + 0.17, x - 0.01, y - 0.22), 0.001)
  })
  const sign = s.rect(2.0, 1.8, 0.95, 0.24, 0.001)
  s.strip([[2.48, 1.6], [2.48, 1.82]], 0.02, 0.025, '#8d979e')
  paint(s, [
    ...cars.map((shape) => ({ shape, color: '#f7c948', ink: 0.01 })),
    {
      shape: sign,
      color: red,
      flat: true,
      ink: 0.012,
      detail: () => s.text('THUNDERBOLT', 2.475, 1.86, 0.09, { color: '#f4f1ea', glow: '#ffe2a3', font: SANS, spacing: 2 }),
    },
  ])
  for (const [x, y] of loop.filter((_, k) => k % 6 === 0)) {
    const bulb = s.ellipse(x, y, 0.014, 0.014)
    s.glow(bulb, '#ffd27a')
  }
}

// ---------------------------------------------------------------------------
// Nathan's Famous on Surf Avenue: the green and yellow corner stand, its
// counters open to the street, and a hot dog on the roof.

export function nathans(s: Sketch) {
  const W = s.w
  const green = '#1f6b3a'
  const yellow = '#f7c948'
  const walls = s.rect(0.05, 0, W - 0.1, 1.05, 0.003)
  const band = s.rect(0.02, 1.02, W - 0.04, 0.34, 0.002)
  const board = s.rect(0.35, 1.36, 1.55, 0.26, 0.002)
  const bun = s.ellipse(2.25, 1.47, 0.36, 0.1)
  const dog = s.ellipse(2.25, 1.53, 0.43, 0.06)
  paint(s, [
    {
      shape: walls,
      color: '#f4f1ea',
      ink: 0.02,
      detail: () => {
        for (let k = 0; k < 4; k++) {
          const counter = s.rect(0.2 + k * 0.66, 0.36, 0.52, 0.32, 0)
          s.fill(counter, '#3d4a63')
          s.glow(counter, '#c9a35c')
          // A cook at each window.
          const cook = [s.ellipse(0.46 + k * 0.66, 0.52, 0.045, 0.05), s.rect(0.42 + k * 0.66, 0.36, 0.08, 0.1, 0)]
          s.fill(cook[0], C.skin)
          s.fill(cook[1], '#ffffff')
          cook.forEach((shape) => s.glow(shape, '#000'))
        }
        s.fill(s.rect(0.05, 0.3, W - 0.1, 0.06, 0), '#c9c4ba')
        s.fill(s.rect(0.05, 0, W - 0.1, 0.06, 0), green)
      },
    },
    awning(s, 0.1, 0.72, W - 0.2, green),
    {
      shape: band,
      color: green,
      flat: true,
      ink: 0.018,
      detail: () => {
        s.text("NATHAN'S FAMOUS", W / 2, 1.1, 0.19, { color: yellow, glow: '#ffd23f', font: SANS, weight: '900', spacing: 2 })
      },
    },
    {
      shape: board,
      color: yellow,
      flat: true,
      ink: 0.014,
      detail: () => s.text('FRANKFURTERS', 1.125, 1.42, 0.11, { color: C.redDark, glow: '#a8402e', font: SANS, weight: '900' }),
    },
    { shape: dog, color: '#b4553a', ink: 0.012 },
    { shape: bun, color: '#e0b06a', ink: 0.014 },
  ])
  s.line(
    Array.from({ length: 13 }, (_, k): Pt => [1.88 + k * 0.06, 1.54 + (k % 2 ? 0.025 : -0.015)]),
    0.016,
    '#f2c230',
    0
  )
  for (const x of [0.45, W - 0.45]) s.strip([[x, 1.36], [x, 1.4]], 0.02, 0.02)
}

// ---------------------------------------------------------------------------
// The way into Luna Park: striped pillars, an arch strung with bulbs, and
// the smiling moon on top.

export function lunaGate(s: Sketch) {
  const W = s.w
  const pillars = [0.12, W - 0.42].map((x) => s.rect(x, 0, 0.3, 1.32, 0.002))
  const arch = s.custom(
    (p) => {
      p.moveTo(0.08, 1.25)
      p.quadraticCurveTo(W / 2, 1.95, W - 0.08, 1.25)
      p.lineTo(W - 0.08, 1.05)
      p.quadraticCurveTo(W / 2, 1.7, 0.08, 1.05)
      p.closePath()
    },
    pts(0.08, 1.05, W - 0.08, 1.6)
  )
  const moon = s.custom(
    (p) => {
      p.arc(W / 2, 1.78, 0.25, Math.PI * 0.3, Math.PI * 1.7, false)
      p.arc(W / 2 - 0.11, 1.78, 0.2, Math.PI * 1.6, Math.PI * 0.4, true)
      p.closePath()
    },
    pts(W / 2 - 0.25, 1.53, W / 2 + 0.25, 2.03)
  )
  const booth = s.rect(W / 2 - 0.3, 0, 0.6, 0.62, 0.002)
  paint(s, [
    {
      shape: booth,
      color: '#3f6fb0',
      ink: 0.016,
      detail: () => {
        const win = s.rect(W / 2 - 0.2, 0.28, 0.4, 0.2, 0)
        s.fill(win, '#fff1c9')
        s.glow(win, '#c9a35c')
        s.text('TICKETS', W / 2, 0.1, 0.075, { color: '#f4f1ea', font: SANS })
      },
    },
    ...pillars.map((shape) => ({
      shape,
      color: '#f4f1ea',
      ink: 0.016,
      detail: () => {
        const c = s.ctx
        c.save()
        c.clip(shape.path)
        c.fillStyle = '#c8202f'
        for (let y = -0.4; y < 1.5; y += 0.2) {
          c.beginPath()
          c.moveTo(shape.minX, y)
          c.lineTo(shape.maxX, y + 0.15)
          c.lineTo(shape.maxX, y + 0.25)
          c.lineTo(shape.minX, y + 0.1)
          c.closePath()
          c.fill()
        }
        c.restore()
      },
    })),
    {
      shape: arch,
      color: '#f4f1ea',
      ink: 0.018,
      detail: () => {
        s.text('LUNA PARK', W / 2, 1.27, 0.2, { color: '#c8202f', glow: '#ff6a5a', font: SANS, weight: '900', spacing: 3 })
      },
    },
    {
      shape: moon,
      color: '#f7d36a',
      ink: 0.016,
      detail: () => {
        s.glow(moon, '#ffe9a8')
        s.fill(s.ellipse(W / 2 - 0.15, 1.86, 0.018, 0.022), INK)
        s.line([[W / 2 - 0.2, 1.7], [W / 2 - 0.15, 1.66], [W / 2 - 0.1, 1.68]], 0.012, INK, 0)
      },
    },
  ])
  // Bulbs all the way round the arch.
  for (let k = 0; k <= 22; k++) {
    const t = k / 22
    const x = 0.12 + t * (W - 0.24)
    const y = 1.21 + 2 * t * (1 - t) * 0.7
    const bulb = s.ellipse(x, y, 0.018, 0.018)
    const color = k % 2 ? '#ffd27a' : '#ff8a8a'
    s.fill(bulb, color)
    s.glow(bulb, color)
  }
}

// ---------------------------------------------------------------------------
// The Riegelmann Boardwalk, seen from the beach: the deck on its pilings,
// the railing, lamps, and the odd bench.

export function boardwalk(s: Sketch) {
  const W = s.w
  const wood = '#a8784f'
  for (let x = 0.1; x < W; x += 0.32) s.strip([[x, 0], [x, 0.14]], 0.03, 0.03, tint(wood, -0.25))
  const deck = s.rect(0.02, 0.12, W - 0.04, 0.13, 0.002)
  paint(s, [
    {
      shape: deck,
      color: wood,
      ink: 0.016,
      detail: () => {
        s.line([[0.02, 0.185], [W - 0.02, 0.185]], 0.006, rgba(INK, 0.4), 0)
        for (let x = 0.3; x < W; x += 0.6) s.line([[x, 0.12], [x, 0.25]], 0.005, rgba(INK, 0.3), 0)
      },
    },
  ])
  // Railing.
  for (let x = 0.08; x < W; x += 0.36) s.strip([[x, 0.25], [x, 0.55]], 0.025, 0.025, '#5a4434')
  s.strip([[0.05, 0.42], [W - 0.05, 0.42]], 0.018, 0.025, '#5a4434')
  s.strip([[0.05, 0.55], [W - 0.05, 0.55]], 0.03, 0.03, '#5a4434')
  // Lamps.
  for (let x = 1.0; x < W - 0.5; x += 2.2) {
    s.strip([[x, 0.25], [x, 0.78]], 0.03, 0.03, '#2f3a33')
    const globe = s.ellipse(x, 0.84, 0.06, 0.065)
    s.border([globe], 0.035)
    s.fill(globe, '#fff3cf')
    s.ink(globe, 0.01)
    s.glow(globe, '#ffd27a')
  }
  // The sign by the steps down to the sand.
  const sign = s.rect(5.6, 0.6, 1.4, 0.16, 0.001)
  s.border([sign], 0.035)
  s.fill(sign, '#2f4566')
  s.ink(sign, 0.01)
  s.text('RIEGELMANN BOARDWALK', 6.3, 0.635, 0.065, { color: '#f4f1ea', font: SANS, spacing: 2, glow: '#c8c4bb' })
}

// People out on the boardwalk: an old couple arm in arm, a kid with cotton
// candy, and someone eating a hot dog.

export function strollers(s: Sketch) {
  const kid = 1.2
  const H = 0.62
  const hand: Pt = [kid + H * 0.2, H * 0.72]
  s.strip([hand, [hand[0] + 0.02, hand[1] + 0.18]], 0.01, 0.025, '#e6d8bb')
  paint(
    s,
    [
      ...person(s, 0.38, 0, 1.0, { coat: '#7b8f9a', hat: 'fedora', rainy: true, brolly: '#2f4566' }),
      ...person(s, 0.72, 0, 0.95, { coat: '#d06aa6', skirt: true, hair: '#c9c4ba' }),
      ...person(s, kid, 0, H, { coat: '#f7c948', hold: 'balloon' }),
      ...person(s, 1.7, 0, 1.02, { coat: '#18a558', hold: 'sandwich', skin: '#8d5a3c' }),
    ],
    0.04
  )
  blobs(
    s,
    [
      [hand[0] + 0.02, hand[1] + 0.27, 0.1],
      [hand[0] - 0.05, hand[1] + 0.33, 0.07],
      [hand[0] + 0.08, hand[1] + 0.34, 0.07],
    ],
    '#f6a8c8',
    'rgba(200,90,140,0.4)',
    0.012
  )
}

// ---------------------------------------------------------------------------
// The Mermaid Parade (summer): mermaids with tails, King Neptune with his
// trident, and the banner held up high.

export function mermaidParade(s: Sketch) {
  const W = s.w
  const carriers = [0.22, W - 0.22]
  const tails: [number, number, string][] = [
    [0.82, 1.0, '#2f9b7a'],
    [1.38, 1.05, '#7b2fbf'],
  ]
  const neptune = 1.92
  const parts: Part[] = [
    ...carriers.flatMap((x, i) => person(s, x, 0, 0.95, { coat: i ? '#e8587a' : '#4f8a8b', hold: 'balloon', keep: true })),
    ...tails.flatMap(([x, H, c]) => person(s, x, 0, H, { coat: c, skirt: true, hair: c === '#2f9b7a' ? '#c8202f' : '#f7c948', keep: true, wave: true })),
    ...person(s, neptune, 0, 1.12, { coat: '#3f6fb0', hold: 'balloon', keep: true, hair: '#f4f1ea' }),
  ]
  paint(s, parts, 0.04)
  // Fishtails over their legs, flaring at the fin.
  for (const [x, H, c] of tails) {
    const tail = s.custom(
      (p) => {
        p.moveTo(x - H * 0.16, H * 0.32)
        p.lineTo(x + H * 0.16, H * 0.32)
        p.quadraticCurveTo(x + H * 0.08, H * 0.12, x + H * 0.03, H * 0.08)
        p.lineTo(x + H * 0.2, 0.0)
        p.lineTo(x - H * 0.2, 0.0)
        p.lineTo(x - H * 0.03, H * 0.08)
        p.quadraticCurveTo(x - H * 0.08, H * 0.12, x - H * 0.16, H * 0.32)
        p.closePath()
      },
      pts(x - H * 0.2, 0, x + H * 0.2, H * 0.32)
    )
    paint(s, [{ shape: tail, color: c, ink: 0.012, hatch: { angle: 0.8, gap: 0.025, alpha: 0.3 } }], 0.03)
    // A crown of shells.
    for (const d of [-1, 0, 1]) s.fill(s.ellipse(x + d * H * 0.05, H * 1.0, H * 0.025, H * 0.03), '#f6c6d0')
  }
  // Neptune's trident, crown and beard.
  const nh: Pt = [neptune + 1.12 * 0.2, 1.12 * 0.72]
  s.strip([nh, [nh[0], 1.55]], 0.02, 0.03, '#d9b45a')
  for (const d of [-1, 0, 1]) s.strip([[nh[0] + d * 0.06, 1.5], [nh[0] + d * 0.06, 1.62]], 0.016, 0.025, '#d9b45a')
  s.strip([[nh[0] - 0.06, 1.5], [nh[0] + 0.06, 1.5]], 0.016, 0.025, '#d9b45a')
  const crownShape = s.poly(pts(neptune - 0.08, 1.06, neptune + 0.08, 1.06, neptune + 0.09, 1.16, neptune + 0.04, 1.11, neptune, 1.18, neptune - 0.04, 1.11, neptune - 0.09, 1.16), 0)
  s.fill(crownShape, '#d9b45a')
  s.ink(crownShape, 0.008)
  const beard = s.custom(
    (p) => {
      p.moveTo(neptune - 0.07, 0.96)
      p.quadraticCurveTo(neptune, 0.78, neptune + 0.07, 0.96)
      p.closePath()
    },
    pts(neptune - 0.07, 0.8, neptune + 0.07, 0.96)
  )
  s.fill(beard, '#f4f1ea')
  s.ink(beard, 0.008)
  // The banner between the carriers' poles.
  for (const x of carriers) s.strip([[x + 0.95 * 0.2, 0.95 * 0.72], [x + 0.95 * 0.2, 1.62]], 0.018, 0.03, '#6e4f3a')
  const banner = s.rect(carriers[0] + 0.19, 1.38, carriers[1] - carriers[0], 0.24, 0.002)
  paint(
    s,
    [
      {
        shape: banner,
        color: '#2f4f8a',
        ink: 0.014,
        detail: () => {
          s.text('MERMAID PARADE', (carriers[0] + carriers[1]) / 2 + 0.19, 1.44, 0.12, { color: '#f4f1ea', font: SANS, spacing: 3 })
          for (let x = banner.minX + 0.05; x < banner.maxX; x += 0.12) s.fill(s.ellipse(x, 1.39, 0.03, 0.02), '#f7c948')
        },
      },
    ],
    0.035
  )
}

// ---------------------------------------------------------------------------
// The lifeguard chair: on duty in summer under a red umbrella, empty (but
// for a gull) the rest of the year.

export function lifeguardChair(s: Sketch) {
  const white = '#f4f1ea'
  const summer = s.season === 'summer'
  for (const [a, b] of [
    [[0.14, 0], [0.34, 1.16]],
    [[0.86, 0], [0.66, 1.16]],
  ] as [Pt, Pt][]) {
    s.strip([a, b], 0.05, 0.035, white)
  }
  for (let y = 0.25; y < 1.1; y += 0.26) {
    const half = 0.36 - y * 0.15
    s.strip([[0.5 - half, y], [0.5 + half, y]], 0.03, 0.03, white)
  }
  const seat = s.rect(0.24, 1.14, 0.52, 0.08, 0.001)
  const back = s.rect(0.3, 1.22, 0.4, 0.34, 0.001)
  const plaque = s.rect(0.26, 0.5, 0.48, 0.16, 0.001)
  paint(s, [
    { shape: back, color: white, ink: 0.012 },
    { shape: seat, color: white, ink: 0.012 },
    { shape: plaque, color: '#c8202f', flat: true, ink: 0.01, detail: () => s.text('LIFEGUARD', 0.5, 0.54, 0.06, { color: white, font: SANS }) },
  ])
  if (summer) {
    s.strip([[0.72, 1.14], [0.72, 1.9]], 0.02, 0.03, '#6e4f3a')
    const shade = s.custom(
      (p) => {
        p.moveTo(0.3, 1.8)
        p.quadraticCurveTo(0.72, 2.05, 1.14, 1.8)
        p.closePath()
      },
      pts(0.3, 1.8, 1.14, 1.93)
    )
    const torso = s.poly(pts(0.4, 1.22, 0.6, 1.22, 0.58, 1.5, 0.42, 1.5), 0.001)
    const head = s.ellipse(0.5, 1.6, 0.075, 0.08)
    paint(s, [
      { shape: torso, color: '#c8202f', ink: 0.012 },
      ...[-1, 1].map((d) => ({ shape: limb(s, [0.5 + d * 0.09, 1.46], [0.5 + d * 0.16, 1.24], 0.025), color: C.skin, ink: 0.01 })),
      {
        shape: head,
        color: C.skin,
        ink: 0.012,
        detail: () => {
          for (const d of [-1, 1]) s.fill(s.ellipse(0.5 + d * 0.028, 1.61, 0.022, 0.016), '#1d1c24')
          s.fill(s.ellipse(0.5, 1.58, 0.012, 0.02), '#ffffff')
        },
      },
      { shape: s.custom((p) => p.arc(0.5, 1.62, 0.08, 0, Math.PI, false), pts(0.42, 1.62, 0.58, 1.7)), color: '#c9a26b', ink: 0.008 },
      { shape: shade, color: '#c8202f', ink: 0.014, detail: () => s.line([[0.72, 1.92], [0.5, 1.82], [0.72, 1.92], [0.94, 1.82]], 0.006, rgba(INK, 0.5), 0) },
    ])
    s.line([[0.46, 1.5], [0.5, 1.38], [0.54, 1.5]], 0.006, '#f4f1ea', 0)
  } else {
    // A gull keeping watch instead.
    const body = s.ellipse(0.5, 1.3, 0.1, 0.06)
    const gullHead = s.ellipse(0.6, 1.37, 0.04, 0.035)
    paint(s, [
      { shape: body, color: '#f4f1ea', ink: 0.01, detail: () => s.fill(s.ellipse(0.46, 1.32, 0.07, 0.035), '#9aa3ab') },
      { shape: gullHead, color: '#f4f1ea', ink: 0.008, detail: () => s.fill(s.poly(pts(0.63, 1.37, 0.69, 1.36, 0.63, 1.35), 0), '#e6bb4c') },
    ], 0.03)
  }
}

// A sandcastle with a flag on top, and the kid who built it.

export function sandcastle(s: Sketch) {
  const sand = '#e4c690'
  const towers = [0.18, 0.5, 0.82].map((x, i) => {
    const h = i === 1 ? 0.58 : 0.42
    const p: Pt[] = [[x - 0.1, 0], [x + 0.1, 0], [x + 0.1, h]]
    for (let k = 0; k < 3; k++) p.push([x + 0.1 - k * 0.07, h], [x + 0.1 - k * 0.07, h + 0.05], [x + 0.065 - k * 0.07, h + 0.05], [x + 0.065 - k * 0.07, h])
    p.push([x - 0.1, h])
    return s.poly(p, 0.001)
  })
  const wall = s.rect(0.1, 0, 0.8, 0.26, 0.002)
  s.strip([[0.5, 0.63], [0.5, 0.85]], 0.012, 0.025)
  const flag = s.poly(pts(0.5, 0.85, 0.66, 0.8, 0.5, 0.75), 0)
  paint(s, [
    ...towers.map((shape) => ({ shape, color: sand, ink: 0.012, hatch: { angle: 0.9, gap: 0.03, alpha: 0.2 } })),
    {
      shape: wall,
      color: tint(sand, -0.05),
      ink: 0.012,
      detail: () => {
        const gate = s.custom(
          (p) => {
            p.moveTo(0.44, 0)
            p.lineTo(0.44, 0.1)
            p.arc(0.5, 0.1, 0.06, Math.PI, 0, true)
            p.lineTo(0.56, 0)
            p.closePath()
          },
          pts(0.44, 0, 0.56, 0.16)
        )
        s.fill(gate, '#8a6a3a')
        for (const x of [0.25, 0.75]) s.fill(s.ellipse(x, 0.12, 0.025, 0.018), '#f6d0d8')
      },
    },
    { shape: flag, color: '#c8202f', ink: 0.008 },
    ...person(s, 1.15, 0, 0.62, { coat: '#e8587a', hold: 'bucket', skirt: true, hair: '#7a3d22' }),
  ])
  s.strip([[0.02, 0.0], [0.08, 0.3]], 0.02, 0.025, '#3f6fb0')
}

// ---------------------------------------------------------------------------
// The Polar Bear Plunge (winter): swimmers in Santa hats charging into the
// sea, and their banner.

function swimmer(s: Sketch, x: number, H: number, o: { suit: string; skin: string; hair: string; trunks?: boolean }): Part[] {
  const P = (dx: number, y: number): Pt => [x + dx * H, y * H]
  const parts: Part[] = []
  // One leg down, the other knee up mid-stride.
  parts.push({ shape: limb(s, P(-0.05, 0.48), P(-0.07, 0.04), 0.045 * H, 0.035 * H), color: o.skin, ink: 0.01 })
  parts.push({ shape: limb(s, P(0.05, 0.48), P(0.1, 0.3), 0.045 * H, 0.04 * H), color: o.skin, ink: 0.01 })
  parts.push({ shape: limb(s, P(0.1, 0.3), P(0.08, 0.1), 0.04 * H, 0.033 * H), color: o.skin, ink: 0.01 })
  const torso = s.poly([P(-0.13, 0.46), P(0.13, 0.46), P(0.14, 0.8), P(-0.14, 0.8)], 0.001)
  parts.push({ shape: torso, color: o.skin, ink: 0.012 })
  parts.push(
    o.trunks
      ? { shape: s.rect(...P(-0.135, 0.4), 0.27 * H, 0.12 * H, 0.001), color: o.suit, ink: 0.01 }
      : { shape: s.poly([P(-0.135, 0.4), P(0.135, 0.4), P(0.12, 0.76), P(0.05, 0.72), P(-0.05, 0.72), P(-0.12, 0.76)], 0.001), color: o.suit, ink: 0.01 }
  )
  // Arms up, cheering.
  for (const d of [-1, 1]) parts.push({ shape: limb(s, P(d * 0.12, 0.78), P(d * 0.24, 1.02), 0.032 * H, 0.026 * H), color: o.skin, ink: 0.01 })
  const head = s.ellipse(...P(0, 0.9), 0.08 * H, 0.085 * H)
  parts.push({
    shape: head,
    color: o.skin,
    ink: 0.012,
    detail: () => {
      for (const d of [-1, 1]) s.fill(s.ellipse(...P(d * 0.03, 0.91), 0.008 * H, 0.01 * H), INK)
      s.fill(s.ellipse(...P(0, 0.86), 0.03 * H, 0.02 * H), '#8a2a2a')
    },
  })
  // The Santa hat.
  const hat = s.poly([P(-0.09, 0.95), P(0.09, 0.95), P(0.17, 1.1), P(0.02, 1.13)], 0.001)
  parts.push({ shape: hat, color: '#c8202f', ink: 0.01 })
  parts.push({ shape: s.rect(...P(-0.1, 0.93), 0.2 * H, 0.04 * H, 0.001), color: '#f4f1ea', ink: 0.008 })
  parts.push({ shape: s.ellipse(...P(0.18, 1.11), 0.025 * H, 0.025 * H), color: '#f4f1ea', ink: 0.006 })
  return parts
}

export function polarPlunge(s: Sketch) {
  const W = s.w
  const sign = s.rect(0.05, 0.92, 0.7, 0.3, 0.002)
  s.strip([[0.4, 0], [0.4, 0.94]], 0.03, 0.03, '#6e4f3a')
  paint(s, [
    {
      shape: sign,
      color: '#f4f1ea',
      ink: 0.014,
      detail: () => {
        s.text('POLAR BEAR', 0.4, 1.08, 0.075, { color: '#2f4f8a', font: SANS, spacing: 1 })
        s.text('CLUB', 0.4, 0.97, 0.075, { color: '#2f4f8a', font: SANS, spacing: 3 })
      },
    },
    ...swimmer(s, 0.95, 1.0, { suit: '#c8202f', skin: C.skin, hair: '#3b2a24', trunks: true }),
    ...swimmer(s, 1.42, 0.92, { suit: '#2f4f8a', skin: '#c99772', hair: '#1f1a18' }),
    ...swimmer(s, 1.9, 1.05, { suit: '#18a558', skin: '#8d5a3c', hair: '#1f1a18', trunks: true }),
    ...swimmer(s, W - 0.3, 0.88, { suit: '#e8587a', skin: C.skin, hair: '#c9a26b' }),
  ])
}

// A beachcomber with a metal detector, sweeping for lost rings (out of
// season).

export function beachcomber(s: Sketch) {
  const x = 0.4
  const H = 1.1
  paint(s, person(s, x, 0, H, { coat: '#6d7a8c', hat: 'beanie', legs: '#4f5a48' }), 0.04)
  const hand: Pt = [x + H * 0.2, H * 0.42]
  s.strip([hand, [1.0, 0.08]], 0.016, 0.03, '#2c2a30')
  const disc = s.ellipse(1.04, 0.05, 0.11, 0.035)
  s.border([disc], 0.03)
  s.fill(disc, '#2c2a30')
  s.ink(disc, 0.008)
  // Headphones on, listening for the beep.
  const hy = H * 0.88
  s.line(
    Array.from({ length: 9 }, (_, k): Pt => {
      const a = Math.PI * (k / 8)
      return [x + Math.cos(a) * H * 0.095, hy + Math.sin(a) * H * 0.095]
    }),
    0.012,
    '#2c2a30',
    0
  )
  for (const d of [-1, 1]) {
    const cup = s.ellipse(x + d * H * 0.09, hy, H * 0.025, H * 0.035)
    s.fill(cup, '#2c2a30')
  }
}

// ---------------------------------------------------------------------------
// The surf: a strip of curling waves along the front of the page.

export function surf(s: Sketch) {
  const W = s.w
  const n = Math.round(W / 0.55)
  const waves = s.custom(
    (p) => {
      p.moveTo(0.02, 0)
      p.lineTo(W - 0.02, 0)
      for (let k = n; k > 0; k--) {
        const x1 = (W * k) / n
        const x0 = (W * (k - 1)) / n
        const crest = 0.3 + 0.06 * Math.sin(k * 1.7)
        p.lineTo(x1, 0.18)
        p.quadraticCurveTo(x1 - 0.12, crest + 0.08, (x0 + x1) / 2, crest)
        p.quadraticCurveTo(x0 + 0.04, crest - 0.06, x0, 0.18)
      }
      p.closePath()
    },
    pts(0.02, 0, W - 0.02, 0.42)
  )
  paint(s, [
    {
      shape: waves,
      color: C.waterDeep,
      ink: 0.016,
      detail: () => {
        // Foam along each crest, and lighter water in the troughs.
        for (let k = 0; k < n; k++) {
          const x0 = (W * k) / n
          const x1 = (W * (k + 1)) / n
          const crest = 0.3 + 0.06 * Math.sin((k + 1) * 1.7)
          s.line([[x0 + 0.06, 0.2], [(x0 + x1) / 2, crest - 0.02], [x1 - 0.08, crest + 0.02]], 0.03, 'rgba(255,255,255,0.85)', 0)
          s.fill(s.ellipse((x0 + x1) / 2, 0.1, 0.18, 0.04), 'rgba(185,214,221,0.6)')
        }
      },
    },
  ])
}
