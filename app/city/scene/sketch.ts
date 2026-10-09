import type { Season } from './season'

// A tiny "ink & watercolor" drawing kit on top of Canvas 2D.
//
// Every pop-up piece is painted into its own canvas. Coordinates are in world
// units with the origin at the bottom-left of the piece and y pointing up, so
// art can be described the way the paper stands on the page.

export type Pt = [number, number]

export type Shape = {
  path: Path2D
  pts: Pt[]
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export type Cutout = {
  canvas: HTMLCanvasElement
  glow: HTMLCanvasElement | null
  // Plane size in world units (art + paper margin, flush at the base).
  width: number
  height: number
  // Where the art's origin sits, measured from the plane's left/bottom edge.
  pad: number
  bottom: number
  // Low-res alpha mask used for picking.
  mask: Uint8Array
  maskW: number
  maskH: number
}

export const INK = '#2a2733'
export const PAPER = '#fbf6ea'

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Color helpers

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16
  )
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function shade(hex: string, amount: number) {
  const [r, g, b] = parseHex(hex)
  const f = (c: number) =>
    Math.round(
      amount >= 0 ? c + (255 - c) * amount : c * (1 + amount)
    )
  return `rgb(${f(r)},${f(g)},${f(b)})`
}

// The same as shade, as a hex colour (so it can be washed and shaded again).
export function tint(hex: string, amount: number) {
  const [r, g, b] = parseHex(hex)
  const f = (c: number) => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount))
  return `#${[r, g, b].map((c) => f(c).toString(16).padStart(2, '0')).join('')}`
}

export function rgba(hex: string, a: number) {
  const [r, g, b] = parseHex(hex)
  return `rgba(${r},${g},${b},${a})`
}

// ---------------------------------------------------------------------------

let grainCanvas: HTMLCanvasElement | null = null

function grain() {
  if (grainCanvas) return grainCanvas
  const c = document.createElement('canvas')
  c.width = c.height = 160
  const g = c.getContext('2d')!
  const img = g.createImageData(160, 160)
  const rnd = mulberry32(7)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rnd()
    const dark = v < 0.5
    img.data[i] = img.data[i + 1] = img.data[i + 2] = dark ? 40 : 255
    img.data[i + 3] = Math.floor(Math.abs(v - 0.5) * 2 * 26)
  }
  g.putImageData(img, 0, 0)
  grainCanvas = c
  return c
}

export type SketchOptions = {
  w: number
  h: number
  seed: number
  season?: Season
  pad?: number
  ppu?: number
  glow?: boolean
  // Leave a margin below the base too (for pieces that hang in the air).
  padBottom?: boolean
}

export class Sketch {
  readonly ctx: CanvasRenderingContext2D
  readonly glowCtx: CanvasRenderingContext2D | null
  readonly canvas: HTMLCanvasElement
  readonly glowCanvas: HTMLCanvasElement | null
  readonly rnd: () => number
  readonly w: number
  readonly h: number
  readonly pad: number
  readonly ppu: number
  readonly bottom: number
  private readonly time: Season
  // Set once the art asks which season it is: it then gets painted again
  // for each season.
  seasonal = false

  get season() {
    this.seasonal = true
    return this.time
  }

