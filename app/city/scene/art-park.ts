import { INK, Pt, Shape, Sketch, rgba, shade } from './sketch'
import { C } from './palette'
import { Part, paint, pts } from './art-common'
import { blobs, person } from './art-street'

// Art for the Central Park spread, seen looking south across the park
// towards Midtown.

// A building block with a grid of windows.
function block(
  s: Sketch,
  x: number,
  w: number,
  h: number,
  color: string,
  o: { cols?: number; rows?: number; lit?: number; win?: string; y?: number; shape?: Shape } = {}
): Part {
  const y = o.y ?? 0
  const shape = o.shape ?? s.rect(x, y, w, h, 0.003)
  return {
    shape,
    color,
    ink: 0.02,
    detail: () => {
      const cols = o.cols ?? Math.max(2, Math.round(w / 0.16))
      const rows = o.rows ?? Math.max(2, Math.round(h / 0.22))
      const mx = w * 0.12
      const cellW = (w - mx * 2) / cols
      const cellH = (h - 0.32) / rows
      const ww = cellW * 0.55
      const wh = cellH * 0.55
      s.windows(x + mx + (cellW - ww) / 2, y + 0.14 + (cellH - wh) / 2, cols, rows, ww, wh, cellW - ww, cellH - wh, {
        color: o.win ?? C.window,
        lit: o.lit ?? 0.45,
        frame: false,
      })
    },
  }
}

// ---------------------------------------------------------------------------
// Billionaires' Row and Midtown beyond the south end of the park.

export function parkSkyline(s: Sketch) {
  const W = s.w
  const parts: Part[] = []
  // Far haze, with the Empire State in the distance.
  for (let x = 0.1; x < W - 0.4; x += s.r(0.55, 0.9)) {
    const w = s.r(0.45, 0.8)
    parts.push({ shape: s.rect(x, 0, w, s.r(1.8, 3.0), 0.003), color: C.hazeLight, ink: 0.014 })
  }
  const esb = s.poly(
    pts(4.3, 0, 5.0, 0, 5.0, 3.2, 4.88, 3.2, 4.88, 3.7, 4.76, 3.7, 4.74, 4.05, 4.66, 4.6, 4.58, 4.05, 4.56, 3.7, 4.42, 3.7, 4.42, 3.2, 4.3, 3.2),
    0.003
  )
  parts.push({ shape: esb, color: shade(C.hazeLight, -0.05), ink: 0.014 })
  // Midtown in the middle distance.
  for (let x = 0.0; x < W - 0.5; x += s.r(0.7, 1.1)) {
    const w = s.r(0.55, 0.9)
    parts.push(block(s, x, w, s.r(1.9, 3.1), s.pick([C.haze, C.hazeDark, '#b3bfd2']), { lit: 0.35, win: '#7b8aa6' }))
  }
  // 220 Central Park South: limestone, with a tiered crown.
  parts.push(
    block(s, 1.3, 0.8, 3.1, '#e3d4b8', {
      shape: s.poly(pts(1.3, 0, 2.1, 0, 2.1, 2.8, 1.98, 2.8, 1.98, 3.05, 1.85, 3.05, 1.85, 3.3, 1.55, 3.3, 1.55, 3.05, 1.42, 3.05, 1.42, 2.8, 1.3, 2.8), 0.003),
      win: '#5d6b85',
    })
  )
  // Central Park Tower: glass, with its cantilever over the next door.
  const cpt = s.poly(pts(3.2, 0, 3.75, 0, 3.75, 1.45, 3.92, 1.55, 3.92, 4.45, 3.2, 4.45), 0.003)
  parts.push({
    shape: cpt,
    color: '#8ea3b9',
    ink: 0.022,
    detail: () => {
      for (let x = 3.26; x < 3.9; x += 0.07) s.line([[x, 0], [x, 4.45]], 0.008, 'rgba(255,255,255,0.35)', 0)
      s.fill(s.rect(3.2, 4.25, 0.72, 0.2, 0), '#c9d6e3')
      s.windows(3.28, 0.3, 4, 18, 0.08, 0.1, 0.07, 0.12, { color: '#5d6f88', lit: 0.3, frame: false })
    },
  })
  // 111 West 57th: the slenderest of them, feathering in as it rises.
  const steps: Pt[] = [[5.6, 0], [5.96, 0], [5.96, 2.6]]
  for (let k = 1; k <= 7; k++) steps.push([5.96 - k * 0.04, 2.6 + (k - 1) * 0.3], [5.96 - k * 0.04, 2.6 + k * 0.3])
  steps.push([5.6, 4.7])
  parts.push({
    shape: s.poly(steps, 0.002),
    color: '#c58b69',
    ink: 0.02,
    detail: () => {
      for (let y = 0.2; y < 4.7; y += 0.16) s.line([[5.6, y], [5.96, y]], 0.012, rgba('#6b4a35', 0.6), 0)
      s.line([[5.62, 0], [5.62, 4.7]], 0.02, '#8a6a3c', 0)
    },
  })
  // One57: blue glass with a cascading top.
  const one57 = s.custom(
    (p) => {
      p.moveTo(6.6, 0)
      p.lineTo(7.5, 0)
      p.lineTo(7.5, 3.0)
      p.quadraticCurveTo(7.3, 3.45, 7.1, 3.4)
      p.quadraticCurveTo(6.9, 3.2, 6.6, 3.1)
      p.closePath()
    },
    pts(6.6, 0, 7.5, 3.45)
  )
  parts.push({
    shape: one57,
    color: '#5f86ad',
    ink: 0.02,
    detail: () => {
      for (let x = 6.66; x < 7.5; x += 0.1) s.fill(s.rect(x, 0, 0.04, 3.4, 0), 'rgba(20,40,70,0.25)')
      s.windows(6.68, 0.3, 6, 12, 0.07, 0.1, 0.07, 0.12, { color: '#3e5878', lit: 0.3, frame: false })
    },
  })
  // 432 Park: a white grid of square windows.
  parts.push(block(s, 9.0, 0.5, 4.35, '#f1efe8', { cols: 6, rows: 26, win: '#3a4152', lit: 0.3 }))
  // Essex House with its red rooftop sign.
  parts.push(
    block(s, 10.3, 0.95, 2.95, '#d9c09a', {
      shape: s.poly(pts(10.3, 0, 11.25, 0, 11.25, 2.5, 11.12, 2.5, 11.12, 2.8, 10.43, 2.8, 10.43, 2.5, 10.3, 2.5), 0.003),
    })
  )
  // 53 West 53rd, tapering to a point.
  parts.push({
    shape: s.poly(pts(11.75, 0, 12.3, 0, 12.18, 2.9, 11.96, 3.85, 11.85, 3.0), 0.003),
    color: '#9fb0c2',
    ink: 0.02,
    detail: () => {
      for (let k = 0; k < 14; k++) {
        const y = k * 0.28
        s.line([[11.75, y], [12.3, y + 0.5]], 0.008, rgba(INK, 0.35), 0)
        s.line([[12.3, y], [11.75, y + 0.5]], 0.008, rgba(INK, 0.35), 0)
      }
    },
  })
  // The hotels and apartments along Central Park South, in front.
  for (let x = 0.05; x < W - 0.4; x += s.r(0.65, 1.0)) {
    const w = s.r(0.6, 0.95)
    parts.push(block(s, x, w, s.r(1.0, 1.7), s.pick([C.brick, C.limestone, C.terracotta, C.cream, C.brownstone]), { lit: 0.5 }))
  }
  paint(s, parts)
  // The Essex House sign: a frame of struts with red letters.
  s.strip([[10.35, 2.8], [10.35, 3.45], [11.2, 3.45], [11.2, 2.8]], 0.016, 0.03)
  s.text('ESSEX', 10.78, 3.17, 0.17, { color: C.red, font: 'Helvetica, Arial, sans-serif', glow: '#ff4a3a' })
  s.text('HOUSE', 10.78, 2.95, 0.17, { color: C.red, font: 'Helvetica, Arial, sans-serif', glow: '#ff4a3a' })
}

