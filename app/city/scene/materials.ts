import * as THREE from 'three'

// Uniforms shared by every paper material so day/night is a single value.
export const shared = {
  uNight: { value: 0 },
}

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
}) {
  const night = o.night ?? null
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
    if (night) shader.uniforms.nightMap = { value: night }
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uNight;
${night ? 'uniform sampler2D nightMap;' : ''}`
      )
      .replace(
        '#include <map_fragment>',
        night
          ? `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  sampledDiffuseColor.rgb = mix( sampledDiffuseColor.rgb, texture2D( nightMap, vMapUv ).rgb, uNight );
  diffuseColor *= sampledDiffuseColor;
#endif`
          : '#include <map_fragment>'
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
totalEmissiveRadiance *= uNight;`
      )
  }
  front.customProgramCacheKey = () => (night ? 'paper-front-night' : 'paper-front')

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
