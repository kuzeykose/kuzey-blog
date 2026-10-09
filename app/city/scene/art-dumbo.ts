import { INK, Pt, Sketch, rgba, shade } from './sketch'
import { C } from './palette'
import { Part, awning, paint, pts } from './art-common'
import { blobs, person } from './art-street'

// Art for the DUMBO spread: the waterfront between the two bridges,
// looking across the East River to Manhattan.

const SANS = 'Helvetica, Arial, sans-serif'

// ---------------------------------------------------------------------------
// The Manhattan Bridge: blue steel towers, cables sweeping between them,
// a deep stiffening truss, and a subway train crossing on the lower deck.

export function manhattanBridge(s: Sketch) {
  const W = s.w
  const steel = '#6f8fa8'
  const deckY = 1.0
  const truss = 0.32
  const towers = [W * 0.28, W * 0.72]
  const top = 3.25
  const cable = (x: number) => {
    const [a, b] = towers
    if (x < a) return 1.55 + ((top - 1.55) * x) / a
    if (x > b) return 1.55 + ((top - 1.55) * (W - x)) / (W - b)
    const u = (x - (a + b) / 2) / ((b - a) / 2)
    return 1.45 + (top - 1.45) * u * u
  }
  // Suspenders, then the cables.
  for (let x = 0.15; x < W - 0.1; x += 0.14) {
    if (towers.some((t) => Math.abs(x - t) < 0.22)) continue
    s.strip([[x, deckY + truss], [x, cable(x)]], 0.007, 0.022)
  }
  const line: Pt[] = []
  for (let x = 0.02; x <= W - 0.02; x += 0.05) line.push([x, cable(x)])
  s.strip(line, 0.035, 0.04, shade(steel, -0.15))
  const deck = s.rect(0.05, deckY, W - 0.1, truss, 0.002)
  const legs = towers.flatMap((t) => [-1, 1].map((d) => s.rect(t + d * 0.2 - 0.07, 0, 0.14, top, 0.002)))
  const crowns = towers.map((t) =>
    s.custom(
      (p) => {
        p.moveTo(t - 0.32, top - 0.1)
        p.lineTo(t + 0.32, top - 0.1)
        p.lineTo(t + 0.3, top + 0.12)
        p.quadraticCurveTo(t, top + 0.32, t - 0.3, top + 0.12)
        p.closePath()
      },
      pts(t - 0.32, top - 0.1, t + 0.32, top + 0.32)
    )
  )
  paint(s, [
    {
      shape: deck,
      color: steel,
      ink: 0.02,
      detail: () => {
        // The truss's lattice, and a train going through it.
        for (let x = 0.05; x < W - 0.1; x += 0.16) {
          s.line([[x, deckY], [x + 0.16, deckY + truss]], 0.008, rgba(INK, 0.5), 0)
          s.line([[x + 0.16, deckY], [x, deckY + truss]], 0.008, rgba(INK, 0.5), 0)
        }
        const train = s.rect(W * 0.38, deckY + 0.06, 1.3, 0.2, 0)
        s.fill(train, '#c9d1d6')
        s.ink(train, 0.01)
        s.windows(W * 0.38 + 0.06, deckY + 0.13, 10, 1, 0.08, 0.07, 0.045, 0, { color: '#3d4a63', lit: 0.9, frame: false })
        const bullet = s.ellipse(W * 0.38 + 0.1, deckY + 0.16, 0.035, 0.035)
        s.fill(bullet, '#ff6319')
        s.glow(bullet, '#ff6319')
      },
    },
    ...legs.map((shape) => ({ shape, color: steel, ink: 0.018, hatch: { angle: 1.3, gap: 0.03, alpha: 0.25 } })),
    ...crowns.map((shape) => ({ shape, color: shade(steel, 0.05), ink: 0.016 })),
  ])
  // Cross-bracing between each tower's legs, and a lamp on top.
  for (const t of towers) {
    for (let y = 1.5; y < top - 0.3; y += 0.55) {
      s.strip([[t - 0.13, y], [t + 0.13, y + 0.5]], 0.018, 0.02, steel)
      s.strip([[t + 0.13, y], [t - 0.13, y + 0.5]], 0.018, 0.02, steel)
    }
    const lamp = s.ellipse(t, top + 0.36, 0.035, 0.035)
    s.fill(lamp, '#ff4a50')
    s.glow(lamp, '#ff4a50')
  }
}