// ---------------------------------------------------------------------------
// The Plaza Hotel: a French château on Fifth Avenue, under a green roof.

export function plazaHotel(s: Sketch) {
  const W = s.w
  const stone = '#efe6d2'
  const copper = '#6f9f8a'
  const wall = 2.45
  const body = s.rect(0.2, 0, W - 0.4, wall, 0.003)
  const towers = [0.05, W - 0.5].map((x) => s.rect(x, 0, 0.45, wall + 0.2, 0.003))
  const roof = s.poly(pts(0.22, wall, W - 0.22, wall, W - 0.42, wall + 0.55, 0.42, wall + 0.55), 0.003)
  const caps = [0.05, W - 0.5].map((x) => s.poly(pts(x - 0.03, wall + 0.2, x + 0.48, wall + 0.2, x + 0.4, wall + 0.7, x + 0.05, wall + 0.7), 0.003))
  const gable = s.poly(pts(W / 2 - 0.3, wall + 0.3, W / 2 + 0.3, wall + 0.3, W / 2 + 0.3, wall + 0.62, W / 2, wall + 0.85, W / 2 - 0.3, wall + 0.62), 0.003)
  const canopy = s.rect(W / 2 - 0.35, 0.36, 0.7, 0.1, 0.002)
  paint(s, [
    {
      shape: body,
      color: stone,
      ink: 0.024,
      detail: () => {
        s.windows(0.35, 0.55, 9, 9, 0.12, 0.14, 0.085, 0.07, { color: '#4a5670', lit: 0.5 })
        s.text('THE PLAZA', W / 2, wall - 0.16, 0.11, { color: rgba(INK, 0.75), spacing: 4 })
        s.fill(s.rect(W / 2 - 0.22, 0, 0.44, 0.36, 0), '#4a3a30')
        s.glow(s.rect(W / 2 - 0.22, 0, 0.44, 0.36, 0), '#ffd27a')
        s.hatch(s.rect(W - 0.6, 0, 0.4, wall, 0), { angle: 1.2, gap: 0.04, alpha: 0.2 })
      },
    },
    ...towers.map((shape, i) => ({
      shape,
      color: shade(stone, -0.04),
      ink: 0.022,
      detail: () => s.windows(i ? W - 0.42 : 0.13, 0.55, 2, 10, 0.1, 0.13, 0.09, 0.075, { color: '#4a5670', lit: 0.5 }),
    })),
    {
      shape: roof,
      color: copper,
      ink: 0.022,
      detail: () => {
        for (let x = 0.55; x < W - 0.55; x += 0.28) {
          const d = s.poly(pts(x, wall + 0.08, x + 0.14, wall + 0.08, x + 0.14, wall + 0.26, x + 0.07, wall + 0.34, x, wall + 0.26), 0)
          s.fill(d, '#f4eedf')
          s.ink(d, 0.008)
          s.fill(s.rect(x + 0.035, wall + 0.1, 0.07, 0.12, 0), '#4a5670')
          s.glow(s.rect(x + 0.035, wall + 0.1, 0.07, 0.12, 0), '#ffd27a')
        }
        s.hatch(roof, { angle: 0.4, gap: 0.035, alpha: 0.25 })
      },
    },
    ...caps.map((shape) => ({ shape, color: shade(copper, -0.06), ink: 0.02, hatch: { angle: 1.1, gap: 0.03, alpha: 0.3 } })),
    { shape: gable, color: stone, ink: 0.018 },
    { shape: canopy, color: C.redDark, ink: 0.012 },
  ])
  // Flags over the entrance.
  for (const [x, col] of [
    [W / 2 - 0.5, C.red],
    [W / 2 + 0.5, '#3f6fb0'],
  ] as [number, string][]) {
    s.strip([[x, wall + 0.55], [x, wall + 0.95]], 0.012, 0.025)
    const flag = s.poly(pts(x, wall + 0.95, x + 0.22, wall + 0.9, x, wall + 0.8), 0)
    s.fill(flag, col)
    s.ink(flag, 0.008)
  }
}

