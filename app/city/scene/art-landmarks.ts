import { INK, Pt, Shape, Sketch, rgba, shade } from './sketch'
import { C } from './palette'
import { Part, paint, pts } from './art-common'

// ---------------------------------------------------------------------------
// The big arched sky that closes the scene, with sun rays (or stars).

export function skyBackdrop(s: Sketch, night: boolean) {
  const W = s.w
  const H = s.h
  const side = H * 0.5
  const arch = s.custom(
    (p) => {
      p.moveTo(0, 0)
      p.lineTo(W, 0)
      p.lineTo(W, side)
      p.ellipse(W / 2, side, W / 2, H - side, 0, 0, Math.PI, false)
      p.lineTo(0, 0)
      p.closePath()
    },
    [
      [0, 0],
      [W, H],
    ]
  )
  s.border([arch], 0.09)
  const c = s.ctx
  c.save()
  c.clip(arch.path)

  const g = c.createLinearGradient(0, 0, 0, H)
  if (night) {
    g.addColorStop(0, '#34477a')
    g.addColorStop(0.45, C.skyNight)
    g.addColorStop(1, C.skyNightDeep)
  } else {
    g.addColorStop(0, '#e3f0f2')
    g.addColorStop(0.4, C.sky)
    g.addColorStop(1, C.skyDeep)
  }
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
  s.wash(arch, night ? C.skyNight : C.sky, { blooms: 26, vary: 0.12, edge: 0, light: 0, dark: 0 })
  c.globalAlpha = 0.55
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
  c.globalAlpha = 1

  // Rays fanning out from behind the skyline.
  const ox = W / 2
  const oy = side * 0.35
  const n = 22
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (0.06 + (0.88 * (i + 0.5)) / n)
    const spread = 0.022 + (i % 3) * 0.008
    c.fillStyle = night ? 'rgba(170,190,255,0.06)' : `rgba(255,255,255,${i % 2 ? 0.22 : 0.38})`
    c.beginPath()
    c.moveTo(ox, oy)
    c.lineTo(ox + Math.cos(a - spread) * 20, oy + Math.sin(a - spread) * 20)
    c.lineTo(ox + Math.cos(a + spread) * 20, oy + Math.sin(a + spread) * 20)
    c.closePath()
    c.fill()
    if (!night && i % 2 === 0) {
      s.line(
        [
          [ox + Math.cos(a) * 2.4, oy + Math.sin(a) * 2.4],
          [ox + Math.cos(a) * (3.6 + (i % 4) * 0.5), oy + Math.sin(a) * (3.6 + (i % 4) * 0.5)],
        ],
        0.012,
        rgba('#ffffff', 0.85),
        0.02
      )
    }
  }

  if (night) {
    // Stars and a crescent moon. They are also painted into the glow map.
    for (let i = 0; i < 170; i++) {
      const x = s.r(0.2, W - 0.2)
      const y = s.r(side * 0.55, H - 0.1)
      const r = s.r(0.012, 0.034)
      const star = s.ellipse(x, y, r, r)
      s.fill(star, '#fff6d8', s.r(0.5, 1))
      s.glow(star, '#fff2c8')
    }
    for (let i = 0; i < 14; i++) {
      const x = s.r(0.6, W - 0.6)
      const y = s.r(side * 0.9, H - 0.5)
      const r = s.r(0.06, 0.13)
      const spark = s.poly(
        [
          [x, y + r],
          [x + r * 0.18, y + r * 0.18],
          [x + r, y],
          [x + r * 0.18, y - r * 0.18],
          [x, y - r],
          [x - r * 0.18, y - r * 0.18],
          [x - r, y],
          [x - r * 0.18, y + r * 0.18],
        ],
        0
      )
      s.fill(spark, '#fff2c8')
      s.glow(spark, '#fff2c8')
    }
    const mx = W * 0.77
    const my = H * 0.74
    const moon = s.ellipse(mx, my, 0.5, 0.5)
    s.wash(moon, '#f7ecc8', { edge: 0.1, blooms: 6 })
    s.glow(moon, '#fff0c0')
    const bite = s.ellipse(mx + 0.24, my + 0.13, 0.44, 0.44)
    s.fill(bite, '#22325c')
    if (s.glowCtx) {
      s.glowCtx.fillStyle = '#000'
      s.glowCtx.fill(bite.path)
    }
    s.ink(s.custom((p) => p.arc(mx, my, 0.5, 0.95, 5.55, false), [[mx - 0.5, my - 0.5], [mx + 0.5, my + 0.5]]), 0.02)
  } else {
    const sun = s.ellipse(ox, oy + 0.6, 1.25, 1.25)
    s.wash(sun, C.sun, { edge: 0.15, blooms: 8 })
    s.ink(sun, 0.02, rgba(INK, 0.7))
    // A few small painted clouds and birds far away.
    for (const [x, y, k] of [
      [1.4, 4.9, 0.8],
      [9.7, 5.4, 1],
      [4.0, 6.5, 0.6],
      [7.6, 6.9, 0.55],
    ] as [number, number, number][]) {
      flatCloud(s, x, y, k)
    }
    for (const [x, y] of [
      [3.1, 5.4],
      [3.4, 5.6],
      [3.7, 5.35],
      [8.2, 4.6],
      [8.5, 4.8],
    ]) {
      s.line([[x - 0.12, y + 0.05], [x - 0.05, y], [x, y + 0.03], [x + 0.05, y], [x + 0.12, y + 0.05]], 0.016)
    }
  }

  // Decorative inner rule, like a vintage frame.
  c.setLineDash([0.12, 0.08])
  c.strokeStyle = night ? 'rgba(255,240,200,0.45)' : 'rgba(42,39,51,0.35)'
  c.lineWidth = 0.02
  c.beginPath()
  c.moveTo(0.22, 0)
  c.lineTo(0.22, side)
  c.ellipse(W / 2, side, W / 2 - 0.22, H - side - 0.22, 0, Math.PI, 0, true)
  c.lineTo(W - 0.22, 0)
  c.stroke()
  c.setLineDash([])
  c.restore()
  s.ink(arch, 0.04)
}

