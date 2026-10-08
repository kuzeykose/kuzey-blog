import { INK, Pt, Shape, Sketch, rgba, shade } from './sketch'
import { C } from './palette'
import { Part, awning, cornice, door, fireEscape, paint, waterTower } from './art-common'

// ---------------------------------------------------------------------------
// Far skyline: a hazy ridge of towers behind the landmarks.

type Far = { x: number; w: number; h: number; top: 'flat' | 'step' | 'pyramid' | 'spire' | 'wtc' | 'slim' | 'slant' }

const FAR: Far[] = [
  { x: 0.1, w: 0.9, h: 2.3, top: 'flat' },
  { x: 0.8, w: 0.7, h: 3.2, top: 'step' },
  { x: 1.45, w: 1.0, h: 4.95, top: 'wtc' },
  { x: 2.35, w: 0.8, h: 2.7, top: 'flat' },
  { x: 3.0, w: 0.62, h: 3.6, top: 'pyramid' },
  { x: 3.5, w: 1.0, h: 2.9, top: 'step' },
  { x: 4.35, w: 0.7, h: 4.0, top: 'spire' },
  { x: 4.95, w: 0.9, h: 2.4, top: 'flat' },
  { x: 5.75, w: 0.8, h: 3.3, top: 'step' },
  { x: 6.45, w: 0.62, h: 2.7, top: 'flat' },
  { x: 6.95, w: 1.0, h: 3.7, top: 'pyramid' },
  { x: 7.85, w: 0.8, h: 2.5, top: 'flat' },
  { x: 8.55, w: 0.5, h: 4.75, top: 'slim' },
  { x: 9.0, w: 0.9, h: 3.0, top: 'step' },
  { x: 9.8, w: 0.75, h: 3.9, top: 'slant' },
  { x: 10.45, w: 1.0, h: 2.6, top: 'flat' },
  { x: 11.3, w: 0.7, h: 3.25, top: 'step' },
  { x: 11.85, w: 0.65, h: 2.2, top: 'flat' },
]

function farOutline(b: Far): Pt[] {
  const { x, w, h } = b
  switch (b.top) {
    case 'step':
      return [
        [x, 0], [x + w, 0], [x + w, h - 0.45], [x + w * 0.85, h - 0.45], [x + w * 0.85, h - 0.2],
        [x + w * 0.68, h - 0.2], [x + w * 0.68, h], [x + w * 0.32, h], [x + w * 0.32, h - 0.2],
        [x + w * 0.15, h - 0.2], [x + w * 0.15, h - 0.45], [x, h - 0.45],
      ]
    case 'pyramid':
      return [[x, 0], [x + w, 0], [x + w, h - 0.55], [x + w / 2, h], [x, h - 0.55]]
    case 'spire':
      return [
        [x, 0], [x + w, 0], [x + w, h - 0.9], [x + w * 0.8, h - 0.9], [x + w * 0.8, h - 0.55],
        [x + w * 0.62, h - 0.55], [x + w / 2, h], [x + w * 0.38, h - 0.55], [x + w * 0.2, h - 0.55],
        [x + w * 0.2, h - 0.9], [x, h - 0.9],
      ]
    case 'wtc': {
      const top = h - 0.75
      return [
        [x, 0], [x + w, 0], [x + w, 0.5], [x + w * 0.8, top], [x + w * 0.53, top],
        [x + w * 0.515, h], [x + w * 0.485, h], [x + w * 0.47, top], [x + w * 0.2, top], [x, 0.5],
      ]
    }
    case 'slant':
      return [[x, 0], [x + w, 0], [x + w, h - 0.55], [x, h]]
    default:
      return [[x, 0], [x + w, 0], [x + w, h], [x, h]]
  }
}