// ---------------------------------------------------------------------------
// Gapstow Bridge: a rough stone arch over the Pond. The arch is cut out.

export function gapstowBridge(s: Sketch) {
  const W = s.w
  const top = (x: number) => 0.95 + 0.12 * Math.sin((Math.PI * x) / W)
  const body = s.custom(
    (p) => {
      p.moveTo(0, 0)
      p.lineTo(0, top(0))
      for (let x = 0; x <= W; x += 0.1) p.lineTo(x, top(x) + 0.18)
      p.lineTo(W, 0)
      p.closePath()
    },
    pts(0, 0, W, 1.25)
  )
  const span = W * 0.4
  const opening = s.custom(
    (p) => {
      p.moveTo(W / 2 - span, 0)
      p.ellipse(W / 2, 0, span, 0.72, 0, Math.PI, 0, true)
      p.closePath()
    },
    pts(W / 2 - span, 0, W / 2 + span, 0.72)
  )
  const c = s.ctx
  paint(s, [
    {
      shape: body,
      color: '#9a9183',
      ink: 0.024,
      detail: () => {
        // Rough schist blocks.
        c.save()
        c.clip(body.path)
        for (let i = 0; i < 90; i++) {
          const x = s.r(0, W)
          const y = s.r(0, 1.2)
          s.fill(s.ellipse(x, y, s.r(0.07, 0.14), s.r(0.05, 0.08), s.r(-0.3, 0.3)), s.pick(['#8a8174', '#a69d8d', '#7d7468', '#b0a796']))
          s.ink(s.ellipse(x, y, s.r(0.07, 0.14), s.r(0.05, 0.08)), 0.006, rgba(INK, 0.4))
        }
        c.restore()
        // The parapet coping.
        const coping: Pt[] = []
        for (let x = 0; x <= W; x += 0.1) coping.push([x, top(x) + 0.16])
        s.line(coping, 0.05, '#c8bfae', 0)
        // Ivy trailing over the edge.
        for (let i = 0; i < 26; i++) {
          const x = s.r(0.2, W - 0.2)
          s.fill(s.ellipse(x, top(x) + s.r(-0.12, 0.12), 0.05, 0.035), s.pick(['#c96a3a', '#d98b3c', '#7a8f4a']))
        }
      },
    },
  ])
  // Voussoirs round the arch, then cut the arch out.
  for (let k = 0; k <= 12; k++) {
    const a = Math.PI - (k / 12) * Math.PI
    const x0 = W / 2 + Math.cos(a) * span
    const y0 = Math.sin(a) * 0.72
    s.line([[x0, y0], [W / 2 + Math.cos(a) * (span + 0.14), Math.sin(a) * 0.86]], 0.012, rgba(INK, 0.6), 0)
  }
  c.save()
  c.globalCompositeOperation = 'destination-out'
  c.fill(opening.path)
  c.restore()
  s.ink(opening, 0.022)
}

// ---------------------------------------------------------------------------
// Bethesda Terrace: the sandstone arcade under the drive, with the grand
// stairs coming down either side and the balustrade above.

export function bethesdaTerrace(s: Sketch) {
  const W = s.w
  const sand = '#d3ad82'
  const wallTop = 1.5
  const wall = s.poly(pts(0, 0, W, 0, W - 0.65, wallTop, 0.65, wallTop), 0.003)
  const rail = s.rect(0.55, wallTop, W - 1.1, 0.3, 0.003)
  const arches = [-1, 0, 1].map((k) => {
    const cx = W / 2 + k * 0.62
    return s.custom(
      (p) => {
        p.moveTo(cx - 0.24, 0)
        p.lineTo(cx - 0.24, 0.72)
        p.arc(cx, 0.72, 0.24, Math.PI, 0, true)
        p.lineTo(cx + 0.24, 0)
        p.closePath()
      },
      pts(cx - 0.24, 0, cx + 0.24, 0.96)
    )
  })
  // Autumn trees on the drive above.
  blobs(s, [[0.9, 2.0, 0.32], [1.3, 2.15, 0.3], [W - 1.0, 2.05, 0.34], [W - 1.4, 2.2, 0.26]], '#d98b3c', 'rgba(150,70,20,0.5)', 0.02)
  blobs(s, [[W / 2 - 0.2, 2.05, 0.26], [W / 2 + 0.2, 2.12, 0.24]], '#c9583a', 'rgba(120,30,20,0.5)', 0.02)
  paint(s, [
    {
      shape: wall,
      color: sand,
      ink: 0.026,
      detail: () => {
        // Coursed stone, and the stairs either side.
        for (let y = 0.25; y < wallTop; y += 0.25) s.line([[0.65, y], [W - 0.65, y]], 0.008, rgba(INK, 0.3), 0)
        for (const side of [-1, 1]) {
          for (let k = 0; k < 10; k++) {
            const y = (k + 1) * (wallTop / 11)
            const inner = side < 0 ? 0.65 * (y / wallTop) : W - 0.65 * (y / wallTop)
            s.line([[inner, y], [side < 0 ? inner + 0.5 : inner - 0.5, y]], 0.01, rgba(INK, 0.45), 0)
          }
          const x = side < 0 ? 0.32 : W - 0.32
          s.strip([[side < 0 ? 0.05 : W - 0.05, 0.22], [side < 0 ? 0.7 : W - 0.7, wallTop + 0.22]], 0.025, 0.03, shade(sand, -0.15))
          s.fill(s.ellipse(x, 0.75, 0.04, 0.04), shade(sand, -0.2))
        }
        // Carved medallions between the arches.
        for (const k of [-1.5, 1.5]) s.fill(s.ellipse(W / 2 + k * 0.62, 1.1, 0.13, 0.15), shade(sand, -0.12))
        s.hatch(s.rect(W - 0.9, 0, 0.9, wallTop, 0), { angle: 1.2, gap: 0.04, alpha: 0.2 })
      },
    },
    ...arches.map((shape) => ({
      shape,
      color: '#5a3d2e',
      ink: 0.018,
      detail: () => {
        // The Minton tile ceiling glowing in the arcade.
        s.glow(shape, '#ffc873')
        for (let i = 0; i < 10; i++) {
          s.fill(s.ellipse(shape.minX + s.r(0.06, 0.42), s.r(0.75, 0.92), 0.025, 0.02), s.pick(['#e2b45c', '#5f8fb0', '#c9583a']))
        }
      },
    })),
    {
      shape: rail,
      color: shade(sand, 0.06),
      ink: 0.02,
      detail: () => {
        for (let x = 0.62; x < W - 0.6; x += 0.075) s.fill(s.ellipse(x, wallTop + 0.13, 0.022, 0.08), shade(sand, -0.18))
        s.fill(s.rect(0.55, wallTop + 0.24, W - 1.1, 0.06, 0), shade(sand, -0.05))
        for (let x = 0.6; x < W - 0.5; x += (W - 1.2) / 6) s.fill(s.rect(x - 0.05, wallTop, 0.1, 0.3, 0), shade(sand, -0.1))
      },
    },
  ])
}