function flatCloud(s: Sketch, x: number, y: number, k: number) {
  const c = s.ctx
  const puffs: [number, number, number][] = [
    [-0.55, 0, 0.28],
    [-0.15, 0.15, 0.38],
    [0.3, 0.08, 0.32],
    [0.65, -0.02, 0.22],
  ]
  c.save()
  c.translate(x, y)
  c.scale(k, k)
  c.fillStyle = 'rgba(255,255,255,0.85)'
  c.strokeStyle = 'rgba(42,39,51,0.35)'
  c.lineWidth = 0.04
  c.beginPath()
  puffs.forEach(([px, py, r]) => {
    c.moveTo(px + r, py)
    c.arc(px, py, r, 0, Math.PI * 2)
  })
  c.rect(-0.75, -0.2, 1.55, 0.2)
  c.stroke()
  c.fill()
  c.restore()
}

// ---------------------------------------------------------------------------
// Empire State Building.

export function empireState(s: Sketch) {
  const stone = C.limestone
  const tiers: [number, number, number, number][] = [
    // x0, x1, y0, y1
    [0, 2.6, 0, 0.75],
    [0.18, 2.42, 0.75, 1.05],
    [0.38, 2.22, 1.05, 4.05],
    [0.62, 1.98, 1.05, 4.85],
    [0.8, 1.8, 4.85, 5.15],
    [0.95, 1.65, 5.15, 5.4],
    [1.07, 1.53, 5.4, 5.85],
    [1.13, 1.47, 5.85, 6.1],
    [1.19, 1.41, 6.1, 6.3],
  ]
  const shapes = tiers.map(([x0, x1, y0, y1]) => s.rect(x0, y0, x1 - x0, y1 - y0, 0.005))
  const antenna = s.poly(pts(1.285, 6.28, 1.315, 6.28, 1.302, 7.0, 1.298, 7.0), 0)
  const dome = s.ellipse(1.3, 6.3, 0.11, 0.07)

  const strips = (x0: number, x1: number, y0: number, y1: number, n: number, tone: string) => {
    const w = (x1 - x0) / n
    for (let i = 0; i < n; i++) {
      const sx = x0 + w * (i + 0.28)
      const sw = w * 0.44
      s.fill(s.rect(sx, y0, sw, y1 - y0, 0), tone)
      for (let y = y0 + 0.06; y < y1 - 0.02; y += 0.11) {
        s.line([[sx, y], [sx + sw, y]], 0.008, rgba('#e8e2d0', 0.75), 0)
        if (s.rnd() < 0.45) s.glow(s.rect(sx, y - 0.1, sw, 0.08, 0), s.pick(['#ffd27a', '#ffe2a3']))
      }
    }
  }

  const parts: Part[] = [
    {
      shape: shapes[0],
      color: shade(stone, -0.05),
      detail: () => {
        s.fill(s.rect(0.15, 0, 2.3, 0.42, 0), C.window)
        s.glow(s.rect(0.15, 0, 2.3, 0.42, 0), '#ffd889')
        for (let i = 0; i <= 8; i++) s.line([[0.15 + (2.3 * i) / 8, 0], [0.15 + (2.3 * i) / 8, 0.42]], 0.014)
        s.fill(s.rect(1.05, 0, 0.5, 0.62, 0), C.ochre)
        s.text('350', 1.3, 0.47, 0.1, { color: INK })
        strips(0.15, 2.45, 0.5, 0.72, 9, C.window)
      },
    },
    { shape: shapes[1], color: stone, detail: () => strips(0.25, 2.35, 0.8, 1.0, 9, C.window) },
    {
      shape: shapes[2],
      color: shade(stone, -0.04),
      detail: () => {
        strips(0.38, 0.62, 1.1, 4.0, 1, C.window)
        strips(1.98, 2.22, 1.1, 4.0, 1, C.window)
        s.hatch(s.rect(1.98, 1.05, 0.24, 3.0, 0), { angle: 1.25, gap: 0.04, alpha: 0.4 })
      },
    },
    {
      shape: shapes[3],
      color: stone,
      detail: () => {
        strips(0.62, 1.98, 1.1, 4.8, 7, C.window)
        s.hatch(s.rect(1.62, 1.05, 0.36, 3.8, 0), { angle: 1.25, gap: 0.05, alpha: 0.3 })
      },
    },
    { shape: shapes[4], color: stone, detail: () => strips(0.8, 1.8, 4.88, 5.12, 5, C.window) },
    { shape: shapes[5], color: stone, detail: () => strips(0.95, 1.65, 5.18, 5.37, 3, C.window) },
    {
      shape: shapes[6],
      color: C.steel,
      detail: () => {
        for (let i = 1; i < 6; i++) s.line([[1.07 + (0.46 * i) / 6, 5.42], [1.07 + (0.46 * i) / 6, 5.83]], 0.01)
      },
    },
    { shape: shapes[7], color: C.steel },
    { shape: shapes[8], color: C.steel },
    { shape: dome, color: C.steelDark },
    { shape: antenna, color: C.steelDark, ink: 0.01 },
  ]
  paint(s, parts.map((p) => ({ ink: 0.026, ...p })))
  // The famous lit crown.
  s.glow(shapes[4], '#7fa7ff')
  s.glow(shapes[5], '#f4f6ff')
  s.glow(shapes[6], '#ff6b6b')
  s.glow(shapes[7], '#ffffff')
  s.glow(s.ellipse(1.3, 6.98, 0.03, 0.03), '#ff4444')
}

