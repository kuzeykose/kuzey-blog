import { INK, Pt, Shape, Sketch, rgba, shade } from './sketch'
import { C } from './palette'
import { Part, paint, pts } from './art-common'
import { person } from './art-street'

// Art for the Times Square spread, looking south down the bowtie to One
// Times Square.

const SANS = 'Helvetica, Arial, sans-serif'

// A lit sign: a panel in its own colour with glowing lettering, and
// optionally a row of bulbs round the edge.
type Board = {
  x: number
  y: number
  w: number
  h: number
  color: string
  text?: string
  ink?: string
  size?: number
  font?: string
  bulbs?: boolean
  // Extra drawing on the panel (pictures on the big screens).
  art?: (s: Sketch, b: Board) => void
}

function boardPart(s: Sketch, b: Board): Part {
  const shape = s.rect(b.x, b.y, b.w, b.h, 0.003)
  return {
    shape,
    color: b.color,
    ink: 0.018,
    detail: () => {
      s.glow(shape, shade(b.color, -0.3))
      b.art?.(s, b)
      if (b.text) {
        const size = b.size ?? b.h * 0.45
        s.text(b.text, b.x + b.w / 2, b.y + b.h / 2 - size * 0.36, size, {
          color: b.ink ?? '#fff7e6',
          glow: b.ink ?? '#fff7e6',
          font: b.font ?? SANS,
        })
      }
      if (b.bulbs) {
        const n = Math.max(6, Math.round(b.w / 0.09))
        for (let k = 0; k <= n; k++) {
          const bx = b.x + 0.05 + ((b.w - 0.1) * k) / n
          for (const by of [b.y + 0.045, b.y + b.h - 0.045]) {
            const bulb = s.ellipse(bx, by, 0.017, 0.017)
            s.fill(bulb, '#fff1c2')
            s.glow(bulb, '#fff1c2')
          }
        }
      }
    },
  }
}

// ---------------------------------------------------------------------------
// One Times Square: a slim tower wrapped in screens, the news zipper round
// its middle, and the year's numerals and the ball's pole on the roof.

// Art positions the stage needs: the zipper band, and the top of the pole.
export const ZIPPER = { x: 0.85, y: 1.33, w: 1.5, h: 0.22 }
export const POLE_TOP = 5.55