// ---------------------------------------------------------------------------
// The Clock Tower building: an old concrete warehouse with a glass clock in
// its tower. The hands are a piece of their own.

export const CLOCK = { x: 1.0, y: 3.62, r: 0.32 }

export function clockTower(s: Sketch) {
  const W = s.w
  const concrete = '#ddd5c5'
  const block = s.rect(0.05, 0, W - 0.1, 3.0, 0.003)
  const tower = s.rect(0.5, 3.0, 1.0, 1.05, 0.003)
  const cap = s.poly(pts(0.42, 4.05, 1.58, 4.05, 1.0, 4.45), 0.003)
  const face = s.ellipse(CLOCK.x, CLOCK.y, CLOCK.r, CLOCK.r)
  paint(s, [
    {
      shape: block,
      color: concrete,
      ink: 0.022,
      detail: () => {
        s.windows(0.18, 0.4, 7, 10, 0.14, 0.16, 0.09, 0.09, { lit: 0.5 })
        s.fill(s.rect(0.05, 2.85, W - 0.1, 0.15, 0), shade(concrete, -0.08))
        s.hatch(s.rect(W - 0.4, 0, 0.35, 3.0, 0), { angle: 1.2, gap: 0.04, alpha: 0.2 })
      },
    },
    { shape: tower, color: concrete, ink: 0.02 },
    { shape: cap, color: '#7d8c8a', ink: 0.018, hatch: { angle: 0.9, gap: 0.03, alpha: 0.3 } },
    {
      shape: face,
      color: '#e9f0f2',
      ink: 0.022,
      detail: () => {
        s.glow(face, '#fff3d0')
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2
          s.line(
            [
              [CLOCK.x + Math.cos(a) * 0.24, CLOCK.y + Math.sin(a) * 0.24],
              [CLOCK.x + Math.cos(a) * 0.3, CLOCK.y + Math.sin(a) * 0.3],
            ],
            0.016
          )
        }
        // The window's frame, spoked like a wheel.
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + Math.PI / 4
          s.line([[CLOCK.x, CLOCK.y], [CLOCK.x + Math.cos(a) * 0.3, CLOCK.y + Math.sin(a) * 0.3]], 0.006, rgba(INK, 0.3), 0)
        }
      },
    },
  ])
}

// The hands, turning about the middle of their art.
export function clockHands(s: Sketch) {
  const c = s.w / 2
  const hour = s.poly(pts(c - 0.018, c, c + 0.018, c, c + 0.01, c + 0.15, c - 0.01, c + 0.15), 0)
  const minute = s.poly(pts(c, c - 0.016, c, c + 0.016, c + 0.24, c + 0.004, c + 0.24, c - 0.004), 0)
  s.border([hour, minute], 0.02)
  for (const hand of [hour, minute]) {
    s.fill(hand, '#1f1c22')
    s.glow(hand, '#000')
  }
  const hub = s.ellipse(c, c, 0.03, 0.03)
  s.fill(hub, '#1f1c22')
}

// ---------------------------------------------------------------------------
// Jane's Carousel in its glass box by the river.

