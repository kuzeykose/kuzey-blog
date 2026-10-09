import { INK, Pt, Shape, Sketch, rgba, tint } from './sketch'
import { C } from './palette'
import { Part, awning, paint, pts, waterTower } from './art-common'
import { crown, person } from './art-street'

// Art for the Williamsburg spread: the waterfront looking west across the
// East River to Manhattan at sunset, and Bedford Avenue behind it.

const SANS = 'Helvetica, Arial, sans-serif'

// ---------------------------------------------------------------------------
// The Williamsburg Bridge: open steel-lattice towers, cables straight down
// to the shore either side, a deep truss, and a J train crossing.

export function williamsburgBridge(s: Sketch) {
  const W = s.w
  const red = '#a8332e'
  const grey = '#5d6168'
  const deckY = 1.0
  const truss = 0.36
  const towers = [W * 0.27, W * 0.73]
  const top = 3.2
  const cable = (x: number) => {
    const [a, b] = towers
    if (x < a) return 1.4 + ((top - 1.4) * x) / a
    if (x > b) return 1.4 + ((top - 1.4) * (W - x)) / (W - b)
    const u = (x - (a + b) / 2) / ((b - a) / 2)
    return 1.5 + (top - 1.5) * u * u
  }
  for (let x = 0.15; x < W - 0.1; x += 0.15) {
    if (towers.some((t) => Math.abs(x - t) < 0.4)) continue
    s.strip([[x, deckY + truss], [x, cable(x)]], 0.007, 0.022)
  }
  const line: Pt[] = []
  for (let x = 0.02; x <= W - 0.02; x += 0.05) line.push([x, cable(x)])
  s.strip(line, 0.035, 0.04, '#3a3a40')
  // Each tower is an open frame: two tapering legs, struts and X-bracing.
  for (const t of towers) {
    const leg = (d: number): Pt[] => [
      [t + d * 0.34, 0],
      [t + d * 0.2, top],
    ]
    for (const d of [-1, 1]) s.strip(leg(d), 0.07, 0.04, red)
    for (let y = 0.3; y < top - 0.2; y += 0.48) {
      const half = (yy: number) => 0.34 - (0.14 * yy) / top
      s.strip([[t - half(y), y], [t + half(y), y]], 0.03, 0.03, red)
      s.strip([[t - half(y), y], [t + half(y + 0.48), y + 0.48]], 0.016, 0.025, red)
      s.strip([[t + half(y), y], [t - half(y + 0.48), y + 0.48]], 0.016, 0.025, red)
    }
    const cap = s.rect(t - 0.26, top - 0.05, 0.52, 0.16, 0.002)
    paint(s, [{ shape: cap, color: red, ink: 0.014 }], 0.04)
    const lamp = s.ellipse(t, top + 0.2, 0.035, 0.035)
    s.strip([[t, top + 0.1], [t, top + 0.17]], 0.012, 0.025)
    s.fill(lamp, '#ff4a50')
    s.glow(lamp, '#ff4a50')
  }
  const deck = s.rect(0.05, deckY, W - 0.1, truss, 0.002)
  const piers = [0.35, W - 0.35].map((x) => s.rect(x - 0.12, 0, 0.24, deckY, 0.002))
  paint(s, [
    ...piers.map((shape) => ({ shape, color: '#a89c88', ink: 0.016, hatch: { angle: 1.2, gap: 0.035, alpha: 0.25 } })),
    {
      shape: deck,
      color: grey,
      ink: 0.02,
      detail: () => {
        for (let x = 0.05; x < W - 0.1; x += 0.18) {
          s.line([[x, deckY], [x + 0.18, deckY + truss]], 0.008, rgba(INK, 0.5), 0)
          s.line([[x + 0.18, deckY], [x, deckY + truss]], 0.008, rgba(INK, 0.5), 0)
        }
        // A J train rattling over to Delancey Street.
        const train = s.rect(W * 0.4, deckY + 0.07, 1.4, 0.22, 0)
        s.fill(train, '#c9d1d6')
        s.ink(train, 0.01)
        s.windows(W * 0.4 + 0.08, deckY + 0.14, 11, 1, 0.08, 0.08, 0.04, 0, { color: '#3d4a63', lit: 0.9, frame: false })
        const bullet = s.ellipse(W * 0.4 + 0.1, deckY + 0.18, 0.04, 0.04)
        s.fill(bullet, '#996633')
        s.glow(bullet, '#996633')
        s.text('J', W * 0.4 + 0.1, deckY + 0.16, 0.05, { color: '#ffffff', font: SANS })
      },
    },
  ])
}

