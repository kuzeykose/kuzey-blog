import * as THREE from 'three'
import { PAGE_D, PAGE_W, brooklynSpread, cloth, coverArt, manhattanSpread, pageEdges } from './art-book'
import { canvasTexture, groundMaterial } from './materials'

export const COVER_T = 0.1
export const BLOCK_T = 0.3
// Height of the page surface above the table when the book lies open.
export const PAGE_Y = COVER_T + BLOCK_T
const OVER = 0.2
const CLOTH = '#2c4a3f'
// The loose page between the two spreads floats this far above its hinge
// line, so it rests just above whichever page it lies on.
const LEAF_LIFT = 0.0015

// Pop-ups glued to one page of a spread live under that page's group, with
// y = 0 on the page surface and x = 0 on the gutter.
export type Spread = { left: THREE.Group; right: THREE.Group }

export type Book = {
  root: THREE.Group
  // Spread 0 (Manhattan): front cover's page + the front of the loose page.
  // Spread 1 (Brooklyn): the back of the loose page + the back cover's page.
  spreads: [Spread, Spread]
  // Hinges of the two halves that turn (everything under them can curl).
  flap: THREE.Group
  leaf: THREE.Group
  // Distance from the spine to the free edge of the cover / loose page.
  flapLength: number
  leafLength: number
  // 0 = lying open on the left, 1 = lying on the right.
  setAngle: (closed: number) => void
  setLeaf: (closed: number) => void
  dispose: () => void
}

export function buildBook(maxAnisotropy: number): Book {
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

  const manhattan = manhattanSpread()
  const brooklyn = brooklynSpread()
  const clothMat = std({ map: tex(cloth(CLOTH), [3, 4]), roughness: 0.85 })
  const coverTex = tex(coverArt(PAGE_W + OVER, PAGE_D + OVER * 2, CLOTH))
  // The front cover is seen upside down relative to the box UVs once the
  // book is closed, so spin the art around.
  coverTex.center.set(0.5, 0.5)
  coverTex.rotation = Math.PI
  const coverMat = std({ map: coverTex, roughness: 0.75, metalness: 0.05 })
  const edgeMat = std({ map: tex(pageEdges()), roughness: 1 })
  const leftArt = groundMaterial(std({ map: tex(manhattan.left), roughness: 0.95 }), -PAGE_W / 2)
  const rightArt = groundMaterial(std({ map: tex(brooklyn.right), roughness: 0.95 }), PAGE_W / 2)

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
    // The right-hand block sits a hair lower so the loose page can lie on it.
    pages.position.set((side * PAGE_W) / 2, -BLOCK_T / 2 - (side > 0 ? LEAF_LIFT * 2 : 0), 0)
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

  // The loose page between the spreads: Manhattan's right page on its front
  // (facing down its hinge's -y), Brooklyn's left page on its back (+y). It
  // is built lying on the left; rotating it by -π lays it on the right.
  const leafPivot = new THREE.Group()
  leafPivot.position.y = PAGE_Y + LEAF_LIFT
  root.add(leafPivot)
  const face = (up: boolean, art: HTMLCanvasElement) => {
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
    // (The front is seen mirrored once turned; shift its drifts well away
    // from the left page's.)
    const mesh = new THREE.Mesh(g, groundMaterial(std({ map: tex(art), roughness: 0.95 }), up ? 0 : 20))
    mesh.castShadow = true
    mesh.receiveShadow = true
    leafPivot.add(mesh)
  }
  face(false, manhattan.right)
  face(true, brooklyn.left)

  // Pages are the children that pop-ups attach to.
  const aLeft = new THREE.Group()
  leftPivot.add(aLeft)
  const aRight = new THREE.Group()
  aRight.position.y = LEAF_LIFT
  aRight.rotation.z = Math.PI
  const bLeft = new THREE.Group()
  bLeft.position.y = LEAF_LIFT
  leafPivot.add(aRight, bLeft)
  const bRight = new THREE.Group()
  bRight.position.y = -LEAF_LIFT * 2
  rightPivot.add(bRight)

  const setAngle = (closed: number) => {
    const t = closed * Math.PI
    leftPivot.rotation.z = -t
    spine.rotation.z = -t / 2
    spine.visible = closed > 0.02
  }
  const setLeaf = (closed: number) => {
    leafPivot.rotation.z = -closed * Math.PI
  }
  setAngle(0)
  setLeaf(1)

  return {
    root,
    spreads: [
      { left: aLeft, right: aRight },
      { left: bLeft, right: bRight },
    ],
    flap: leftPivot,
    leaf: leafPivot,
    flapLength: coverW,
    leafLength: PAGE_W,
    setAngle,
    setLeaf,
    dispose: () => disposables.forEach((d) => d.dispose()),
  }
}