export function oneTimesSquare(s: Sketch) {
  const W = s.w
  const top = 3.95
  const tower = s.poly(pts(0.1, 0, W - 0.1, 0, W - 0.1, top, W - 0.25, top, W - 0.25, top + 0.12, 0.25, top + 0.12, 0.25, top, 0.1, top), 0.003)
  const year = String(new Date().getFullYear() + 1)
  const boards: Board[] = [
    {
      x: 0.12,
      y: 0.42,
      w: W - 0.24,
      h: 0.68,
      color: '#3b3a8f',
      text: 'DREAM BIG',
      ink: '#ffffff',
      size: 0.2,
      art: (s, b) => {
        for (let k = 0; k < 5; k++) s.fill(s.ellipse(b.x + s.r(0.1, b.w - 0.1), b.y + s.r(0.1, b.h - 0.1), 0.05, 0.05), '#ffd36b')
      },
    },
    { x: 0.12, y: 1.6, w: W - 0.24, h: 0.72, color: '#d43f8d', text: 'HELLO, NYC', ink: '#ffe14d', size: 0.19 },
    {
      x: 0.15,
      y: 2.42,
      w: W - 0.3,
      h: 0.66,
      color: '#15161d',
      text: 'TIMES SQ',
      ink: '#5ff3ff',
      size: 0.22,
      art: (s, b) => s.ink(s.rect(b.x + 0.06, b.y + 0.06, b.w - 0.12, b.h - 0.12, 0), 0.012, '#5ff3ff'),
    },
    { x: 0.2, y: 3.17, w: W - 0.4, h: 0.66, color: '#f08a24', text: 'SHOWTIME', ink: '#ffffff', size: 0.18, bulbs: true },
  ]
  const boardParts = boards.map((b) => boardPart(s, b))
  const zipper = s.rect(0.08, ZIPPER.y - ZIPPER.h / 2 - 0.03, W - 0.16, ZIPPER.h + 0.06, 0.002)
  const numerals = s.rect(0.3, top + 0.12, W - 0.6, 0.38, 0.003)
  paint(s, [
    {
      shape: tower,
      color: C.steel,
      ink: 0.026,
      detail: () => {
        const door = s.rect(0.25, 0, W - 0.5, 0.36, 0)
        s.fill(door, C.window)
        s.glow(door, '#ffe2a3')
      },
    },
    ...boardParts,
    { shape: zipper, color: '#14141a', ink: 0.016, flat: true },
    {
      shape: numerals,
      color: '#1d1c24',
      ink: 0.016,
      flat: true,
      detail: () => {
        s.text(year, W / 2, top + 0.2, 0.26, { color: '#fff3c4', glow: '#fff3c4', font: SANS })
        for (let k = 0; k <= 12; k++) {
          const bulb = s.ellipse(0.36 + ((W - 0.72) * k) / 12, top + 0.47, 0.014, 0.014)
          s.fill(bulb, '#fff1c2')
          s.glow(bulb, '#fff1c2')
        }
      },
    },
  ])
  // The ball's pole, with stays.
  s.strip([[W / 2, top + 0.5], [W / 2, POLE_TOP]], 0.05, 0.035, C.steelDark)
  s.strip([[W / 2 - 0.3, top + 0.5], [W / 2, top + 1.0]], 0.012, 0.025)
  s.strip([[W / 2 + 0.3, top + 0.5], [W / 2, top + 1.0]], 0.012, 0.025)
}

// The New Year's Eve ball: a sphere of crystal triangles.
export function timesBall(s: Sketch) {
  const W = s.w
  const c = W / 2
  const r = W / 2 - 0.04
  const ball = s.ellipse(c, c, r, r)
  paint(s, [
    {
      shape: ball,
      color: '#dce9f2',
      ink: 0.016,
      detail: () => {
        s.glow(ball, '#e6f6ff')
        const ctx = s.ctx
        ctx.save()
        ctx.clip(ball.path)
        // Facets, each a little tint of the light it catches.
        for (let y = c - r; y < c + r; y += 0.07) {
          for (let x = c - r + ((Math.round((y - c) / 0.07) % 2) * 0.035); x < c + r; x += 0.07) {
            const tri = s.poly(pts(x, y, x + 0.07, y, x + 0.035, y + 0.07), 0)
            s.fill(tri, s.pick(['#ffffff', '#cfe6ff', '#ffd6f0', '#fff3b0', '#bff5e6']), 0.6)
          }
        }
        ctx.restore()
        for (let k = -2; k <= 2; k++) s.line([[c - r, c + k * r * 0.4], [c + r, c + k * r * 0.4]], 0.006, rgba(INK, 0.35), 0)
        s.fill(s.ellipse(c - r * 0.35, c + r * 0.4, r * 0.25, r * 0.15), 'rgba(255,255,255,0.8)')
      },
    },
  ])
}

// ---------------------------------------------------------------------------
// The Paramount Building: limestone setbacks, a clock, a glass globe.