export function farSkyline(s: Sketch) {
  const blue = '#4d5874'
  const order = FAR.map((b, i) => ({ b, i })).sort((a, b) => b.b.h - a.b.h)
  const shapes = new Map<number, Shape>()
  order.forEach(({ b, i }) => shapes.set(i, s.poly(farOutline(b), 0.006)))
  const parts: Part[] = order.map(({ b, i }) => {
    const shape = shapes.get(i)!
    const tone = [C.haze, C.hazeDark, C.hazeLight, '#b3bcd4', '#9eaac6'][i % 5]
    return {
      shape,
      color: tone,
      ink: 0.02,
      inkColor: blue,
      detail: () => {
        const cols = Math.max(2, Math.floor((b.w - 0.12) / 0.13))
        const top = b.top === 'flat' ? b.h - 0.15 : b.h - (b.top === 'wtc' ? 0.95 : 0.65)
        const rows = Math.max(1, Math.floor((top - 0.2) / 0.2))
        const gx = (b.w - 0.16 - cols * 0.06) / Math.max(1, cols - 1)
        s.windows(b.x + 0.08, 0.15, cols, rows, 0.06, 0.09, gx, 0.11, {
          color: shade(tone, -0.18),
          frame: false,
          lit: 0.4,
        })
        if (b.top === 'wtc') {
          s.line([[b.x + b.w / 2, 0.5], [b.x + b.w / 2, b.h - 0.75]], 0.012, blue)
          s.line([[b.x, 0.5], [b.x + b.w * 0.8, b.h - 0.75]], 0.008, rgba(blue, 0.6))
          s.line([[b.x + b.w, 0.5], [b.x + b.w * 0.2, b.h - 0.75]], 0.008, rgba(blue, 0.6))
          s.glow(s.ellipse(b.x + b.w / 2, b.h - 0.02, 0.04, 0.04), '#ffffff')
        }
        if (b.top === 'pyramid') {
          s.fill(
            s.poly([[b.x, b.h - 0.55], [b.x + b.w, b.h - 0.55], [b.x + b.w / 2, b.h]], 0),
            i % 2 ? '#d7b46a' : '#c99a5b',
            0.85
          )
          s.glow(s.poly([[b.x + 0.05, b.h - 0.52], [b.x + b.w - 0.05, b.h - 0.52], [b.x + b.w / 2, b.h - 0.05]], 0), '#e0b45c')
        }
        if (b.top === 'slim') {
          for (let y = 0.3; y < b.h - 0.1; y += 0.5) s.line([[b.x, y], [b.x + b.w, y]], 0.008, rgba(blue, 0.7))
        }
      },
      hatch: i % 3 === 0 ? { angle: 1.2, gap: 0.06, alpha: 0.18, width: 0.01 } : undefined,
    }
  })
  paint(s, parts, 0.06)
}

// ---------------------------------------------------------------------------
// Mid-rise row with water towers, fire escapes and shop signs.

type Mid = {
  x: number
  w: number
  h: number
  color: string
  tower?: number
  escape?: boolean
  sign?: string
  blade?: string
  deco?: boolean
  arches?: boolean
  awning?: string
}

const MID: Mid[] = [
  { x: 0.0, w: 1.5, h: 2.7, color: C.brick, tower: 0.25, escape: true, awning: C.green },
  { x: 1.5, w: 1.2, h: 3.35, color: C.sand, blade: 'HOTEL' },
  { x: 2.7, w: 1.7, h: 2.45, color: C.terracotta, sign: 'DELI', awning: C.red },
  { x: 4.4, w: 1.3, h: 3.6, color: C.cream, deco: true },
  { x: 5.7, w: 1.6, h: 2.85, color: C.brickDark, tower: 0.9, escape: true, awning: C.navy },
  { x: 7.3, w: 1.2, h: 3.15, color: C.ochre },
  { x: 8.5, w: 1.6, h: 2.55, color: C.slate, arches: true, sign: 'BOOKS' },
  { x: 10.1, w: 1.4, h: 3.4, color: C.brick, tower: 0.75, escape: true },
  { x: 11.5, w: 1.5, h: 2.7, color: C.sand, sign: 'PIZZA', awning: C.red },
]