// ---------------------------------------------------------------------------
// The Domino Sugar Refinery: soot-dark brick, the chimney with its name down
// the side, and the yellow DOMINO SUGAR sign on the roof.

export function dominoRefinery(s: Sketch) {
  const W = s.w
  const brick = '#9a4f38'
  const block = s.rect(0.3, 0, W - 0.35, 3.0, 0.003)
  const chimney = s.poly(pts(0.04, 0, 0.42, 0, 0.36, 4.1, 0.1, 4.1), 0.002)
  const sign = s.rect(0.45, 3.06, W - 0.6, 0.86, 0.002)
  for (const x of [0.55, W - 0.25]) s.strip([[x, 2.98], [x, 3.1]], 0.03, 0.03, '#2c2a30')
  paint(s, [
    {
      shape: block,
      color: brick,
      ink: 0.022,
      detail: () => {
        for (let y = 0.1; y < 3.0; y += 0.06) s.line([[0.31, y], [W - 0.06, y]], 0.004, rgba(INK, 0.15), 0)
        s.windows(0.45, 0.25, 5, 4, 0.2, 0.42, 0.13, 0.27, { arch: true, lit: 0.5, color: '#2f3a4a' })
        s.fill(s.rect(0.3, 2.82, W - 0.35, 0.1, 0), tint(brick, -0.2))
      },
    },
    {
      shape: chimney,
      color: tint(brick, -0.1),
      ink: 0.02,
      detail: () => {
        'DOMINO'.split('').forEach((ch, i) => s.text(ch, 0.23, 3.55 - i * 0.3, 0.2, { color: '#f4f1ea', font: SANS }))
        s.fill(s.rect(0.1, 3.95, 0.26, 0.08, 0), '#2c2a30')
      },
    },
    {
      shape: sign,
      color: '#2c2a30',
      flat: true,
      ink: 0.014,
      detail: () => {
        // The steel frame behind the letters.
        for (let x = 0.5; x < W - 0.15; x += 0.16) s.line([[x, 3.08], [x, 3.9]], 0.008, rgba('#8d979e', 0.5), 0)
        s.text('DOMINO', 0.45 + (W - 0.6) / 2, 3.5, 0.36, { color: '#f7c531', glow: '#ffd23f', font: 'Georgia, serif', weight: '900' })
        s.text('SUGAR', 0.45 + (W - 0.6) / 2, 3.13, 0.24, { color: '#f7c531', glow: '#ffd23f', font: 'Georgia, serif', weight: '900', spacing: 6 })
      },
    },
  ])
}

// ---------------------------------------------------------------------------
// Domino Park: the old syrup tanks, the raised yellow walkway along the
// crane rails, a taco stand under it and a couple of trees.

export const DOMINO_CROWNS: [number, number, number][] = [[2.55, 1.12, 0.2]]