export function paramountBuilding(s: Sketch) {
  const W = s.w
  const stone = '#d8cdb5'
  const tiers: [number, number, number][] = [
    [0.0, W, 2.4],
    [0.2, W - 0.4, 3.2],
    [0.4, W - 0.8, 3.9],
    [0.6, W - 1.2, 4.3],
  ]
  const shapes = tiers.map(([x, w, h], i) => s.rect(x, i ? tiers[i - 1][2] - 0.02 : 0, w, h - (i ? tiers[i - 1][2] - 0.02 : 0), 0.003))
  const clock = s.ellipse(W / 2, 3.55, 0.24, 0.24)
  const plinth = s.rect(W / 2 - 0.1, 4.3, 0.2, 0.1, 0.002)
  const globe = s.ellipse(W / 2, 4.62, 0.21, 0.21)
  const board = boardPart(s, { x: 0.1, y: 0.45, w: W - 0.2, h: 0.9, color: '#b8282f', text: 'ROCK', ink: '#ffe9a8', size: 0.3, font: 'Georgia, serif' })
  paint(s, [
    ...shapes.map((shape, i) => ({
      shape,
      color: shade(stone, i * 0.02),
      ink: 0.02,
      detail: () => {
        const [x, w] = tiers[i]
        const y0 = shape.minY + (i ? 0.12 : 1.5)
        const rows = Math.max(1, Math.floor((shape.maxY - y0 - 0.15) / 0.2))
        const cols = Math.max(2, Math.round(w / 0.17))
        if (i !== 2) s.windows(x + 0.08, y0, cols, rows, 0.08, 0.11, (w - 0.16 - cols * 0.08) / (cols - 1 || 1), 0.09, { lit: 0.5 })
      },
    })),
    board,
    {
      shape: clock,
      color: '#f6f0de',
      ink: 0.02,
      detail: () => {
        s.glow(clock, '#d9c48c')
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2
          s.line([[W / 2 + Math.cos(a) * 0.19, 3.55 + Math.sin(a) * 0.19], [W / 2 + Math.cos(a) * 0.22, 3.55 + Math.sin(a) * 0.22]], 0.012)
        }
        const hands = [s.poly(pts(W / 2 - 0.012, 3.55, W / 2 + 0.012, 3.55, W / 2 + 0.07, 3.7), 0), s.poly(pts(W / 2, 3.562, W / 2, 3.538, W / 2 + 0.16, 3.52), 0)]
        hands.forEach((hand) => {
          s.fill(hand, INK)
          s.glow(hand, '#000')
        })
      },
    },
    { shape: plinth, color: shade(stone, -0.1), ink: 0.012 },
    {
      shape: globe,
      color: '#bcdcea',
      ink: 0.016,
      detail: () => {
        s.glow(globe, '#d9f1ff')
        for (const rx of [0.07, 0.15]) s.ink(s.ellipse(W / 2, 4.62, rx, 0.21), 0.006, rgba(INK, 0.5))
        s.line([[W / 2 - 0.21, 4.62], [W / 2 + 0.21, 4.62]], 0.006, rgba(INK, 0.5), 0)
      },
    },
  ])
}

// ---------------------------------------------------------------------------
// A building wrapped in signs, like every one round the square.

export function billboardTower(s: Sketch, base: string, boards: Board[], o: { top?: number; crown?: string } = {}) {
  const W = s.w
  const top = o.top ?? s.h - 0.15
  const body = s.rect(0.08, 0, W - 0.16, top, 0.003)
  paint(s, [
    {
      shape: body,
      color: base,
      ink: 0.024,
      detail: () => {
        s.windows(0.2, 0.5, Math.round((W - 0.4) / 0.2), Math.round((top - 0.7) / 0.24), 0.1, 0.13, 0.1, 0.11, { lit: 0.55 })
        const shop = s.rect(0.15, 0, W - 0.3, 0.38, 0)
        s.fill(shop, C.window)
        s.glow(shop, '#c9a463')
        s.hatch(s.rect(W - 0.45, 0, 0.35, top, 0), { angle: 1.2, gap: 0.04, alpha: 0.2 })
      },
    },
    ...boards.map((b) => boardPart(s, b)),
  ])
  if (o.crown) {
    const crown = s.rect(W * 0.2, top, W * 0.6, 0.12, 0)
    s.border([crown], 0.04)
    s.fill(crown, o.crown)
    s.ink(crown, 0.012)
  }
}