export function midriseRow(s: Sketch) {
  const parts: Part[] = []
  for (const b of MID) {
    const { x, w, h } = b
    const outline: Pt[] = b.deco
      ? [
          [x, 0], [x + w, 0], [x + w, h - 0.55], [x + w - 0.14, h - 0.55], [x + w - 0.14, h - 0.3],
          [x + w - 0.3, h - 0.3], [x + w - 0.3, h], [x + 0.3, h], [x + 0.3, h - 0.3], [x + 0.14, h - 0.3],
          [x + 0.14, h - 0.55], [x, h - 0.55],
        ]
      : [[x, 0], [x + w, 0], [x + w, h], [x, h]]
    const body = s.poly(outline, 0.008)
    const floorH = 0.34
    const ground = 0.5
    const top = b.deco ? h - 0.6 : h - 0.2
    const rows = Math.floor((top - ground - 0.05) / floorH)
    const cols = Math.max(2, Math.floor((w - 0.16) / 0.26))
    const ww = b.arches ? 0.15 : 0.13
    const gx = (w - 0.3 - cols * ww) / Math.max(1, cols - 1)
    parts.push({
      shape: body,
      color: b.color,
      ink: 0.03,
      detail: () => {
        s.windows(x + 0.15, ground + 0.08, cols, rows, ww, 0.2, gx, floorH - 0.2, {
          arch: b.arches,
          lit: 0.55,
        })
        // Lintels above each window.
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const wx = x + 0.15 + i * (ww + gx)
            const wy = ground + 0.08 + j * floorH + 0.2
            s.line([[wx - 0.02, wy + 0.025], [wx + ww + 0.02, wy + 0.025]], 0.018, shade(b.color, -0.3))
          }
        }
        // Shop front.
        s.fill(s.rect(x + 0.1, 0.0, w - 0.2, ground - 0.12, 0), shade(C.window, 0.1))
        s.fill(s.rect(x + 0.14, 0.04, w - 0.28, ground - 0.2, 0), 'rgba(255,255,255,0.12)')
        s.glow(s.rect(x + 0.12, 0.02, w - 0.24, ground - 0.16, 0), '#ffcf7a')
        s.line([[x + w * 0.5, 0], [x + w * 0.5, ground - 0.12]], 0.012)
        s.line([[x + 0.05, ground - 0.1], [x + w - 0.05, ground - 0.1]], 0.02)
        if (b.deco) {
          for (let k = 1; k < 4; k++) {
            const px = x + (w * k) / 4
            s.line([[px, ground], [px, h - 0.6]], 0.01, rgba(INK, 0.5))
          }
          s.fill(s.rect(x + 0.4, h - 0.22, w - 0.8, 0.1, 0), C.ochre)
        }
        if (b.escape) fireEscape(s, x + w * 0.22, ground + 0.08, w * 0.56, rows, floorH)
      },
      hatch: { angle: 1.15, gap: 0.06, alpha: 0.12, width: 0.01 },
    })
    if (!b.deco) parts.push(cornice(s, x, h - 0.12, w, b.color))
    if (b.awning) parts.push(awning(s, x + 0.12, ground - 0.24, w - 0.24, b.awning))
    if (b.sign) {
      const sw = Math.min(w - 0.3, 0.16 * b.sign.length + 0.2)
      const sign = s.rect(x + (w - sw) / 2, ground - 0.06 + (b.awning ? 0.16 : 0), sw, 0.2, 0.004)
      parts.push({
        shape: sign,
        color: '#f4ead2',
        ink: 0.016,
        detail: () => {
          s.text(b.sign!, x + w / 2, ground - 0.01 + (b.awning ? 0.16 : 0), 0.15, {
            color: C.redDark,
            glow: '#ff7a5c',
          })
        },
      })
    }
    if (b.blade) {
      const bx = x + w - 0.08
      const len = 0.24 * b.blade.length + 0.1
      const blade = s.rect(bx, h - 0.6 - len, 0.24, len, 0.004)
      parts.push({
        shape: blade,
        color: C.red,
        ink: 0.02,
        detail: () => {
          b.blade!.split('').forEach((ch, k) => {
            s.text(ch, bx + 0.12, h - 0.6 - 0.28 - k * 0.24, 0.19, { color: '#fff4dc', glow: '#ff6a4a' })
          })
        },
      })
    }
    if (b.tower !== undefined) parts.push(...waterTower(s, x + b.tower * (w - 0.45), h, 1))
  }
  paint(s, parts)
}