export function dominoPark(s: Sketch) {
  const W = s.w
  const yellow = '#f2b632'
  const tree = DOMINO_CROWNS[0]
  s.strip([[tree[0], 0.08], [tree[0], tree[1] - 0.1]], 0.06, 0.04, '#6e4f3a')
  crown(s, [tree, [tree[0] - 0.16, tree[1] - 0.1, 0.16], [tree[0] + 0.16, tree[1] - 0.08, 0.15]], ['#d98b3c', 'rgba(150,70,20,0.5)'])
  const tanks = [0.2, 0.52].map((x) => s.rect(x - 0.15, 0.08, 0.3, 0.72, 0.002))
  paint(s, [
    ...tanks.map((shape) => ({
      shape,
      color: '#8a5a3c',
      ink: 0.016,
      detail: () => {
        for (let y = 0.2; y < 0.8; y += 0.14) s.fill(s.rect(shape.minX, y, 0.3, 0.025, 0), tint('#8a5a3c', -0.25))
        s.hatch(shape, { angle: 1.3, gap: 0.03, alpha: 0.25 })
      },
    })),
  ])
  // The walkway on its gantry legs.
  for (let x = 0.85; x < W - 0.15; x += 0.42) {
    s.strip([[x, 0.08], [x, 0.86]], 0.04, 0.035, yellow)
    s.strip([[x, 0.1], [x + 0.42, 0.84]], 0.014, 0.025, yellow)
  }
  const walk = s.rect(0.75, 0.84, W - 0.85, 0.09, 0.001)
  const stand = s.rect(1.35, 0.08, 0.5, 0.36, 0.001)
  const lawn = s.custom(
    (p) => {
      p.moveTo(0.02, 0)
      p.lineTo(W - 0.02, 0)
      p.lineTo(W - 0.02, 0.1)
      p.quadraticCurveTo(W * 0.5, 0.18, 0.02, 0.1)
      p.closePath()
    },
    pts(0.02, 0, W - 0.02, 0.14)
  )
  paint(s, [
    { shape: walk, color: yellow, ink: 0.014 },
    {
      shape: stand,
      color: '#f4f1ea',
      ink: 0.012,
      detail: () => {
        const hatch = s.rect(1.42, 0.2, 0.36, 0.14, 0)
        s.fill(hatch, '#3d4a63')
        s.glow(hatch, '#ffc873')
        s.text('TACOS', 1.6, 0.11, 0.06, { color: C.redDark, font: SANS })
      },
    },
    awning(s, 1.35, 0.44, 0.5, '#2f8a5b'),
    { shape: lawn, color: '#8dbb6c', ink: 0.014 },
  ])
  s.strip([[0.75, 1.04], [W - 0.1, 1.04]], 0.012, 0.025, yellow)
  // People strolling along the walkway.
  paint(
    s,
    [
      ...person(s, 1.15, 0.93, 0.36, { coat: '#3f6fb0' }),
      ...person(s, 1.45, 0.93, 0.34, { coat: '#e8587a', skirt: true }),
      ...person(s, 2.05, 0.93, 0.36, { coat: '#18a558', rainy: true }),
    ],
    0.03
  )
}

// ---------------------------------------------------------------------------
// Smorgasburg on a Saturday: food stalls under white tents, a crowd, and
// the banner on its poles. (Spring to autumn.)