// The four towers round the canyon, each with its own signs.
export const TOWERS: { base: string; boards: Board[] }[] = [
  {
    base: '#8d8a96',
    boards: [
      {
        x: 0.15,
        y: 0.5,
        w: 1.9,
        h: 1.0,
        color: '#c8202f',
        text: 'Fizz!',
        ink: '#ffffff',
        size: 0.42,
        font: 'Georgia, serif',
      },
      { x: 0.25, y: 1.65, w: 1.7, h: 0.5, color: '#16161c', text: '• BREAKING NEWS •', ink: '#ffb347', size: 0.13 },
      {
        x: 0.15,
        y: 2.3,
        w: 1.9,
        h: 1.25,
        color: '#2a9df4',
        art: (s, b) => {
          // A giant smiling face.
          const cx = b.x + b.w / 2
          const cy = b.y + b.h / 2
          s.fill(s.ellipse(cx, cy, 0.42, 0.42), '#ffd23f')
          s.glow(s.ellipse(cx, cy, 0.42, 0.42), '#ffe680')
          for (const d of [-1, 1]) {
            const eye = s.ellipse(cx + d * 0.14, cy + 0.1, 0.04, 0.07)
            s.fill(eye, INK)
            s.glow(eye, '#000')
          }
          const mouth = s.custom(
            (p) => {
              p.moveTo(cx - 0.2, cy - 0.11)
              p.quadraticCurveTo(cx, cy - 0.32, cx + 0.2, cy - 0.11)
              p.quadraticCurveTo(cx, cy - 0.24, cx - 0.2, cy - 0.11)
              p.closePath()
            },
            pts(cx - 0.2, cy - 0.32, cx + 0.2, cy - 0.11)
          )
          s.fill(mouth, INK)
          s.glow(mouth, '#000')
        },
      },
      { x: 0.35, y: 3.68, w: 1.5, h: 0.4, color: '#7b2fbf', text: 'I ♥ NY', ink: '#ffffff', size: 0.22, font: 'Georgia, serif' },
    ],
  },
  {
    base: '#6f7f99',
    boards: [
      {
        x: 0.15,
        y: 0.5,
        w: 1.9,
        h: 1.5,
        color: '#0b3d91',
        text: 'MARKETS ▲',
        ink: '#7dffb0',
        size: 0.2,
        art: (s, b) => {
          const line: Pt[] = []
          for (let k = 0; k <= 12; k++) line.push([b.x + 0.15 + k * 0.13, b.y + 0.3 + 0.1 * Math.sin(k * 1.3) + k * 0.05])
          s.line(line, 0.025, '#7dffb0', 0)
          if (s.glowCtx) {
            s.glowCtx.strokeStyle = '#7dffb0'
            s.glowCtx.lineWidth = 0.03
            s.glowCtx.beginPath()
            line.forEach(([x, y], i) => (i ? s.glowCtx!.lineTo(x, y) : s.glowCtx!.moveTo(x, y)))
            s.glowCtx.stroke()
          }
        },
      },
      { x: 0.2, y: 2.15, w: 1.8, h: 0.8, color: '#ff7a1a', text: 'SNEAKERS', ink: '#1a1a1a', size: 0.2 },
      { x: 0.3, y: 3.1, w: 1.6, h: 0.75, color: '#18a558', text: 'PIZZA $1', ink: '#fff7e6', size: 0.19, bulbs: true },
    ],
  },
  {
    base: '#a0705a',
    boards: [
      // The blade sign; hotelTower letters it.
      { x: 0.15, y: 0.5, w: 1.0, h: 3.5, color: '#e8364f' },
      { x: 1.25, y: 0.5, w: 0.95, h: 1.0, color: '#f7c948', text: 'SALE', ink: '#c8202f', size: 0.24 },
      { x: 1.25, y: 1.65, w: 0.95, h: 1.0, color: '#00a6a6', text: 'WOW', ink: '#ffffff', size: 0.26 },
      { x: 1.25, y: 2.8, w: 0.95, h: 1.0, color: '#1d1c24', text: 'SHOW', ink: '#ff5ec4', size: 0.24 },
    ],
  },
  {
    base: '#7d8a8f',
    boards: [
      {
        x: 0.15,
        y: 0.5,
        w: 2.1,
        h: 1.4,
        color: '#ffd23f',
        text: 'CANDY',
        ink: '#c8202f',
        size: 0.3,
        art: (s, b) => {
          for (let k = 0; k < 14; k++) {
            s.fill(s.ellipse(b.x + s.r(0.1, b.w - 0.1), b.y + s.r(0.1, b.h - 0.1), 0.06, 0.04), s.pick(['#c8202f', '#2a9df4', '#18a558', '#ff7a1a', '#7b2fbf']))
          }
        },
      },
      { x: 0.25, y: 2.05, w: 1.9, h: 0.45, color: '#16161c', text: '• LIVE • TONIGHT •', ink: '#ff5ec4', size: 0.13 },
      { x: 0.15, y: 2.65, w: 2.1, h: 1.3, color: '#e8364f', text: 'BROADWAY', ink: '#fff4dc', size: 0.26, bulbs: true },
    ],
  },
]