// ---------------------------------------------------------------------------
// Brownstone row houses with stoops.

type House = {
  w: number
  color: string
  floors: number
  stoop?: 'left' | 'right'
  tenement?: boolean
  shop?: { text: string; color: string }
  tower?: boolean
  cat?: boolean
}

export function brownstones(s: Sketch, houses: House[]) {
  const parts: Part[] = []
  let x = 0
  const garden = 0.42
  const fh = 0.5
  for (const hs of houses) {
    const h = garden + hs.floors * fh + 0.08
    const x0 = x
    const body = s.rect(x0, 0, hs.w, h, 0.006)
    const cols = hs.w > 1.5 ? 3 : 2
    const ww = 0.17
    const gx = (hs.w - 0.4 - cols * ww) / (cols - 1)
    parts.push({
      shape: body,
      color: hs.color,
      ink: 0.03,
      detail: () => {
        for (let f = 0; f < hs.floors; f++) {
          const wy = garden + 0.1 + f * fh
          s.windows(x0 + 0.2, wy, cols, 1, ww, 0.3, gx, 0, { lit: 0.6 })
          for (let i = 0; i < cols; i++) {
            const wx = x0 + 0.2 + i * (ww + gx)
            // Stone lintel and sill.
            s.fill(s.rect(wx - 0.03, wy + 0.31, ww + 0.06, 0.05, 0.002), shade(hs.color, hs.tenement ? 0.35 : 0.2))
            s.line([[wx - 0.03, wy + 0.31], [wx + ww + 0.03, wy + 0.31]], 0.01)
            s.line([[wx - 0.02, wy - 0.01], [wx + ww + 0.02, wy - 0.01]], 0.016)
          }
        }
        // Garden-level windows with iron grilles.
        if (!hs.shop) {
          for (let i = 0; i < 2; i++) {
            const gx0 = x0 + (hs.stoop === 'left' ? hs.w * 0.55 : 0.15) + i * 0.3
            s.fill(s.rect(gx0, 0.1, 0.2, 0.2, 0), C.window)
            s.glow(s.rect(gx0, 0.1, 0.2, 0.2, 0), '#ffc861')
            for (let k = 1; k < 4; k++) s.line([[gx0 + k * 0.05, 0.1], [gx0 + k * 0.05, 0.3]], 0.008)
          }
        }
        if (hs.tenement) fireEscape(s, x0 + hs.w * 0.25, garden + 0.08, hs.w * 0.5, hs.floors, fh)
        if (hs.cat) {
          // A cat sitting in the second floor window.
          const cx = x0 + 0.2 + ww / 2
          const cy = garden + 0.1 + fh
          const c = s.ctx
          c.save()
          c.fillStyle = INK
          c.beginPath()
          c.ellipse(cx, cy + 0.06, 0.05, 0.06, 0, 0, Math.PI * 2)
          c.ellipse(cx, cy + 0.14, 0.035, 0.035, 0, 0, Math.PI * 2)
          c.fill()
          c.beginPath()
          c.moveTo(cx - 0.035, cy + 0.15)
          c.lineTo(cx - 0.03, cy + 0.2)
          c.lineTo(cx - 0.01, cy + 0.17)
          c.moveTo(cx + 0.035, cy + 0.15)
          c.lineTo(cx + 0.03, cy + 0.2)
          c.lineTo(cx + 0.01, cy + 0.17)
          c.fill()
          c.restore()
        }
      },
      hatch: { angle: 1.1, gap: 0.055, alpha: 0.14, width: 0.01 },
    })
    parts.push(cornice(s, x0, h - 0.06, hs.w, hs.color, 0.14))

    if (hs.shop) {
      parts.push({
        shape: s.rect(x0 + 0.1, 0.0, hs.w - 0.2, garden - 0.04, 0.003),
        color: C.window,
        ink: 0.02,
        detail: () => {
          s.glow(s.rect(x0 + 0.12, 0.02, hs.w - 0.24, garden - 0.1, 0), '#ffd27a')
          s.fill(s.rect(x0 + 0.16, 0.05, 0.25, 0.22, 0), 'rgba(255,255,255,0.16)')
          s.line([[x0 + hs.w * 0.6, 0], [x0 + hs.w * 0.6, garden - 0.06]], 0.012)
        },
      })
      parts.push(awning(s, x0 + 0.08, garden - 0.12, hs.w - 0.16, hs.shop.color))
      parts.push({
        shape: s.rect(x0 + 0.12, garden + 0.04, hs.w - 0.24, 0.16, 0.003),
        color: '#f6ecd4',
        ink: 0.015,
        detail: () =>
          s.text(hs.shop!.text, x0 + hs.w / 2, garden + 0.08, 0.11, {
            color: hs.shop!.color,
            glow: '#ffd27a',
            font: 'Helvetica, Arial, sans-serif',
          }),
      })
    }

    if (hs.stoop) {
      // Stoop: stairs up to the parlor floor door, with curly railings.
      const left = hs.stoop === 'left'
      const dx = left ? x0 + 0.12 : x0 + hs.w - 0.62
      parts.push(door(s, dx + 0.15, garden + 0.02, 0.2, 0.42))
      const stoop = s.poly(
        [
          [dx, 0],
          [dx + 0.5, 0],
          [dx + 0.46, garden + 0.02],
          [dx + 0.04, garden + 0.02],
        ],
        0.004
      )
      parts.push({
        shape: stoop,
        color: shade(hs.color, -0.05),
        ink: 0.02,
        detail: () => {
          for (let k = 1; k < 6; k++) {
            const yy = (garden * k) / 6
            s.line([[dx + 0.02, yy], [dx + 0.48, yy]], 0.01)
          }
        },
        hatch: { angle: 0.3, gap: 0.04, alpha: 0.2 },
      })
      for (const side of [0, 1]) {
        const rx = side ? dx + 0.5 : dx
        parts.push({
          shape: s.custom(
            (p) => {
              p.moveTo(rx, 0)
              p.lineTo(rx, 0.25)
              p.quadraticCurveTo(rx + (side ? 0.06 : -0.06), 0.4, rx + (side ? -0.03 : 0.03), garden + 0.2)
            },
            [
              [rx - 0.06, 0],
              [rx + 0.06, garden + 0.2],
            ]
          ),
          ink: 0.018,
          noBorder: true,
        })
      }
    }
    if (hs.tower) parts.push(...waterTower(s, x0 + hs.w * 0.55, h + 0.08, 0.95))
    x += hs.w
  }
  paint(s, parts)
}

