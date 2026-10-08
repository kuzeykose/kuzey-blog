import * as THREE from 'three'
import { PAGE_D, PAGE_W, cloth, coverArt, pageEdges, spread } from './art-book'
import { canvasTexture } from './materials'

export const COVER_T = 0.1
export const BLOCK_T = 0.3
// Height of the page surface above the table when the book lies open.
export const PAGE_Y = COVER_T + BLOCK_T
const OVER = 0.2
const CLOTH = '#2c4a3f'

export type Book = {
  root: THREE.Group
  // Everything glued to the left / right page lives under these, with y = 0
  // on the page surface and x = 0 on the gutter.
  left: THREE.Group
  right: THREE.Group
  // closed: 0 = flat open, 1 = shut. bend: how far the front cover flexes
  // outwards (radians at its outer edge) while it swings.
  setAngle: (closed: number, bend?: number) => void
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

  const pages = spread()
  const clothMat = std({ map: tex(cloth(CLOTH), [3, 4]), roughness: 0.85 })
  const coverTex = tex(coverArt(PAGE_W + OVER, PAGE_D + OVER * 2, CLOTH))
  // The front cover is seen upside down relative to the box UVs once the
  // book is closed, so spin the art around.
  coverTex.center.set(0.5, 0.5)
  coverTex.rotation = Math.PI
  const coverMat = std({ map: coverTex, roughness: 0.75, metalness: 0.05 })
  const edgeMat = std({ map: tex(pageEdges()), roughness: 1 })
  const leftArt = std({ map: tex(pages.left), roughness: 0.95 })
  const rightArt = std({ map: tex(pages.right), roughness: 0.95 })

  const root = new THREE.Group()
  const leftPivot = new THREE.Group()
  const rightPivot = new THREE.Group()
  leftPivot.position.y = PAGE_Y
  rightPivot.position.y = PAGE_Y
  root.add(leftPivot, rightPivot)

  const coverW = PAGE_W + OVER
  const coverGeo = new THREE.BoxGeometry(coverW, COVER_T, PAGE_D + OVER * 2)
  // The front cover gets its own finely divided copy so it can flex.
  const frontGeo = new THREE.BoxGeometry(coverW, COVER_T, PAGE_D + OVER * 2, 32, 1, 1)
  const blockGeo = new THREE.BoxGeometry(PAGE_W, BLOCK_T, PAGE_D)
  disposables.push(coverGeo, frontGeo, blockGeo)

  const half = (
    side: -1 | 1,
    pivot: THREE.Group,
    geo: THREE.BufferGeometry,
    art: THREE.Material,
    outside: THREE.Material
  ) => {
    const cover = new THREE.Mesh(geo, [clothMat, clothMat, clothMat, outside, clothMat, clothMat])
    cover.position.set((side * (PAGE_W + OVER)) / 2, -PAGE_Y + COVER_T / 2, 0)
    const block = new THREE.Mesh(blockGeo, [edgeMat, edgeMat, art, edgeMat, edgeMat, edgeMat])
    block.position.set((side * PAGE_W) / 2, -BLOCK_T / 2, 0)
    for (const m of [cover, block]) {
      m.castShadow = true
      m.receiveShadow = true
    }
    pivot.add(cover, block)
  }
  half(-1, leftPivot, frontGeo, leftArt, coverMat)
  half(1, rightPivot, coverGeo, rightArt, clothMat)

  // Flex the front cover away from the pages: each point turns a little
  // further the farther it is from the spine (growing with the square of
  // the distance), so the board curves like cloth over card.
  const frontPos = frontGeo.attributes.position as THREE.BufferAttribute
  const rest = (frontPos.array as Float32Array).slice()
  const STEPS = 64
  const curveX = new Float32Array(STEPS + 1)
  const curveY = new Float32Array(STEPS + 1)
  let bent = 0
  const bendCover = (beta: number) => {
    if (Math.abs(beta - bent) < 1e-4) return
    bent = beta
    const ds = coverW / STEPS
    for (let i = 1; i <= STEPS; i++) {
      const u = ((i - 0.5) / STEPS) * coverW
      const psi = beta * (u / coverW) ** 2
      curveX[i] = curveX[i - 1] - Math.cos(psi) * ds
      curveY[i] = curveY[i - 1] - Math.sin(psi) * ds
    }
    for (let v = 0; v < frontPos.count; v++) {
      // Distance from the spine, and offset across the board's thickness.
      const s = Math.min(coverW, Math.max(0, coverW / 2 - rest[v * 3]))
      const d = rest[v * 3 + 1]
      const f = (s / coverW) * STEPS
      const i0 = Math.min(STEPS - 1, Math.floor(f))
      const k = f - i0
      const cx = curveX[i0] + (curveX[i0 + 1] - curveX[i0]) * k
      const cy = curveY[i0] + (curveY[i0 + 1] - curveY[i0]) * k
      const psi = beta * (s / coverW) ** 2
      frontPos.setXY(v, cx - Math.sin(psi) * d + coverW / 2, cy + Math.cos(psi) * d)
    }
    frontPos.needsUpdate = true
    frontGeo.computeVertexNormals()
    frontGeo.computeBoundingSphere()
  }

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

  // Pages are the children that pop-ups attach to.
  const left = new THREE.Group()
  const right = new THREE.Group()
  leftPivot.add(left)
  rightPivot.add(right)

  const setAngle = (closed: number, bend = 0) => {
    const t = closed * Math.PI
    leftPivot.rotation.z = -t
    spine.rotation.z = -t / 2
    spine.visible = closed > 0.02
    bendCover(bend)
  }
  setAngle(0)

  return {
    root,
    left,
    right,
    setAngle,
    dispose: () => disposables.forEach((d) => d.dispose()),
  }
}
