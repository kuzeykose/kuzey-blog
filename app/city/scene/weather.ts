import * as THREE from 'three'
import { PAGE_D, PAGE_W } from './art-book'
import { PAGE_Y } from './book'

export type Weather = 'clear' | 'rain' | 'snow'

// What the weather lands on: the open pages, the shut book, or (while the
// pages are moving) nothing in particular.
export type Ground = 'open' | 'closed' | 'moving'

// Weather falls through a box over the book and a margin of table.
const SPAN_X = 13
const SPAN_Z = 8
const TOP = 15
const DROPS = 2200
const DROP_LEN = 0.34
const WIND = 0.14
const FLAKES = 2000
const RIPPLES = 96
const RIPPLE_LIFE = 0.45

function flakeTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  // A paper-white dot with a faint grey rim, so it shows on pale paper too.
  g.fillStyle = 'rgba(110,120,140,0.3)'
  g.beginPath()
  g.arc(32, 32, 28, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#ffffff'
  g.beginPath()
  g.arc(32, 32, 25, 0, Math.PI * 2)
  g.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export class WeatherFx {
  readonly root = new THREE.Group()

  // Per drop: x, y, z, speed.
  private drops = new Float32Array(DROPS * 4)
  private rainGeo = new THREE.BufferGeometry()
  private rainMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false })
  private rain: THREE.LineSegments

  // Per flake: x, y, z, speed, phase. Two layers of different sizes share
  // the positions.
  private flakes = new Float32Array(FLAKES * 5)
  private snowPos = new THREE.BufferAttribute(new Float32Array(FLAKES * 3), 3)
  private flakeTex = flakeTexture()
  private snow: THREE.Points[] = []

  // Wet rings where drops hit the paper: they darken what's under them and
  // fade as they spread.
  private ripples: THREE.InstancedMesh
  private rippleAge = new Float32Array(RIPPLES).fill(1)
  private rippleNext = 0
  private ripplePos = new Float32Array(RIPPLES * 3)
  private color = new THREE.Color()
  private dummy = new THREE.Object3D()

  constructor() {
    for (let i = 0; i < DROPS; i++) this.spawnDrop(i, Math.random() * TOP)
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DROPS * 6), 3))
    this.rain = new THREE.LineSegments(this.rainGeo, this.rainMat)
    this.rain.frustumCulled = false

    for (let i = 0; i < FLAKES; i++) {
      this.spawnFlake(i, Math.random() * TOP)
      this.flakes[i * 5 + 4] = Math.random() * Math.PI * 2
    }
    const half = FLAKES / 2
    for (const [from, size] of [
      [0, 0.14],
      [half, 0.24],
    ]) {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', this.snowPos)
      geo.setDrawRange(from, half)
      const mat = new THREE.PointsMaterial({
        size,
        map: this.flakeTex,
        transparent: true,
        alphaTest: 0.05,
        depthWrite: false,
      })
      const points = new THREE.Points(geo, mat)
      points.frustumCulled = false
      this.snow.push(points)
    }

    const ring = new THREE.RingGeometry(0.62, 1, 16).rotateX(-Math.PI / 2)
    this.ripples = new THREE.InstancedMesh(
      ring,
      new THREE.MeshBasicMaterial({
        blending: THREE.MultiplyBlending,
        premultipliedAlpha: true,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
      RIPPLES
    )
    this.ripples.frustumCulled = false
    for (let i = 0; i < RIPPLES; i++) {
      this.dummy.scale.setScalar(0)
      this.dummy.updateMatrix()
      this.ripples.setMatrixAt(i, this.dummy.matrix)
      this.ripples.setColorAt(i, this.color.setScalar(1))
    }

    this.root.add(this.rain, ...this.snow, this.ripples)
    this.root.visible = false
  }

  private spawnDrop(i: number, y: number) {
    const d = this.drops
    d[i * 4] = (Math.random() * 2 - 1) * SPAN_X
    d[i * 4 + 1] = y
    d[i * 4 + 2] = (Math.random() * 2 - 1) * SPAN_Z
    d[i * 4 + 3] = 10 + Math.random() * 3
  }

  private spawnFlake(i: number, y: number) {
    const f = this.flakes
    f[i * 5] = (Math.random() * 2 - 1) * SPAN_X
    f[i * 5 + 1] = y
    f[i * 5 + 2] = (Math.random() * 2 - 1) * SPAN_Z
    f[i * 5 + 3] = 0.45 + Math.random() * 0.4
  }

  // Height of whatever is under (x, z), or null if the weather should just
  // vanish there (into pages that are on the move).
  private floor(x: number, z: number, ground: Ground) {
    if (ground === 'closed') {
      return x > 0 && x < PAGE_W + 0.2 && Math.abs(z) < PAGE_D / 2 + 0.2 ? PAGE_Y * 2 : 0
    }
    const onBook = Math.abs(x) < PAGE_W && Math.abs(z) < PAGE_D / 2
    if (!onBook) return 0
    return ground === 'open' ? PAGE_Y : null
  }

  private ripple(x: number, y: number, z: number) {
    const i = this.rippleNext
    this.rippleNext = (i + 1) % RIPPLES
    this.rippleAge[i] = 0
    this.ripplePos.set([x, y + 0.012, z], i * 3)
  }

  // `rain` and `snow` are how hard each is falling (0..1).
  update(dt: number, time: number, o: { rain: number; snow: number; night: number; ground: Ground }) {
    const { rain, snow, night, ground } = o
    this.root.visible = rain > 0.001 || snow > 0.001 || this.rippleAge.some((a) => a < 1)
    if (!this.root.visible) return

    // Rain: slanted streaks, a little lighter against the night.
    this.rain.visible = rain > 0.001
    if (this.rain.visible) {
      this.rainMat.color.set('#6f8299').lerp(this.color.set('#a3b4d8'), night)
      this.rainMat.opacity = rain * THREE.MathUtils.lerp(0.42, 0.36, night)
      const d = this.drops
      const pos = this.rainGeo.attributes.position as THREE.BufferAttribute
      const p = pos.array as Float32Array
      for (let i = 0; i < DROPS; i++) {
        const k = i * 4
        const fall = d[k + 3] * dt
        d[k] += fall * WIND
        d[k + 1] -= fall
        const x = d[k]
        const z = d[k + 2]
        const below = this.floor(x, z, ground)
        if (below === null ? d[k + 1] < PAGE_Y : d[k + 1] < below) {
          if (below !== null && Math.random() < 0.3 * rain) this.ripple(x, below, z)
          this.spawnDrop(i, TOP + Math.random() * 1.5)
        }
        const j = i * 6
        p[j] = d[k]
        p[j + 1] = d[k + 1]
        p[j + 2] = d[k + 2]
        p[j + 3] = d[k] - WIND * DROP_LEN
        p[j + 4] = d[k + 1] + DROP_LEN
        p[j + 5] = d[k + 2]
      }
      pos.needsUpdate = true
    }

    // Snow: slow, swaying flakes.
    const snowing = snow > 0.001
    for (const s of this.snow) {
      s.visible = snowing
      const mat = s.material as THREE.PointsMaterial
      mat.opacity = snow
      mat.color.set('#ffffff').lerp(this.color.set('#b9c4de'), night)
    }
    if (snowing) {
      const f = this.flakes
      const p = this.snowPos.array as Float32Array
      for (let i = 0; i < FLAKES; i++) {
        const k = i * 5
        const ph = f[k + 4]
        f[k] += (Math.sin(time * 1.3 + ph) * 0.35 + 0.12) * dt
        f[k + 1] -= f[k + 3] * dt
        f[k + 2] += Math.cos(time * 0.9 + ph * 1.7) * 0.2 * dt
        const below = this.floor(f[k], f[k + 2], ground)
        if (f[k + 1] < (below ?? PAGE_Y)) this.spawnFlake(i, TOP + Math.random())
        p[i * 3] = f[k]
        p[i * 3 + 1] = f[k + 1]
        p[i * 3 + 2] = f[k + 2]
      }
      this.snowPos.needsUpdate = true
    }

    // Ripples spread and fade.
    for (let i = 0; i < RIPPLES; i++) {
      const a = this.rippleAge[i]
      if (a >= 1) continue
      const next = Math.min(1, a + dt / RIPPLE_LIFE)
      this.rippleAge[i] = next
      this.dummy.position.fromArray(this.ripplePos, i * 3)
      this.dummy.scale.setScalar(next >= 1 ? 0 : 0.04 + next * 0.18)
      this.dummy.updateMatrix()
      this.ripples.setMatrixAt(i, this.dummy.matrix)
      this.ripples.setColorAt(i, this.color.setScalar(1 - 0.42 * (1 - next) * (1 - 0.6 * night)))
    }
    this.ripples.instanceMatrix.needsUpdate = true
    if (this.ripples.instanceColor) this.ripples.instanceColor.needsUpdate = true
  }

  dispose() {
    this.rainGeo.dispose()
    this.rainMat.dispose()
    this.snow.forEach((s) => {
      s.geometry.dispose()
      ;(s.material as THREE.Material).dispose()
    })
    this.flakeTex.dispose()
    this.ripples.geometry.dispose()
    ;(this.ripples.material as THREE.Material).dispose()
  }
}