export function janesCarousel(s: Sketch) {
  const W = s.w
  const box = s.rect(0.05, 0, W - 0.1, 1.45, 0.003)
  const roof = s.rect(0.0, 1.45, W, 0.1, 0.002)
  const cx = W / 2
  paint(s, [
    {
      shape: box,
      color: '#a9c3cc',
      ink: 0.02,
      detail: () => {
        // The carousel inside: canopy, poles, horses.
        const canopy = s.poly(pts(cx - 0.85, 1.05, cx + 0.85, 1.05, cx + 0.5, 1.3, cx - 0.5, 1.3), 0.002)
        s.fill(canopy, '#e8d6a8')
        for (let k = 0; k < 9; k++) {
          const x = cx - 0.8 + k * 0.2
          s.fill(s.poly(pts(x, 1.05, x + 0.1, 1.05, x + 0.05, 0.96), 0), k % 2 ? C.red : '#f6f0e2')
        }
        s.fill(s.rect(cx - 0.9, 0.05, 1.8, 0.08, 0), '#c9a463')
        // Lit up at night: a warm room, the horses and canopy brighter in it.
        s.glow(s.rect(cx - 0.9, 0.05, 1.8, 1.25, 0), '#7a5e38')
        s.glow(canopy, '#e0b878')
        for (let k = 0; k < 6; k++) {
          const x = cx - 0.75 + k * 0.3
          s.line([[x, 0.12], [x, 1.0]], 0.02, '#d9b45a', 0)
          const horse = s.ellipse(x + 0.02, 0.55 + (k % 2) * 0.1, 0.11, 0.06)
          s.fill(horse, k % 2 ? '#f6f0e2' : '#e9dfc7')
          s.ink(horse, 0.008)
          s.glow(horse, '#efe4c8')
        }
        // Glass mullions over it all.
        for (let x = 0.3; x < W - 0.1; x += 0.3) {
          s.line([[x, 0], [x, 1.45]], 0.01, '#5d6b75', 0)
          s.glow(s.rect(x - 0.006, 0, 0.012, 1.45, 0), '#000')
        }
        s.fill(s.rect(0.05, 0, W - 0.1, 1.45, 0), 'rgba(255,255,255,0.06)')
      },
    },
    { shape: roof, color: '#3a3f46', ink: 0.016 },
  ])
}

// ---------------------------------------------------------------------------
// Empire Stores: a brick warehouse of arched windows and iron shutters,
// its old painted sign on the wall.

export function empireStores(s: Sketch) {
  const W = s.w
  const brick = '#9c4a35'
  const body = s.rect(0.05, 0, W - 0.1, 3.2, 0.003)
  paint(s, [
    {
      shape: body,
      color: brick,
      ink: 0.022,
      detail: () => {
        for (let y = 0.1; y < 3.2; y += 0.08) s.line([[0.05, y], [W - 0.05, y]], 0.004, rgba(INK, 0.15), 0)
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 5; col++) {
            const x = 0.22 + col * ((W - 0.44) / 5)
            const y = 0.3 + row * 0.56
            const win = s.custom(
              (p) => {
                p.moveTo(x, y)
                p.lineTo(x, y + 0.24)
                p.arc(x + 0.1, y + 0.24, 0.1, Math.PI, 0, true)
                p.lineTo(x + 0.2, y)
                p.closePath()
              },
              pts(x, y, x + 0.2, y + 0.34)
            )
            const open = (row + col) % 3 !== 0
            s.fill(win, open ? '#3d4a63' : '#4f7a5a')
            if (open) s.glow(win, '#ffd27a')
            s.ink(win, 0.008)
          }
        }
        s.fill(s.rect(0.15, 2.62, W - 0.3, 0.42, 0), 'rgba(255,255,255,0.08)')
        s.text('EMPIRE STORES', W / 2, 2.72, 0.2, { color: 'rgba(250,244,230,0.75)', font: SANS, spacing: 4 })
        s.hatch(s.rect(W - 0.4, 0, 0.35, 3.2, 0), { angle: 1.2, gap: 0.04, alpha: 0.2 })
      },
    },
  ])
  // A garden on the roof.
  for (let x = 0.25; x < W - 0.2; x += 0.32) {
    const bush = s.ellipse(x, 3.25, 0.13, 0.09)
    s.border([bush], 0.03)
    s.fill(bush, s.pick(['#7fa860', '#d98b3c', '#5f8f4a']))
    s.ink(bush, 0.01)
  }
}