  constructor(o: SketchOptions) {
    this.time = o.season ?? 'autumn'
    this.w = o.w
    this.h = o.h
    this.pad = o.pad ?? 0.1
    this.bottom = o.padBottom ? this.pad : 0
    this.rnd = mulberry32(o.seed)
    const fullW = o.w + this.pad * 2
    const fullH = o.h + this.pad + this.bottom
    const max = 2048
    this.ppu = Math.min(o.ppu ?? Sketch.defaultPpu, max / fullW, max / fullH)

    this.canvas = document.createElement('canvas')
    this.canvas.width = Math.ceil(fullW * this.ppu)
    this.canvas.height = Math.ceil(fullH * this.ppu)
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false })!
    this.ctx.setTransform(
      this.ppu,
      0,
      0,
      -this.ppu,
      this.pad * this.ppu,
      (this.pad + this.h) * this.ppu
    )
    this.ctx.lineJoin = 'round'
    this.ctx.lineCap = 'round'

    if (o.glow) {
      const gp = this.ppu / 2
      this.glowCanvas = document.createElement('canvas')
      this.glowCanvas.width = Math.ceil(fullW * gp)
      this.glowCanvas.height = Math.ceil(fullH * gp)
      this.glowCtx = this.glowCanvas.getContext('2d')!
      this.glowCtx.fillStyle = '#000'
      this.glowCtx.fillRect(0, 0, this.glowCanvas.width, this.glowCanvas.height)
      this.glowCtx.setTransform(gp, 0, 0, -gp, this.pad * gp, (this.pad + this.h) * gp)
    } else {
      this.glowCanvas = null
      this.glowCtx = null
    }
  }

  static defaultPpu = 140

  r(a: number, b: number) {
    return a + (b - a) * this.rnd()
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.rnd() * arr.length)]
  }

  // ------------------------------------------------------------------ shapes

  // Closed polygon with a gentle hand-drawn wobble along long edges.
  poly(pts: Pt[], wobble = 0.012): Shape {
    const out: Pt[] = []
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]
      const b = pts[(i + 1) % pts.length]
      out.push(a)
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      const n = Math.floor(len / 0.35)
      if (wobble > 0 && n > 0) {
        const nx = -(b[1] - a[1]) / len
        const ny = (b[0] - a[0]) / len
        for (let k = 1; k <= n; k++) {
          const t = k / (n + 1)
          const o = (this.rnd() - 0.5) * 2 * wobble
          out.push([a[0] + (b[0] - a[0]) * t + nx * o, a[1] + (b[1] - a[1]) * t + ny * o])
        }
      }
    }
    const path = new Path2D()
    out.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])))
    path.closePath()
    return this.withBounds(path, pts)
  }

  rect(x: number, y: number, w: number, h: number, wobble = 0.01) {
    return this.poly(
      [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ],
      wobble
    )
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, rot = 0): Shape {
    const path = new Path2D()
    path.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2)
    const r = Math.max(rx, ry)
    return this.withBounds(path, [
      [cx - r, cy - r],
      [cx + r, cy + r],
    ])
  }

  // Shape from a free-form path; `bounds` are the points to size washes by.
  custom(build: (p: Path2D) => void, bounds: Pt[]): Shape {
    const path = new Path2D()
    build(path)
    return this.withBounds(path, bounds)
  }

  // Merge several shapes into one (for borders and clipping).
  union(shapes: Shape[]): Shape {
    const path = new Path2D()
    const pts: Pt[] = []
    shapes.forEach((s) => {
      path.addPath(s.path)
      pts.push([s.minX, s.minY], [s.maxX, s.maxY])
    })
    return this.withBounds(path, pts)
  }

  private withBounds(path: Path2D, pts: Pt[]): Shape {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    pts.forEach(([x, y]) => {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    })
    return { path, pts, minX, minY, maxX, maxY }
  }

  // ---------------------------------------------------------------- painting

  // The die-cut paper margin around the silhouette.
  border(shapes: Shape[], width = 0.075) {
    const c = this.ctx
    c.save()
    c.fillStyle = PAPER
    c.strokeStyle = PAPER
    c.lineWidth = width * 2
    shapes.forEach((s) => {
      c.fill(s.path)
      c.stroke(s.path)
    })
    c.restore()
  }

  // Flat fill with watercolor blooms, a soft vertical gradient and darker
  // pooled edges.
  wash(
    s: Shape,
    color: string,
    o: { blooms?: number; vary?: number; edge?: number; light?: number; dark?: number } = {}
  ) {
    const c = this.ctx
    const w = s.maxX - s.minX
    const h = s.maxY - s.minY
    c.save()
    c.clip(s.path)
    c.fillStyle = color
    c.fill(s.path)

    const blooms = o.blooms ?? Math.min(26, Math.max(4, Math.round(w * h * 1.6)))
    const vary = o.vary ?? 0.09
    // Blooms are capped in size: big soft gradients are slow to rasterise
    // and smaller ones read more like real pigment anyway.
    const size = Math.min(1.4, Math.max(0.35, Math.min(w, h)))
    for (let i = 0; i < blooms; i++) {
      const x = s.minX + this.rnd() * w
      const y = s.minY + this.rnd() * h
      const r = this.r(0.25, 0.9) * size
      const tone = shade(color, (this.rnd() - 0.55) * 2 * vary)
      const g = c.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, tone)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      c.globalAlpha = 0.35
      c.fillStyle = g
      c.fillRect(x - r, y - r, r * 2, r * 2)
    }
    c.globalAlpha = 1

    const lg = c.createLinearGradient(0, s.minY, 0, s.maxY)
    lg.addColorStop(0, `rgba(40,20,30,${o.dark ?? 0.1})`)
    lg.addColorStop(1, `rgba(255,250,235,${o.light ?? 0.1})`)
    c.fillStyle = lg
    c.fillRect(s.minX, s.minY, w, h)

    const edge = o.edge ?? 0.22
    if (edge > 0) {
      c.strokeStyle = shade(color, -0.25)
      c.globalAlpha = edge
      c.lineWidth = 0.07
      c.stroke(s.path)
    }
    c.restore()
  }

  // Ink outline. Drawn twice with a tiny offset for a slightly sketchy line.
  ink(s: Shape | Path2D, width = 0.03, color = INK) {
    const path = s instanceof Path2D ? s : s.path
    const c = this.ctx
    c.save()
    c.strokeStyle = color
    c.lineWidth = width
    c.stroke(path)
    c.globalAlpha = 0.45
    c.lineWidth = width * 0.6
    c.translate(0.006, -0.005)
    c.stroke(path)
    c.restore()
  }

  // Open ink stroke through points, with optional wobble.
  line(pts: Pt[], width = 0.02, color = INK, wobble = 0.006) {
    const c = this.ctx
    c.save()
    c.strokeStyle = color
    c.lineWidth = width
    c.beginPath()
    pts.forEach((p, i) => {
      const x = p[0] + (i && i < pts.length - 1 ? (this.rnd() - 0.5) * wobble : 0)
      const y = p[1] + (i && i < pts.length - 1 ? (this.rnd() - 0.5) * wobble : 0)
      i ? c.lineTo(x, y) : c.moveTo(x, y)
    })
    c.stroke()
    c.restore()
  }

  // A thin strip of paper (die-cut) with an ink line down the middle.
  strip(pts: Pt[], width = 0.02, paper = 0.05, color = INK) {
    const c = this.ctx
    c.save()
    c.strokeStyle = PAPER
    c.lineWidth = width + paper
    c.beginPath()
    pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])))
    c.stroke()
    c.restore()
    this.line(pts, width, color, 0)
  }

  // Parallel pen hatching clipped to a shape.
  hatch(
    s: Shape,
    o: { angle?: number; gap?: number; width?: number; color?: string; alpha?: number } = {}
  ) {
    const c = this.ctx
    const angle = o.angle ?? Math.PI / 3
    const gap = o.gap ?? 0.07
    c.save()
    c.clip(s.path)
    c.strokeStyle = o.color ?? INK
    c.globalAlpha = o.alpha ?? 0.45
    c.lineWidth = o.width ?? 0.012
    const cx = (s.minX + s.maxX) / 2
    const cy = (s.minY + s.maxY) / 2
    const r = Math.hypot(s.maxX - s.minX, s.maxY - s.minY) / 2 + gap
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    for (let d = -r; d <= r; d += gap) {
      const ox = -dy * d + cx
      const oy = dx * d + cy
      const j = (this.rnd() - 0.5) * 0.015
      c.beginPath()
      c.moveTo(ox - dx * r + j, oy - dy * r)
      c.lineTo(ox + dx * r, oy + dy * r + j)
      c.stroke()
    }
    c.restore()
  }

  fill(s: Shape | Path2D, color: string, alpha = 1) {
    const c = this.ctx
    c.save()
    c.globalAlpha = alpha
    c.fillStyle = color
    c.fill(s instanceof Path2D ? s : s.path)
    c.restore()
  }

  // Grid of windows. Lit ones are also painted into the glow map.
  windows(
    x: number,
    y: number,
    cols: number,
    rows: number,
    ww: number,
    wh: number,
    gx: number,
    gy: number,
    o: { color?: string; lit?: number; litColor?: string; frame?: boolean; arch?: boolean } = {}
  ) {
    const c = this.ctx
    const color = o.color ?? '#3d4a63'
    const lit = o.lit ?? 0.55
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const wx = x + i * (ww + gx) + (this.rnd() - 0.5) * 0.008
        const wy = y + j * (wh + gy) + (this.rnd() - 0.5) * 0.008
        const isLit = this.rnd() < lit
        const day = this.rnd() < 0.18 ? shade(color, 0.35) : color
        c.fillStyle = day
        if (o.arch) {
          c.beginPath()
          c.moveTo(wx, wy)
          c.lineTo(wx, wy + wh - ww / 2)
          c.arc(wx + ww / 2, wy + wh - ww / 2, ww / 2, Math.PI, 0, true)
          c.lineTo(wx + ww, wy)
          c.closePath()
          c.fill()
        } else {
          c.fillRect(wx, wy, ww, wh)
        }
        // A sliver of reflected sky.
        c.fillStyle = 'rgba(255,255,255,0.22)'
        c.fillRect(wx + ww * 0.12, wy + wh * 0.5, ww * 0.18, wh * 0.42)
        if (o.frame !== false && ww > 0.06) {
          c.strokeStyle = rgba(INK, 0.55)
          c.lineWidth = 0.008
          c.strokeRect(wx, wy, ww, wh)
        }
        if (isLit && this.glowCtx) {
          const g = this.glowCtx
          g.fillStyle = o.litColor ?? this.pick(['#ffd27a', '#ffc861', '#ffe2a3', '#ffb84d'])
          g.fillRect(wx, wy, ww, wh)
        }
      }
    }
  }

  // Paint directly into the glow map (signs, lamps, torch...).
  glow(s: Shape | Path2D, color: string) {
    if (!this.glowCtx) return
    this.glowCtx.fillStyle = color
    this.glowCtx.fill(s instanceof Path2D ? s : s.path)
  }

  text(
    str: string,
    x: number,
    y: number,
    size: number,
    o: {
      color?: string
      align?: CanvasTextAlign
      font?: string
      weight?: string
      rotate?: number
      glow?: string
      spacing?: number
    } = {}
  ) {
    const draw = (c: CanvasRenderingContext2D, color: string) => {
      c.save()
      c.translate(x, y)
      c.scale(1, -1)
      if (o.rotate) c.rotate(o.rotate)
      c.textAlign = o.align ?? 'center'
      c.textBaseline = 'alphabetic'
      // Canvas fonts are sized in px; draw at 100px and scale to world units.
      c.font = `${o.weight ?? '700'} 100px ${o.font ?? 'Georgia, "Times New Roman", serif'}`
      c.scale(size / 100, size / 100)
      if (o.spacing) {
        ;(c as any).letterSpacing = `${o.spacing}px`
      }
      c.fillStyle = color
      c.fillText(str, 0, 0)
      c.restore()
    }
    draw(this.ctx, o.color ?? INK)
    if (o.glow && this.glowCtx) draw(this.glowCtx, o.glow)
  }

  // Paper grain over everything painted so far.
  grain(alpha = 1) {
    const c = this.ctx
    c.save()
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.globalCompositeOperation = 'source-atop'
    c.globalAlpha = alpha
    c.fillStyle = c.createPattern(grain(), 'repeat')!
    c.fillRect(0, 0, this.canvas.width, this.canvas.height)
    c.restore()
  }

  finish(): Cutout {
    this.grain()
    const step = 4
    const mw = Math.ceil(this.canvas.width / step)
    const mh = Math.ceil(this.canvas.height / step)
    const small = document.createElement('canvas')
    small.width = mw
    small.height = mh
    const sc = small.getContext('2d', { willReadFrequently: true })!
    sc.drawImage(this.canvas, 0, 0, mw, mh)
    const data = sc.getImageData(0, 0, mw, mh).data
    const mask = new Uint8Array(mw * mh)
    for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] > 128 ? 1 : 0
    return {
      canvas: this.canvas,
      glow: this.glowCanvas,
      width: this.w + this.pad * 2,
      height: this.h + this.pad + this.bottom,
      pad: this.pad,
      bottom: this.bottom,
      mask,
      maskW: mw,
      maskH: mh,
    }
  }
}