// ---------------------------------------------------------------------------
// Chrysler Building with its stacked sunburst crown.

export function chrysler(s: Sketch) {
  const brick = '#ddd7cb'
  const base = s.rect(0, 0, 2.0, 0.9, 0.005)
  const shaft = s.rect(0.25, 0.9, 1.5, 2.65, 0.005)
  const upper = s.rect(0.42, 3.55, 1.16, 0.6, 0.004)
  const eagles = [
    s.poly(pts(0.42, 4.05, 0.26, 4.0, 0.3, 4.12, 0.42, 4.15), 0),
    s.poly(pts(1.58, 4.05, 1.74, 4.0, 1.7, 4.12, 1.58, 4.15), 0),
  ]
  const tiers: Shape[] = []
  for (let i = 0; i < 6; i++) {
    const w = 1.08 - i * 0.17
    const y = 4.15 + i * 0.2
    const r = w / 2
    tiers.push(
      s.custom(
        (p) => {
          p.moveTo(1 - r, y)
          p.lineTo(1 - r, y + 0.05)
          p.arc(1, y + 0.05, r, Math.PI, 0, true)
          p.lineTo(1 + r, y)
          p.closePath()
        },
        [
          [1 - r, y],
          [1 + r, y + 0.05 + r],
        ]
      )
    )
  }
  const spire = s.poly(pts(0.94, 5.25, 1.06, 5.25, 1.0, 6.3), 0)

  const strips = (x0: number, x1: number, y0: number, y1: number, n: number) => {
    const w = (x1 - x0) / n
    for (let i = 0; i < n; i++) {
      const sx = x0 + w * (i + 0.3)
      s.fill(s.rect(sx, y0, w * 0.4, y1 - y0, 0), C.window)
      for (let y = y0 + 0.05; y < y1; y += 0.1) {
        s.line([[sx, y], [sx + w * 0.4, y]], 0.007, rgba('#f2eee4', 0.8), 0)
        if (s.rnd() < 0.4) s.glow(s.rect(sx, y - 0.09, w * 0.4, 0.07, 0), '#ffe0a0')
      }
    }
  }

  const parts: Part[] = [
    {
      shape: base,
      color: shade(brick, -0.08),
      detail: () => {
        s.fill(s.rect(0.1, 0, 1.8, 0.4, 0), C.window)
        s.glow(s.rect(0.1, 0, 1.8, 0.4, 0), '#ffd889')
        for (let i = 0; i <= 6; i++) s.line([[0.1 + 0.3 * i, 0], [0.1 + 0.3 * i, 0.4]], 0.014)
        strips(0.1, 1.9, 0.48, 0.85, 7)
      },
    },
    {
      shape: shaft,
      color: brick,
      detail: () => {
        strips(0.25, 1.75, 0.95, 3.5, 7)
        for (const y of [1.5, 2.3, 3.1]) s.fill(s.rect(0.25, y, 1.5, 0.06, 0), '#5d5f68')
        s.hatch(s.rect(1.45, 0.9, 0.3, 2.65, 0), { angle: 1.25, gap: 0.045, alpha: 0.3 })
      },
    },
    {
      shape: upper,
      color: brick,
      detail: () => {
        strips(0.42, 1.58, 3.6, 4.1, 5)
        s.fill(s.rect(0.42, 3.98, 1.16, 0.05, 0), '#5d5f68')
      },
    },
    ...eagles.map((e) => ({ shape: e, color: C.steel, ink: 0.014 })),
    ...tiers.map((t, i) => ({
      shape: t,
      color: shade(C.steel, i % 2 ? 0.05 : -0.02),
      detail: () => {
        const w = 1.08 - i * 0.17
        const y = 4.15 + i * 0.2 + 0.05
        const r = w / 2
        // Triangular windows set into each arch.
        const n = 9 - i
        for (let k = 0; k < n; k++) {
          const a = Math.PI * (0.12 + (0.76 * (k + 0.5)) / n)
          const cx = 1 + Math.cos(a) * r * 0.72
          const cy = y + Math.sin(a) * r * 0.72
          const tri = s.poly(
            [
              [cx + Math.cos(a) * 0.07, cy + Math.sin(a) * 0.07],
              [cx + Math.cos(a + 1.9) * 0.035, cy + Math.sin(a + 1.9) * 0.035],
              [cx + Math.cos(a - 1.9) * 0.035, cy + Math.sin(a - 1.9) * 0.035],
            ],
            0
          )
          s.fill(tri, '#3b4357')
          s.glow(tri, '#fff6dc')
        }
        for (let k = 0; k < 7; k++) {
          const a = Math.PI * (0.1 + (0.8 * k) / 6)
          s.line([[1 + Math.cos(a) * r * 0.35, y + Math.sin(a) * r * 0.35], [1 + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95]], 0.008, rgba(INK, 0.55))
        }
      },
      hatch: { angle: 1.2, gap: 0.05, alpha: 0.15 },
    })),
    { shape: spire, color: C.steel, ink: 0.014 },
  ]
  paint(s, parts.map((p) => ({ ink: 0.024, ...p })))
}

