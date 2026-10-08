import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Cutout, Sketch } from './sketch'
import { PIECES, PLATFORM, PieceDef } from './pieces'
import { buildBook, Book } from './book'
import { canvasTexture, paperMaterials, shared } from './materials'
import { curb, roadTop, sidewalk, tableTop } from './art-book'

export type StageEvents = {
  onProgress?: (p: number) => void
  onReady?: () => void
  onHover?: (label: string | null) => void
  onOpenChange?: (open: boolean) => void
}

type Spring = { x: number; v: number }
type Shot = { target: THREE.Vector3; at: THREE.Spherical }

type Half = {
  anchor: THREE.Object3D
  hinge: THREE.Object3D
  poke: THREE.Object3D
  bob: THREE.Object3D
  mesh: THREE.Mesh
}

type Piece = {
  def: PieceDef
  cut: Cutout
  halves: Half[]
  start: number
  rise: number
  eps: number
  phase: number
  tilt: Spring
  lift: Spring
  drive: Spring
  light: THREE.PointLight | null
  parent: Piece | null
  // Pieces that scurry along a path: distance from home, where they're
  // headed, which way they face, how long they've been out.
  run: { s: number; target: number; dir: number; wait: number; cum: number[]; len: number } | null
}

const OPEN_TIME = 4.4
const CLOSE_TIME = 2.8
const RISE_SPAN = 0.2