export function smorgasburg(s: Sketch) {
  const W = s.w
  for (const x of [0.15, W - 0.15]) s.strip([[x, 0], [x, 1.42]], 0.03, 0.03, '#3a3a40')
  const banner = s.rect(0.1, 1.24, W - 0.2, 0.2, 0.001)
  const stalls: [string, string][] = [
    ['RAMEN', '#c8202f'],
    ['TACOS', '#18a558'],
    ['DONUTS', '#e8587a'],
    ['BBQ', '#3a3a40'],
  ]
  const sw = (W - 0.5) / stalls.length
  const parts: Part[] = []
  stalls.forEach(([name, color], i) => {
    const x = 0.25 + i * sw
    const roof = s.poly(pts(x - 0.02, 0.86, x + sw - 0.06, 0.86, x + sw - 0.18, 1.06, x + 0.1, 1.06), 0.002)
    const counter = s.rect(x + 0.04, 0.22, sw - 0.14, 0.3, 0.001)
    for (const px of [x + 0.03, x + sw - 0.09]) s.strip([[px, 0.2], [px, 0.87]], 0.014, 0.025, '#8d979e')
    parts.push({
      shape: counter,
      color,
      ink: 0.012,
      detail: () => {
        s.fill(s.rect(x + 0.04, 0.46, sw - 0.14, 0.06, 0), '#f4f1ea')
        // The cook behind it.
        s.fill(s.ellipse(x + sw / 2 - 0.05, 0.62, 0.05, 0.055), C.skin)
        s.fill(s.rect(x + sw / 2 - 0.1, 0.52, 0.1, 0.07, 0), '#f4f1ea')
      },
    })
    parts.push({
      shape: roof,
      color: '#fbf8f0',
      ink: 0.014,
      detail: () => {
        s.fill(s.rect(x - 0.02, 0.86, sw - 0.04, 0.06, 0), color)
        s.text(name, x + sw / 2 - 0.04, 0.95, 0.06, { color: INK, font: SANS })
      },
    })
  })
  parts.push({
    shape: banner,
    color: '#f4f1ea',
    flat: true,
    ink: 0.012,
    detail: () => s.text('SMORGASBURG', W / 2, 1.29, 0.11, { color: '#1d1c24', glow: '#5a5a5a', font: SANS, spacing: 4 }),
  })
  paint(s, parts)
  // String lights between the tents.
  const bulbs: Pt[] = []
  for (let k = 0; k <= 24; k++) {
    const t = k / 24
    bulbs.push([0.15 + t * (W - 0.3), 1.18 - Math.abs(Math.sin(t * Math.PI * 4)) * 0.08])
  }
  s.line(bulbs, 0.005, rgba(INK, 0.6), 0)
  bulbs.forEach(([x, y]) => {
    const bulb = s.ellipse(x, y - 0.012, 0.014, 0.014)
    s.fill(bulb, '#fff1c4')
    s.glow(bulb, '#ffd27a')
  })
  // The crowd, eating as they go.
  paint(
    s,
    [
      ...person(s, 0.3, 0, 0.68, { coat: '#3f6fb0', hold: 'icecream', rainy: true }),
      ...person(s, 0.7, 0, 0.72, { coat: '#f7c948', hold: 'sandwich', hair: '#7a3d22' }),
      ...person(s, 1.12, 0, 0.66, { coat: '#7b2fbf', skirt: true, hold: 'coffee', skin: '#8d5a3c' }),
      ...person(s, 1.55, 0, 0.74, { coat: '#e0703f', hat: 'beanie', hold: 'phone' }),
      ...person(s, 2.25, 0, 0.7, { coat: '#4f8a8b', skirt: true, hold: 'icecream', rainy: true }),
      ...person(s, 2.7, 0, 0.72, { coat: '#f4f1ea', hold: 'sandwich', skin: '#c99772' }),
      ...person(s, 3.1, 0, 0.6, { coat: '#e8364f', hold: 'balloon', hat: 'beanie' }),
    ],
    0.035
  )
}

// A Christmas tree stand on the sidewalk in winter: firs leaning on their
// rack under the lights, the seller's hut, and a tree going home.

export function treeStand(s: Sketch) {
  const W = s.w
  for (const x of [0.12, 2.0]) s.strip([[x, 0], [x, 1.25]], 0.035, 0.035, '#6e4f3a')
  s.strip([[0.12, 1.2], [2.0, 1.2]], 0.03, 0.035, '#6e4f3a')
  const firs: Shape[] = []
  for (let k = 0; k < 7; k++) {
    const x = 0.28 + k * 0.25
    const h = 0.8 + ((k * 7) % 3) * 0.13
    const lean = (k % 2 ? 1 : -1) * 0.04
    firs.push(s.poly(pts(x - 0.14, 0.05, x + 0.14, 0.05, x + lean + 0.02, h, x + lean - 0.02, h), 0.003))
  }
  const hut = s.rect(2.15, 0, 0.75, 0.95, 0.002)
  const roof = s.poly(pts(2.08, 0.93, W - 0.03, 0.93, W - 0.12, 1.12, 2.17, 1.12), 0.002)
  const sign = s.rect(2.2, 0.62, 0.65, 0.2, 0.001)
  paint(s, [
    ...firs.map((shape) => ({ shape, color: '#2f6a45', ink: 0.014, hatch: { angle: 0.9, gap: 0.03, alpha: 0.3 } })),
    {
      shape: hut,
      color: '#8a5a3c',
      ink: 0.016,
      detail: () => {
        for (let x = 2.2; x < W - 0.1; x += 0.1) s.line([[x, 0.02], [x, 0.92]], 0.005, rgba(INK, 0.35), 0)
        const win = s.rect(2.3, 0.2, 0.3, 0.3, 0)
        s.fill(win, '#3d4a63')
        s.glow(win, '#ffc873')
      },
    },
    { shape: roof, color: '#c8202f', ink: 0.014 },
    {
      shape: sign,
      color: '#f4f1ea',
      flat: true,
      ink: 0.01,
      detail: () => {
        s.text('XMAS TREES', 2.525, 0.69, 0.065, { color: '#2f6a45', font: SANS, glow: '#a8c8a0' })
      },
    },
  ])
  // Lights along the rack.
  const bulbs: Pt[] = []
  for (let k = 0; k <= 16; k++) bulbs.push([0.12 + (k / 16) * 1.88, 1.16 - Math.abs(Math.sin((k / 16) * Math.PI * 3)) * 0.07])
  s.line(bulbs, 0.005, rgba(INK, 0.6), 0)
  bulbs.forEach(([x, y], k) => {
    const bulb = s.ellipse(x, y - 0.012, 0.016, 0.016)
    const c = ['#ffd27a', '#ff6b6b', '#7fd0ff', '#9be38a'][k % 4]
    s.fill(bulb, c)
    s.glow(bulb, c)
  })
  // The seller, and someone carrying a tree home on their shoulder.
  const netted = s.poly(pts(1.55, 0.72, 2.25, 0.86, 2.25, 0.98, 1.55, 0.8), 0.002)
  paint(
    s,
    [
      ...person(s, 2.0, 0, 0.82, { coat: '#b03a32', hat: 'beanie' }),
      ...person(s, 1.75, 0, 0.78, { coat: '#3f6fb0', hair: '#7a3d22' }),
      { shape: netted, color: '#2f6a45', ink: 0.012, hatch: { angle: 0.6, gap: 0.025, alpha: 0.4 } },
    ],
    0.035
  )
}

