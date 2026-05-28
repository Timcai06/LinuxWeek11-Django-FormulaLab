import gsap from "gsap";
import * as THREE from "three";
import { formulaChapters, type FormulaChapter } from "../../data/formula-chapters";

const MANUSCRIPT_TEXTURE_URL = "/static/formulas/experiment/assets/research-manuscript-sheet.png";
const PAPER_WIDTH = 3.35;
const PAPER_HEIGHT = 4.45;

type PaperUniforms = {
  uTime: { value: number };
  uProgress: { value: number };
  uPointer: { value: THREE.Vector2 };
  uPaperTexture: { value: THREE.Texture };
  uTextureReady: { value: number };
};

export type PaperScene = {
  resize: () => void;
  render: (time: number, progress: number, chapterIndex: number, localProgress: number) => void;
  setPointer: (x: number, y: number) => void;
  dispose: () => void;
};

function uvToPlaneRect(bounds: FormulaChapter["uvBounds"]) {
  return {
    x: (bounds.x + bounds.width / 2 - 0.5) * PAPER_WIDTH,
    y: (0.5 - bounds.y - bounds.height / 2) * PAPER_HEIGHT,
    width: bounds.width * PAPER_WIDTH,
    height: bounds.height * PAPER_HEIGHT,
  };
}