const DAY = {
  bg: new THREE.Color('#ece3d2'),
  hemiSky: new THREE.Color('#fff7ea'),
  hemiGround: new THREE.Color('#cdbd9f'),
  hemi: 0.85,
  key: new THREE.Color('#fff1dc'),
  keyI: 3.1,
  fill: 0.4,
  spot: 0,
}
const NIGHT = {
  bg: new THREE.Color('#151823'),
  hemiSky: new THREE.Color('#6a7cb4'),
  hemiGround: new THREE.Color('#1c1a24'),
  hemi: 0.32,
  key: new THREE.Color('#9db4ff'),
  keyI: 0.35,
  fill: 0.08,
  spot: 420,
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutBack = (t: number) => {
  const c1 = 1.5
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
const smooth = (t: number) => t * t * (3 - 2 * t)
const nextFrame = () => new Promise<void>((r) => setTimeout(r, 0))

export class CityStage {
  private container: HTMLElement
  private events: StageEvents
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private timer = new THREE.Timer()
  private raf = 0
  private disposed = false
  private book: Book | null = null
  private pieces: Piece[] = []
  private pickables: THREE.Object3D[] = []
  private platform: { groups: THREE.Group[]; rise: number; start: number; eps: number; top: number } | null = null
  private disposables: { dispose: () => void }[] = []

  private openT = 0
  private openTarget = 0
  private ready = false
  private pendingOpen = false
  // How shut the book is right now, where an opening swing starts from, and
  // how far the cover is lifted by the pointer while it waits.
  private closedNow = 1
  private fromClosed = 1
  private hoverCover = false
  private hoverLift = 0
  // When the book has just finished opening, a little show starts after
  // a beat (the cab honks, the rat bolts).
  private wasOpen = false
  private showAt = 0
  private nightT = 0
  private nightTarget = 0
  private reduced: boolean

  private hemi: THREE.HemisphereLight
  private key: THREE.DirectionalLight
  private fill: THREE.DirectionalLight
  private spot: THREE.SpotLight

  private pointer = new THREE.Vector2()
  private pointerDirty = false
  private hovered: Piece | null = null
  private down: { x: number; y: number; t: number } | null = null
  private raycaster = new THREE.Raycaster()
  private glide: { from: Shot; to: Shot; t: number } | null = null
  private ro: ResizeObserver
  // Set once the user orbits/zooms; until then resizes refit the view.
  private userMoved = false

  constructor(container: HTMLElement, o: { night: boolean; reducedMotion: boolean; events: StageEvents }) {
    this.container = container
    this.events = o.events
    this.reduced = o.reducedMotion
    this.nightT = this.nightTarget = o.night ? 1 : 0
    this.timer.connect(document)

    const small = Math.min(window.innerWidth, window.innerHeight) < 700
    Sketch.defaultPpu = small ? 100 : 140

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.75 : 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.width = '100%'
    this.renderer.domElement.style.height = '100%'
    this.renderer.domElement.style.touchAction = 'none'
    container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.5, 200)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 2.1, -0.8)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.enablePan = false
    this.controls.rotateSpeed = 0.55
    this.controls.zoomSpeed = 0.8
    this.controls.minDistance = 9
    this.controls.minPolarAngle = 0.2
    this.controls.maxPolarAngle = 1.36
    this.controls.minAzimuthAngle = -1.25
    this.controls.maxAzimuthAngle = 1.25
    this.controls.addEventListener('start', () => {
      this.glide = null
      this.userMoved = true
    })

    // Lights.
    this.hemi = new THREE.HemisphereLight(DAY.hemiSky, DAY.hemiGround, DAY.hemi)
    this.key = new THREE.DirectionalLight(DAY.key, DAY.keyI)
    this.key.position.set(-11, 17, 15)
    this.key.target.position.set(0, 0, -1)
    this.key.castShadow = true
    this.key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048)
    const sc = this.key.shadow.camera
    sc.left = -14
    sc.right = 14
    sc.top = 14
    sc.bottom = -14
    sc.near = 1
    sc.far = 60
    this.key.shadow.radius = 2.5
    this.key.shadow.bias = -0.0005
    this.key.shadow.normalBias = 0.05
    this.fill = new THREE.DirectionalLight('#e9f0ff', DAY.fill)
    this.fill.position.set(12, 7, 9)
    this.spot = new THREE.SpotLight('#ffcf8f', 0, 0, 0.62, 0.85, 2)
    this.spot.position.set(7, 15, 10)
    this.spot.target.position.set(0, 1, -1.2)
    this.spot.castShadow = true
    this.spot.shadow.mapSize.set(1024, 1024)
    this.spot.shadow.bias = -0.0005
    this.spot.shadow.normalBias = 0.05
    this.spot.shadow.radius = 4
    this.scene.add(this.hemi, this.key, this.key.target, this.fill, this.spot, this.spot.target)

    this.scene.background = DAY.bg.clone()
    this.scene.fog = new THREE.Fog(DAY.bg.clone(), 34, 90)

    const tableTex = canvasTexture(tableTop(), { repeat: [36, 36] })
    const table = new THREE.Mesh(
      new THREE.PlaneGeometry(180, 180),
      new THREE.MeshStandardMaterial({ color: '#efe5d1', map: tableTex, roughness: 1 })
    )
    table.rotation.x = -Math.PI / 2
    table.receiveShadow = true
    this.scene.add(table)
    this.disposables.push(tableTex, table.geometry, table.material as THREE.Material)

    this.applyNight()
    this.resize()
    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(container)

    const el = this.renderer.domElement
    el.addEventListener('pointermove', this.onPointerMove)
    el.addEventListener('pointerdown', this.onPointerDown)
    el.addEventListener('pointerup', this.onPointerUp)
    el.addEventListener('pointerleave', this.onPointerLeave)
  }

  // ------------------------------------------------------------------ build

  async build() {
    const aniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
    this.book = buildBook(aniso)
    this.book.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) this.pickables.push(o)
    })
    this.scene.add(this.book.root)
    this.book.setAngle(1)
    // Show the closed book straight away; the pop-ups are cut behind it.
    this.update(0)
    this.loop()
    await nextFrame()
    if (this.disposed) return

    const byId = new Map<string, Piece>()
    let done = 0
    for (const def of PIECES) {
      const piece = this.buildPiece(def, aniso, def.parent ? byId.get(def.parent) ?? null : null)
      byId.set(def.id, piece)
      this.pieces.push(piece)
      done++
      this.events.onProgress?.(done / (PIECES.length + 1))
      await nextFrame()
      if (this.disposed) return
    }
    this.buildPlatform(aniso)
    this.events.onProgress?.(1)
    this.renderer.compile(this.scene, this.camera)
    this.ready = true
    this.events.onReady?.()
    if (this.pendingOpen) this.setOpen(true)
  }

  private buildPiece(def: PieceDef, aniso: number, parent: Piece | null): Piece {
    const sketch = new Sketch({ w: def.w, h: def.h, seed: def.seed, glow: def.glow, padBottom: def.padBottom })
    def.art(sketch)
    const cut = sketch.finish()
    let nightTex: THREE.Texture | null = null
    let glowCanvas = cut.glow
    if (def.nightArt) {
      const ns = new Sketch({ w: def.w, h: def.h, seed: def.seed, glow: true, padBottom: def.padBottom })
      def.nightArt(ns)
      const nc = ns.finish()
      nightTex = canvasTexture(nc.canvas, { anisotropy: aniso })
      glowCanvas = nc.glow
    }
    const map = canvasTexture(cut.canvas, { anisotropy: aniso })
    const glow = glowCanvas ? canvasTexture(glowCanvas, { anisotropy: aniso }) : null
    const material = paperMaterials({ map, glow, night: nightTex })
    this.disposables.push(map, material.front, material.back)
    if (glow) this.disposables.push(glow)
    if (nightTex) this.disposables.push(nightTex)

    const k = def.scale ?? 1
    const W = cut.width * k
    const H = cut.height * k
    const left = def.x - (def.w / 2 + cut.pad) * k
    const right = def.x + (def.w / 2 + cut.pad) * k
    type Seg = { x0: number; x1: number; anchorX: number; root: THREE.Object3D; pos: THREE.Vector3 }
    const segs: Seg[] = []
    const book = this.book!

    if (parent) {
      // Glued onto the parent: pick the parent half under the child.
      const [dx, dy, dz] = def.offset ?? [0, 0, 0]
      const childX = parent.def.x + dx
      const idx = parent.halves.length > 1 && childX >= 0 ? 1 : 0
      const anchorX = parent.halves.length > 1 ? 0 : parent.def.x
      segs.push({
        x0: left,
        x1: right,
        anchorX: def.x,
        root: parent.halves[idx].bob,
        pos: new THREE.Vector3(childX - anchorX, dy, dz),
      })
    } else if (!def.ry && left < 0 && right > 0) {
      segs.push({ x0: left, x1: 0, anchorX: 0, root: book.left, pos: new THREE.Vector3(0, 0, def.z) })
      segs.push({ x0: 0, x1: right, anchorX: 0, root: book.right, pos: new THREE.Vector3(0, 0, def.z) })
    } else {
      segs.push({
        x0: left,
        x1: right,
        anchorX: def.x,
        root: def.x < 0 ? book.left : book.right,
        pos: new THREE.Vector3(def.x, 0, def.z),
      })
    }

    const start = 0.34 + def.order * 0.46
    const piece: Piece = {
      def,
      cut,
      halves: [],
      start,
      rise: 0,
      eps: 0.003 + (1 - def.order) * 0.04,
      phase: Math.random() * Math.PI * 2,
      tilt: { x: 0, v: 0 },
      lift: { x: 0, v: 0 },
      drive: { x: 0, v: 0 },
      light: null,
      parent,
      run: def.run ? runState(def.run) : null,
    }

    for (const seg of segs) {
      const geo = new THREE.PlaneGeometry(seg.x1 - seg.x0, H)
      const uv = geo.attributes.uv as THREE.BufferAttribute
      const u0 = (seg.x0 - left) / W
      const u1 = (seg.x1 - left) / W
      for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + (u1 - u0) * uv.getX(i))
      this.disposables.push(geo)
      const mesh = new THREE.Mesh(geo, material.front)
      const back = new THREE.Mesh(geo, material.back)
      for (const m of [mesh, back]) {
        m.castShadow = true
        m.receiveShadow = true
        m.position.set((seg.x0 + seg.x1) / 2 - seg.anchorX, H / 2 - cut.bottom * k, 0)
        m.userData.piece = piece
        this.pickables.push(m)
      }

      const anchor = new THREE.Object3D()
      anchor.position.copy(seg.pos)
      anchor.rotation.y = def.ry ?? 0
      const hinge = new THREE.Object3D()
      const poke = new THREE.Object3D()
      const bob = new THREE.Object3D()
      anchor.add(hinge)
      hinge.add(poke)
      poke.add(bob)
      bob.add(mesh, back)
      seg.root.add(anchor)
      piece.halves.push({ anchor, hinge, poke, bob, mesh })
    }

    if (def.lamp) {
      const light = new THREE.PointLight(def.lampColor ?? '#ffc874', 0, 5, 1.6)
      light.position.set((def.lamp[0] - def.w / 2) * k, (def.lamp[1] - 0.05) * k, 0.25)
      piece.halves[0].bob.add(light)
      piece.light = light
    }
    return piece
  }

  private buildPlatform(aniso: number) {
    const book = this.book!
    const side = canvasTexture(curb(), { repeat: [1, 1], anisotropy: aniso })
    side.wrapS = side.wrapT = THREE.RepeatWrapping
    const walk = canvasTexture(sidewalk(), { anisotropy: aniso })
    walk.wrapS = walk.wrapT = THREE.RepeatWrapping
    const road = canvasTexture(roadTop(), { anisotropy: aniso })
    const sideMat = new THREE.MeshStandardMaterial({ map: side, roughness: 0.95 })
    const walkMat = new THREE.MeshStandardMaterial({ map: walk, roughness: 0.95 })
    const roadMat = new THREE.MeshStandardMaterial({ map: road, roughness: 0.9 })
    this.disposables.push(side, walk, road, sideMat, walkMat, roadMat)

    const groups: THREE.Group[] = []
    for (const dir of [-1, 1]) {
      const g = new THREE.Group()
      PLATFORM.tiers.forEach((t, i) => {
        const h = (i + 1) * PLATFORM.step
        const poly: [number, number][] =
          dir > 0
            ? [
                [0, t.back],
                [t.a, t.back],
                [t.a, t.side],
                [0, t.tip],
              ]
            : [
                [0, t.tip],
                [-t.a, t.side],
                [-t.a, t.back],
                [0, t.back],
              ]
        const top = i === PLATFORM.tiers.length - 1
        const meshes = prism(poly, h, PLATFORM.step, top ? roadMat : walkMat, sideMat, top ? 'road' : 'walk')
        meshes.forEach((m) => {
          this.disposables.push(m.geometry)
          this.pickables.push(m)
          g.add(m)
        })
      })
      ;(dir < 0 ? book.left : book.right).add(g)
      groups.push(g)
    }
    this.platform = {
      groups,
      rise: 0,
      start: 0.34 + PLATFORM.order * 0.46,
      eps: 0.003 + (1 - PLATFORM.order) * 0.04,
      top: PLATFORM.tiers.length * PLATFORM.step,
    }
  }

  // ---------------------------------------------------------------- control

  setOpen(open: boolean) {
    if (!this.ready) {
      // Clicked before the paper is cut: open as soon as it is.
      this.pendingOpen = open
      return
    }
    if (this.openTarget === (open ? 1 : 0)) return
    this.openTarget = open ? 1 : 0
    if (open && this.openT === 0) this.fromClosed = this.closedNow
    if (this.reduced) this.settle()
    else this.glideTo(open ? this.homeShot() : this.closedShot())
    this.events.onOpenChange?.(open)
  }

  setNight(night: boolean) {
    this.nightTarget = night ? 1 : 0
    if (this.reduced) {
      this.nightT = this.nightTarget
      this.applyNight()
    }
  }

  // Skip any running transition (used by tests and reduced motion).
  settle() {
    this.openT = this.openTarget
    this.nightT = this.nightTarget
    this.glide = null
    this.place(this.openTarget ? this.homeShot() : this.closedShot())
    this.applyNight()
  }

  resetView() {
    this.glideTo(this.openTarget ? this.homeShot() : this.closedShot())
  }

  private glideTo(to: Shot) {
    this.userMoved = false
    const target = this.controls.target.clone()
    const at = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(target))
    this.glide = { from: { target, at }, to, t: 0 }
  }

  // Looking at the open spread.
  private homeShot(): Shot {
    return { target: new THREE.Vector3(0, 2.1, -0.8), at: this.homeSpherical() }
  }

  // Looking at the closed book, which lies on the right half of the spread.
  private closedShot(): Shot {
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    const tanH = tanV * this.camera.aspect
    const d = Math.min(40, Math.max(18, 6.6 / tanH, 7.6 / tanV))
    return { target: new THREE.Vector3(4.2, 0.4, 0.5), at: new THREE.Spherical(d, 0.72, -0.32) }
  }

  private place(shot: Shot) {
    this.controls.target.copy(shot.target)
    this.camera.position.setFromSpherical(shot.at).add(shot.target)
    this.camera.lookAt(shot.target)
  }

  private homeSpherical() {
    const aspect = this.camera.aspect
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    const tanH = tanV * aspect
    // Keep the spread in frame: wide screens are limited by height, narrow
    // ones by width.
    const d = Math.min(52, Math.max(21, 8.4 / tanH, 8.2 / tanV))
    this.controls.maxDistance = Math.max(38, d * 1.35)
    // Tall screens look down a little more so the pages fill the height.
    return new THREE.Spherical(d, aspect < 1 ? 0.86 : 1.0, 0)
  }

  private resize = () => {
    const w = this.container.clientWidth || 1
    const h = this.container.clientHeight || 1
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // Widen the lens on portrait screens so the whole spread still fits.
    const tanV = Math.max(Math.tan(THREE.MathUtils.degToRad(16)), 0.22 / this.camera.aspect)
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(tanV))
    this.camera.updateProjectionMatrix()
    const shot = this.openTarget ? this.homeShot() : this.closedShot()
    if (this.glide) this.glide.to = shot
    else if (!this.userMoved) this.place(shot)
  }

  // ------------------------------------------------------------- pointer

  private setPointer(e: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  }

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    this.setPointer(e)
    this.pointerDirty = true
  }

  private onPointerDown = (e: PointerEvent) => {
    this.down = { x: e.clientX, y: e.clientY, t: performance.now() }
  }

  private onPointerUp = (e: PointerEvent) => {
    const d = this.down
    this.down = null
    if (!d) return
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || performance.now() - d.t > 450) return
    this.setPointer(e)
    const hit = this.pick()
    if (hit === 'cover') {
      this.setOpen(true)
    } else if (hit) {
      this.poke(hit)
    }
  }

  private onPointerLeave = () => {
    this.hovered = null
    this.hoverCover = false
    this.renderer.domElement.style.cursor = ''
    this.events.onHover?.(null)
  }

  private pick(): Piece | 'cover' | null {
    if (!this.book) return null
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.pickables, false)
    for (const h of hits) {
      const piece = h.object.userData.piece as Piece | undefined
      // The book itself (or the platform) is in the way.
      if (!piece) return this.openTarget === 0 ? 'cover' : null
      if (piece.rise < 0.6 || !h.uv) continue
      const { mask, maskW, maskH } = piece.cut
      const mx = Math.min(maskW - 1, Math.floor(h.uv.x * maskW))
      const my = Math.min(maskH - 1, Math.floor((1 - h.uv.y) * maskH))
      if (mask[my * maskW + mx]) return piece
    }
    return null
  }

  private poke(p: Piece) {
    const kind = p.def.poke ?? 'tilt'
    if (p.run) {
      // Out of hiding, or straight back into it.
      p.run.target = p.run.s < p.run.len / 2 ? p.run.len : 0
    } else if (kind === 'lift') p.lift.v += 2.2
    else if (kind === 'drive') {
      p.drive.v += 3.2
      p.lift.v += 0.8
    } else p.tilt.v += p.def.h > 4 ? 0.9 : 2.0
    if (p.def.startles) {
      const q = this.pieces.find((o) => o.def.id === p.def.startles)
      if (q?.run && q.run.s === 0) q.run.target = q.run.len
    }
  }

  // ---------------------------------------------------------------- frame

  private loop = () => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.loop)
    this.timer.update()
    const dt = Math.min(0.05, this.timer.getDelta())
    this.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number) {
    // Open / close timeline.
    if (this.openT !== this.openTarget) {
      const speed = this.openTarget > this.openT ? 1 / OPEN_TIME : 1 / CLOSE_TIME
      this.openT =
        this.openTarget > this.openT
          ? Math.min(this.openTarget, this.openT + dt * speed)
          : Math.max(this.openTarget, this.openT - dt * speed)
    }
    const opening = this.openTarget === 1
    const t = this.openT
    const time = this.timer.getElapsed()
    let closed: number
    if (t === 0 && !opening) {
      // Waiting to be opened: the cover peeks up every few seconds and lifts
      // further while the pointer is over it.
      this.hoverLift += ((this.hoverCover ? 1 : 0) - this.hoverLift) * Math.min(1, dt * 8)
      const pulse = this.reduced ? 0 : Math.pow(Math.max(0, Math.sin(time * 1.5)), 6)
      closed = 1 - 0.022 * pulse - 0.05 * this.hoverLift
    } else if (opening) {
      // Swing over, then land with two small bounces.
      const u = clamp01(t / 0.46)
      if (u < 0.84) {
        closed = this.fromClosed * (1 - easeInOut(u / 0.84))
      } else {
        const v = clamp01((u - 0.84) / 0.16)
        closed = 0.03 * Math.abs(Math.sin(2 * Math.PI * v)) * Math.pow(1 - v, 1.5)
      }
    } else {
      closed = 1 - easeInOut(clamp01(t / 0.42))
    }
    this.closedNow = closed
    // The cloth cover flexes while it is moving and lies flat at either end.
    const moving = t > 0 && t < 0.46
    this.book?.setAngle(closed, moving ? 0.17 * Math.pow(Math.sin(Math.PI * closed), 1.2) : 0)

    const riseOf = (start: number) => {
      const k = clamp01((t - start) / RISE_SPAN)
      return opening ? (k >= 1 ? 1 : easeOutBack(k)) : smooth(k)
    }

    if (this.platform) {
      const k = clamp01((t - this.platform.start) / RISE_SPAN)
      const r = opening ? easeOutBack(k) : smooth(k)
      this.platform.rise = r
      for (const g of this.platform.groups) {
        g.scale.y = Math.max(0.002, r)
        g.position.y = this.platform.eps * (1 - Math.min(1, r))
      }
    }

    // Night.
    if (this.nightT !== this.nightTarget) {
      const step = dt / 1.4
      this.nightT =
        this.nightTarget > this.nightT
          ? Math.min(this.nightTarget, this.nightT + step)
          : Math.max(this.nightTarget, this.nightT - step)
      this.applyNight()
    }

    for (const p of this.pieces) {
      const springs = [p.tilt, p.lift, p.drive]
      const k = [70, 26, 18]
      const c = [5, 3.2, 3.6]
      springs.forEach((s, i) => {
        s.v += (-k[i] * s.x - c[i] * s.v) * dt
        s.x += s.v * dt
      })
      // Glued pieces ride along with their parent and only bob.
      p.rise = p.parent ? p.parent.rise : riseOf(p.start)
      const flat = 1 - Math.min(1, p.rise)
      const fold = p.parent ? 0 : (Math.PI / 2) * (1 - p.rise)
      const mountY = p.def.mount && this.platform ? this.platform.top * Math.max(0, this.platform.rise) : 0
      const bobAmp = p.def.bob && !this.reduced ? p.def.bob : null
      for (const h of p.halves) {
        h.hinge.rotation.x = fold
        if (!p.parent) h.anchor.position.y = p.eps * flat + mountY + 0.001
        h.poke.rotation.x = p.tilt.x * 0.35
        h.poke.position.y = Math.max(-0.05, p.lift.x * 0.5)
        h.poke.position.x = p.drive.x * 0.6
        if (bobAmp) {
          h.bob.position.y = bobAmp.amp * Math.sin(time * bobAmp.speed + p.phase) * Math.min(1, p.rise)
          h.bob.rotation.z = (bobAmp.sway ?? 0) * Math.sin(time * bobAmp.speed * 0.7 + p.phase)
        }
      }
      if (p.light) p.light.intensity = shared.uNight.value * 2.4 * clamp01(p.rise)
      if (p.run) this.scurry(p, dt, time)
    }

    const isOpen = this.openTarget === 1 && this.openT === 1
    if (isOpen && !this.wasOpen && !this.reduced) this.showAt = time + 0.6
    this.wasOpen = isOpen
    if (this.showAt && time >= this.showAt) {
      this.showAt = 0
      if (isOpen) this.pieces.filter((p) => p.def.pokeOnOpen).forEach((p) => this.poke(p))
    }

    // Camera glides (opening, closing, reset).
    if (this.glide) {
      const g = this.glide
      g.t = Math.min(1, g.t + dt / (this.openTarget ? 3.4 : 2.4))
      const e = easeInOut(g.t)
      this.place({
        target: g.from.target.clone().lerp(g.to.target, e),
        at: new THREE.Spherical(
          THREE.MathUtils.lerp(g.from.at.radius, g.to.at.radius, e),
          THREE.MathUtils.lerp(g.from.at.phi, g.to.at.phi, e),
          THREE.MathUtils.lerp(g.from.at.theta, g.to.at.theta, e)
        ),
      })
      if (g.t >= 1) this.glide = null
    }
    this.controls.update()

    if (this.pointerDirty) {
      this.pointerDirty = false
      const hit = this.pick()
      const piece = hit && hit !== 'cover' ? hit : null
      this.renderer.domElement.style.cursor = hit ? 'pointer' : ''
      const cover = hit === 'cover'
      if (piece !== this.hovered || cover !== this.hoverCover) {
        this.hovered = piece
        this.hoverCover = cover
        this.events.onHover?.(piece ? piece.def.label : cover ? 'Open the book' : null)
      }
    }
  }

  private scurry(p: Piece, dt: number, time: number) {
    const r = p.run!
    const { path, face } = p.def.run!
    // Back into hiding as soon as the book starts to close, and be there
    // before the pages fold shut.
    if (this.openTarget === 0) r.target = 0
    if (this.openT < 0.5) r.s = 0
    // Out in the open: look around for a moment, then sneak back.
    if (r.target === r.len && r.s >= r.len) {
      r.wait += dt
      if (r.wait > 2.6) r.target = 0
    } else r.wait = 0

    const dist = r.target - r.s
    const moving = Math.abs(dist) > 1e-3
    if (moving) {
      const speed = this.openTarget ? 3.4 : 8
      // Quick start, a little braking at the end.
      const step = speed * dt * Math.min(1, 0.35 + Math.abs(dist) / 0.4)
      r.s += Math.sign(dist) * Math.min(Math.abs(dist), step)
    }
    let i = 1
    while (i < r.cum.length - 1 && r.cum[i] < r.s) i++
    const [ax, az] = path[i - 1]
    const [bx, bz] = path[i]
    const k = clamp01((r.s - r.cum[i - 1]) / (r.cum[i] - r.cum[i - 1] || 1))
    if (moving && Math.abs(bx - ax) > 0.05) r.dir = Math.sign(bx - ax) * Math.sign(dist)
    if (!moving && r.s === 0) r.dir = face
    // A glance over its shoulder while it waits.
    const look = r.wait > 0.8 && r.wait < 1.6 ? -1 : 1
    const hop = moving ? Math.abs(Math.sin(time * 22)) : 0
    for (const h of p.halves) {
      h.anchor.position.x = ax + (bx - ax) * k
      h.anchor.position.z = az + (bz - az) * k
      h.poke.position.y = hop * 0.05
      h.poke.rotation.z = moving ? -r.dir * 0.08 * Math.sin(time * 22) : 0
      // The art faces right; mirror it to face left.
      h.poke.scale.x = r.dir * look
    }
  }

  private applyNight() {
    const n = smooth(this.nightT)
    shared.uNight.value = n
    const bg = DAY.bg.clone().lerp(NIGHT.bg, n)
    ;(this.scene.background as THREE.Color).copy(bg)
    ;(this.scene.fog as THREE.Fog).color.copy(bg)
    this.hemi.color.copy(DAY.hemiSky).lerp(NIGHT.hemiSky, n)
    this.hemi.groundColor.copy(DAY.hemiGround).lerp(NIGHT.hemiGround, n)
    this.hemi.intensity = THREE.MathUtils.lerp(DAY.hemi, NIGHT.hemi, n)
    this.key.color.copy(DAY.key).lerp(NIGHT.key, n)
    this.key.intensity = THREE.MathUtils.lerp(DAY.keyI, NIGHT.keyI, n)
    this.fill.intensity = THREE.MathUtils.lerp(DAY.fill, NIGHT.fill, n)
    this.spot.intensity = THREE.MathUtils.lerp(DAY.spot, NIGHT.spot, n)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.ro.disconnect()
    const el = this.renderer.domElement
    el.removeEventListener('pointermove', this.onPointerMove)
    el.removeEventListener('pointerdown', this.onPointerDown)
    el.removeEventListener('pointerup', this.onPointerUp)
    el.removeEventListener('pointerleave', this.onPointerLeave)
    this.controls.dispose()
    this.timer.dispose()
    this.book?.dispose()
    this.disposables.forEach((d) => d.dispose())
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    el.remove()
  }
}