// A ferry crossing the river.
export function riverFerry(s: Sketch) {
  const W = s.w
  const hull = s.custom(
    (p) => {
      p.moveTo(0.05, 0.32)
      p.lineTo(W - 0.05, 0.36)
      p.lineTo(W - 0.25, 0.06)
      p.lineTo(0.2, 0.06)
      p.closePath()
    },
    pts(0.05, 0.06, W - 0.05, 0.36)
  )
  const cabin = s.rect(0.3, 0.33, W - 0.75, 0.3, 0.002)
  const bridge = s.rect(W - 0.85, 0.63, 0.35, 0.18, 0.002)
  paint(s, [
    { shape: hull, color: '#f4f2ec', ink: 0.018, detail: () => s.fill(s.rect(0.05, 0.12, W - 0.15, 0.06, 0), '#2a6fb0') },
    {
      shape: cabin,
      color: '#f4f2ec',
      ink: 0.016,
      detail: () => {
        s.windows(0.36, 0.42, 10, 1, 0.1, 0.12, 0.05, 0, { color: '#3d4a63', lit: 0.8, frame: false })
        s.text('FERRY', W / 2 - 0.2, 0.36, 0.05, { color: '#2a6fb0', font: SANS, spacing: 2 })
      },
    },
    { shape: bridge, color: '#f4f2ec', ink: 0.014, detail: () => s.fill(s.rect(W - 0.82, 0.69, 0.29, 0.06, 0), '#3d4a63') },
  ])
  s.line([[0.05, 0.02], [-0.0, 0.02]], 0.01, 'rgba(255,255,255,0.8)', 0)
  for (let k = 1; k <= 3; k++) s.line([[0.15 - k * 0.04, 0.04], [0.15 - k * 0.04 - 0.2, 0.0 + k * 0.01]], 0.01, 'rgba(255,255,255,0.8)', 0)
}

// ---------------------------------------------------------------------------
// The street: a pizzeria with a queue out the door, and a wedding shoot.

export function pizzeria(s: Sketch) {
  const W = s.w
  const brick = '#a8573f'
  const front = s.rect(0.6, 0, W - 0.7, 1.75, 0.003)
  const sign = s.rect(0.75, 1.15, W - 1.0, 0.3, 0.002)
  const parts: Part[] = [
    {
      shape: front,
      color: brick,
      ink: 0.022,
      detail: () => {
        const win = s.rect(1.65, 0.25, W - 1.95, 0.6, 0)
        s.fill(win, '#3d4a63')
        s.glow(win, '#ffb85c')
        // The oven's glow through the window.
        const oven = s.ellipse(2.2, 0.45, 0.2, 0.12)
        s.fill(oven, '#ff8a3d')
        s.glow(oven, '#ff7a2a')
        const door = s.rect(0.85, 0, 0.45, 0.85, 0)
        s.fill(door, '#4a2e28')
        s.glow(door, '#7a5a34')
        s.windows(0.8, 1.55, 4, 1, 0.22, 0.15, 0.2, 0, { lit: 0.6 })
      },
    },
    awning(s, 0.7, 0.9, W - 0.9, C.red),
    {
      shape: sign,
      color: '#1f6b45',
      ink: 0.014,
      detail: () => s.text('PIZZERIA', 0.75 + (W - 1.0) / 2, 1.22, 0.16, { color: '#fff4dc', glow: '#fff4dc', font: 'Georgia, serif' }),
    },
  ]
  paint(s, parts)
  // The queue, down the block.
  const coats = ['#3f6fb0', '#f7c948', '#18a558', '#7b2fbf', '#e8364f']
  const queue = coats.flatMap((coat, k) => person(s, 0.18 + k * 0.3, 0, 0.95 + (k % 2) * 0.1, { coat, hat: k === 2 ? 'beanie' : undefined, hold: k === 4 ? 'coffee' : undefined }))
  paint(s, queue, 0.04)
  // Silhouetted against the lit window after dark.
  queue.forEach((part) => s.glow(part.shape, '#000'))
}