// ---------------------------------------------------------------------------
// Lady Liberty on her pedestal.

export function liberty(s: Sketch) {
  const cu = C.copper
  const stone = '#d4c2a0'
  const fort = s.poly(pts(0.05, 0, 1.75, 0, 1.62, 0.32, 0.18, 0.32), 0.004)
  const plinth = s.rect(0.3, 0.32, 1.2, 0.28, 0.003)
  const shaft = s.rect(0.42, 0.6, 0.96, 0.75, 0.003)
  const cap = s.rect(0.34, 1.35, 1.12, 0.14, 0.002)
  const top = s.rect(0.5, 1.49, 0.8, 0.13, 0.002)

  const robe = s.custom(
    (p) => {
      p.moveTo(0.58, 1.62)
      p.quadraticCurveTo(0.9, 1.58, 1.22, 1.62)
      p.quadraticCurveTo(1.12, 2.2, 1.12, 2.75)
      p.lineTo(1.06, 2.98)
      p.lineTo(0.98, 3.04)
      p.lineTo(0.82, 3.04)
      p.lineTo(0.72, 2.98)
      p.quadraticCurveTo(0.66, 2.4, 0.58, 1.62)
      p.closePath()
    },
    pts(0.58, 1.6, 1.22, 3.04)
  )
  const arm = s.poly(pts(0.68, 2.9, 0.8, 2.98, 0.63, 3.6, 0.52, 3.57), 0.002)
  const handle = s.poly(pts(0.53, 3.55, 0.6, 3.56, 0.56, 3.74, 0.5, 3.73), 0)
  const cup = s.poly(pts(0.43, 3.72, 0.63, 3.75, 0.6, 3.81, 0.46, 3.79), 0)
  const flame = s.custom(
    (p) => {
      p.moveTo(0.46, 3.8)
      p.quadraticCurveTo(0.46, 3.9, 0.54, 3.96)
      p.quadraticCurveTo(0.6, 3.88, 0.6, 3.81)
      p.closePath()
    },
    pts(0.46, 3.8, 0.6, 3.96)
  )
  const head = s.ellipse(0.9, 3.15, 0.1, 0.11)
  const spikes: Shape[] = []
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.12 + (0.76 * i) / 6)
    const bx = 0.9 + Math.cos(a) * 0.1
    const by = 3.18 + Math.sin(a) * 0.1
    spikes.push(
      s.poly(
        [
          [bx + Math.cos(a + 1.57) * 0.025, by + Math.sin(a + 1.57) * 0.025],
          [bx + Math.cos(a) * 0.14, by + Math.sin(a) * 0.14],
          [bx + Math.cos(a - 1.57) * 0.025, by + Math.sin(a - 1.57) * 0.025],
        ],
        0
      )
    )
  }
  const tablet = s.poly(pts(1.03, 2.38, 1.2, 2.33, 1.27, 2.66, 1.1, 2.71), 0.002)
  const forearm = s.poly(pts(1.06, 2.82, 1.13, 2.78, 1.2, 2.5, 1.12, 2.5), 0.002)

  const parts: Part[] = [
    {
      shape: fort,
      color: stone,
      detail: () => {
        for (let x = 0.25; x < 1.6; x += 0.18) s.line([[x, 0.02], [x + 0.02, 0.3]], 0.008, rgba(INK, 0.5))
        s.hatch(fort, { angle: 0.4, gap: 0.05, alpha: 0.2 })
      },
    },
    { shape: plinth, color: shade(stone, 0.05) },
    {
      shape: shaft,
      color: stone,
      detail: () => {
        for (const x of [0.62, 1.1]) {
          s.fill(s.rect(x, 0.78, 0.08, 0.36, 0), C.window)
          s.glow(s.rect(x, 0.78, 0.08, 0.36, 0), '#ffd27a')
        }
        s.fill(s.rect(0.86, 0.72, 0.08, 0.5, 0), shade(stone, -0.2))
        s.hatch(s.rect(1.2, 0.6, 0.18, 0.75, 0), { angle: 1.3, gap: 0.04, alpha: 0.35 })
      },
    },
    { shape: cap, color: shade(stone, -0.05) },
    { shape: top, color: stone },
    {
      shape: robe,
      color: cu,
      detail: () => {
        // Drapery folds.
        for (const [x0, x1] of [
          [0.7, 0.68],
          [0.8, 0.76],
          [0.93, 0.9],
          [1.04, 1.02],
          [1.13, 1.08],
        ]) {
          s.line([[x0, 1.66], [x1 + 0.02, 2.2], [x1 + 0.04, 2.7]], 0.01, rgba(INK, 0.6))
        }
        s.line([[0.75, 2.95], [1.1, 2.55]], 0.012, rgba(INK, 0.7))
        s.hatch(robe, { angle: 1.25, gap: 0.04, alpha: 0.12 })
        s.hatch(s.rect(0.98, 1.6, 0.26, 1.5, 0), { angle: 1.2, gap: 0.035, alpha: 0.3 })
      },
    },
    { shape: arm, color: cu, hatch: { angle: 0.4, gap: 0.035, alpha: 0.25 } },
    { shape: handle, color: C.copperDark, ink: 0.012 },
    { shape: cup, color: '#d9b45c', ink: 0.012 },
    { shape: flame, color: '#f2b13c', ink: 0.012 },
    ...spikes.map((sp) => ({ shape: sp, color: cu, ink: 0.01 })),
    {
      shape: head,
      color: cu,
      detail: () => {
        s.fill(s.ellipse(0.87, 3.15, 0.012, 0.012), INK)
        s.fill(s.ellipse(0.93, 3.15, 0.012, 0.012), INK)
        s.fill(s.rect(0.8, 3.22, 0.2, 0.04, 0), C.copperDark)
      },
    },
    { shape: forearm, color: cu },
    {
      shape: tablet,
      color: C.copperLight,
      detail: () => s.line([[1.08, 2.45], [1.2, 2.42]], 0.008, rgba(INK, 0.6)),
    },
  ]
  paint(s, parts.map((p) => ({ ink: 0.02, ...p })))
  s.glow(flame, '#ffc24a')
  s.glow(cup, '#c68a2a')
}