// The Angel of the Waters over Bethesda Fountain.
export function bethesdaFountain(s: Sketch) {
  const W = s.w
  const cx = W / 2
  const stone = '#cdbb9c'
  const bronze = '#5f8f7a'
  const basin = s.custom(
    (p) => {
      p.moveTo(0.05, 0)
      p.lineTo(W - 0.05, 0)
      p.lineTo(W - 0.05, 0.22)
      p.quadraticCurveTo(cx, 0.3, 0.05, 0.22)
      p.closePath()
    },
    pts(0.05, 0, W - 0.05, 0.3)
  )
  const column = s.poly(pts(cx - 0.12, 0.25, cx + 0.12, 0.25, cx + 0.08, 0.92, cx - 0.08, 0.92), 0.002)
  const bowl = s.custom(
    (p) => {
      p.moveTo(cx - 0.5, 1.02)
      p.quadraticCurveTo(cx, 0.82, cx + 0.5, 1.02)
      p.lineTo(cx + 0.46, 1.08)
      p.lineTo(cx - 0.46, 1.08)
      p.closePath()
    },
    pts(cx - 0.5, 0.88, cx + 0.5, 1.08)
  )
  const plinth = s.poly(pts(cx - 0.12, 1.08, cx + 0.12, 1.08, cx + 0.08, 1.3, cx - 0.08, 1.3), 0.002)
  // The angel: robe, head, wings spread, an arm held out with a lily.
  const robe = s.poly(pts(cx - 0.1, 1.3, cx + 0.1, 1.3, cx + 0.07, 1.75, cx - 0.05, 1.75), 0.002)
  const head = s.ellipse(cx + 0.01, 1.83, 0.05, 0.055)
  // Broad wings swept up behind her, with a scalloped trailing edge.
  const wings = [-1, 1].map((d) =>
    s.custom(
      (p) => {
        p.moveTo(cx + d * 0.03, 1.74)
        p.quadraticCurveTo(cx + d * 0.22, 2.02, cx + d * 0.46, 2.2)
        p.quadraticCurveTo(cx + d * 0.44, 2.0, cx + d * 0.38, 1.86)
        p.quadraticCurveTo(cx + d * 0.36, 1.76, cx + d * 0.28, 1.72)
        p.quadraticCurveTo(cx + d * 0.26, 1.6, cx + d * 0.17, 1.56)
        p.quadraticCurveTo(cx + d * 0.12, 1.48, cx + d * 0.06, 1.5)
        p.closePath()
      },
      pts(cx - 0.46, 1.48, cx + 0.46, 2.2)
    )
  )
  const arm = s.poly(pts(cx + 0.06, 1.66, cx + 0.26, 1.78, cx + 0.25, 1.82, cx + 0.05, 1.71), 0)
  // Water spilling from the bowl in curtains.
  const spill = (d: number) => {
    const line: Pt[] = []
    for (let t = 0; t <= 1.001; t += 0.1) line.push([cx + d * (0.46 + 0.14 * Math.sin(t * 1.4)), 1.02 - t * 0.8])
    return line
  }
  paint(s, [
    { shape: column, color: stone, ink: 0.016 },
    { shape: bowl, color: stone, ink: 0.018 },
    { shape: plinth, color: stone, ink: 0.014 },
    ...wings.map((shape, i) => ({
      shape,
      color: shade(bronze, 0.08),
      ink: 0.014,
      detail: () => {
        // Feathers fanning out from the shoulder.
        const d = i ? 1 : -1
        for (let k = 0; k < 5; k++) {
          const a = 0.35 + k * 0.22
          s.line([[cx + d * 0.06, 1.66], [cx + d * (0.06 + Math.cos(a) * 0.4), 1.66 + Math.sin(a) * 0.42]], 0.008, rgba(INK, 0.45), 0)
        }
      },
    })),
    { shape: robe, color: bronze, ink: 0.014, hatch: { angle: 1.3, gap: 0.03, alpha: 0.25 } },
    { shape: arm, color: bronze, ink: 0.01 },
    { shape: head, color: bronze, ink: 0.01 },
  ])
  // Four cherubs round the column.
  for (const d of [-0.16, 0.16]) {
    const cherub = s.ellipse(cx + d, 0.48, 0.07, 0.1)
    s.fill(cherub, bronze)
    s.ink(cherub, 0.01)
  }
  s.fill(s.ellipse(cx + 0.29, 1.84, 0.04, 0.05), '#f4f1ea')
  for (const d of [-1, 1]) {
    s.strip(spill(d), 0.05, 0.02, rgba('#a9d4e6', 0.95))
    s.glow(s.ellipse(cx + d * 0.55, 0.6, 0.06, 0.35), '#9fd2ff')
  }
  for (const d of [-0.3, 0, 0.3]) s.strip([[cx + d, 1.02], [cx + d * 1.2, 1.15]], 0.02, 0.015, rgba('#cfe9f5', 0.9))
  paint(s, [
    {
      shape: basin,
      color: stone,
      ink: 0.02,
      detail: () => {
        s.fill(s.rect(0.08, 0.17, W - 0.16, 0.05, 0), '#8fc0d4')
        for (let x = 0.2; x < W - 0.1; x += 0.35) s.line([[x, 0.03], [x, 0.17]], 0.01, rgba(INK, 0.35), 0)
      },
    },
  ])
}