export function weddingShoot(s: Sketch) {
  const groom = person(s, 0.55, 0, 1.15, { coat: '#1f1c22', legs: '#1f1c22' })
  const bride = person(s, 0.85, 0, 1.05, { coat: '#fbf8f0', legs: '#fbf8f0', skirt: true, hair: '#6b4a2c' })
  paint(s, [...groom, ...bride], 0.05)
  // Her dress spreads to the ground, a veil behind.
  const dress = s.poly(pts(0.72, 0.02, 0.98, 0.02, 0.92, 0.45, 0.78, 0.45), 0.002)
  const veil = s.custom(
    (p) => {
      p.moveTo(0.86, 1.02)
      p.quadraticCurveTo(1.12, 0.9, 1.08, 0.45)
      p.quadraticCurveTo(0.98, 0.75, 0.88, 0.9)
      p.closePath()
    },
    pts(0.86, 0.45, 1.12, 1.02)
  )
  s.border([dress, veil], 0.03)
  s.fill(dress, '#fbf8f0')
  s.ink(dress, 0.01)
  s.fill(veil, 'rgba(255,255,255,0.85)')
  s.ink(veil, 0.008)
  const bouquet = s.ellipse(0.74, 0.5, 0.05, 0.045)
  s.fill(bouquet, '#e48aa9')
  s.ink(bouquet, 0.008)
  // The photographer, crouched with a camera.
  const snapper = person(s, 1.4, 0, 0.75, { coat: '#c9764a', hat: 'beanie' })
  paint(s, snapper, 0.04)
  const camera = s.rect(1.28, 0.55, 0.1, 0.07, 0)
  s.fill(camera, '#1f1c22')
  const flash = s.ellipse(1.29, 0.65, 0.025, 0.02)
  s.fill(flash, '#fff8d0')
  s.glow(flash, '#ffffff')
}

// ---------------------------------------------------------------------------
// Brooklyn Bridge Park: the lawns by the water, a picnic, the park sign and
// a kid with a kite.

export const PARK_CROWNS: [number, number, number][] = [
  [0.32, 0.86, 0.26],
  [2.38, 0.8, 0.24],
]

