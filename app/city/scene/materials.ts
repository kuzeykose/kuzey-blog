import * as THREE from 'three'

// Uniforms shared by every paper material so day/night is a single value,
// and likewise the weather: how much snow has settled, how wet the pages
// are and how grey the sky has turned.
export const shared = {
  uNight: { value: 0 },
  uSnow: { value: 0 },
  uWet: { value: 0 },
  uGloom: { value: 0 },
}

const SNOW_GLSL = /* glsl */ `
const vec3 SNOW = vec3( 0.95, 0.96, 0.99 );
float snowHash( vec2 p ) {
  return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 );
}
float snowNoise( vec2 p ) {
  vec2 i = floor( p );
  vec2 f = fract( p );
  f = f * f * ( 3.0 - 2.0 * f );
  return mix(
    mix( snowHash( i ), snowHash( i + vec2( 1.0, 0.0 ) ), f.x ),
    mix( snowHash( i + vec2( 0.0, 1.0 ) ), snowHash( i + vec2( 1.0, 1.0 ) ), f.x ),
    f.y
  );
}
`

export function canvasTexture(
  canvas: HTMLCanvasElement,
  o: { repeat?: [number, number]; srgb?: boolean; anisotropy?: number } = {}
) {
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = o.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.anisotropy = o.anisotropy ?? 8
  if (o.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(o.repeat[0], o.repeat[1])
  }
  return t
}

// A paper cutout is two single-sided materials on the same plane: the
// printed front and the plain stock behind it. Keeping them separate gives
// each side its own normal, which keeps shadows clean when the back of a
// folded-down piece faces the light.
export function paperMaterials(o: {
  map: THREE.Texture
  glow?: THREE.Texture | null
  night?: THREE.Texture | null
  back?: string
  glowStrength?: number
  // World size of the texture, so snow settles in a band of real depth.
  size?: [number, number]
  // Sky papers turn grey under rain instead of gathering snow.
  sky?: boolean
}) {
  const night = o.night ?? null
  const sky = o.sky ?? false
  const size = new THREE.Vector2(...(o.size ?? [1, 1]))
  const front = new THREE.MeshStandardMaterial({
    map: o.map,
    roughness: 0.95,
    metalness: 0,
    side: THREE.FrontSide,
    alphaTest: 0.5,
    alphaToCoverage: true,
    emissive: o.glow ? new THREE.Color('#ffffff') : new THREE.Color('#000000'),
    emissiveMap: o.glow ?? null,
    emissiveIntensity: o.glowStrength ?? 1.25,
  })
  front.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = shared.uNight
    shader.uniforms.uSnow = shared.uSnow
    shader.uniforms.uGloom = shared.uGloom
    shader.uniforms.uPaperSize = { value: size }
    if (night) shader.uniforms.nightMap = { value: night }
    const weather = sky
      ? `
  float lum = dot( diffuseColor.rgb, vec3( 0.299, 0.587, 0.114 ) );
  diffuseColor.rgb = mix( diffuseColor.rgb, vec3( lum ) * vec3( 0.8, 0.84, 0.9 ), uGloom );`
      : `
  #ifdef USE_MAP
  if ( uSnow > 0.001 ) {
    // Snow settles along every top edge: wherever there's open air just
    // above. The band deepens as it keeps snowing.
    float depth = uSnow * ( 0.08 + 0.1 * snowNoise( vec2( vMapUv.x * uPaperSize.x * 6.0, 0.5 ) ) );
    float dv = depth / uPaperSize.y;
    float air = 0.0;
    for ( int i = 1; i <= 4; i ++ ) {
      air = max( air, 1.0 - step( 0.5, texture2D( map, vMapUv + vec2( 0.0, dv * float( i ) * 0.25 ) ).a ) );
    }
    diffuseColor.rgb = mix( diffuseColor.rgb, SNOW, air );
  }
  #endif`
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uNight;
uniform float uSnow;
uniform float uGloom;
uniform vec2 uPaperSize;
${SNOW_GLSL}
${night ? 'uniform sampler2D nightMap;' : ''}`
      )
      .replace(
        '#include <map_fragment>',
        (night
          ? `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  sampledDiffuseColor.rgb = mix( sampledDiffuseColor.rgb, texture2D( nightMap, vMapUv ).rgb, uNight );
  diffuseColor *= sampledDiffuseColor;
#endif`
          : '#include <map_fragment>') + weather
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
totalEmissiveRadiance *= uNight;`
      )
  }
  front.customProgramCacheKey = () => `paper-front${night ? '-night' : ''}${sky ? '-sky' : ''}`

  const backColor = new THREE.Color(o.back ?? '#efe7d6')
  const back = new THREE.MeshStandardMaterial({
    map: o.map,
    roughness: 1,
    metalness: 0,
    side: THREE.BackSide,
    alphaTest: 0.5,
    alphaToCoverage: true,
  })
  back.onBeforeCompile = (shader) => {
    shader.uniforms.uBack = { value: backColor }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uBack;')
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
  diffuseColor *= vec4( uBack, texture2D( map, vMapUv ).a );
#endif`
      )
  }
  back.customProgramCacheKey = () => 'paper-back'
  return { front, back }
}

// Printed pages and pavements: damp under rain, and dusted with drifts of
// snow that spread as it keeps falling. The drifts follow the surface's own
// x/z, so they stay put while a page turns.
// `shiftX` moves the surface into spread coordinates, so the two halves of
// a spread don't get the same drifts.
export function groundMaterial(m: THREE.MeshStandardMaterial, shiftX = 0) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uSnow = shared.uSnow
    shader.uniforms.uWet = shared.uWet
    shader.uniforms.uShiftX = { value: shiftX }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uShiftX;\nvarying vec2 vGround;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGround = position.xz + vec2( uShiftX, 0.0 );')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uSnow;
uniform float uWet;
varying vec2 vGround;
${SNOW_GLSL}`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
  diffuseColor.rgb *= 1.0 - 0.1 * uWet;
  if ( uSnow > 0.001 ) {
    // Drifts cover about half the page at most, so the map still shows
    // between them.
    float n = snowNoise( vGround * 1.1 ) * 0.7 + snowNoise( vGround * 4.5 ) * 0.3;
    float f = uSnow * 0.42;
    diffuseColor.rgb = mix( diffuseColor.rgb, SNOW, 0.9 * smoothstep( 0.92 - f, 1.0 - f, n ) );
  }`
      )
  }
  m.customProgramCacheKey = () => 'ground'
  return m
}