// The tall vertical sign on the third tower spells HOTEL.
export function hotelTower(s: Sketch) {
  billboardTower(s, TOWERS[2].base, TOWERS[2].boards)
  'HOTEL'.split('').forEach((ch, k) => s.text(ch, 0.65, 3.45 - k * 0.66, 0.42, { color: '#fff7e6', glow: '#fff7e6', font: SANS }))
}

// ---------------------------------------------------------------------------
// The recruiting station on the traffic island, its flag in neon tubes.

export function recruitingStation(s: Sketch) {
  const W = s.w
  const box = s.rect(0.08, 0, W - 0.16, 0.95, 0.003)
  const flag = s.rect(0.18, 0.22, W - 0.36, 0.6, 0.002)
  const roof = s.rect(0.03, 0.95, W - 0.06, 0.07, 0.002)
  paint(s, [
    { shape: box, color: C.steel, ink: 0.02 },
    {
      shape: flag,
      color: '#f4f1ea',
      ink: 0.014,
      detail: () => {
        const fw = W - 0.36
        for (let k = 0; k < 7; k++) {
          const y = 0.22 + 0.6 - (k + 0.5) * (0.6 / 7)
          s.line([[0.18 + (k < 4 ? fw * 0.42 : 0.02), y], [0.18 + fw - 0.02, y]], 0.03, '#e8323f', 0)
          s.glow(s.rect(0.18 + (k < 4 ? fw * 0.42 : 0.02), y - 0.015, fw * (k < 4 ? 0.56 : 0.96), 0.03, 0), '#ff4a5a')
        }
        const canton = s.rect(0.2, 0.52, fw * 0.4, 0.28, 0)
        s.fill(canton, '#2a4fb0')
        s.glow(canton, '#2a4fb0')
        for (let k = 0; k < 9; k++) {
          const star = s.ellipse(0.25 + (k % 3) * fw * 0.12, 0.57 + Math.floor(k / 3) * 0.08, 0.015, 0.015)
          s.fill(star, '#ffffff')
          s.glow(star, '#ffffff')
        }
      },
    },
    { shape: roof, color: C.steelDark, ink: 0.012 },
  ])
  s.text('ARMED FORCES', W / 2, 0.07, 0.08, { color: INK, font: SANS })
}

// ---------------------------------------------------------------------------
// The red steps over the TKTS booth, full of people taking it all in.

