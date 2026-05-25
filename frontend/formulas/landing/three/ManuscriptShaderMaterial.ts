import * as THREE from "three";

export type ManuscriptShaderUniforms = {
  uTexture: { value: THREE.Texture | null };
  uTime: { value: number };
  uScanProgress: { value: number };
  uDecodeProgress: { value: number };
  uOpacity: { value: number };
};

export function manuscriptShaderUniforms(texture: THREE.Texture | null): ManuscriptShaderUniforms {
  return {
    uTexture: { value: texture },
    uTime: { value: 0 },
    uScanProgress: { value: 0 },
    uDecodeProgress: { value: 0 },
    uOpacity: { value: 1 },
  };
}

const vertexShader = `
  #include <common>
  #include <fog_pars_vertex>

  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = `
  #include <common>
  #include <dithering_pars_fragment>
  #include <fog_pars_fragment>

  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uScanProgress;
  uniform float uDecodeProgress;
  uniform float uOpacity;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec4 paper = texture2D(uTexture, vUv);
    float scanLine = smoothstep(0.025, 0.0, abs(vUv.x - uScanProgress));
    float scanWake = smoothstep(0.18, 0.0, abs(vUv.x - uScanProgress));
    float grain = hash(vUv * 180.0 + uTime * 0.08);
    vec3 scanColor = vec3(0.36, 1.0, 0.72);
    vec3 decodedInk = mix(paper.rgb, vec3(0.92), uDecodeProgress * scanWake * 0.18);
    vec3 litPaper = decodedInk + scanColor * scanLine * 0.42 + scanColor * scanWake * 0.08;
    litPaper += (grain - 0.5) * 0.035;
    gl_FragColor = vec4(litPaper, paper.a * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    #include <dithering_fragment>
  }
`;

export function createManuscriptShaderMaterial(texture: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, manuscriptShaderUniforms(texture)]),
    vertexShader,
    fragmentShader,
    fog: true,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
  });
}
