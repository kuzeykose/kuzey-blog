import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Cutout, Sketch } from './sketch'
import { PIECES, PLATFORM, PieceDef } from './pieces'
import { BROOKLYN } from './pieces-brooklyn'
import { PARK } from './pieces-park'
import { TIMES } from './pieces-times'
import { LOWER } from './pieces-lower'
import { MIDTOWN } from './pieces-midtown'
import { DUMBO } from './pieces-dumbo'
import { buildBook, Book, Sheet } from './book'
import { PAGES, pageNumber } from '../contents'
import { canvasTexture, groundMaterial, paperMaterials, shared } from './materials'
import { PageCurl } from './bend'
import { Ground, Weather, WeatherFx } from './weather'
import { SKY, Season } from './season'
import {
  brooklynSpread,
  centralParkSpread,
  curb,
  dumboSpread,
  lowerManhattanSpread,
  manhattanSpread,
  midtownSpread,
  roadTop,
  sidewalk,
  tableTop,
  timesSquareSpread,
} from './art-book'

export type StageEvents = {
  onProgress?: (p: number) => void
  onReady?: () => void
  onHover?: (label: string | null) => void
  onOpenChange?: (open: boolean) => void
  onPageChange?: (page: number) => void
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

type Paper = { front: THREE.Material; back: THREE.Material }

// A piece's painted art, shared with every piece that borrows it. Art that
// changes with the seasons keeps a cutout for each season (painted the
// first time it's needed) and shows one at a time.
type Art = {
  def: PieceDef
  paper: Paper
  map: THREE.Texture
  glow: THREE.Texture | null
  cuts: Partial<Record<Season, Cutout>>
  seasonal: boolean
  showing: Season
  users: Piece[]
}

// A loose petal, in its piece's anchor space. `landed` is the age it
// settled on the page at (0 while still falling).
type Petal = { pos: THREE.Vector3; vel: THREE.Vector3; rot: THREE.Euler; spin: THREE.Vector3; age: number; landed: number; phase: number }

type Piece = {
  def: PieceDef
  art: Art
  // Which spread it belongs to: 0 = Manhattan, 1 = Brooklyn.
  spread: number
  // The cutout showing now (for picking).
  cut: Cutout
  // How far it stands for the season: it folds down to change its art, or
  // to go away until its season comes round.
  present: number
  // When it next drops a leaf by itself (autumn).
  dripAt: number
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
  // Pieces that turn about a point (the Wonder Wheel).
  spin: { angle: number; vel: number } | null
  petals: { mesh: THREE.InstancedMesh; items: Petal[]; size: number } | null
  // Pieces that drop and come back (the New Year's ball): seconds since
  // let go, or -1 while waiting at the top.
  drop: { at: number } | null
  // Pieces that twirl round on the spot (the skaters): how far round they
  // are, and where they're turning to.
  twirl: { x: number; to: number } | null
}

const OPEN_TIME = 4.4
const CLOSE_TIME = 2.8
// Share of the open/close timeline spent turning the page; the pop-ups
// rise after it lands.
const TURN = 0.4
const RISE_SPAN = 0.18
const riseStart = (order: number) => TURN + 0.02 + order * 0.4
// Turning to the next spread: the current pop-ups fold away, the page turns,
// then the next spread's pop-ups rise.
const PAGE_TIME = 4.2
const FOLD_END = 0.3
const LAND = 0.7
// Each place's pop-ups and printed map; the contents decide the order.
const PLACES: Record<string, { pieces: PieceDef[]; sheet: (first: number, season: Season) => Sheet; seasonal?: boolean }> = {
  Manhattan: { pieces: PIECES, sheet: manhattanSpread },
  'Lower Manhattan': { pieces: LOWER, sheet: lowerManhattanSpread },
  Midtown: { pieces: MIDTOWN, sheet: midtownSpread },
  'Times Square': { pieces: TIMES, sheet: timesSquareSpread },
  'Central Park': { pieces: PARK, sheet: centralParkSpread, seasonal: true },
  Brooklyn: { pieces: BROOKLYN, sheet: brooklynSpread },
  DUMBO: { pieces: DUMBO, sheet: dumboSpread },
}
const SPREADS = PAGES.map((name) => PLACES[name])

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
// What rain and snow do to the light: the background they fade to (by day
// and by night), and how much they scale each light.
const RAIN = {
  bg: [new THREE.Color('#c6c8c9'), new THREE.Color('#0f1117')],
  key: 0.5,
  hemi: 0.95,
  fill: 1,
}
const SNOW = {
  bg: [new THREE.Color('#e4e7ed'), new THREE.Color('#1a2030')],
  key: 0.72,
  hemi: 1.12,
  fill: 1.4,
}
const OVERCAST = new THREE.Color('#dde3ec')
const tmpColor = new THREE.Color()

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const approach = (x: number, to: number, step: number) => (x < to ? Math.min(to, x + step) : Math.max(to, x - step))
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutBack = (t: number) => {
  const c1 = 1.5
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
const smooth = (t: number) => t * t * (3 - 2 * t)
const PETALS = 48
// The ball drop: down, a pause at the bottom, back up.
const DROP_FALL = 2.6
const DROP_HOLD = 2.4
const DROP_RISE = 3.2
const dummy = new THREE.Object3D()
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
  private curl: PageCurl | null = null
  private leafCurls: PageCurl[] = []
  private pieces: Piece[] = []
  private pickables: THREE.Object3D[] = []
  private petalKit: { petal: THREE.BufferGeometry; confetti: THREE.BufferGeometry; mat: THREE.Material } | null = null
  private tickers: { map: THREE.Texture; speed: number }[] = []
  private platform: { groups: THREE.Group[]; rise: number; start: number; eps: number; top: number } | null = null
  // Which spread is showing (target), how far the turn between them is,
  // and where the current turn started from.
  private page = 0
  private pageT = 0
  private pageFrom = 0
  // A spread picked while the book was opening or closing.
  private pendingPage: number | null = null
  private disposables: { dispose: () => void }[] = []

  private openT = 0
  private openTarget = 0
  private ready = false
  private pendingOpen = false
  // How shut the book is right now, where an opening swing starts from, and
  // how far the cover is lifted by the pointer while it waits.
  private closedNow = 1
  private fromClosed = 1
  private curlNow = 0
  private fromCurl = 0
  private hoverCover = false
  private hoverLift = 0
  // When the book has just finished opening, a little show starts after
  // a beat (the cab honks, the rat bolts).
  private wasOpen = false
  private showAt = 0
  private nightT = 0
  private nightTarget = 0
  private weather: Weather = 'clear'
  private season: Season
  // When the season last changed, every art waiting to be painted for it,
  // and each spread's printed map: the season it shows and those cut so far.
  private seasonAt = 0
  private clock = 0
  private arts: Art[] = []
  private aniso = 1
  private sheets: { showing: Season; cuts: Partial<Record<Season, Sheet>> }[] = []
  private rainT = 0
  private snowT = 0
  private weatherFx = new WeatherFx()
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

  constructor(container: HTMLElement, o: { night: boolean; season: Season; reducedMotion: boolean; events: StageEvents }) {
    this.container = container
    this.events = o.events
    this.reduced = o.reducedMotion
    this.nightT = this.nightTarget = o.night ? 1 : 0
    // The book opens in its season's weather, snow already lying in winter.
    this.season = o.season
    this.weather = SKY[o.season]
    this.rainT = this.weather === 'rain' ? 1 : 0
    this.snowT = shared.uSnow.value = this.weather === 'snow' ? 1 : 0
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
    this.scene.add(this.weatherFx.root)

    this.applyLight()
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
    this.aniso = aniso
    const sheets = SPREADS.map((sp, i) => sp.sheet(pageNumber(i), this.season))
    this.sheets = sheets.map((sheet) => ({ showing: this.season, cuts: { [this.season]: sheet } }))
    this.book = buildBook(aniso, sheets)
    this.book.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) this.pickables.push(o)
    })
    this.scene.add(this.book.root)
    this.book.setAngle(1)
    this.curl = new PageCurl(this.book.flapLength)
    this.curl.attach(this.book.flap)
    this.leafCurls = this.book.leaves.map((leaf) => {
      const curl = new PageCurl(this.book!.leafLength)
      curl.attach(leaf)
      return curl
    })
    // Show the closed book straight away; the pop-ups are cut behind it.
    this.update(0)
    this.loop()
    await nextFrame()
    if (this.disposed) return

    const byId = new Map<string, Piece>()
    // Pieces that borrow another's art (and anything glued onto them) are
    // cut last, so the art they borrow is ready whatever the page order.
    const jobs = SPREADS.flatMap((sp, spread) => sp.pieces.map((def) => ({ def, spread })))
    const borrowing = new Set<string>()
    for (const { def } of jobs) {
      if (def.sameArtAs || (def.parent && borrowing.has(def.parent))) borrowing.add(def.id)
    }
    const ordered = [...jobs.filter((j) => !borrowing.has(j.def.id)), ...jobs.filter((j) => borrowing.has(j.def.id))]
    for (const { def, spread } of ordered) {
      const piece = this.buildPiece(
        def,
        aniso,
        def.parent ? byId.get(def.parent) ?? null : null,
        spread,
        def.sameArtAs ? byId.get(def.sameArtAs) ?? null : null
      )
      byId.set(def.id, piece)
      this.pieces.push(piece)
      this.events.onProgress?.(this.pieces.length / (jobs.length + 1))
      await nextFrame()
      if (this.disposed) return
    }
    this.buildPlatform(aniso)
    // Everything now glued to the left page curls with it.
    this.curl.attach(this.book.flap)
    this.leafCurls.forEach((curl, j) => curl.attach(this.book!.leaves[j]))
    this.events.onProgress?.(1)
    this.renderer.compile(this.scene, this.camera)
    this.ready = true
    this.events.onReady?.()
    if (this.pendingOpen) this.setOpen(true)
  }

  private buildPiece(def: PieceDef, aniso: number, parent: Piece | null, spread: number, twin: Piece | null): Piece {
    const art = twin ? twin.art : this.paint(def, aniso)
    const cut = art.cuts[art.showing]!
    const k = def.scale ?? 1
    const W = cut.width * k
    const H = cut.height * k
    const left = def.x - (def.w / 2 + cut.pad) * k
    const right = def.x + (def.w / 2 + cut.pad) * k
    type Seg = { x0: number; x1: number; anchorX: number; root: THREE.Object3D; pos: THREE.Vector3 }
    const segs: Seg[] = []
    const pages = this.book!.spreads[spread]

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
      segs.push({ x0: left, x1: 0, anchorX: 0, root: pages.left, pos: new THREE.Vector3(0, 0, def.z) })
      segs.push({ x0: 0, x1: right, anchorX: 0, root: pages.right, pos: new THREE.Vector3(0, 0, def.z) })
    } else {
      segs.push({
        x0: left,
        x1: right,
        anchorX: def.x,
        root: def.x < 0 ? pages.left : pages.right,
        pos: new THREE.Vector3(def.x, 0, def.z),
      })
    }

    const start = riseStart(def.order)
    const piece: Piece = {
      def,
      art,
      spread,
      cut,
      present: !def.seasons || def.seasons.includes(this.season) ? 1 : 0,
      dripAt: 0,
      halves: [],
      start,
      rise: 0,
      eps: 0.003 + (1 - def.order) * 0.02,
      phase: Math.random() * Math.PI * 2,
      tilt: { x: 0, v: 0 },
      lift: { x: 0, v: 0 },
      drive: { x: 0, v: 0 },
      light: null,
      parent,
      run: def.run ? runState(def.run) : null,
      spin: def.spin ? { angle: 0, vel: def.spin.idle } : null,
      petals: null,
      drop: def.drop ? { at: -1 } : null,
      twirl: def.poke === 'twirl' ? { x: 0, to: 0 } : null,
    }
    art.users.push(piece)

    for (const seg of segs) {
      // Divided finely enough to follow the page as it curls.
      const geo = new THREE.PlaneGeometry(
        seg.x1 - seg.x0,
        H,
        Math.max(1, Math.ceil((seg.x1 - seg.x0) / 0.4)),
        Math.max(1, Math.ceil(H / 0.4))
      )
      const uv = geo.attributes.uv as THREE.BufferAttribute
      const u0 = (seg.x0 - left) / W
      const u1 = (seg.x1 - left) / W
      for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + (u1 - u0) * uv.getX(i))
      this.disposables.push(geo)
      const mesh = new THREE.Mesh(geo, art.paper.front)
      const back = new THREE.Mesh(geo, art.paper.back)
      for (const m of [mesh, back]) {
        m.castShadow = true
        m.receiveShadow = true
        m.position.set((seg.x0 + seg.x1) / 2 - seg.anchorX, H / 2 - cut.bottom * k, 0)
        m.userData.piece = piece
        this.pickables.push(m)
      }

      const anchor = new THREE.Object3D()
      anchor.position.copy(seg.pos)
      if (def.spin) {
        // Put the turning point at the origin of the bob node.
        const hx = (def.spin.at[0] - def.w / 2) * k
        const hy = def.spin.at[1] * k
        anchor.position.x += hx
        anchor.position.y += hy
        mesh.position.x -= hx
        mesh.position.y -= hy
        back.position.copy(mesh.position)
      }
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
    if (def.petals) {
      if (!this.petalKit) {
        this.petalKit = {
          petal: new THREE.CircleGeometry(0.075, 7),
          confetti: new THREE.PlaneGeometry(0.1, 0.07),
          mat: new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide }),
        }
        this.disposables.push(this.petalKit.petal, this.petalKit.confetti, this.petalKit.mat)
      }
      // Under the anchor, so they fall free of the paper's wobble.
      const size = def.petals.count ?? PETALS
      const mesh = new THREE.InstancedMesh(def.petals.confetti ? this.petalKit.confetti : this.petalKit.petal, this.petalKit.mat, size)
      mesh.count = 0
      mesh.frustumCulled = false
      mesh.visible = false
      piece.halves[0].anchor.add(mesh)
      piece.petals = { mesh, items: [], size }
      this.tintPetals(piece)
    }
    if (def.ticker) this.addTicker(piece)
    return piece
  }

  // A self-lit strip of news that scrolls over a band of the art.
  private addTicker(p: Piece) {
    const t = p.def.ticker!
    const k = p.def.scale ?? 1
    const cv = document.createElement('canvas')
    const ctx = cv.getContext('2d')!
    const font = 'bold 44px Helvetica, Arial, sans-serif'
    ctx.font = font
    const runs: [string, string][] = [...(typeof t.text === 'string' ? [[t.text, '#ffb347'] as [string, string]] : t.text), ['   ', '#000']]
    const widths = runs.map(([str]) => ctx.measureText(str).width)
    cv.width = Math.min(4096, Math.ceil(widths.reduce((a, b) => a + b, 0)))
    cv.height = 64
    ctx.fillStyle = '#14141a'
    ctx.fillRect(0, 0, cv.width, cv.height)
    ctx.font = font
    ctx.textBaseline = 'middle'
    let at = 0
    runs.forEach(([str, color], i) => {
      ctx.fillStyle = color
      ctx.fillText(str, at, 34)
      at += widths[i]
    })
    const map = new THREE.CanvasTexture(cv)
    map.colorSpace = THREE.SRGBColorSpace
    map.wrapS = THREE.RepeatWrapping
    // As much of the strip as fits the band at its own aspect.
    const length = (t.h * k * cv.width) / cv.height
    map.repeat.x = (t.w * k) / length
    const mat = new THREE.MeshBasicMaterial({ map })
    const geo = new THREE.PlaneGeometry(t.w * k, t.h * k)
    this.disposables.push(map, mat, geo)
    const mesh = new THREE.Mesh(geo, mat)
    // On the half of a split piece that the band's middle is over.
    const x = p.def.x + (t.at[0] - p.def.w / 2) * k
    const idx = p.halves.length > 1 && x >= 0 ? 1 : 0
    const anchorX = p.halves.length > 1 ? 0 : p.def.x
    mesh.position.set(x - anchorX, t.at[1] * k, 0.012)
    p.halves[idx].bob.add(mesh)
    this.tickers.push({ map, speed: (0.35 * k) / length })
  }

  // Paint a piece's art into textures and paper materials.
  private paint(def: PieceDef, aniso: number): Art {
    const sketch = new Sketch({ w: def.w, h: def.h, seed: def.seed, glow: def.glow, padBottom: def.padBottom, season: this.season })
    def.art(sketch)
    const cut = sketch.finish()
    let nightTex: THREE.Texture | null = null
    let glowCanvas = cut.glow
    if (def.nightArt) {
      const ns = new Sketch({ w: def.w, h: def.h, seed: def.seed, glow: true, padBottom: def.padBottom, season: this.season })
      def.nightArt(ns)
      const nc = ns.finish()
      nightTex = canvasTexture(nc.canvas, { anisotropy: aniso })
      glowCanvas = nc.glow
    }
    const map = canvasTexture(cut.canvas, { anisotropy: aniso })
    const glow = glowCanvas ? canvasTexture(glowCanvas, { anisotropy: aniso }) : null
    const k = def.scale ?? 1
    const paper = paperMaterials({ map, glow, night: nightTex, size: [cut.width * k, cut.height * k], sky: def.sky })
    this.disposables.push(map, paper.front, paper.back)
    if (glow) this.disposables.push(glow)
    if (nightTex) this.disposables.push(nightTex)
    const art: Art = { def, paper, map, glow, cuts: { [this.season]: cut }, seasonal: sketch.seasonal, showing: this.season, users: [] }
    this.arts.push(art)
    return art
  }

  // Cut an art again for another season.
  private cutFor(art: Art, season: Season) {
    const { def } = art
    if (!art.cuts[season]) {
      const sketch = new Sketch({ w: def.w, h: def.h, seed: def.seed, glow: def.glow, padBottom: def.padBottom, season })
      def.art(sketch)
      art.cuts[season] = sketch.finish()
    }
    return art.cuts[season]!
  }

  // Show an art's cutout for the current season.
  private reseason(art: Art) {
    const cut = this.cutFor(art, this.season)
    art.map.image = cut.canvas
    art.map.needsUpdate = true
    if (art.glow && cut.glow) {
      art.glow.image = cut.glow
      art.glow.needsUpdate = true
    }
    art.showing = this.season
    for (const p of art.users) p.cut = cut
  }

  // A spread's printed map for the current season.
  private resheet(spread: number) {
    const entry = this.sheets[spread]
    const sheet = (entry.cuts[this.season] ??= SPREADS[spread].sheet(pageNumber(spread), this.season))
    const pages = this.book!.pages[spread]
    pages.left.image = sheet.left
    pages.right.image = sheet.right
    pages.left.needsUpdate = pages.right.needsUpdate = true
    entry.showing = this.season
  }

  // Cut what the new season still needs, a little each frame within a few
  // milliseconds: the spread on show (its pop-ups, then its map) first.
  private catchUp(budget: number) {
    const t0 = performance.now()
    const inSeason = (a: Art) => a.users.some((p) => !p.def.seasons || p.def.seasons.includes(this.season))
    const due = this.arts.filter((a) => a.seasonal && !a.cuts[this.season] && inSeason(a))
    const jobs: (() => void)[] = []
    for (const near of [true, false]) {
      for (const art of due) if (art.users.some((p) => p.spread === this.page) === near) jobs.push(() => this.cutFor(art, this.season))
      this.sheets.forEach((entry, i) => {
        if (SPREADS[i].seasonal && !entry.cuts[this.season] && (i === this.page) === near) {
          jobs.push(() => (entry.cuts[this.season] = SPREADS[i].sheet(pageNumber(i), this.season)))
        }
      })
    }
    for (const job of jobs) {
      if (performance.now() - t0 > budget) return
      job()
    }
  }

  // Petal colours for the season (a tree's own, or the art's fixed ones).
  private tintPetals(p: Piece) {
    const { colors } = p.def.petals!
    const list = !colors ? ['#ef8fb0', '#fde6ee', '#f6b3c9'] : Array.isArray(colors) ? colors : colors[this.season]
    const tones = list.map((c) => new THREE.Color(c))
    const { mesh, size } = p.petals!
    for (let i = 0; i < size; i++) mesh.setColorAt(i, tones[i % tones.length])
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }

  private buildPlatform(aniso: number) {
    const book = this.book!
    const side = canvasTexture(curb(), { repeat: [1, 1], anisotropy: aniso })
    side.wrapS = side.wrapT = THREE.RepeatWrapping
    const walk = canvasTexture(sidewalk(), { anisotropy: aniso })
    walk.wrapS = walk.wrapT = THREE.RepeatWrapping
    const road = canvasTexture(roadTop(), { anisotropy: aniso })
    const sideMat = new THREE.MeshStandardMaterial({ map: side, roughness: 0.95 })
    const walkMat = groundMaterial(new THREE.MeshStandardMaterial({ map: walk, roughness: 0.95 }))
    const roadMat = groundMaterial(new THREE.MeshStandardMaterial({ map: road, roughness: 0.9 }))
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
      const pages = book.spreads[0]
      ;(dir < 0 ? pages.left : pages.right).add(g)
      groups.push(g)
    }
    this.platform = {
      groups,
      rise: 0,
      start: riseStart(PLATFORM.order),
      eps: 0.003 + (1 - PLATFORM.order) * 0.02,
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
    if (!open) this.pendingPage = null
    if (this.openTarget === (open ? 1 : 0)) return
    this.openTarget = open ? 1 : 0
    if (open && this.openT === 0) {
      this.fromClosed = this.closedNow
      this.fromCurl = this.curlNow
    }
    // The page turn plays even with reduced motion: it's the one thing the
    // visitor asked for by clicking. Ambient motion is what gets dropped.
    this.glideTo(open ? this.homeShot() : this.closedShot())
    this.events.onOpenChange?.(open)
  }

  // Go to a spread. A shut book opens straight at it (the leaves before
  // it ride over with the cover); one that's opening or closing turns there
  // once it lies open.
  setPage(page: number) {
    const next = Math.max(0, Math.min(SPREADS.length - 1, page))
    if (!this.ready) return
    if (this.openTarget === 0 && this.openT === 0) {
      this.page = this.pageT = this.pageFrom = next
      this.events.onPageChange?.(next)
      this.setOpen(true)
      return
    }
    if (this.openTarget !== 1 || this.openT < 1) {
      this.pendingPage = next
      this.setOpen(true)
      return
    }
    if (next === this.page) return
    this.pageFrom = this.pageT
    this.page = next
    this.events.onPageChange?.(next)
  }

  setNight(night: boolean) {
    this.nightTarget = night ? 1 : 0
  }

  // A new season brings its weather, and the pop-ups that change fold down
  // and come back up dressed for it.
  setSeason(season: Season) {
    if (season === this.season) return
    this.season = season
    this.weather = SKY[season]
    this.seasonAt = this.clock
    for (const p of this.pieces) if (p.petals) this.tintPetals(p)
  }

  // Skip any running transition (handy from the dev console).
  settle() {
    this.openT = this.openTarget
    this.pageT = this.pageFrom = this.page
    this.nightT = this.nightTarget
    this.rainT = this.weather === 'rain' ? 1 : 0
    this.snowT = this.weather === 'snow' ? 1 : 0
    shared.uSnow.value = this.snowT
    for (const art of this.arts) if (art.seasonal && art.showing !== this.season) this.reseason(art)
    for (const p of this.pieces) p.present = !p.def.seasons || p.def.seasons.includes(this.season) ? 1 : 0
    this.sheets.forEach((entry, i) => {
      if (SPREADS[i].seasonal && entry.showing !== this.season) this.resheet(i)
    })
    this.glide = null
    this.place(this.openTarget ? this.homeShot() : this.closedShot())
    this.applyLight()
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
    // (A dropping piece sheds when it lands instead.)
    if (p.petals && !p.drop) this.shed(p)
    if (p.drop) {
      if (p.drop.at < 0) p.drop.at = 0
    } else if (p.twirl) {
      // Two turns, showing the plain back of the paper as it goes round.
      p.twirl.to += Math.PI * 4
    } else if (p.spin) {
      p.spin.vel += 2.4
    } else if (p.run) {
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
      if (q?.drop && q.drop.at < 0) q.drop.at = 0
      if (q?.spin) q.spin.vel += 2.4
    }
  }

  // Shake a flurry of petals loose from the piece's blossoms.
  private shed(p: Piece) {
    const { items, size } = p.petals!
    items.length = 0
    // Staggered, so they let go a few at a time.
    for (let i = 0; i < size; i++) items.push(this.petal(p, p.def.petals!.from[i % p.def.petals!.from.length], -Math.random() * 0.8))
  }

  // A single leaf letting go by itself, in a slot that's free.
  private drip(p: Piece) {
    const { items, size } = p.petals!
    const free = items.findIndex((it) => it.landed > 0 && it.age - it.landed > 2.6)
    if (free < 0 && items.length >= size) return
    const from = p.def.petals!.from
    const leaf = this.petal(p, from[Math.floor(Math.random() * from.length)], 0)
    if (free < 0) items.push(leaf)
    else items[free] = leaf
  }

  private petal(p: Piece, [cx, cy, r]: [number, number, number], age: number): Petal {
    const k = p.def.scale ?? 1
    const a = Math.random() * Math.PI * 2
    const d = Math.sqrt(Math.random()) * r
    return {
      pos: new THREE.Vector3((cx + Math.cos(a) * d - p.def.w / 2) * k, (cy + Math.sin(a) * d) * k, 0.04 + Math.random() * 0.1),
      vel: new THREE.Vector3(-0.15 + Math.random() * 0.45, Math.random() * 0.3, 0.25 + Math.random() * 0.4),
      rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      spin: new THREE.Vector3(2 + Math.random() * 4, 1 + Math.random() * 3, Math.random() * 2),
      age,
      landed: 0,
      phase: Math.random() * Math.PI * 2,
    }
  }

  private flutter(p: Piece, dt: number, live: boolean) {
    const { mesh, items } = p.petals!
    if (!live) items.length = 0
    // Pieces glued up on another piece shed from up there: the page is
    // further down.
    const floor = 0.006 - (p.parent ? p.def.offset?.[1] ?? 0 : 0)
    let busy = false
    // Each petal keeps its own instance (and so its colour); ones not yet
    // released or already gone are drawn at zero size.
    items.forEach((it, i) => {
      it.age += dt
      if (it.age >= 0 && !it.landed) {
        // Falling slowly, drifting with the breeze and tumbling.
        it.vel.y = Math.max(-0.3, it.vel.y - 0.8 * dt)
        it.vel.z *= 1 - 0.3 * dt
        it.pos.x += (it.vel.x + Math.sin(it.age * 3.1 + it.phase) * 0.22) * dt
        it.pos.y += it.vel.y * dt
        it.pos.z += it.vel.z * dt
        it.rot.x += it.spin.x * dt
        it.rot.y += it.spin.y * dt
        it.rot.z += it.spin.z * dt
        if (it.pos.y <= floor) {
          it.pos.y = floor
          it.landed = it.age
          it.rot.set(-Math.PI / 2, 0, it.phase)
        }
      }
      // Settled ones linger on the page, then fade away.
      const size = it.age < 0 ? 0 : it.landed ? clamp01(1 - (it.age - it.landed - 2) / 0.6) : 1
      if (it.age < 0 || size > 0) busy = true
      dummy.position.copy(it.pos)
      dummy.rotation.copy(it.rot)
      dummy.scale.set(size, 0.62 * size, size)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    if (!busy) items.length = 0
    mesh.count = items.length
    mesh.visible = items.length > 0
    mesh.instanceMatrix.needsUpdate = true
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
    this.clock += dt
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
    let curl: number
    const p = clamp01(t / TURN)
    if (t === 0 && !opening) {
      // Waiting to be opened: the cover's free edge lifts and settles like
      // a page corner in a draught, and lifts further under the pointer.
      this.hoverLift += ((this.hoverCover ? 1 : 0) - this.hoverLift) * Math.min(1, dt * 6)
      const breath = this.reduced ? 0 : 0.5 - 0.5 * Math.cos(time * 1.3)
      closed = 1
      curl = 0.08 * breath + 0.22 * this.hoverLift
    } else if (opening) {
      // Turn the page: the free edge leads, curling over, and the page
      // flattens as it lands.
      closed = this.fromClosed * (1 - easeInOut(p))
      curl = Math.max(this.fromCurl * (1 - p) ** 2, 1.5 * Math.sin(Math.PI * p) * (1 - p) ** 0.6)
      // Never curl past the table.
      curl = Math.min(curl, 0.9 * Math.PI * closed)
    } else {
      // Closing: the free edge leads the other way.
      closed = 1 - easeInOut(p)
      const q = 1 - p
      curl = -1.3 * Math.sin(Math.PI * q) * (1 - q) ** 0.6
      curl = Math.max(curl, -0.9 * Math.PI * (1 - closed))
    }
    this.closedNow = closed
    this.curlNow = curl

    // Once the book is shut it starts again at the first spread.
    if (t === 0 && !opening && this.page !== 0) {
      this.page = this.pageT = this.pageFrom = 0
      this.events.onPageChange?.(0)
    }
    // A spread picked while it was opening or closing, now it lies open.
    if (this.pendingPage !== null && opening && t === 1) {
      const next = this.pendingPage
      this.pendingPage = null
      this.setPage(next)
    }
    // Turning between spreads. Flipping several pages at once races through
    // the ones in between and slows down again to land.
    const far = Math.abs(this.page - this.pageFrom) > 1
    if (this.pageT !== this.page) {
      const along = Math.min(Math.abs(this.pageT - this.pageFrom), Math.abs(this.page - this.pageT), 1)
      const step = (dt / PAGE_TIME) * (far ? 1 + 5 * along : 1)
      this.pageT = this.page > this.pageT ? Math.min(this.page, this.pageT + step) : Math.max(this.page, this.pageT - step)
    }
    const forward = this.page > this.pageT
    if (this.book) {
      this.book.setAngle(closed)
      this.curl?.update(this.book.flap, curl)
      // Leaf j turns in the middle of the move from spread j to j + 1.
      this.book.leaves.forEach((leaf, j) => {
        const lp = clamp01((this.pageT - j - FOLD_END) / (LAND - FOLD_END))
        let leafClosed = 1 - easeInOut(lp)
        let leafCurl = forward
          ? Math.min(1.4 * Math.sin(Math.PI * lp) * (1 - lp) ** 0.6, 0.9 * Math.PI * leafClosed)
          : Math.max(-1.3 * Math.sin(Math.PI * (1 - lp)) * lp ** 0.6, -0.9 * Math.PI * (1 - leafClosed))
        // A leaf turned over to the cover's side goes wherever the cover
        // goes (one still on the right stays put).
        if (leafClosed < 1 && closed >= leafClosed) {
          leafClosed = closed
          leafCurl = curl
        }
        this.book!.setLeaf(j, leafClosed)
        this.leafCurls[j]?.update(leaf, leafCurl)
      })
    }

    const riseOf = (start: number) => {
      const k = clamp01((t - start) / RISE_SPAN)
      return opening ? (k >= 1 ? 1 : easeOutBack(k)) : smooth(k)
    }
    // How far a spread's pop-ups stand while the pages turn: a spread being
    // left folds front to back, one being reached rises back to front.
    const gate = (spread: number, order: number) => {
      // The spreads flipped past on the way stay folded flat.
      if (far && spread !== this.page && Math.abs(spread - this.pageFrom) >= 0.5) return 0
      if (this.pageT >= spread) {
        return 1 - smooth(clamp01((this.pageT - spread - (1 - order) * 0.12) / (FOLD_END - 0.12)))
      }
      const k = clamp01((this.pageT - (spread - 1) - LAND - order * 0.12) / (1 - LAND - 0.12))
      return forward && k < 1 ? easeOutBack(k) : smooth(k)
    }
    // Only a spread that can be seen is drawn: the others are shut under
    // the loose leaves.
    const shown = (spread: number) => this.pageT > spread - 1 + FOLD_END + 0.01 && this.pageT < spread + LAND - 0.01

    if (this.platform) {
      const k = clamp01((t - this.platform.start) / RISE_SPAN)
      const r = (opening ? easeOutBack(k) : smooth(k)) * gate(0, PLATFORM.order)
      this.platform.rise = r
      for (const g of this.platform.groups) {
        g.scale.y = Math.max(0.002, r)
        g.position.y = this.platform.eps * (1 - Math.min(1, r))
        g.visible = shown(0)
      }
    }

    // Night and weather ease in and out; snow builds up while it falls and
    // melts away after.
    const rainTo = this.weather === 'rain' ? 1 : 0
    const snowTo = this.weather === 'snow' ? 1 : 0
    if (this.nightT !== this.nightTarget || this.rainT !== rainTo || this.snowT !== snowTo) {
      this.nightT = approach(this.nightT, this.nightTarget, dt / 1.4)
      this.rainT = approach(this.rainT, rainTo, dt / 2.2)
      this.snowT = approach(this.snowT, snowTo, dt / 2.2)
      this.applyLight()
    }
    // The new season's art gets cut a little at a time; a spread's map
    // changes out of sight, or once its pop-ups have folded down.
    if (this.ready) {
      this.catchUp(6)
      this.sheets.forEach((entry, i) => {
        if (!SPREADS[i].seasonal || entry.showing === this.season || !entry.cuts[this.season]) return
        if (!shown(i) || this.clock - this.seasonAt > 0.4) this.resheet(i)
      })
    }
    const settling = this.weather === 'snow' && this.snowT > 0.3
    shared.uSnow.value = approach(shared.uSnow.value, settling ? 1 : 0, dt / (settling ? 14 : 5))

    for (const p of this.pieces) {
      const springs = [p.tilt, p.lift, p.drive]
      const k = [70, 26, 18]
      const c = [5, 3.2, 3.6]
      springs.forEach((s, i) => {
        s.v += (-k[i] * s.x - c[i] * s.v) * dt
        s.x += s.v * dt
      })
      const visible = shown(p.spread)
      // In season, and dressed for it? Out of sight it changes at once; in
      // view it folds down first, changes, and pops back up. Art shared
      // with a piece in view waits until that one is down too.
      const here = !p.def.seasons || p.def.seasons.includes(this.season)
      const stale = p.art.seasonal && p.art.showing !== this.season
      const down = () => p.art.users.every((q) => q.parent || !shown(q.spread) || q.present === 0)
      if (!visible || p.parent || !this.ready) {
        if (stale && here && (p.art.cuts[this.season] || p.parent) && down()) this.reseason(p.art)
        p.present = here ? 1 : 0
      } else {
        // (Whatever comes up waits for the rest to fold down first.)
        const want = here && !stale ? 1 : 0
        if (!want || this.clock - this.seasonAt > 0.4) p.present = approach(p.present, want, dt / (want ? 0.6 : 0.4))
        if (p.present === 0 && stale && here && down()) this.reseason(p.art)
      }
      const standing = p.present === 1 ? 1 : p.present > 0 && here && !stale ? easeOutBack(p.present) : smooth(p.present)
      // Glued pieces ride along with their parent and only bob.
      p.rise = p.parent ? p.parent.rise : riseOf(p.start) * gate(p.spread, p.def.order) * standing
      const flat = 1 - Math.min(1, p.rise)
      const fold = p.parent ? 0 : (Math.PI / 2) * (1 - p.rise)
      const mountY = p.def.mount && this.platform ? this.platform.top * Math.max(0, this.platform.rise) : 0
      const bobAmp = p.def.bob && !this.reduced ? p.def.bob : null
      for (const h of p.halves) {
        h.anchor.visible = visible && p.present > 0
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
      if (p.spin) {
        // Coast back down to its idle turn after a spin.
        const idle = this.reduced ? 0 : p.def.spin!.idle
        p.spin.vel += (idle - p.spin.vel) * Math.min(1, dt * 0.5)
        p.spin.angle += p.spin.vel * dt
        for (const h of p.halves) h.bob.rotation.z = p.spin.angle
      }
      if (p.def.whirl) {
        const turn = this.reduced ? 1 : Math.cos(time * p.def.whirl)
        for (const h of p.halves) h.poke.scale.x = turn
      }
      if (p.run) this.scurry(p, dt, time)
      if (p.twirl) {
        const tw = p.twirl
        tw.x += (tw.to - tw.x) * Math.min(1, dt * 1.6)
        if (Math.abs(tw.to - tw.x) < 0.002) tw.x = tw.to = 0
        for (const h of p.halves) h.poke.rotation.y = tw.x
      }
      if (p.drop) {
        const d = p.drop
        // Back to the top whenever its spread goes away.
        if (!visible || this.openTarget === 0) d.at = -1
        if (d.at >= 0) {
          const was = d.at
          d.at += dt
          if (was < DROP_FALL && d.at >= DROP_FALL && p.petals) this.shed(p)
          if (d.at > DROP_FALL + DROP_HOLD + DROP_RISE) d.at = -1
        }
        const a = d.at
        const down =
          a < 0 ? 0 : a < DROP_FALL ? easeInOut(a / DROP_FALL) : a < DROP_FALL + DROP_HOLD ? 1 : 1 - smooth((a - DROP_FALL - DROP_HOLD) / DROP_RISE)
        for (const h of p.halves) h.bob.position.y = -p.def.drop! * (p.def.scale ?? 1) * down
      }
      if (p.petals) {
        const live = visible && p.rise > 0.98 && this.openTarget === 1
        // In autumn the trees on show let their leaves go, one at a time.
        const tree = p.def.petals!.colors && !Array.isArray(p.def.petals!.colors)
        if (live && tree && this.season === 'autumn' && !this.reduced && this.pageT === this.page) {
          if (this.clock >= p.dripAt) {
            if (p.dripAt) this.drip(p)
            p.dripAt = this.clock + 0.8 + Math.random() * 2.2
          }
        }
        this.flutter(p, dt, live)
      }
    }

    const ground: Ground = closed > 0.98 ? 'closed' : this.openT === 1 && this.pageT === this.page ? 'open' : 'moving'
    this.weatherFx.update(dt, time, {
      rain: smooth(this.rainT),
      snow: smooth(this.snowT),
      night: smooth(this.nightT),
      ground,
    })

    for (const t of this.tickers) t.map.offset.x = (t.map.offset.x + dt * t.speed) % 1

    // Each spread puts on its little show once it has fully risen.
    const isOpen = this.openTarget === 1 && this.openT === 1 && this.pageT === this.page
    if (isOpen && !this.wasOpen && !this.reduced) this.showAt = time + 0.6
    this.wasOpen = isOpen
    if (this.showAt && time >= this.showAt) {
      this.showAt = 0
      if (isOpen) this.pieces.filter((p) => p.def.pokeOnOpen && p.spread === this.page).forEach((p) => this.poke(p))
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
    if (this.openTarget === 0 || this.page !== p.spread) r.target = 0
    if (this.openT < 0.5 || Math.abs(this.pageT - p.spread) > 0.15) r.s = 0
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

  private applyLight() {
    const n = smooth(this.nightT)
    const r = smooth(this.rainT)
    const w = smooth(this.snowT)
    const lerp = THREE.MathUtils.lerp
    shared.uNight.value = n
    shared.uWet.value = r
    shared.uGloom.value = Math.max(r * 0.8, w * 0.35)
    const bg = DAY.bg.clone().lerp(NIGHT.bg, n)
    bg.lerp(tmpColor.copy(RAIN.bg[0]).lerp(RAIN.bg[1], n), r * 0.85)
    bg.lerp(tmpColor.copy(SNOW.bg[0]).lerp(SNOW.bg[1], n), w * 0.8)
    ;(this.scene.background as THREE.Color).copy(bg)
    const fog = this.scene.fog as THREE.Fog
    fog.color.copy(bg)
    // Bad weather closes in.
    fog.near = 34 - 8 * r - 5 * w
    fog.far = 90 - 24 * r - 14 * w
    // Overcast: a flatter, cooler light and softer shadows.
    const grey = Math.max(r, w) * (1 - n)
    this.hemi.color.copy(DAY.hemiSky).lerp(NIGHT.hemiSky, n).lerp(OVERCAST, grey * 0.6)
    this.hemi.groundColor.copy(DAY.hemiGround).lerp(NIGHT.hemiGround, n)
    this.hemi.intensity = lerp(DAY.hemi, NIGHT.hemi, n) * lerp(1, RAIN.hemi, r) * lerp(1, SNOW.hemi, w)
    this.key.color.copy(DAY.key).lerp(NIGHT.key, n).lerp(OVERCAST, grey * 0.7)
    this.key.intensity = lerp(DAY.keyI, NIGHT.keyI, n) * lerp(1, RAIN.key, r) * lerp(1, SNOW.key, w)
    this.key.shadow.radius = 2.5 + 4.5 * Math.max(r, w * 0.6)
    this.fill.intensity = lerp(DAY.fill, NIGHT.fill, n) * lerp(1, RAIN.fill, r) * lerp(1, SNOW.fill, w)
    this.spot.intensity = lerp(DAY.spot, NIGHT.spot, n)
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
    this.curl?.dispose()
    this.leafCurls.forEach((curl) => curl.dispose())
    this.weatherFx.dispose()
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
  // The top is cut into narrow strips across x so it can curl with the
  // page while the book turns.
  const pos: number[] = []
  const uv: number[] = []
  const index: number[] = []
  const xs = poly.map((q) => q[0])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const strips = Math.max(1, Math.ceil((maxX - minX) / CURL_STEP))
  for (let i = 0; i < strips; i++) {
    const part = clipX(poly, minX + ((maxX - minX) * i) / strips, minX + ((maxX - minX) * (i + 1)) / strips)
    if (part.length < 3) continue
    const base = pos.length / 3
    part.forEach(([x, z]) => {
      pos.push(x, h, z)
      if (topKind === 'road') uv.push((x + 1.6) / 3.2, 1 - (z + 0.7) / 2.4)
      else uv.push(x, -z)
    })
    const tris = THREE.ShapeUtils.triangulateShape(
      part.map(([x, z]) => new THREE.Vector2(x, z)),
      []
    )
    tris.forEach(([a, b, c]) => {
      // Make every triangle face up.
      const pa = part[a]
      const pb = part[b]
      const pc = part[c]
      const cross = (pb[0] - pa[0]) * (pc[1] - pa[1]) - (pb[1] - pa[1]) * (pc[0] - pa[0])
      if (cross < 0) index.push(base + a, base + b, base + c)
      else index.push(base + a, base + c, base + b)
    })
  }
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
    const n = Math.max(1, Math.ceil(len / CURL_STEP))
    for (let k = 0; k < n; k++) {
      const at = (f: number): [number, number, number] => [
        p0[0] + (p1[0] - p0[0]) * f,
        p0[1] + (p1[1] - p0[1]) * f,
        u0 + (u1 - u0) * f,
      ]
      const [ax, az, au] = at(k / n)
      const [bx, bz, bu] = at((k + 1) / n)
      const quad: [number, number, number, number][] = [
        [ax, 0, az, au],
        [bx, 0, bz, bu],
        [bx, h, bz, bu],
        [ax, 0, az, au],
        [bx, h, bz, bu],
        [ax, h, az, au],
      ]
      quad.forEach(([x, y, z, u]) => {
        wp.push(x, y, z)
        wn.push(nx, 0, nz)
        wu.push(u, y / step)
      })
    }
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

// Platform geometry is cut into pieces no wider than this so it can curl.
const CURL_STEP = 0.3

// Clip a convex polygon (x, z) to the band x0 <= x <= x1.
function clipX(poly: [number, number][], x0: number, x1: number) {
  const clip = (pts: [number, number][], inside: (p: [number, number]) => boolean, edge: number) => {
    const out: [number, number][] = []
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length]
      const ia = inside(a)
      const ib = inside(b)
      if (ia) out.push(a)
      if (ia !== ib) {
        const t = (edge - a[0]) / (b[0] - a[0])
        out.push([edge, a[1] + (b[1] - a[1]) * t])
      }
    })
    return out
  }
  const left = clip(poly, (p) => p[0] >= x0 - 1e-9, x0)
  return left.length ? clip(left, (p) => p[0] <= x1 + 1e-9, x1) : left
}
