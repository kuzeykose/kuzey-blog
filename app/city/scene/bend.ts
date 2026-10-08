import * as THREE from 'three'

// Page-turn curl, done in the vertex shader so the cover, the pages and the
// paper lying on them all bend together.
//
// Everything glued to the turning (left) half of the book lives under one
// pivot: x runs from the spine (0) out to the free edge (negative x) and
// y = 0 is the page surface. Each point is wrapped round a circle so the
// free edge turns `uBend` radians further than the spine. Positive values
// curl the free edge towards the cover side (leading while the book opens),
// negative values towards the pages (leading while it closes).

const DECL = /* glsl */ `
uniform float uBend;
uniform float uBendLen;
uniform mat4 uPivot;
uniform mat4 uPivotInv;

vec3 bendPoint( vec3 p, out float ang ) {
  float s = max( - p.x, 0.0 );
  float k = uBend / uBendLen;
  ang = k * s;
  if ( abs( k ) < 1e-5 ) return p;
  vec2 c = vec2( - sin( ang ) / k, ( cos( ang ) - 1.0 ) / k );
  vec2 n = vec2( - sin( ang ), cos( ang ) );
  return vec3( c + p.y * n, p.z );
}
`

// Replaces <project_vertex>: bend the world position (and, unless DEPTH,
// turn the normal with the paper).
const PROJECT = /* glsl */ `
vec4 bentWorld = modelMatrix * vec4( transformed, 1.0 );
{
  float ang;
  vec3 bp = bendPoint( ( uPivotInv * bentWorld ).xyz, ang );
  bentWorld = uPivot * vec4( bp, 1.0 );
  #ifndef BEND_DEPTH
    vec3 np = mat3( uPivotInv ) * ( vec4( transformedNormal, 0.0 ) * viewMatrix ).xyz;
    float cs = cos( ang );
    float sn = sin( ang );
    np.xy = vec2( cs * np.x - sn * np.y, sn * np.x + cs * np.y );
    transformedNormal = normalize( mat3( viewMatrix ) * ( mat3( uPivot ) * np ) );
    #ifndef FLAT_SHADED
      vNormal = transformedNormal;
    #endif
  #endif
}
vec4 mvPosition = viewMatrix * bentWorld;
gl_Position = projectionMatrix * mvPosition;
`

const WORLDPOS = /* glsl */ `
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
  vec4 worldPosition = bentWorld;
#endif
`

type Uniforms = {
  uBend: { value: number }
  uBendLen: { value: number }
  uPivot: { value: THREE.Matrix4 }
  uPivotInv: { value: THREE.Matrix4 }
}

function patch(shader: THREE.WebGLProgramParametersWithUniforms, uniforms: Uniforms, depth: boolean) {
  Object.assign(shader.uniforms, uniforms)
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${depth ? '#define BEND_DEPTH\n' : ''}${DECL}`)
    .replace('#include <project_vertex>', PROJECT)
    .replace('#include <worldpos_vertex>', WORLDPOS)
}

export class PageCurl {
  private uniforms: Uniforms
  private bent = new Map<THREE.Material, THREE.Material>()
  private copies = new Set<THREE.Material>()
  private depthCutout: THREE.MeshDepthMaterial
  private depthSolid: THREE.MeshDepthMaterial

  constructor(length: number) {
    this.uniforms = {
      uBend: { value: 0 },
      uBendLen: { value: length },
      uPivot: { value: new THREE.Matrix4() },
      uPivotInv: { value: new THREE.Matrix4() },
    }
    // Shadow casters need the same curl. The shadow pass copies map,
    // alphaTest and side from each object's own material onto these.
    this.depthCutout = this.depthMaterial()
    this.depthSolid = this.depthMaterial()
  }

  private depthMaterial() {
    const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })
    m.onBeforeCompile = (shader) => patch(shader, this.uniforms, true)
    m.customProgramCacheKey = () => 'depth|bend'
    return m
  }

  // A copy of `m` that curls with the page. The original keeps rendering
  // the right-hand half, which never bends.
  private material(m: THREE.Material): THREE.Material {
    const cached = this.bent.get(m)
    if (cached) return cached
    const copy = m.clone()
    const base = m.onBeforeCompile.bind(m)
    const key = m.customProgramCacheKey.bind(m)
    copy.onBeforeCompile = (shader, renderer) => {
      base(shader, renderer)
      patch(shader, this.uniforms, false)
    }
    copy.customProgramCacheKey = () => `${key()}|bend`
    this.bent.set(m, copy)
    this.copies.add(copy)
    return copy
  }

  // Make every mesh under `root` curl with the page.
  attach(root: THREE.Object3D) {
    root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      if (mats.some((m) => this.copies.has(m))) return
      mesh.material = Array.isArray(mesh.material)
        ? mats.map((m) => this.material(m))
        : this.material(mesh.material)
      mesh.customDepthMaterial = mats.some((m) => m.alphaTest > 0 || m.alphaToCoverage)
        ? this.depthCutout
        : this.depthSolid
      // Bent geometry can leave its bounding sphere mid-turn.
      mesh.frustumCulled = false
    })
  }

  // `pivot` is the turning half's hinge; `curl` the extra turn at its edge.
  update(pivot: THREE.Object3D, curl: number) {
    pivot.updateWorldMatrix(true, false)
    this.uniforms.uPivot.value.copy(pivot.matrixWorld)
    this.uniforms.uPivotInv.value.copy(pivot.matrixWorld).invert()
    this.uniforms.uBend.value = curl
  }

  dispose() {
    this.copies.forEach((m) => m.dispose())
    this.depthCutout.dispose()
    this.depthSolid.dispose()
  }
}