export function tktsSteps(s: Sketch) {
  const W = s.w
  const steps = 6
  const rise = 0.24
  const base = 0.42
  const stairs = s.rect(0.05, base, W - 0.1, steps * rise, 0.002)
  const booth = s.rect(0.35, 0, W - 0.7, base, 0.002)
  paint(s, [
    {
      shape: stairs,
      color: '#a8222e',
      ink: 0.022,
      detail: () => {
        // Bright glowing risers under darker treads.
        for (let k = 0; k < steps; k++) {
          const y = base + k * rise
          const riser = s.rect(0.05, y, W - 0.1, rise * 0.55, 0)
          s.fill(riser, '#ff4a50')
          s.glow(riser, '#ff3b46')
          s.line([[0.05, y + rise * 0.55], [W - 0.05, y + rise * 0.55]], 0.012, rgba(INK, 0.6), 0)
        }
        s.hatch(s.rect(W - 0.3, base, 0.25, steps * rise, 0), { angle: 1.2, gap: 0.035, alpha: 0.25 })
      },
    },
    {
      shape: booth,
      color: '#1d1c24',
      ink: 0.016,
      flat: true,
      detail: () => s.text('TKTS', W / 2, 0.1, 0.24, { color: '#ff4a50', glow: '#ff4a50', font: SANS }),
    },
  ])
  // People sitting along the steps, taking it all in.
  const coats = ['#3f6fb0', '#f7c948', '#18a558', '#f4f1ea', '#7b2fbf', '#ff7a1a', '#2f4566', '#e8364f']
  for (let k = 1; k < steps; k++) {
    const y = base + k * rise - rise * 0.45
    for (let x = 0.3 + s.r(0, 0.25); x < W - 0.25; x += s.r(0.3, 0.6)) {
      const body = s.custom(
        (p) => {
          p.moveTo(x - 0.07, y)
          p.lineTo(x + 0.07, y)
          p.quadraticCurveTo(x + 0.08, y + 0.17, x, y + 0.18)
          p.quadraticCurveTo(x - 0.08, y + 0.17, x - 0.07, y)
          p.closePath()
        },
        pts(x - 0.08, y, x + 0.08, y + 0.18)
      )
      const head = s.ellipse(x, y + 0.23, 0.048, 0.052)
      s.border([body, head], 0.025)
      s.fill(body, s.pick(coats))
      s.ink(body, 0.008)
      s.fill(head, s.pick([C.skin, C.skinDark, '#e0b48c']))
      s.ink(head, 0.008)
      // Silhouetted against the lit steps after dark.
      s.glow(body, '#000')
      s.glow(head, '#000')
      if (s.rnd() < 0.35) {
        // Holding up a phone.
        const phone = s.rect(x + 0.05, y + 0.26, 0.035, 0.055, 0)
        s.fill(phone, '#1d1c24')
        s.glow(phone, '#cfe6ff')
      }
    }
  }
}

// ---------------------------------------------------------------------------
// A Broadway house: a bulb-lit marquee and a blade sign up the front.