export function bridgePark(s: Sketch) {
  const W = s.w
  for (const [x, y, r] of PARK_CROWNS) {
    s.strip([[x, 0.1], [x, y - r * 0.5]], 0.07, 0.04, '#6e4f3a')
    blobs(
      s,
      [
        [x, y, r * 0.8],
        [x - r * 0.6, y - r * 0.15, r * 0.6],
        [x + r * 0.6, y - r * 0.1, r * 0.62],
        [x - r * 0.15, y + r * 0.55, r * 0.55],
      ],
      '#6f9a55',
      'rgba(40,80,30,0.5)'
    )
  }
  // The kite, high on its string.
  const kx = 1.95
  const ky = 1.05
  s.strip([[1.71, 0.52], [1.84, 0.8], [kx, ky - 0.08]], 0.006, 0.025)
  const kite = s.poly(pts(kx, ky + 0.12, kx + 0.09, ky, kx, ky - 0.1, kx - 0.09, ky), 0.001)
  s.strip([[kx, ky - 0.1], [kx - 0.05, ky - 0.2], [kx + 0.02, ky - 0.28], [kx - 0.04, ky - 0.36]], 0.006, 0.025)
  paint(
    s,
    [
      {
        shape: kite,
        color: '#e8364f',
        ink: 0.01,
        detail: () => {
          s.fill(s.poly(pts(kx, ky + 0.12, kx + 0.09, ky, kx, ky), 0), '#f7c948')
          s.fill(s.poly(pts(kx, ky, kx - 0.09, ky, kx, ky - 0.1), 0), '#3f6fb0')
        },
      },
      ...[0.16, 0.26].map((dy, k) => ({ shape: s.ellipse(kx - 0.03 + k * 0.04, ky - dy - 0.04, 0.025, 0.014), color: k ? '#3f6fb0' : '#f7c948', ink: 0.006 })),
    ],
    0.03
  )
  const lawn = s.custom(
    (p) => {
      p.moveTo(0.02, 0)
      p.lineTo(W - 0.02, 0)
      p.lineTo(W - 0.02, 0.1)
      p.quadraticCurveTo(W * 0.55, 0.42, 0.02, 0.12)
      p.closePath()
    },
    pts(0.02, 0, W - 0.02, 0.27)
  )
  const sign = s.rect(0.38, 0.4, 0.66, 0.15, 0.001)
  const blanket = s.poly(pts(0.95, 0.12, 1.5, 0.12, 1.46, 0.22, 0.99, 0.22), 0.001)
  paint(s, [
    ...[0.48, 0.94].map((x) => ({ shape: s.rect(x - 0.015, 0.12, 0.03, 0.3, 0), color: '#6e4f3a', ink: 0.008 })),
    {
      shape: sign,
      color: '#2f5a3a',
      ink: 0.012,
      detail: () => s.text('BROOKLYN BRIDGE PARK', 0.71, 0.44, 0.05, { color: '#f4f1ea', font: SANS, spacing: 1 }),
    },
    {
      shape: lawn,
      color: '#8dbb6c',
      ink: 0.016,
      detail: () => {
        for (let i = 0; i < 40; i++) {
          const gx = s.r(0.1, W - 0.1)
          const gy = s.r(0.03, 0.12)
          s.line([[gx, gy], [gx + 0.01, gy + 0.04]], 0.006, rgba('#3f6a2e', 0.6), 0)
        }
      },
    },
    {
      shape: blanket,
      color: '#d24a3a',
      ink: 0.01,
      detail: () => {
        for (let x = 1.0; x < 1.48; x += 0.08) s.fill(s.rect(x, 0.12, 0.04, 0.1, 0), 'rgba(255,255,255,0.65)')
        s.fill(s.rect(0.97, 0.155, 0.52, 0.03, 0), 'rgba(255,255,255,0.5)')
      },
    },
  ])
  // A couple on the blanket, and the kid holding the kite string.
  const seated = (x: number, top: string, hair: string, skin: string): Part[] => {
    const body = s.poly(pts(x - 0.08, 0.18, x + 0.08, 0.18, x + 0.06, 0.42, x - 0.06, 0.42), 0.001)
    const head = s.ellipse(x, 0.49, 0.06, 0.065)
    return [
      { shape: body, color: top, ink: 0.01 },
      { shape: head, color: skin, ink: 0.01, detail: () => s.fill(s.ellipse(x + 0.02, 0.5, 0.007, 0.008), INK) },
      { shape: s.custom((p) => p.arc(x, 0.5, 0.066, -0.2, Math.PI + 0.2, false), pts(x - 0.066, 0.5, x + 0.066, 0.57)), color: hair, ink: 0.008 },
    ]
  }
  paint(
    s,
    [
      ...seated(1.12, '#f7c948', '#3b2a24', C.skin),
      ...seated(1.32, '#3f6fb0', '#7a3d22', '#c99772'),
      ...person(s, 1.6, 0.12, 0.55, { coat: '#18a558', hold: 'balloon', hat: 'beanie' }),
    ],
    0.035
  )
}

// ---------------------------------------------------------------------------
// Time Out Market, in the old warehouse on the water: arched windows full of
// food stalls and long tables, and a roof terrace looking at the bridges.