// ---------------------------------------------------------------------------
// The Brooklyn Bridge: granite towers, gothic arches, a web of cables.

export function brooklynBridge(s: Sketch) {
  const W = s.w
  const deckY = 0.85
  const deckH = 0.15
  const towers = [W * 0.27, W * 0.73]
  const towerTop = 2.55
  const granite = '#d3bf9c'

  const cablePt = (x: number): number => {
    // Main cable height above x: sagging spans between towers and anchors.
    const [t1, t2] = towers
    const anchor = deckY + deckH + 0.05
    const top = towerTop - 0.1
    if (x <= t1) {
      const u = (x - 0.3) / (t1 - 0.3)
      return anchor + (top - anchor) * u * u
    }
    if (x >= t2) {
      const u = (W - 0.3 - x) / (W - 0.3 - t2)
      return anchor + (top - anchor) * u * u
    }
    const u = (x - (t1 + t2) / 2) / ((t2 - t1) / 2)
    return deckY + deckH + 0.12 + (top - deckY - deckH - 0.12) * u * u
  }

  // Paper strips first so the towers and deck sit on top of them.
  const cableLine: Pt[] = []
  for (let x = 0.3; x <= W - 0.3; x += 0.05) cableLine.push([x, cablePt(x)])
  for (let x = 0.4; x < W - 0.35; x += 0.13) {
    if (towers.some((t) => Math.abs(x - t) < 0.4)) continue
    s.strip([[x, deckY + deckH], [x, cablePt(x)]], 0.008, 0.03)
  }
  for (const t of towers) {
    for (let k = 1; k <= 6; k++) {
      for (const dir of [-1, 1]) {
        const x = t + dir * (0.45 + k * 0.17)
        if (x < 0.4 || x > W - 0.4) continue
        s.strip([[t + dir * 0.3, towerTop - 0.25], [x, deckY + deckH]], 0.007, 0.03)
      }
    }
  }
  s.strip(cableLine, 0.026, 0.05)

  const anchorL = s.rect(0, 0, 0.6, deckY + deckH + 0.12, 0.004)
  const anchorR = s.rect(W - 0.6, 0, 0.6, deckY + deckH + 0.12, 0.004)
  const deck = s.rect(0.5, deckY, W - 1.0, deckH, 0.003)
  const towerShapes = towers.map((t) =>
    s.poly(
      pts(t - 0.42, 0, t + 0.42, 0, t + 0.36, 0.25, t + 0.34, towerTop - 0.12, t + 0.38, towerTop - 0.12, t + 0.38, towerTop, t - 0.38, towerTop, t - 0.38, towerTop - 0.12, t - 0.34, towerTop - 0.12, t - 0.36, 0.25),
      0.004
    )
  )
  const arches = towers.flatMap((t) =>
    [-1, 1].map((d) => {
      const cx = t + d * 0.14
      const w = 0.17
      return s.custom(
        (p) => {
          p.moveTo(cx - w / 2, deckY + deckH)
          p.lineTo(cx - w / 2, 1.78)
          p.quadraticCurveTo(cx - w / 2, 2.0, cx, 2.1)
          p.quadraticCurveTo(cx + w / 2, 2.0, cx + w / 2, 1.78)
          p.lineTo(cx + w / 2, deckY + deckH)
          p.closePath()
        },
        pts(cx - w / 2, deckY, cx + w / 2, 2.1)
      )
    })
  )

  const stones = (sh: Shape, x0: number, x1: number, y0: number, y1: number) => {
    const c = s.ctx
    c.save()
    c.clip(sh.path)
    for (let y = y0 + 0.12; y < y1; y += 0.12) {
      s.line([[x0, y], [x1, y]], 0.006, rgba(INK, 0.35), 0)
      const off = Math.round(y / 0.12) % 2 ? 0 : 0.1
      for (let x = x0 + off; x < x1; x += 0.2) s.line([[x, y - 0.12], [x, y]], 0.005, rgba(INK, 0.25), 0)
    }
    c.restore()
  }

  const parts: Part[] = [
    ...[anchorL, anchorR].map((a, i) => ({
      shape: a,
      color: granite,
      detail: () => stones(a, i ? W - 0.6 : 0, i ? W : 0.6, 0, deckY + deckH + 0.12),
      hatch: { angle: 1.2, gap: 0.05, alpha: 0.2 },
    })),
    {
      shape: deck,
      color: '#76727a',
      detail: () => {
        for (let x = 0.55; x < W - 0.55; x += 0.1) {
          s.line([[x, deckY + 0.01], [x + 0.05, deckY + deckH - 0.01]], 0.006, rgba('#f2ead8', 0.55), 0)
        }
        s.line([[0.5, deckY + deckH * 0.5], [W - 0.5, deckY + deckH * 0.5]], 0.006, rgba(INK, 0.5), 0)
        // Little street lamps along the promenade.
        for (let x = 0.9; x < W - 0.8; x += 0.55) s.glow(s.ellipse(x, deckY + deckH + 0.02, 0.025, 0.025), '#ffd27a')
      },
    },
    ...towerShapes.map((t, i) => ({
      shape: t,
      color: granite,
      detail: () => {
        stones(t, towers[i] - 0.42, towers[i] + 0.42, 0, towerTop)
        s.hatch(s.rect(towers[i] + 0.18, 0, 0.25, towerTop, 0), { angle: 1.25, gap: 0.04, alpha: 0.3 })
        s.fill(s.rect(towers[i] - 0.42, 0, 0.84, 0.25, 0), shade(granite, -0.15))
      },
    })),
  ]
  paint(s, parts.map((p) => ({ ink: 0.024, ...p })), 0.06)

  // Cut the arch openings out of the towers.
  const c = s.ctx
  arches.forEach((a) => {
    c.save()
    c.globalCompositeOperation = 'destination-out'
    c.fill(a.path)
    c.restore()
    s.ink(a, 0.022)
  })
  // The deck passes in front of the arches.
  s.fill(s.rect(0.5, deckY, W - 1.0, deckH, 0), '#76727a')
  s.ink(s.rect(0.5, deckY, W - 1.0, deckH, 0), 0.02)
  for (let x = 0.55; x < W - 0.55; x += 0.1) {
    s.line([[x, deckY + 0.01], [x + 0.05, deckY + deckH - 0.01]], 0.006, rgba('#f2ead8', 0.55), 0)
  }
  // Tiny flags on the towers.
  towers.forEach((t) => {
    s.line([[t, towerTop], [t, towerTop + 0.18]], 0.012)
    const flag = s.poly(pts(t, towerTop + 0.18, t + 0.14, towerTop + 0.15, t, towerTop + 0.1), 0)
    s.fill(flag, C.red)
    s.ink(flag, 0.008)
  })
}