// ---------------------------------------------------------------------------
// The Wythe Hotel: a brick cooperage turned hotel, its name in white on
// the roof and the glass rooftop bar strung with lights.

export function wytheHotel(s: Sketch) {
  const W = s.w
  const brick = '#a8573f'
  const block = s.rect(0.05, 0, W - 0.1, 2.95, 0.003)
  const bar = s.rect(0.75, 2.95, W - 0.85, 0.42, 0.002)
  const sign = s.rect(0.15, 3.42, W - 0.3, 0.36, 0.001)
  for (const x of [0.3, W - 0.3]) s.strip([[x, 3.3], [x, 3.45]], 0.025, 0.03, '#2c2a30')
  paint(s, [
    {
      shape: block,
      color: brick,
      ink: 0.022,
      detail: () => {
        for (let y = 0.1; y < 2.9; y += 0.06) s.line([[0.06, y], [W - 0.06, y]], 0.004, rgba(INK, 0.15), 0)
        s.windows(0.2, 0.3, 4, 5, 0.26, 0.34, 0.2, 0.18, { arch: true, lit: 0.6 })
        const door = s.rect(W / 2 - 0.2, 0, 0.4, 0.26, 0)
        s.fill(door, '#3a2c26')
        s.glow(door, '#ffc873')
      },
    },
    ...waterTower(s, 0.18, 2.95, 1.1),
    {
      shape: bar,
      color: '#9fc9e6',
      ink: 0.016,
      detail: () => {
        s.glow(bar, '#8a6a3a')
        for (let x = 0.85; x < W - 0.1; x += 0.2) {
          s.line([[x, 2.96], [x, 3.36]], 0.008, rgba(INK, 0.5), 0)
          s.glow(s.rect(x - 0.008, 2.96, 0.016, 0.4, 0), '#000')
        }
        for (let x = 0.9; x < W - 0.15; x += 0.24) {
          const head = s.ellipse(x, 3.12, 0.035, 0.04)
          s.fill(head, rgba(INK, 0.7))
          s.glow(head, '#000')
        }
      },
    },
    {
      shape: sign,
      color: '#2c2a30',
      flat: true,
      ink: 0.012,
      detail: () => s.text('WYTHE HOTEL', W / 2, 3.5, 0.2, { color: '#f4f1ea', glow: '#fff6dc', font: SANS, weight: '900', spacing: 2 }),
    },
  ])
}

// ---------------------------------------------------------------------------
// Bedford Avenue shopfronts: records, vintage clothes and a coffee bar,
// lofts upstairs and a water tower on the roof.