// ---------------------------------------------------------------------------
// Bow Bridge: cream cast iron, interlocking circles along the rail and
// planters along the top. Only the ironwork is paper.

export function bowBridge(s: Sketch) {
  const W = s.w
  const iron = '#efe7d2'
  const a = 0.42
  const deck = (x: number) => 0.78 + 0.12 * Math.sin((Math.PI * (x - a)) / (W - 2 * a))
  const deckLine: Pt[] = []
  const railLine: Pt[] = []
  const ribLine: Pt[] = []
  for (let x = a; x <= W - a + 0.001; x += 0.08) {
    deckLine.push([x, deck(x)])
    railLine.push([x, deck(x) + 0.3])
    ribLine.push([x, 0.25 + 0.45 * Math.sin((Math.PI * (x - a)) / (W - 2 * a))])
  }
  // Rail circles and the tracery between rib and deck.
  for (let x = a + 0.09; x < W - a - 0.05; x += 0.13) {
    const ring: Pt[] = []
    for (let k = 0; k <= 16; k++) ring.push([x + Math.cos((k / 16) * Math.PI * 2) * 0.09, deck(x) + 0.15 + Math.sin((k / 16) * Math.PI * 2) * 0.09])
    s.strip(ring, 0.012, 0.02, '#b9ad92')
  }
  for (let x = a + 0.3; x < W - a - 0.25; x += 0.22) {
    const rib = 0.25 + 0.45 * Math.sin((Math.PI * (x - a)) / (W - 2 * a))
    const gap = deck(x) - rib
    if (gap < 0.12) continue
    const r = Math.min(0.09, gap / 2 - 0.02)
    const ring: Pt[] = []
    for (let k = 0; k <= 14; k++) ring.push([x + Math.cos((k / 14) * Math.PI * 2) * r, rib + gap / 2 + Math.sin((k / 14) * Math.PI * 2) * r])
    s.strip(ring, 0.01, 0.02, '#b9ad92')
  }
  s.strip(ribLine, 0.045, 0.04, '#d8cdb3')
  s.strip(railLine, 0.035, 0.04, '#b9ad92')
  s.strip(deckLine, 0.08, 0.05, iron)
  // Planters along the rail.
  for (let x = a + 0.35; x < W - a - 0.2; x += 0.55) {
    const pot = s.poly(pts(x - 0.06, deck(x) + 0.3, x + 0.06, deck(x) + 0.3, x + 0.08, deck(x) + 0.4, x - 0.08, deck(x) + 0.4), 0)
    s.border([pot], 0.03)
    s.fill(pot, iron)
    s.ink(pot, 0.008)
    blobs(s, [[x, deck(x) + 0.45, 0.06]], '#d98b3c', 'rgba(150,70,20,0.4)', 0.01)
  }
  // Stone abutments either end.
  const ends = [0, W - a - 0.05].map((x) => s.rect(x, 0, a + 0.05, 0.95, 0.003))
  paint(
    s,
    ends.map((shape) => ({
      shape,
      color: '#a59c8c',
      ink: 0.02,
      detail: () => {
        for (let y = 0.2; y < 0.95; y += 0.2) s.line([[shape.minX, y], [shape.maxX, y]], 0.008, rgba(INK, 0.35), 0)
      },
    }))
  )
}

// A rowboat from the Loeb Boathouse, two aboard.
export function rowboat(s: Sketch) {
  const W = s.w
  const rower = person(s, W * 0.42, 0.02, 0.62, { coat: '#d96a4a', hat: 'beanie' })
  const passenger = person(s, W * 0.7, 0.02, 0.58, { coat: '#3f6fb0', hair: '#a0522d', skirt: true })
  paint(s, [...rower, ...passenger], 0.04)
  for (const d of [-1, 1]) s.strip([[W * 0.42 + d * 0.06, 0.32], [W * 0.42 + d * 0.42, 0.06]], 0.02, 0.025, '#a8784f')
  const hull = s.custom(
    (p) => {
      p.moveTo(0.04, 0.3)
      p.lineTo(W - 0.04, 0.3)
      p.quadraticCurveTo(W - 0.1, 0.06, W * 0.7, 0.05)
      p.lineTo(W * 0.25, 0.05)
      p.quadraticCurveTo(0.08, 0.08, 0.04, 0.3)
      p.closePath()
    },
    pts(0.04, 0.05, W - 0.04, 0.3)
  )
  paint(s, [
    {
      shape: hull,
      color: '#3f7a5a',
      ink: 0.02,
      detail: () => {
        s.fill(s.rect(0.04, 0.24, W - 0.08, 0.04, 0), '#f1e7cf')
        s.text('7', W * 0.2, 0.1, 0.09, { color: '#f1e7cf', font: 'Helvetica, Arial, sans-serif' })
      },
    },
  ])
  for (const [x, y] of [[0.15, 0.03], [W - 0.2, 0.04]]) s.line([[x - 0.1, y], [x + 0.1, y]], 0.012, 'rgba(255,255,255,0.8)', 0)
}