export function timeOutMarket(s: Sketch) {
  const W = s.w
  const brick = '#a8573f'
  const front = s.rect(0.05, 0, W - 0.1, 1.5, 0.003)
  const arches = [0, 1, 2].map((k) => {
    const x = 0.2 + k * ((W - 0.4) / 3) + 0.04
    const w = (W - 0.4) / 3 - 0.08
    return {
      x,
      w,
      shape: s.custom(
        (p) => {
          p.moveTo(x, 0.0)
          p.lineTo(x, 0.62 - w / 2)
          p.arc(x + w / 2, 0.62 - w / 2, w / 2, Math.PI, 0, true)
          p.lineTo(x + w, 0.0)
          p.closePath()
        },
        pts(x, 0, x + w, 0.62)
      ),
    }
  })
  const sign = s.rect(W / 2 - 0.42, 1.0, 0.84, 0.26, 0.001)
  const label = s.rect(W / 2 - 0.42, 0.86, 0.84, 0.13, 0.001)
  const rail = s.rect(0.12, 1.5, W - 0.24, 0.1, 0)
  paint(s, [
    {
      shape: front,
      color: brick,
      ink: 0.022,
      detail: () => {
        for (let y = 0.1; y < 1.5; y += 0.06) s.line([[0.06, y], [W - 0.06, y]], 0.004, rgba(INK, 0.18), 0)
        // The warehouse's small iron-shuttered windows upstairs.
        s.windows(0.2, 0.74, 7, 1, 0.14, 0.16, 0.13, 0, { color: '#3d4a63', lit: 0.7, arch: true })
        arches.forEach(({ x, w, shape }) => {
          s.fill(shape, '#f3d9a4')
          s.glow(shape, '#6a4a22')
          // Food stalls along the back, diners at the long tables.
          s.fill(s.rect(x, 0.32, w, 0.06, 0), '#1f6b45')
          s.fill(s.rect(x + 0.04, 0.34, w - 0.08, 0.02, 0), '#f7c948')
          s.fill(s.rect(x + 0.03, 0.12, w - 0.06, 0.035, 0), '#6b4430')
          for (let dx = 0.07; dx < w - 0.04; dx += 0.1) {
            const diner = s.ellipse(x + dx, 0.2, 0.03, 0.035)
            s.fill(diner, rgba(INK, 0.75))
            s.fill(s.rect(x + dx - 0.035, 0.12, 0.07, 0.06, 0), rgba(INK, 0.75))
            s.glow(diner, '#000')
          }
          // String lights across the arch.
          for (let k = 0; k < 6; k++) {
            const t = (k + 0.5) / 6
            const bulb = s.ellipse(x + t * w, 0.5 - Math.sin(t * Math.PI) * 0.06, 0.012, 0.012)
            s.fill(bulb, '#fff1c4')
            s.glow(bulb, '#ffd27a')
          }
          s.line([[x, 0.05], [x, 0.6 - w / 2]], 0.008, rgba(INK, 0.6), 0)
        })
      },
    },
    { shape: rail, color: '#3a3a40', ink: 0.01, noBorder: true },
    {
      shape: sign,
      color: '#e4002b',
      flat: true,
      ink: 0.012,
      detail: () => {
        s.glow(sign, '#a8001f')
        s.text('Time Out', W / 2, 1.06, 0.15, { color: '#ffffff', glow: '#ffffff', font: SANS, weight: '900' })
      },
    },
    {
      shape: label,
      color: '#ffffff',
      flat: true,
      ink: 0.012,
      detail: () => {
        s.glow(label, '#5a5a5a')
        s.text('MARKET', W / 2, 0.89, 0.085, { color: INK, font: SANS, weight: '900', spacing: 4 })
      },
    },
  ])
  // The roof terrace: railings, umbrellas and a strand of lights.
  s.strip([[0.12, 1.5], [0.12, 1.62], [W - 0.12, 1.62], [W - 0.12, 1.5]], 0.014, 0.03)
  for (let x = 0.2; x < W - 0.15; x += 0.1) s.strip([[x, 1.5], [x, 1.62]], 0.006, 0.02)
  for (const [x, c] of [
    [0.45, '#e4002b'],
    [1.15, '#f4f1ea'],
    [1.85, '#e4002b'],
  ] as [number, string][]) {
    s.strip([[x, 1.5], [x, 1.78]], 0.014, 0.03)
    const top = s.custom(
      (p) => {
        p.moveTo(x - 0.26, 1.74)
        p.quadraticCurveTo(x, 1.92, x + 0.26, 1.74)
        p.closePath()
      },
      pts(x - 0.26, 1.74, x + 0.26, 1.83)
    )
    paint(s, [{ shape: top, color: c, ink: 0.012, detail: () => s.line([[x - 0.13, 1.77], [x, 1.83], [x + 0.13, 1.77]], 0.006, rgba(INK, 0.4), 0) }], 0.04)
  }
}