export const LEFT_HOUSES: House[] = [
  { w: 1.75, color: C.brick, floors: 4, tenement: true, shop: { text: 'BODEGA', color: C.greenDark }, tower: true },
  { w: 1.6, color: C.brownstone, floors: 3, stoop: 'right', cat: true },
]

export const RIGHT_HOUSES: House[] = [
  { w: 1.6, color: C.brown, floors: 3, stoop: 'left' },
  { w: 1.75, color: C.terracotta, floors: 4, tenement: true, shop: { text: 'COFFEE', color: C.redDark }, tower: true },
]

// ---------------------------------------------------------------------------
// The Flatiron, seen head-on from its narrow prow with both sides receding.

export function flatiron(s: Sketch) {
  const W = s.w
  const mid = W / 2
  const pw = 0.13
  const L = mid - pw
  const R = mid + pw
  const prowTop = 4.4
  const sideTop = 3.85
  const topL = (x: number) => sideTop + ((prowTop - sideTop) * x) / L
  const topR = (x: number) => prowTop - ((prowTop - sideTop) * (x - R)) / (W - R)
  const top = (x: number) => (x <= L ? topL(x) : x >= R ? topR(x) : prowTop)

  const silhouette = s.poly(
    [
      [0, 0],
      [W, 0],
      [W, sideTop],
      [R, prowTop],
      [mid, prowTop + 0.04],
      [L, prowTop],
      [0, sideTop],
    ],
    0.003
  )
  const face = (x0: number, x1: number) =>
    s.poly([[x0, 0], [x1, 0], [x1, top(x1)], [x0, top(x0)]], 0)
  const leftFace = face(0, L)
  const prow = face(L, R)
  const rightFace = face(R, W)
  const stone = '#ead8b4'
  const terra = '#d9a77c'

  const quad = (x0: number, x1: number, f0: number, f1: number) =>
    s.poly([[x0, top(x0) * f0], [x1, top(x1) * f0], [x1, top(x1) * f1], [x0, top(x0) * f1]], 0)

  const windows = (x0: number, x1: number, cols: number) => {
    const rows = 16
    for (let j = 2; j < rows - 1; j++) {
      const f0 = (j + 0.22) / rows
      const f1 = (j + 0.7) / rows
      for (let i = 0; i < cols; i++) {
        const a = x0 + ((x1 - x0) * (i + 0.28)) / cols
        const b = x0 + ((x1 - x0) * (i + 0.72)) / cols
        const win = quad(a, b, f0, f1)
        s.fill(win, s.rnd() < 0.2 ? C.windowLight : C.window)
        if (s.rnd() < 0.5) s.glow(win, '#ffd27a')
      }
    }
    // Floor bands, a terracotta crown and a rusticated base.
    for (const j of [2, 5, 11]) {
      s.fill(quad(x0, x1, j / rows - 0.004, j / rows + 0.006), rgba(INK, 0.35))
    }
    s.fill(quad(x0, x1, 12.6 / rows, 15 / rows), rgba(terra, 0.55))
    s.fill(quad(x0, x1, 0, 2 / rows), rgba('#b89b78', 0.6))
    for (let i = 0; i < cols; i++) {
      const a = x0 + ((x1 - x0) * (i + 0.2)) / cols
      const b = x0 + ((x1 - x0) * (i + 0.8)) / cols
      const shop = quad(a, b, 0.2 / rows, 1.6 / rows)
      s.fill(shop, C.window)
      s.glow(shop, '#ffd889')
    }
  }

  paint(s, [
    {
      shape: silhouette,
      color: stone,
      ink: 0.03,
      detail: () => {
        s.wash(leftFace, stone)
        windows(0, L, 5)
        s.wash(rightFace, shade(stone, -0.14))
        windows(R, W, 5)
        s.hatch(rightFace, { angle: 1.25, gap: 0.045, alpha: 0.3 })
        s.wash(prow, shade(stone, 0.08), { edge: 0 })
        for (let y = 0.5; y < prowTop - 0.4; y += 0.275) {
          s.fill(s.rect(mid - 0.045, y, 0.09, 0.14, 0), C.window)
        }
        // Heavy cornice tracing the roofline.
        const band = (x0: number, x1: number) =>
          s.poly([[x0, top(x0) - 0.2], [x1, top(x1) - 0.2], [x1, top(x1)], [x0, top(x0)]], 0)
        s.fill(band(0, L), shade(terra, -0.1))
        s.fill(band(L, R), terra)
        s.fill(band(R, W), shade(terra, -0.25))
        for (let x = 0.05; x < W; x += 0.09) {
          s.line([[x, top(x) - 0.2], [x, top(x) - 0.13]], 0.01, rgba(INK, 0.6), 0)
        }
        s.line([[0, top(0) - 0.2], [L, top(L) - 0.2], [R, top(R) - 0.2], [W, top(W) - 0.2]], 0.014)
        s.line([[L, 0], [L, top(L)]], 0.016)
        s.line([[R, 0], [R, top(R)]], 0.016)
      },
    },
  ])
  // A little flag on the prow.
  s.strip([[mid, prowTop + 0.04], [mid, prowTop + 0.36]], 0.012, 0.035)
  const flag = s.poly([[mid, prowTop + 0.36], [mid + 0.2, prowTop + 0.31], [mid, prowTop + 0.24]], 0)
  s.border([flag], 0.03)
  s.fill(flag, C.red)
  s.ink(flag, 0.01)
}