// A mallard and her ducklings in a line.
export function ducks(s: Sketch) {
  const duck = (x: number, k: number, body: string, head: string) => {
    const b = s.ellipse(x, 0.1 * k, 0.14 * k, 0.08 * k, 0.05)
    const h = s.ellipse(x + 0.12 * k, 0.2 * k, 0.055 * k, 0.055 * k)
    const bill = s.poly(pts(x + 0.16 * k, 0.2 * k, x + 0.24 * k, 0.19 * k, x + 0.16 * k, 0.17 * k), 0)
    s.border([b, h, bill], 0.035)
    s.fill(b, body)
    s.ink(b, 0.01)
    s.fill(h, head)
    s.ink(h, 0.01)
    s.fill(bill, '#e8a33a')
    s.fill(s.ellipse(x + 0.13 * k, 0.21 * k, 0.01 * k, 0.012 * k), INK)
  }
  duck(0.25, 1.6, '#9a7a58', '#8a6a48')
  for (const x of [0.55, 0.72, 0.88]) duck(x, 0.85, '#d9b85a', '#e2c46a')
  for (const x of [0.2, 0.5, 0.8]) s.line([[x - 0.12, 0.01], [x + 0.08, 0.01]], 0.01, 'rgba(255,255,255,0.8)', 0)
}

// ---------------------------------------------------------------------------
// Central Park West: the San Remo's twin towers with their temples.

export function sanRemo(s: Sketch) {
  const W = s.w
  const stone = '#e3d6bd'
  const base = 2.9
  const body = s.rect(0.05, 0, W - 0.1, base, 0.003)
  const towers = [0.25, W - 0.95].map((x) => s.rect(x, base, 0.7, 1.15, 0.003))
  const temples = [0.25, W - 0.95].map((x) =>
    s.custom(
      (p) => {
        p.moveTo(x + 0.08, base + 1.15)
        p.lineTo(x + 0.62, base + 1.15)
        p.lineTo(x + 0.62, base + 1.55)
        p.quadraticCurveTo(x + 0.35, base + 1.82, x + 0.08, base + 1.55)
        p.closePath()
      },
      pts(x + 0.08, base + 1.15, x + 0.62, base + 1.82)
    )
  )
  paint(s, [
    {
      shape: body,
      color: stone,
      ink: 0.024,
      detail: () => {
        s.windows(0.18, 0.35, 9, 12, 0.11, 0.12, 0.12, 0.09, { color: '#4a5670', lit: 0.5 })
        s.fill(s.rect(0.05, base - 0.12, W - 0.1, 0.06, 0), shade(stone, -0.1))
        s.fill(s.rect(0.05, 0, W - 0.1, 0.3, 0), shade(stone, -0.08))
        s.hatch(s.rect(W - 0.45, 0, 0.4, base, 0), { angle: 1.2, gap: 0.04, alpha: 0.2 })
      },
    },
    ...towers.map((shape) => ({
      shape,
      color: stone,
      ink: 0.022,
      detail: () => s.windows(shape.minX + 0.1, base + 0.12, 3, 5, 0.1, 0.12, 0.1, 0.09, { color: '#4a5670', lit: 0.55 }),
    })),
    ...temples.map((shape) => ({
      shape,
      color: shade(stone, 0.04),
      ink: 0.018,
      detail: () => {
        for (let k = 0; k < 5; k++) {
          const x = shape.minX + 0.06 + k * 0.105
          s.fill(s.rect(x, base + 1.2, 0.04, 0.3, 0), shade(stone, -0.15))
        }
        s.glow(s.rect(shape.minX + 0.05, base + 1.2, shape.maxX - shape.minX - 0.1, 0.3, 0), '#ffd27a')
      },
    })),
  ])
  for (const x of [0.6, W - 0.6]) s.strip([[x, base + 1.8], [x, base + 2.05]], 0.02, 0.03)
}

// Fifth Avenue: the Guggenheim's white spiral, widening as it rises.
export function guggenheim(s: Sketch) {
  const W = s.w
  const white = '#fbf7ec'
  const cx = 1.2
  const bands = [0, 1, 2, 3].map((k) => {
    const y = 0.55 + k * 0.38
    const half = 0.72 + k * 0.11
    return s.custom(
      (p) => {
        p.moveTo(cx - half + 0.08, y)
        p.lineTo(cx + half - 0.08, y)
        p.quadraticCurveTo(cx + half + 0.02, y + 0.15, cx + half - 0.02, y + 0.3)
        p.lineTo(cx - half + 0.02, y + 0.3)
        p.quadraticCurveTo(cx - half - 0.02, y + 0.15, cx - half + 0.08, y)
        p.closePath()
      },
      pts(cx - half - 0.02, y, cx + half + 0.02, y + 0.3)
    )
  })
  const core = s.rect(cx - 0.7, 0.55, 1.4, 1.45, 0)
  const monitor = s.rect(2.0, 0.5, 0.62, 1.0, 0.003)
  const slab = s.rect(0.15, 0.2, W - 0.3, 0.32, 0.003)
  const lobby = s.rect(0.3, 0, W - 0.6, 0.2, 0.002)
  const dome = s.custom((p) => p.ellipse(cx, 2.0, 0.5, 0.14, 0, 0, Math.PI, false), pts(cx - 0.5, 2.0, cx + 0.5, 2.14))
  paint(s, [
    { shape: lobby, color: '#a9c3c9', ink: 0.014, detail: () => s.glow(lobby, '#e9b86c') },
    { shape: core, color: '#55606c', ink: false, noBorder: true, detail: () => s.glow(core, '#c98f45') },
    {
      shape: monitor,
      color: white,
      ink: 0.02,
      detail: () => {
        for (let y = 0.8; y < 1.5; y += 0.3) s.fill(s.rect(2.0, y, 0.62, 0.06, 0), '#55606c')
      },
    },
    // (Only the glazing between the bands glows.)
    ...bands.map((shape) => ({ shape, color: white, ink: 0.022, detail: () => s.glow(shape, '#000') })),
    { shape: dome, color: '#cfe0e6', ink: 0.014 },
    {
      shape: slab,
      color: white,
      ink: 0.02,
      detail: () =>
        s.text('SOLOMON R. GUGGENHEIM MUSEUM', W / 2, 0.3, 0.085, { color: INK, font: 'Helvetica, Arial, sans-serif', spacing: 2 }),
    },
  ])
}