function createFormulaRegionMesh(bounds: FormulaChapter["uvBounds"]) {
  const rect = uvToPlaneRect(bounds);
  const geometry = new THREE.PlaneGeometry(rect.width, rect.height, 16, 4);
  const material = new THREE.MeshBasicMaterial({
    color: 0xb7ff4a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(rect.x, rect.y, 0.035);
  mesh.renderOrder = 3;
  return mesh;
}

function createExtractedFormulaMaterial(chapter: FormulaChapter, uniforms: PaperUniforms) {
  const sourceUvRect = new THREE.Vector4(
    chapter.uvBounds.x,
    chapter.uvBounds.y,
    chapter.uvBounds.width,
    chapter.uvBounds.height,
  );
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uPaperTexture: uniforms.uPaperTexture,
      uTextureReady: uniforms.uTextureReady,
      uSourceUvRect: { value: sourceUvRect },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uPaperTexture;
      uniform float uTextureReady;
      uniform vec4 uSourceUvRect;

      void main() {
        vec2 sourceUv = uSourceUvRect.xy + vUv * uSourceUvRect.zw;
        vec4 texel = texture2D(uPaperTexture, sourceUv);
        float luma = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
        float inkMask = 1.0 - smoothstep(0.2, 0.62, luma);
        float paperFiber = smoothstep(0.18, 0.72, luma);
        float edge = smoothstep(0.0, 0.055, vUv.x) * smoothstep(0.0, 0.055, vUv.y) *
          smoothstep(0.0, 0.055, 1.0 - vUv.x) * smoothstep(0.0, 0.055, 1.0 - vUv.y);
        vec3 signal = vec3(0.64, 1.0, 0.36);
        vec3 color = mix(texel.rgb * 1.18, signal, inkMask * 0.28);
        float alpha = edge * uTextureReady * clamp(inkMask * 1.35 + paperFiber * 0.1, 0.0, 0.95);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

function createExtractedFormulaMesh(chapter: FormulaChapter, uniforms: PaperUniforms) {
  const rect = uvToPlaneRect(chapter.uvBounds);
  const material = createExtractedFormulaMaterial(chapter, uniforms);
  const geometry = new THREE.PlaneGeometry(rect.width, rect.height, 24, 8);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(rect.x, rect.y, 0.06);
  mesh.userData.baseX = rect.x;
  mesh.userData.baseY = rect.y;
  mesh.renderOrder = 4;
  return mesh;
}

function createPaperMaterial(uniforms: PaperUniforms) {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      uniform float uProgress;
      uniform vec2 uPointer;

      void main() {
        vUv = uv;
        vec3 transformed = position;
        float fold = sin((uv.x * 6.2831) + uProgress * 4.0) * 0.045;
        float lift = smoothstep(0.08, 0.48, uProgress);
        transformed.z += fold * (1.0 - lift * 0.42);
        transformed.x += (uv.y - 0.5) * uPointer.x * 0.11;
        transformed.y += (uv.x - 0.5) * uPointer.y * 0.09;
        transformed.y += lift * 0.26;
        transformed.x *= 1.0 + lift * 0.34;
        transformed.y *= 1.0 - lift * 0.10;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uProgress;
      uniform float uTime;
      uniform sampler2D uPaperTexture;
      uniform float uTextureReady;

      float grid(vec2 uv, float scale) {
        vec2 g = abs(fract(uv * scale - 0.5) - 0.5) / fwidth(uv * scale);
        return 1.0 - min(min(g.x, g.y), 1.0);
      }

      void main() {
        float edge = smoothstep(0.0, 0.025, vUv.x) * smoothstep(0.0, 0.025, vUv.y) *
          smoothstep(0.0, 0.025, 1.0 - vUv.x) * smoothstep(0.0, 0.025, 1.0 - vUv.y);
        vec4 texel = texture2D(uPaperTexture, vUv);
        float luma = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
        float textureMask = smoothstep(0.035, 0.16, luma) * uTextureReady;
        float scan = smoothstep(0.018, 0.0, abs(vUv.y - fract(uProgress * 1.18 + 0.12)));
        float formula = grid(vUv + vec2(sin(vUv.y * 9.0 + uTime * 0.22) * 0.012, 0.0), 8.0);
        float fine = grid(vUv + vec2(0.0, cos(vUv.x * 8.0) * 0.008), 21.0);
        vec3 paperTone = mix(vec3(0.56, 0.54, 0.49), vec3(0.92, 0.90, 0.82), 0.55 + vUv.y * 0.18);
        vec3 ink = vec3(0.06, 0.08, 0.07);
        vec3 signal = vec3(0.53, 1.0, 0.35);
        vec3 photographedPaper = mix(paperTone, texel.rgb, textureMask * 0.92);
        vec3 color = photographedPaper;
        color = mix(color, ink, formula * (0.11 + (1.0 - textureMask) * 0.2));
        color = mix(color, ink, fine * (0.04 + (1.0 - textureMask) * 0.08));
        color = mix(color, signal, scan * (0.18 + uProgress * 0.42));
        float alpha = edge * mix(0.88, textureMask, uTextureReady) *
          (0.9 - smoothstep(0.72, 0.95, uProgress) * 0.16);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

export function createPaperScene(canvas: HTMLCanvasElement): PaperScene {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.18, 7.2);

  const fallbackPaperTexture = new THREE.DataTexture(new Uint8Array([205, 198, 176, 255]), 1, 1, THREE.RGBAFormat);
  fallbackPaperTexture.colorSpace = THREE.SRGBColorSpace;
  fallbackPaperTexture.needsUpdate = true;

  const paperUniforms: PaperUniforms = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uPaperTexture: { value: fallbackPaperTexture },
    uTextureReady: { value: 0 },
  };

  const paperGeometry = new THREE.PlaneGeometry(PAPER_WIDTH, PAPER_HEIGHT, 120, 120);
  const paperMaterial = createPaperMaterial(paperUniforms);
  const paper = new THREE.Mesh(paperGeometry, paperMaterial);
  paper.rotation.set(-0.08, 0.08, -0.015);
  scene.add(paper);

  const formulaRegionMeshes = formulaChapters.map((chapter) => createFormulaRegionMesh(chapter.uvBounds));
  formulaRegionMeshes.forEach((mesh) => paper.add(mesh));
  const extractedFormulaMeshes = formulaChapters.map((chapter) => createExtractedFormulaMesh(chapter, paperUniforms));
  extractedFormulaMeshes.forEach((mesh) => paper.add(mesh));

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xb7ff4a,
    transparent: true,
    opacity: 0.32,
  });

  const lineGroup = new THREE.Group();
  for (let i = 0; i < 18; i += 1) {
    const y = -1.9 + i * 0.22;
    const points = [
      new THREE.Vector3(-2.2, y, -0.45),
      new THREE.Vector3(0, y + Math.sin(i) * 0.12, -0.55),
      new THREE.Vector3(2.2, y + Math.cos(i) * 0.08, -0.45),
    ];
    lineGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
  }
  lineGroup.scale.set(0.58, 0.58, 0.58);
  lineGroup.position.z = -0.8;
  scene.add(lineGroup);

  new THREE.TextureLoader().load(MANUSCRIPT_TEXTURE_URL, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    paperUniforms.uPaperTexture.value = texture;
    gsap.to(paperUniforms.uTextureReady, { value: 1, duration: 0.72, ease: "power2.out" });
  });

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.65);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  return {
    resize,
    setPointer(x, y) {
      paperUniforms.uPointer.value.set(x, y);
    },
    render(time, progress, chapterIndex, localProgress) {
      paperUniforms.uTime.value = time * 0.001;
      paperUniforms.uProgress.value = progress;

      paper.rotation.y = 0.08 + progress * 0.36;
      paper.rotation.x = -0.08 + progress * 0.08;
      paper.position.z = -progress * 0.48;
      lineGroup.rotation.z = progress * 0.08;
      lineGroup.position.y = -0.18 + progress * 0.34;
      lineMaterial.opacity = 0.16 + progress * 0.28;

      formulaRegionMeshes.forEach((mesh, index) => {
        const material = mesh.material as THREE.MeshBasicMaterial;
        const active = index === chapterIndex ? 1 : 0;
        const lift = active * Math.sin(localProgress * Math.PI);
        material.opacity = active * (0.08 + lift * 0.28);
        mesh.position.z = 0.035 + lift * 0.32;
        mesh.scale.setScalar(1 + lift * 0.08);
      });

      extractedFormulaMeshes.forEach((mesh, index) => {
        const material = mesh.material as THREE.ShaderMaterial;
        const active = index === chapterIndex ? 1 : 0;
        const lift = active * Math.sin(Math.min(1, localProgress * 1.15) * Math.PI);
        const settle = active * Math.min(1, Math.max(0, (localProgress - 0.18) / 0.44));
        material.opacity = active * Math.min(0.96, lift * 1.18);
        mesh.position.x = mesh.userData.baseX;
        mesh.position.y = mesh.userData.baseY + active * Math.sin(localProgress * Math.PI * 2) * 0.018;
        mesh.position.z = 0.06 + lift * 0.88;
        mesh.rotation.x = -lift * 0.16;
        mesh.scale.setScalar(0.88 + settle * 0.24);
      });

      renderer.render(scene, camera);
    },
    dispose() {
      renderer.dispose();
      paperGeometry.dispose();
      paperMaterial.dispose();
      fallbackPaperTexture.dispose();
      lineMaterial.dispose();
      formulaRegionMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      extractedFormulaMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      lineGroup.children.forEach((line) => {
        (line as THREE.Line).geometry.dispose();
      });
    },
  };
}