// ---------------------------------------------------------------------------
// Times Square tower wrapped in billboards, with the New Year's ball on top.

export function timesSquare(s: Sketch) {
  const W = s.w
  const tower = s.poly(
    [
      [0.4, 0],
      [W - 0.4, 0],
      [W - 0.4, 4.15],
      [W - 0.6, 4.15],
      [W - 0.6, 4.45],
      [0.6, 4.45],
      [0.6, 4.15],
      [0.4, 4.15],
    ],
    0.004
  )
  const mast = s.rect(W / 2 - 0.025, 4.45, 0.05, 0.3, 0)
  const ball = s.ellipse(W / 2, 4.75, 0.13, 0.13)
  const boards: { x: number; y: number; w: number; h: number; color: string; text: string; ink: string; glow: string; size: number }[] = [
    { x: 0.15, y: 0.5, w: W - 0.3, h: 0.7, color: C.red, text: 'BROADWAY', ink: '#fff4dc', glow: '#fff1d6', size: 0.27 },
    { x: 0.3, y: 1.28, w: 0.85, h: 0.6, color: C.navy, text: 'SHOW', ink: '#ffd36b', glow: '#ffd36b', size: 0.2 },
    { x: 1.2, y: 1.28, w: W - 1.5, h: 0.6, color: C.taxi, text: '★★★', ink: C.redDark, glow: '#000000', size: 0.2 },
    { x: 0.2, y: 1.96, w: W - 0.4, h: 0.62, color: C.greenDark, text: 'TICKETS', ink: '#f8f1dd', glow: '#effff0', size: 0.24 },
    { x: 0.4, y: 2.66, w: W - 0.8, h: 0.34, color: '#2b2733', text: '• NEWS • NYC •', ink: '#ffb347', glow: '#ffb347', size: 0.15 },
    { x: 0.3, y: 3.08, w: W - 0.6, h: 0.85, color: '#c95c8f', text: 'I ♥ NY', ink: '#fff4dc', glow: '#fff3f8', size: 0.3 },
  ]
  const boardShapes = boards.map((b) => s.rect(b.x, b.y, b.w, b.h, 0.004))
  s.border([tower, mast, ball, ...boardShapes], 0.075)
  s.wash(tower, C.steel)
  s.windows(0.55, 4.0 - 0.1, 5, 1, 0.12, 0.12, 0.12, 0, { lit: 0.8 })
  s.ink(tower, 0.03)
  s.fill(s.rect(0.5, 0, W - 1, 0.42, 0), C.window)
  s.glow(s.rect(0.5, 0, W - 1, 0.42, 0), '#ffe2a3')
  s.ink(s.rect(0.5, 0, W - 1, 0.42, 0), 0.016)
  boards.forEach((b, i) => {
    const sh = boardShapes[i]
    s.wash(sh, b.color, { edge: 0.15 })
    // Boards glow in their own colour; the lettering glows brighter on top.
    s.glow(sh, shade(b.color, -0.35))
    s.text(b.text, b.x + b.w / 2, b.y + b.h / 2 - b.size * 0.36, b.size, {
      color: b.ink,
      glow: b.glow,
      font: b.text === 'BROADWAY' || b.text === 'TICKETS' ? 'Helvetica, Arial, sans-serif' : undefined,
    })
    // Marquee bulbs around the edges.
    if (i === 0 || i === 3) {
      for (let k = 0; k <= 18; k++) {
        const bx = b.x + 0.06 + ((b.w - 0.12) * k) / 18
        for (const by of [b.y + 0.05, b.y + b.h - 0.05]) {
          const bulb = s.ellipse(bx, by, 0.018, 0.018)
          s.fill(bulb, '#fff1c2')
          s.glow(bulb, '#fff1c2')
        }
      }
    }
    s.ink(sh, 0.02)
  })
  s.wash(mast, C.steelDark)
  s.ink(mast, 0.012)
  s.wash(ball, '#e8eef2', { edge: 0.1 })
  for (let k = -2; k <= 2; k++) s.line([[W / 2 - 0.12, 4.75 + k * 0.045], [W / 2 + 0.12, 4.75 + k * 0.045]], 0.006, rgba(INK, 0.5))
  s.glow(ball, '#d9f1ff')
  s.ink(ball, 0.016)
}