// ---------------------------------------------------------------------------
// Belvedere Castle on Vista Rock.

export function belvedereCastle(s: Sketch) {
  const W = s.w
  const stone = '#9a958c'
  const rock = s.custom(
    (p) => {
      p.moveTo(0.02, 0)
      p.lineTo(W - 0.02, 0)
      p.lineTo(W - 0.08, 0.5)
      p.lineTo(W - 0.35, 0.82)
      p.lineTo(1.2, 0.78)
      p.lineTo(0.7, 0.86)
      p.lineTo(0.25, 0.62)
      p.closePath()
    },
    pts(0.02, 0, W - 0.02, 0.86)
  )
  const hall = s.rect(0.45, 0.78, 0.95, 0.72, 0.003)
  const tower = s.rect(1.35, 0.8, 0.5, 1.4, 0.003)
  const merlons: Shape[] = []
  for (let k = 0; k < 4; k++) merlons.push(s.rect(1.35 + k * 0.135, 2.2, 0.09, 0.1, 0))
  for (let k = 0; k < 6; k++) merlons.push(s.rect(0.45 + k * 0.17, 1.5, 0.1, 0.09, 0))
  const loggia = s.rect(0.2, 0.75, 0.42, 0.5, 0.002)
  const spire = s.poly(pts(0.16, 1.25, 0.66, 1.25, 0.41, 1.62), 0.002)
  const turret = s.rect(0.98, 1.5, 0.22, 0.32, 0.002)
  const turretCap = s.poly(pts(0.95, 1.82, 1.23, 1.82, 1.09, 2.08), 0.002)
  const stones = (shape: Shape) => () => {
    for (let y = shape.minY + 0.1; y < shape.maxY; y += 0.1) {
      for (let x = shape.minX + ((y * 10) % 2 ? 0.05 : 0.12); x < shape.maxX; x += 0.16) s.line([[x, y], [x, y - 0.1]], 0.006, rgba(INK, 0.3), 0)
      s.line([[shape.minX, y], [shape.maxX, y]], 0.006, rgba(INK, 0.3), 0)
    }
  }
  paint(s, [
    {
      shape: hall,
      color: stone,
      ink: 0.02,
      detail: () => {
        stones(hall)()
        for (const x of [0.62, 0.92, 1.18]) {
          const win = s.rect(x, 1.0, 0.1, 0.22, 0)
          s.fill(win, '#3d4a63')
          s.glow(win, '#ffd27a')
        }
      },
    },
    {
      shape: tower,
      color: shade(stone, 0.03),
      ink: 0.02,
      detail: () => {
        stones(tower)()
        const win = s.rect(1.55, 1.6, 0.1, 0.24, 0)
        s.fill(win, '#3d4a63')
        s.glow(win, '#ffd27a')
        s.hatch(s.rect(1.7, 0.8, 0.15, 1.4, 0), { angle: 1.2, gap: 0.035, alpha: 0.25 })
      },
    },
    ...merlons.map((shape) => ({ shape, color: shade(stone, 0.03), ink: 0.01 })),
    { shape: loggia, color: shade(stone, -0.05), ink: 0.016, detail: () => s.fill(s.rect(0.28, 0.82, 0.26, 0.32, 0), '#4a4038') },
    { shape: spire, color: '#7d8c8a', ink: 0.014 },
    { shape: turret, color: stone, ink: 0.014 },
    { shape: turretCap, color: '#7d8c8a', ink: 0.012 },
    {
      shape: rock,
      color: '#6d6a66',
      ink: 0.022,
      hatch: { angle: 0.5, gap: 0.04, alpha: 0.3 },
    },
  ])
  // Autumn shrubs on the rock, and the flag on the tower.
  blobs(s, [[0.3, 0.55, 0.16], [0.5, 0.5, 0.13], [W - 0.25, 0.48, 0.15]], '#d98b3c', 'rgba(150,70,20,0.45)', 0.014)
  s.strip([[1.6, 2.3], [1.6, 2.62]], 0.014, 0.025)
  const flag = s.poly(pts(1.6, 2.62, 1.86, 2.56, 1.6, 2.48), 0)
  s.fill(flag, C.red)
  s.ink(flag, 0.008)
}

// ---------------------------------------------------------------------------
// A horse and carriage, the driver in a top hat up front.

