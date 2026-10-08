import { INK, Pt, Shape, Sketch, shade } from './sketch'
import { C } from './palette'

export type Part = {
  shape: Shape
  color?: string
  flat?: boolean
  ink?: number | false
  inkColor?: string
  hatch?: { angle?: number; gap?: number; alpha?: number; width?: number }
  noBorder?: boolean
  detail?: () => void
}

// Border every part, then paint them back-to-front.
export function paint(s: Sketch, parts: Part[], border = 0.075) {
  s.border(
    parts.filter((p) => !p.noBorder).map((p) => p.shape),
    border
  )
  for (const p of parts) {
    if (p.color) p.flat ? s.fill(p.shape, p.color) : s.wash(p.shape, p.color)
    p.detail?.()
    if (p.hatch) s.hatch(p.shape, p.hatch)
    if (p.ink !== false) s.ink(p.shape, p.ink ?? 0.028, p.inkColor ?? INK)
  }
}

// Classic NYC rooftop water tower: barrel, cone roof, stilts.
export function waterTower(s: Sketch, x: number, y: number, size = 1): Part[] {
  const w = 0.42 * size
  const legH = 0.22 * size
  const bodyH = 0.38 * size
  const legs = s.poly(
    [
      [x + w * 0.1, y],
      [x + w * 0.9, y],
      [x + w * 0.86, y + legH],
      [x + w * 0.14, y + legH],
    ],
    0
  )
  const body = s.poly(
    [
      [x, y + legH],
      [x + w, y + legH],
      [x + w * 1.02, y + legH + bodyH * 0.5],
      [x + w, y + legH + bodyH],
      [x, y + legH + bodyH],
      [x - w * 0.02, y + legH + bodyH * 0.5],
    ],
    0.004
  )
  const roof = s.poly(
    [
      [x - w * 0.06, y + legH + bodyH],
      [x + w * 1.06, y + legH + bodyH],
      [x + w / 2, y + legH + bodyH + 0.24 * size],
    ],
    0.003
  )
  const wood = '#a8784f'
  return [
    {
      // Stilts and cross bracing, cut as thin paper strips.
      shape: legs,
      noBorder: true,
      ink: false,
      detail: () => {
        s.strip([[x + w * 0.12, y], [x + w * 0.15, y + legH]], 0.03)
        s.strip([[x + w * 0.88, y], [x + w * 0.85, y + legH]], 0.03)
        s.strip([[x + w * 0.5, y], [x + w * 0.5, y + legH]], 0.022)
        s.strip([[x + w * 0.14, y + 0.02], [x + w * 0.86, y + legH - 0.02]], 0.012)
        s.strip([[x + w * 0.86, y + 0.02], [x + w * 0.14, y + legH - 0.02]], 0.012)
      },
    },
    {
      shape: body,
      color: wood,
      ink: 0.022,
      detail: () => {
        for (let i = 1; i < 4; i++) {
          const yy = y + legH + (bodyH * i) / 4
          s.line([[x - w * 0.01, yy], [x + w * 1.01, yy]], 0.012, shade(INK, 0.1))
        }
        for (let i = 1; i < 6; i++) {
          const xx = x + (w * i) / 6
          s.line([[xx, y + legH], [xx, y + legH + bodyH]], 0.006, 'rgba(60,35,25,0.5)')
        }
      },
      hatch: { angle: Math.PI / 2.4, gap: 0.035, alpha: 0.35 },
    },
    { shape: roof, color: '#7b5a45', ink: 0.022, hatch: { angle: -0.6, gap: 0.04, alpha: 0.3 } },
  ]
}

// Zig-zag fire escape hung on a facade.
export function fireEscape(s: Sketch, x: number, y0: number, w: number, floors: number, fh: number) {
  for (let f = 0; f < floors; f++) {
    const y = y0 + f * fh
    s.line([[x, y], [x + w, y]], 0.022)
    s.line([[x, y + fh * 0.32], [x + w, y + fh * 0.32]], 0.01)
    for (let i = 0; i <= 6; i++) {
      const xx = x + (w * i) / 6
      s.line([[xx, y], [xx, y + fh * 0.32]], 0.007)
    }
    if (f < floors - 1) {
      const dir = f % 2 === 0
      s.line(
        [
          [dir ? x + w * 0.15 : x + w * 0.85, y],
          [dir ? x + w * 0.8 : x + w * 0.2, y + fh],
        ],
        0.014
      )
    }
  }
}

// Striped storefront awning.
export function awning(s: Sketch, x: number, y: number, w: number, color: string, stripes = true): Part {
  const h = 0.16
  const shape = s.poly(
    [
      [x - 0.04, y],
      [x + w + 0.04, y],
      [x + w, y + h],
      [x, y + h],
    ],
    0.003
  )
  return {
    shape,
    color,
    ink: 0.018,
    detail: () => {
      if (!stripes) return
      const n = Math.max(3, Math.round(w / 0.12))
      for (let i = 0; i < n; i += 2) {
        const sx = x - 0.04 + ((w + 0.08) * i) / n
        const sw = (w + 0.08) / n
        s.fill(
          s.poly(
            [
              [sx, y],
              [sx + sw, y],
              [sx + sw * 0.95, y + h],
              [sx + sw * 0.05, y + h],
            ],
            0
          ),
          '#fbf3e1',
          0.9
        )
      }
      // Scalloped valance.
      const c = s.ctx
      c.save()
      c.fillStyle = shade(color, -0.12)
      const sc = Math.max(4, Math.round(w / 0.09))
      for (let i = 0; i < sc; i++) {
        const cx = x - 0.04 + ((w + 0.08) * (i + 0.5)) / sc
        c.beginPath()
        c.arc(cx, y, (w + 0.08) / sc / 2, Math.PI, 0, false)
        c.fill()
      }
      c.restore()
    },
  }
}

// Cornice band with little brackets.
export function cornice(s: Sketch, x: number, y: number, w: number, color: string, h = 0.12): Part {
  const shape = s.rect(x - 0.05, y, w + 0.1, h, 0.003)
  return {
    shape,
    color: shade(color, -0.08),
    ink: 0.02,
    detail: () => {
      const n = Math.max(3, Math.round(w / 0.14))
      for (let i = 0; i <= n; i++) {
        const bx = x - 0.02 + ((w + 0.04) * i) / n
        s.line([[bx, y + 0.01], [bx, y + h * 0.65]], 0.012)
      }
      s.line([[x - 0.05, y + h * 0.7], [x + w + 0.05, y + h * 0.7]], 0.01)
    },
  }
}

export function door(s: Sketch, x: number, y: number, w: number, h: number, color = '#5a3a2c'): Part {
  const shape = s.custom(
    (p) => {
      p.moveTo(x, y)
      p.lineTo(x, y + h - w / 2)
      p.arc(x + w / 2, y + h - w / 2, w / 2, Math.PI, 0, true)
      p.lineTo(x + w, y)
      p.closePath()
    },
    [
      [x, y],
      [x + w, y + h],
    ]
  )
  return {
    shape,
    color,
    ink: 0.016,
    detail: () => {
      s.line([[x + w / 2, y], [x + w / 2, y + h - w / 2]], 0.008)
      s.fill(s.ellipse(x + w * 0.38, y + h * 0.42, 0.012, 0.012), C.ochre)
    },
  }
}

export function pts(...xs: number[]): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < xs.length; i += 2) out.push([xs[i], xs[i + 1]])
  return out
}
