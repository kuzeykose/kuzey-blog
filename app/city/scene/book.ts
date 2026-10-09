import * as THREE from 'three'
import { PAGE_D, PAGE_W, cloth, coverArt, pageEdges } from './art-book'
import { canvasTexture, groundMaterial } from './materials'

export const COVER_T = 0.1
export const BLOCK_T = 0.3
// Height of the page surface above the table when the book lies open.
export const PAGE_Y = COVER_T + BLOCK_T
const OVER = 0.2
const CLOTH = '#2c4a3f'
// Loose pages float this far above their hinge line, so each rests just
// above whatever page it lies on.
const LEAF_LIFT = 0.0015

// Pop-ups glued to one page of a spread live under that page's group, with
// y = 0 on the page surface and x = 0 on the gutter.
export type Spread = { left: THREE.Group; right: THREE.Group }

// A printed spread, already cut in two at the gutter.
export type Sheet = { left: HTMLCanvasElement; right: HTMLCanvasElement }

export type Book = {
  root: THREE.Group
  // One per sheet. Spread i's left page is the back of loose leaf i - 1
  // (the front cover's page for the first); its right page is the front
  // of leaf i (the back cover's page for the last).
  spreads: Spread[]
  // Hinges of the halves that turn (everything under them can curl): the
  // front cover, and the loose leaves between spreads.
  flap: THREE.Group
  leaves: THREE.Group[]
  // Distance from the spine to the free edge of the cover / a loose leaf.
  flapLength: number
  leafLength: number
  // Each spread's printed pages, to repaint for the seasons.
  pages: { left: THREE.Texture; right: THREE.Texture }[]
  // How much higher the left page lies than the right with the book open
  // at a spread: the leaves turned so far stack up on the left while the
  // rest sink on the right.
  step: (spread: number) => number
  // 0 = lying open on the left, 1 = lying on the right.
  setAngle: (closed: number) => void
  setLeaf: (leaf: number, closed: number) => void
  dispose: () => void
}