export function hansomCab(s: Sketch) {
  const horse = '#f3efe6'
  const red = '#8e2b2b'
  // The horse, trotting to the right.
  const legs: [number, number, number][] = [
    [1.62, 0.02, 0.1],
    [1.74, 0.0, -0.05],
    [2.05, 0.02, 0.12],
    [2.17, 0.0, -0.08],
  ]
  legs.forEach(([x, , lean]) => s.strip([[x, 0.6], [x + lean, 0.05]], 0.06, 0.03, shade(horse, -0.12)))
  const body = s.ellipse(1.9, 0.72, 0.36, 0.2, 0.03)
  const neck = s.poly(pts(2.08, 0.75, 2.22, 0.72, 2.36, 1.1, 2.24, 1.16), 0.002)
  const headShape = s.poly(pts(2.24, 1.16, 2.36, 1.1, 2.5, 0.94, 2.46, 0.88, 2.3, 0.98), 0.002)
  const tail = s.custom(
    (p) => {
      p.moveTo(1.55, 0.8)
      p.quadraticCurveTo(1.42, 0.7, 1.46, 0.45)
      p.quadraticCurveTo(1.52, 0.62, 1.58, 0.72)
      p.closePath()
    },
    pts(1.42, 0.45, 1.58, 0.8)
  )
  paint(s, [
    { shape: tail, color: '#cfc6b4', ink: 0.01 },
    { shape: body, color: horse, ink: 0.016 },
    { shape: neck, color: horse, ink: 0.014 },
    { shape: headShape, color: horse, ink: 0.014, detail: () => s.fill(s.ellipse(2.38, 1.02, 0.012, 0.014), INK) },
  ])
  // Harness, and a red plume.
  s.line([[1.62, 0.8], [2.18, 0.78]], 0.02, INK, 0)
  s.line([[2.22, 1.12], [2.42, 0.95]], 0.012, INK, 0)
  blobs(s, [[2.27, 1.24, 0.05]], C.red, 'rgba(100,20,20,0.4)', 0.008)
  // The carriage behind.
  s.strip([[0.95, 0.42], [1.75, 0.66]], 0.025, 0.03, '#3a2a24')
  const cab = s.custom(
    (p) => {
      p.moveTo(0.2, 0.35)
      p.lineTo(1.1, 0.35)
      p.lineTo(1.18, 0.6)
      p.lineTo(0.95, 0.72)
      p.lineTo(0.3, 0.72)
      p.quadraticCurveTo(0.16, 0.6, 0.2, 0.35)
      p.closePath()
    },
    pts(0.16, 0.35, 1.18, 0.72)
  )
  const hood = s.custom(
    (p) => {
      p.moveTo(0.22, 0.72)
      p.quadraticCurveTo(0.2, 1.2, 0.62, 1.22)
      p.lineTo(0.66, 0.72)
      p.closePath()
    },
    pts(0.2, 0.72, 0.66, 1.22)
  )
  const seat = s.rect(0.9, 0.72, 0.28, 0.08, 0.002)
  const driver = person(s, 1.02, 0.55, 0.62, { coat: '#2f2a2e', hat: 'fedora' })
  const riders = person(s, 0.5, 0.5, 0.6, { coat: '#d06aa6', hair: '#3b2a24', skirt: true })
  paint(s, [...riders, ...driver], 0.04)
  // A top hat over the driver's hat.
  const topHat = s.rect(0.975, 1.12, 0.09, 0.12, 0)
  s.fill(topHat, '#1f1c22')
  const wheel = (cx: number, r: number) => {
    const ring: Pt[] = []
    for (let k = 0; k <= 30; k++) ring.push([cx + Math.cos((k / 30) * Math.PI * 2) * r, r + 0.02 + Math.sin((k / 30) * Math.PI * 2) * r])
    s.strip(ring, 0.035, 0.03, '#3a2a24')
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI
      s.line([[cx - Math.cos(a) * r, r + 0.02 - Math.sin(a) * r], [cx + Math.cos(a) * r, r + 0.02 + Math.sin(a) * r]], 0.008, C.redDark, 0)
    }
  }
  paint(s, [
    { shape: hood, color: '#2a2628', ink: 0.016, hatch: { angle: 0.3, gap: 0.05, alpha: 0.3 } },
    {
      shape: cab,
      color: red,
      ink: 0.018,
      detail: () => {
        s.line([[0.25, 0.5], [1.1, 0.5]], 0.012, '#e2b45c', 0)
        const lantern = s.rect(1.1, 0.75, 0.07, 0.1, 0)
        s.fill(lantern, '#ffe7a8')
        s.glow(lantern, '#ffd27a')
      },
    },
    { shape: seat, color: '#3a2a24', ink: 0.01 },
  ])
  wheel(0.48, 0.3)
  wheel(1.08, 0.2)
}

// A grey squirrel clutching an acorn. Faces right.
export function squirrel(s: Sketch) {
  const fur = '#8d8a86'
  const tail = s.custom(
    (p) => {
      p.moveTo(0.2, 0.08)
      p.quadraticCurveTo(0.0, 0.2, 0.08, 0.4)
      p.quadraticCurveTo(0.14, 0.52, 0.28, 0.46)
      p.quadraticCurveTo(0.14, 0.4, 0.18, 0.3)
      p.quadraticCurveTo(0.24, 0.18, 0.3, 0.12)
      p.closePath()
    },
    pts(0.0, 0.08, 0.3, 0.52)
  )
  const body = s.ellipse(0.32, 0.15, 0.13, 0.1, 0.3)
  const head = s.ellipse(0.44, 0.27, 0.07, 0.065)
  const ear = s.poly(pts(0.4, 0.31, 0.43, 0.38, 0.45, 0.32), 0)
  const acorn = s.ellipse(0.52, 0.17, 0.035, 0.042)
  const cap = s.custom((p) => p.arc(0.52, 0.19, 0.04, 0, Math.PI, false), pts(0.48, 0.19, 0.56, 0.23))
  paint(
    s,
    [
      { shape: tail, color: shade(fur, 0.08), ink: 0.012, hatch: { angle: 1.0, gap: 0.025, alpha: 0.3 } },
      { shape: body, color: fur, ink: 0.012, detail: () => s.fill(s.ellipse(0.38, 0.12, 0.05, 0.06), '#e9e2d6') },
      { shape: ear, color: fur, ink: 0.008 },
      { shape: head, color: fur, ink: 0.012, detail: () => s.fill(s.ellipse(0.47, 0.29, 0.012, 0.014), INK) },
      { shape: acorn, color: '#a8723c', ink: 0.008 },
      { shape: cap, color: '#6b4a2c', ink: 0.008 },
    ],
    0.04
  )
  for (const x of [0.26, 0.38]) s.fill(s.ellipse(x, 0.04, 0.035, 0.018), shade(fur, -0.15))
}