export function theaterMarquee(s: Sketch) {
  const W = s.w
  const brick = '#b0563f'
  const facade = s.poly(pts(0.1, 0, W - 0.1, 0, W - 0.1, 2.7, W / 2 + 0.3, 2.95, W / 2 - 0.3, 2.95, 0.1, 2.7), 0.003)
  const blade = s.rect(0.2, 1.35, 0.42, 1.55, 0.003)
  const marquee = s.rect(0.05, 0.9, W - 0.1, 0.45, 0.003)
  const arch = s.custom(
    (p) => {
      p.moveTo(1.0, 1.6)
      p.lineTo(1.0, 2.15)
      p.arc(1.45, 2.15, 0.45, Math.PI, 0, true)
      p.lineTo(1.9, 1.6)
      p.closePath()
    },
    pts(1.0, 1.6, 1.9, 2.6)
  )
  paint(s, [
    {
      shape: facade,
      color: brick,
      ink: 0.024,
      detail: () => {
        for (let y = 0.15; y < 2.7; y += 0.12) s.line([[0.1, y], [W - 0.1, y]], 0.005, rgba(INK, 0.2), 0)
        const doors = s.rect(0.5, 0, W - 1.0, 0.75, 0)
        s.fill(doors, '#4a2e28')
        s.glow(doors, '#b98a4a')
        for (let x = 0.62; x < W - 0.5; x += 0.3) {
          s.line([[x, 0], [x, 0.75]], 0.012, '#e2b45c', 0)
          s.glow(s.rect(x - 0.012, 0, 0.024, 0.75, 0), '#000')
        }
        // Posters either side.
        for (const x of [0.18, W - 0.42]) {
          const poster = s.rect(x, 0.15, 0.24, 0.42, 0)
          s.fill(poster, s.pick(['#f7c948', '#7b2fbf', '#18a558']))
          s.ink(poster, 0.008)
        }
      },
    },
    {
      shape: arch,
      color: '#3d4a63',
      ink: 0.016,
      detail: () => {
        s.glow(arch, '#c99a5c')
        s.line([[1.45, 1.6], [1.45, 2.6]], 0.012, '#e9dcc0', 0)
        s.line([[1.0, 2.1], [1.9, 2.1]], 0.012, '#e9dcc0', 0)
      },
    },
    {
      shape: marquee,
      color: '#f3e9cf',
      ink: 0.02,
      detail: () => {
        s.glow(marquee, '#a8875a')
        s.text('NOW PLAYING', W / 2, 1.18, 0.1, { color: C.redDark, font: SANS, spacing: 3 })
        s.text('POP-UP!', W / 2, 0.97, 0.15, { color: INK, font: 'Georgia, serif' })
        for (let k = 0; k <= 22; k++) {
          for (const y of [0.93, 1.32]) {
            const bulb = s.ellipse(0.1 + ((W - 0.2) * k) / 22, y, 0.016, 0.016)
            s.fill(bulb, '#fff1c2')
            s.glow(bulb, '#fff1c2')
          }
        }
      },
    },
    {
      shape: blade,
      color: '#c8202f',
      ink: 0.02,
      detail: () => {
        s.glow(blade, '#7a1018')
        'PALACE'.split('').forEach((ch, k) => s.text(ch, 0.41, 2.68 - k * 0.24, 0.19, { color: '#fff1c2', glow: '#fff1c2', font: SANS }))
      },
    },
  ])
}

// ---------------------------------------------------------------------------
// Tourists, and a Statue of Liberty in green face paint.

export function tourists(s: Sketch) {
  const parts: Part[] = [
    ...person(s, 0.35, 0, 1.15, { coat: '#3f6fb0', hold: 'balloon', legs: '#2f4566' }),
    ...person(s, 0.9, 0, 1.3, { coat: '#f7c948', hat: 'beanie', hold: 'paper', rainy: true }),
    ...person(s, 1.75, 0, 1.25, { coat: '#7fb59f', skin: '#8fc4a8', legs: '#7fb59f', skirt: true, keep: true }),
    ...person(s, 2.3, 0, 1.05, { coat: '#e8364f', hair: '#a0522d', skirt: true, hold: 'icecream' }),
  ]
  paint(s, parts, 0.05)
  // Liberty's crown and torch.
  const crown: Shape = s.poly(pts(1.66, 1.2, 1.7, 1.33, 1.73, 1.22, 1.76, 1.36, 1.79, 1.22, 1.82, 1.33, 1.85, 1.2), 0)
  s.border([crown], 0.03)
  s.fill(crown, '#7fb59f')
  s.ink(crown, 0.008)
  s.strip([[1.88, 0.9], [1.98, 1.42]], 0.035, 0.03, '#7fb59f')
  const flame = s.ellipse(1.99, 1.48, 0.04, 0.06)
  s.fill(flame, '#ffb347')
  s.glow(flame, '#ffb347')
  s.ink(flame, 0.008)
}