export function shopRow(s: Sketch) {
  const W = s.w
  const front = s.rect(0.05, 0, W - 0.1, 1.6, 0.003)
  const shops: [string, string][] = [
    ['VINYL', '#2f5a3a'],
    ['VINTAGE', '#d9a650'],
    ['COFFEE', '#f4f1ea'],
  ]
  const sw = (W - 0.1) / shops.length
  paint(s, [
    ...waterTower(s, W - 0.75, 1.6, 1.2),
    {
      shape: front,
      color: C.brick,
      ink: 0.022,
      detail: () => {
        s.windows(0.2, 0.92, 7, 1, 0.3, 0.42, 0.13, 0, { lit: 0.6 })
        // Tags sprayed along the bottom.
        const tag = s.ctx
        tag.save()
        tag.lineWidth = 0.02
        for (let i = 0; i < 9; i++) {
          tag.strokeStyle = ['#e8364f', '#3f6fb0', '#f7c948', '#18a558', '#f4f1ea'][i % 5]
          const x = s.r(0.2, W - 0.3)
          tag.beginPath()
          tag.moveTo(x, 0.62)
          tag.bezierCurveTo(x + 0.06, 0.72, x + 0.1, 0.56, x + 0.16, 0.66)
          tag.stroke()
        }
        tag.restore()
      },
    },
    ...shops.flatMap(([name, color], i): Part[] => {
      const x = 0.05 + i * sw
      const win = s.rect(x + 0.1, 0.06, sw - 0.42, 0.44, 0)
      const doorway = s.rect(x + sw - 0.28, 0, 0.2, 0.52, 0)
      return [
        {
          shape: s.rect(x + 0.04, 0, sw - 0.08, 0.6, 0.001),
          color,
          ink: 0.014,
          detail: () => {
            s.fill(win, '#3d4a63')
            s.glow(win, '#ffc873')
            s.fill(doorway, '#3a2c26')
            s.glow(doorway, '#7a5a34')
            if (name === 'VINYL') {
              // Records on show.
              for (let k = 0; k < 3; k++) {
                const rec = s.ellipse(x + 0.22 + k * 0.17, 0.27, 0.075, 0.075)
                s.fill(rec, '#1d1c24')
                s.fill(s.ellipse(x + 0.22 + k * 0.17, 0.27, 0.025, 0.025), ['#e8364f', '#f7c948', '#7fd0ff'][k])
                s.glow(rec, '#000')
              }
            } else if (name === 'VINTAGE') {
              // A dress on a dummy, and a rail of clothes.
              const dress = s.poly(pts(x + 0.24, 0.08, x + 0.42, 0.08, x + 0.36, 0.36, x + 0.3, 0.36), 0)
              s.fill(dress, '#c8202f')
              s.glow(dress, '#000')
              s.fill(s.ellipse(x + 0.33, 0.41, 0.035, 0.04), '#e6d8bb')
              for (let k = 0; k < 4; k++) s.fill(s.rect(x + 0.5 + k * 0.06, 0.12, 0.05, 0.26, 0), ['#3f6fb0', '#f7c948', '#18a558', '#7b2fbf'][k])
            } else {
              // The espresso machine's gleam, and a cup on the sill.
              s.fill(s.rect(x + 0.25, 0.2, 0.22, 0.14, 0), '#c9d1d6')
              s.fill(s.rect(x + 0.55, 0.08, 0.05, 0.07, 0), '#f4ecdc')
            }
          },
        },
        awning(s, x + 0.08, 0.6, sw - 0.16, name === 'VINYL' ? '#2f5a3a' : name === 'VINTAGE' ? '#c8202f' : '#3a3a40'),
        {
          shape: s.rect(x + 0.18, 0.78, sw - 0.36, 0.12, 0.001),
          color: '#1d1c24',
          flat: true,
          ink: 0.008,
          detail: () => s.text(name, x + sw / 2, 0.8, 0.075, { color: '#f4f1ea', glow: '#ffe2a3', font: SANS, spacing: 3 }),
        },
      ]
    }),
  ])
}

// ---------------------------------------------------------------------------
// A mural wall: a painted face, bubble letters and a bird in flight.