// ---------------------------------------------------------------------------
// The line for ice cream on a summer evening: whoever's at the front gets
// the first cone.

export function iceCreamQueue(s: Sketch) {
  const queue = [
    person(s, 0.18, 0, 0.62, { coat: '#f7c948', hold: 'icecream', skin: '#c99772', hat: 'beanie' }),
    person(s, 0.5, 0, 1.0, { coat: '#4f8a8b', hold: 'icecream', hair: '#c9a26b', skirt: true }),
    person(s, 0.84, 0, 1.06, { coat: '#f4f1ea', hold: 'phone', skin: '#8d5a3c', hair: '#1f1a18' }),
    person(s, 1.14, 0, 0.97, { coat: '#e8587a', skirt: true, hair: '#7a3d22' }),
    person(s, 1.44, 0, 1.03, { coat: '#7b2fbf', hat: 'fedora' }),
  ]
  paint(s, queue.flat(), 0.04)
}

// ---------------------------------------------------------------------------
// Tourists taking a selfie with the Manhattan Bridge behind them.

export function selfieTourists(s: Sketch) {
  const H = 1.08
  const x = 0.42
  const hand: Pt = [x + H * 0.24, H * 0.86]
  const phone: Pt = [x + 0.38, 1.38]
  s.strip([hand, phone], 0.014, 0.03, '#2c2a30')
  const a = person(s, x, 0, H, { coat: '#f4f1ea', legs: '#4f6d8f', hold: 'selfie', wave: true, hair: '#3b2a24' })
  const b = person(s, x + 0.42, 0, 1.0, { coat: '#e2a03c', hold: 'paper', skin: '#c99772', hat: 'beret' })
  paint(s, [...b, ...a], 0.045)
  // I ♥ NY across the T-shirt, and a camera round the friend's neck.
  s.text('I', x - 0.045, H * 0.62, 0.07, { color: INK, font: SANS, weight: '900' })
  s.text('♥', x + 0.02, H * 0.62, 0.075, { color: '#e4002b', font: SANS, weight: '900' })
  s.text('NY', x, H * 0.55, 0.07, { color: INK, font: SANS, weight: '900' })
  s.line([[x + 0.36, 0.78], [x + 0.42, 0.66], [x + 0.48, 0.78]], 0.008, INK, 0)
  const cam = s.rect(x + 0.38, 0.6, 0.09, 0.06, 0)
  s.fill(cam, '#2c2a30')
  s.fill(s.ellipse(x + 0.425, 0.63, 0.02, 0.02), '#8d979e')
  // The phone on its stick, the flash going off.
  const body = s.rect(phone[0] - 0.045, phone[1] - 0.02, 0.09, 0.15, 0.001)
  s.border([body], 0.035)
  s.fill(body, '#2c2a30')
  s.ink(body, 0.01)
  const flash = s.ellipse(phone[0] + 0.02, phone[1] + 0.1, 0.014, 0.014)
  s.fill(flash, '#fff8d0')
  s.glow(flash, '#ffffff')
}