export function buildBook(maxAnisotropy: number, sheets: Sheet[]): Book {
  const disposables: { dispose: () => void }[] = []
  const tex = (c: HTMLCanvasElement, repeat?: [number, number]) => {
    const t = canvasTexture(c, { repeat, anisotropy: maxAnisotropy })
    disposables.push(t)
    return t
  }
  const std = (p: THREE.MeshStandardMaterialParameters) => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...p })
    disposables.push(m)
    return m
  }

  const count = sheets.length
  // The back cover's pages sit below every loose leaf stacked on them.
  const sink = LEAF_LIFT * 2 * (count - 1)
  const clothMat = std({ map: tex(cloth(CLOTH), [3, 4]), roughness: 0.85 })
  const coverTex = tex(coverArt(PAGE_W + OVER, PAGE_D + OVER * 2, CLOTH))
  // The front cover is seen upside down relative to the box UVs once the
  // book is closed, so spin the art around.
  coverTex.center.set(0.5, 0.5)
  coverTex.rotation = Math.PI
  const coverMat = std({ map: coverTex, roughness: 0.75, metalness: 0.05 })
  const edgeMat = std({ map: tex(pageEdges()), roughness: 1 })
  const pages = sheets.map(() => ({}) as { left: THREE.Texture; right: THREE.Texture })
  pages[0].left = tex(sheets[0].left)
  pages[count - 1].right = tex(sheets[count - 1].right)
  const leftArt = groundMaterial(std({ map: pages[0].left, roughness: 0.95 }), -PAGE_W / 2)
  const rightArt = groundMaterial(std({ map: pages[count - 1].right, roughness: 0.95 }), PAGE_W / 2)

  const root = new THREE.Group()
  const leftPivot = new THREE.Group()
  const rightPivot = new THREE.Group()
  leftPivot.position.y = PAGE_Y
  rightPivot.position.y = PAGE_Y
  root.add(leftPivot, rightPivot)

  const coverW = PAGE_W + OVER
  const coverGeo = new THREE.BoxGeometry(coverW, COVER_T, PAGE_D + OVER * 2)
  const blockGeo = new THREE.BoxGeometry(PAGE_W, BLOCK_T, PAGE_D)
  // The turning half is finely divided across its width so it can curl.
  const frontGeo = new THREE.BoxGeometry(coverW, COVER_T, PAGE_D + OVER * 2, 40, 1, 1)
  const flapBlockGeo = new THREE.BoxGeometry(PAGE_W, BLOCK_T, PAGE_D, 40, 1, 1)
  disposables.push(coverGeo, frontGeo, blockGeo, flapBlockGeo)

  const half = (
    side: -1 | 1,
    pivot: THREE.Group,
    geo: THREE.BufferGeometry,
    block: THREE.BufferGeometry,
    art: THREE.Material,
    outside: THREE.Material
  ) => {
    const cover = new THREE.Mesh(geo, [clothMat, clothMat, clothMat, outside, clothMat, clothMat])
    cover.position.set((side * (PAGE_W + OVER)) / 2, -PAGE_Y + COVER_T / 2, 0)
    const pages = new THREE.Mesh(block, [edgeMat, edgeMat, art, edgeMat, edgeMat, edgeMat])
    // The right-hand block sits a hair lower so the loose leaves can lie on it.
    pages.position.set((side * PAGE_W) / 2, -BLOCK_T / 2 - (side > 0 ? sink : 0), 0)
    for (const m of [cover, pages]) {
      m.castShadow = true
      m.receiveShadow = true
    }
    pivot.add(cover, pages)
  }
  half(-1, leftPivot, frontGeo, flapBlockGeo, leftArt, coverMat)
  half(1, rightPivot, coverGeo, blockGeo, rightArt, clothMat)

  // Rounded spine. It bisects the angle between the covers, so it tucks under
  // the gutter when the book is open and wraps the page edges when closed.
  const spineShape = new THREE.Shape()
  const a = PAGE_Y
  const b = 0.24
  spineShape.absellipse(0, 0, a, b, Math.PI, Math.PI * 2, false, 0)
  spineShape.absellipse(0, 0, a - COVER_T * 0.9, b - COVER_T * 0.8, Math.PI * 2, Math.PI, true, 0)
  const spineGeo = new THREE.ExtrudeGeometry(spineShape, {
    depth: PAGE_D + OVER * 2,
    bevelEnabled: false,
    curveSegments: 24,
  })
  spineGeo.translate(0, 0, -(PAGE_D + OVER * 2) / 2)
  disposables.push(spineGeo)
  const spine = new THREE.Mesh(spineGeo, clothMat)
  spine.position.y = PAGE_Y
  spine.castShadow = true
  root.add(spine)

  // The loose leaves: each carries one spread's right page on its front
  // (facing down its hinge's -y) and the next spread's left page on its
  // back (+y). Each is built lying on the left; rotating it by -π lays it
  // on the right.
  const spreads: Spread[] = sheets.map(() => ({ left: new THREE.Group(), right: new THREE.Group() }))
  leftPivot.add(spreads[0].left)
  const leaves: THREE.Group[] = []
  for (let j = 0; j < count - 1; j++) {
    const pivot = new THREE.Group()
    root.add(pivot)
    const face = (up: boolean, art: HTMLCanvasElement, shiftX: number): THREE.Texture => {
      const g = new THREE.PlaneGeometry(PAGE_W, PAGE_D, 40, 1)
      g.rotateX(up ? -Math.PI / 2 : Math.PI / 2)
      g.translate(-PAGE_W / 2, LEAF_LIFT, 0)
      const pos = g.attributes.position as THREE.BufferAttribute
      const uv = g.attributes.uv as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        // Seen from above: on the left the back reads left to right; on the
        // right the front does, mirrored through the hinge.
        uv.setXY(i, up ? (x + PAGE_W) / PAGE_W : -x / PAGE_W, 0.5 - pos.getZ(i) / PAGE_D)
      }
      disposables.push(g)
      // (Each face gets its own patch of snow drifts.)
      const map = tex(art)
      const mesh = new THREE.Mesh(g, groundMaterial(std({ map, roughness: 0.95 }), shiftX))
      mesh.castShadow = true
      mesh.receiveShadow = true
      pivot.add(mesh)
      return map
    }
    pages[j].right = face(false, sheets[j].right, 20 + 40 * j)
    pages[j + 1].left = face(true, sheets[j + 1].left, 40 * (j + 1))
    const front = spreads[j].right
    front.position.y = LEAF_LIFT
    front.rotation.z = Math.PI
    const back = spreads[j + 1].left
    back.position.y = LEAF_LIFT
    pivot.add(front, back)
    leaves.push(pivot)
  }
  const last = spreads[count - 1].right
  last.position.y = -sink
  rightPivot.add(last)

  const setAngle = (closed: number) => {
    const t = closed * Math.PI
    leftPivot.rotation.z = -t
    spine.rotation.z = -t / 2
    spine.visible = closed > 0.02
  }
  const setLeaf = (j: number, closed: number) => {
    const leaf = leaves[j]
    leaf.rotation.z = -closed * Math.PI
    // Leaves stack the way paper does: on the right the first leaf is on
    // top; on the left the one turned last is. The hinge rises or sinks a
    // hair as it turns so each face lands on its layer.
    leaf.position.y = PAGE_Y + LEAF_LIFT * THREE.MathUtils.lerp(2 * j + 1, 1 - 2 * j, closed)
  }
  setAngle(0)
  leaves.forEach((_, j) => setLeaf(j, 1))

  return {
    root,
    spreads,
    flap: leftPivot,
    leaves,
    flapLength: coverW,
    leafLength: PAGE_W,
    pages,
    step: (spread) => 4 * LEAF_LIFT * spread,
    setAngle,
    setLeaf,
    dispose: () => disposables.forEach((d) => d.dispose()),
  }
}