export function muralWall(s: Sketch) {
  const W = s.w
  const wall = s.rect(0.05, 0, W - 0.1, 1.55, 0.003)
  paint(s, [
    {
      shape: wall,
      color: '#3f6fb0',
      ink: 0.02,
      detail: () => {
        const c = s.ctx
        c.save()
        c.clip(wall.path)
        // Sunburst stripes.
        for (let k = 0; k < 12; k++) {
          c.fillStyle = k % 2 ? '#f7c948' : '#e8587a'
          c.beginPath()
          c.moveTo(W * 0.32, 0.7)
          const a0 = (k / 12) * Math.PI * 2
          const a1 = ((k + 0.5) / 12) * Math.PI * 2
          c.lineTo(W * 0.32 + Math.cos(a0) * 2, 0.7 + Math.sin(a0) * 2)
          c.lineTo(W * 0.32 + Math.cos(a1) * 2, 0.7 + Math.sin(a1) * 2)
          c.closePath()
          c.fill()
        }
        c.restore()
        // The face.
        const face = s.ellipse(W * 0.32, 0.72, 0.36, 0.42)
        s.fill(face, '#18a558')
        s.ink(face, 0.016)
        for (const d of [-1, 1]) {
          s.fill(s.ellipse(W * 0.32 + d * 0.13, 0.82, 0.08, 0.06), '#f4f1ea')
          s.fill(s.ellipse(W * 0.32 + d * 0.13, 0.82, 0.035, 0.04), INK)
        }
        s.line([[W * 0.32 - 0.14, 0.52], [W * 0.32, 0.46], [W * 0.32 + 0.14, 0.52]], 0.025, '#c8202f', 0)
        // Bubble letters.
        s.text('BKLYN', W * 0.72, 0.6, 0.34, { color: '#f4f1ea', font: 'Arial Black, Helvetica, sans-serif', weight: '900' })
        s.text('BKLYN', W * 0.72 - 0.015, 0.615, 0.34, { color: '#e8364f', font: 'Arial Black, Helvetica, sans-serif', weight: '900' })
        // A bird in flight.
        s.line([[W * 0.62, 1.2], [W * 0.68, 1.27], [W * 0.73, 1.22], [W * 0.78, 1.29], [W * 0.84, 1.21]], 0.03, '#f4f1ea', 0)
      },
    },
  ])
}

// ---------------------------------------------------------------------------
// Buskers on the corner: a guitarist, a drummer on upturned buckets, and the
// open case.

export function buskers(s: Sketch) {
  const guitarist = person(s, 0.45, 0, 1.05, { coat: '#5a6e4a', hat: 'beanie', hair: '#5b3a24' })
  const drummer = person(s, 1.18, 0, 0.92, { coat: '#2f4566', skin: '#8d5a3c', hair: '#1f1a18' })
  paint(s, [...guitarist, ...drummer], 0.04)
  // The guitar across the guitarist.
  const body = s.custom(
    (p) => {
      p.ellipse(0.5, 0.44, 0.1, 0.075, -0.5, 0, Math.PI * 2)
      p.ellipse(0.42, 0.5, 0.07, 0.055, -0.5, 0, Math.PI * 2)
    },
    pts(0.34, 0.36, 0.6, 0.56)
  )
  s.strip([[0.4, 0.53], [0.2, 0.76]], 0.03, 0.03, '#5a3d2e')
  paint(
    s,
    [
      { shape: body, color: '#c98a4a', ink: 0.012, detail: () => s.fill(s.ellipse(0.47, 0.47, 0.026, 0.022), '#3a2c26') },
      // Two buckets, upside down.
      ...[1.05, 1.32].map((x) => ({ shape: s.poly(pts(x - 0.11, 0.0, x + 0.11, 0.0, x + 0.09, 0.3, x - 0.09, 0.3), 0.001), color: '#f0782a', ink: 0.012 })),
      // The open case with a few coins.
      {
        shape: s.rect(0.08, 0, 0.34, 0.08, 0.001),
        color: '#1d1c24',
        ink: 0.01,
        detail: () => {
          s.fill(s.rect(0.11, 0.02, 0.28, 0.05, 0), '#a8222e')
          for (const x of [0.17, 0.24, 0.32]) s.fill(s.ellipse(x, 0.05, 0.015, 0.012), '#e6bb4c')
        },
      },
    ],
    0.035
  )
  // Sticks, and the music going up.
  s.strip([[1.0, 0.55], [1.08, 0.32]], 0.012, 0.025, '#e6d8bb')
  s.strip([[1.36, 0.55], [1.3, 0.32]], 0.012, 0.025, '#e6d8bb')
  s.text('♪', 0.85, 1.05, 0.16, { color: INK })
  s.text('♫', 1.45, 1.15, 0.14, { color: INK })
}