// A vertical prism standing on the page: flat top plus walls. The wall on
// the gutter (x = 0) is skipped because the two halves meet there.
function prism(
  poly: [number, number][],
  h: number,
  step: number,
  topMat: THREE.Material,
  sideMat: THREE.Material,
  topKind: 'road' | 'walk'
) {
  const contour = poly.map(([x, z]) => new THREE.Vector2(x, z))
  const tris = THREE.ShapeUtils.triangulateShape(contour, [])
  const pos: number[] = []
  const uv: number[] = []
  poly.forEach(([x, z]) => {
    pos.push(x, h, z)
    if (topKind === 'road') uv.push((x + 1.6) / 3.2, 1 - (z + 0.7) / 2.4)
    else uv.push(x, -z)
  })
  const index: number[] = []
  tris.forEach(([a, b, c]) => {
    // Make every triangle face up.
    const ax = poly[a]
    const bx = poly[b]
    const cx = poly[c]
    const cross = (bx[0] - ax[0]) * (cx[1] - ax[1]) - (bx[1] - ax[1]) * (cx[0] - ax[0])
    if (cross < 0) index.push(a, b, c)
    else index.push(a, c, b)
  })
  const topGeo = new THREE.BufferGeometry()
  topGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  topGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  topGeo.setIndex(index)
  topGeo.computeVertexNormals()

  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length
  const cz = poly.reduce((s, p) => s + p[1], 0) / poly.length
  const wp: number[] = []
  const wn: number[] = []
  const wu: number[] = []
  let run = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (Math.abs(a[0]) < 1e-6 && Math.abs(b[0]) < 1e-6) {
      run += len
      continue
    }
    let nx = b[1] - a[1]
    let nz = -(b[0] - a[0])
    const mx = (a[0] + b[0]) / 2 - cx
    const mz = (a[1] + b[1]) / 2 - cz
    let p0 = a
    let p1 = b
    let u0 = run
    let u1 = run + len
    if (nx * mx + nz * mz < 0) {
      nx = -nx
      nz = -nz
    }
    // Wind so the outward side is the front face.
    const cross = (p1[0] - p0[0]) * nz - (p1[1] - p0[1]) * nx
    if (cross < 0) {
      ;[p0, p1] = [p1, p0]
      ;[u0, u1] = [u1, u0]
    }
    const l = Math.hypot(nx, nz)
    nx /= l
    nz /= l
    const quad: [number, number, number, number][] = [
      [p0[0], 0, p0[1], u0],
      [p1[0], 0, p1[1], u1],
      [p1[0], h, p1[1], u1],
      [p0[0], 0, p0[1], u0],
      [p1[0], h, p1[1], u1],
      [p0[0], h, p0[1], u0],
    ]
    quad.forEach(([x, y, z, u]) => {
      wp.push(x, y, z)
      wn.push(nx, 0, nz)
      wu.push(u, y / step)
    })
    run += len
  }
  const wallGeo = new THREE.BufferGeometry()
  wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3))
  wallGeo.setAttribute('normal', new THREE.Float32BufferAttribute(wn, 3))
  wallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wu, 2))

  const top = new THREE.Mesh(topGeo, topMat)
  const walls = new THREE.Mesh(wallGeo, sideMat)
  for (const m of [top, walls]) {
    m.castShadow = true
    m.receiveShadow = true
  }
  return [top, walls]
}

function runState(run: NonNullable<PieceDef['run']>) {
  const cum = [0]
  for (let i = 1; i < run.path.length; i++) {
    const [ax, az] = run.path[i - 1]
    const [bx, bz] = run.path[i]
    cum.push(cum[i - 1] + Math.hypot(bx - ax, bz - az))
  }
  return { s: 0, target: 0, dir: run.face, wait: 0, cum, len: cum[cum.length - 1] }
}