// Hipsters on Bedford Avenue: a beard and a flannel shirt, a film camera,
// and a French bulldog.

export function hipsters(s: Sketch) {
  const he = person(s, 0.42, 0, 1.15, { coat: '#b03a32', hat: 'beanie', hold: 'coffee', hair: '#5b3a24' })
  const she = person(s, 0.95, 0, 1.05, { coat: '#d9a650', skirt: true, hat: 'beret', hair: '#2d2420', rainy: true, brolly: '#1f1c22' })
  paint(s, [...he, ...she], 0.045)
  // His flannel check and beard; her round glasses and camera.
  const shirt = he.find((part) => part.color === '#b03a32')!.shape
  const c = s.ctx
  c.save()
  c.clip(shirt.path)
  c.strokeStyle = 'rgba(30,20,20,0.35)'
  c.lineWidth = 0.012
  for (let x = 0.27; x < 0.6; x += 0.06) {
    c.beginPath()
    c.moveTo(x, 0.34)
    c.lineTo(x, 0.88)
    c.stroke()
  }
  for (let y = 0.38; y < 0.88; y += 0.06) {
    c.beginPath()
    c.moveTo(0.27, y)
    c.lineTo(0.58, y)
    c.stroke()
  }
  c.restore()
  const beard = s.custom(
    (p) => {
      p.moveTo(0.36, 1.0)
      p.quadraticCurveTo(0.42, 0.86, 0.48, 1.0)
      p.closePath()
    },
    pts(0.36, 0.86, 0.48, 1.0)
  )
  s.fill(beard, '#5b3a24')
  s.ink(beard, 0.008)
  for (const d of [-1, 1]) {
    const lens = s.ellipse(0.95 + d * 0.027, 0.925, 0.024, 0.024)
    s.ink(lens, 0.008)
  }
  s.line([[0.88, 0.85], [0.95, 0.72], [1.02, 0.85]], 0.008, INK, 0)
  const cam = s.rect(0.9, 0.62, 0.1, 0.07, 0)
  s.fill(cam, '#1d1c24')
  s.fill(s.ellipse(0.95, 0.655, 0.022, 0.022), '#8d979e')
  // The tote on his shoulder.
  const tote = s.rect(0.2, 0.4, 0.16, 0.2, 0.001)
  s.border([tote], 0.03)
  s.fill(tote, '#efe2c4')
  s.ink(tote, 0.01)
  s.text('BK', 0.28, 0.46, 0.06, { color: INK, font: SANS })
  // The Frenchie.
  const X = 1.3
  const dog = s.custom(
    (p) => {
      p.moveTo(X - 0.12, 0.04)
      p.lineTo(X - 0.12, 0.16)
      p.quadraticCurveTo(X - 0.1, 0.22, X, 0.21)
      p.lineTo(X + 0.06, 0.21)
      p.lineTo(X + 0.05, 0.27)
      p.lineTo(X + 0.08, 0.25)
      p.lineTo(X + 0.11, 0.29)
      p.lineTo(X + 0.13, 0.23)
      p.quadraticCurveTo(X + 0.16, 0.18, X + 0.13, 0.14)
      p.lineTo(X + 0.08, 0.13)
      p.lineTo(X + 0.08, 0.04)
      p.lineTo(X + 0.04, 0.04)
      p.lineTo(X + 0.03, 0.11)
      p.lineTo(X - 0.06, 0.11)
      p.lineTo(X - 0.07, 0.04)
      p.closePath()
    },
    pts(X - 0.12, 0.04, X + 0.16, 0.29)
  )
  paint(s, [{ shape: dog, color: '#d9b48a', ink: 0.01, detail: () => s.fill(s.ellipse(X + 0.1, 0.2, 0.01, 0.01), INK) }], 0.03)
}

