import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

import { easedRange } from "../three/motion";
import { createManuscriptShaderMaterial, type ManuscriptShaderUniforms } from "../three/ManuscriptShaderMaterial";

const MANUSCRIPT_TEXTURE = "/static/formulas/visuals/manuscript_texture_alpha.png";
const IDLE_SCROLL_PROGRESS = { current: 0 };
const MAX_DPR: [number, number] = [1, 1.5];
const STARFIELD_PARTICLE_COUNT = 720;

type ManuscriptCanvasProps = {
  scrollProgressRef?: MutableRefObject<number>;
};

function createStarfieldGeometry() {
  const count = STARFIELD_PARTICLE_COUNT;
  const basePositions = new Float32Array(count * 3);
  const targetPositions = new Float32Array(count * 3);
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const angle = index * 2.399963229728653;
    const band = index % 9;
    const radius = 1.8 + (index % 37) * 0.12;
    const row = Math.floor(index / 37) % 7;
    const baseOffset = index * 3;

    basePositions[baseOffset] = Math.cos(angle) * radius + (band - 4) * 0.58;
    basePositions[baseOffset + 1] = Math.sin(angle * 0.72) * 2.7 + (row - 3) * 0.42;
    basePositions[baseOffset + 2] = -3.4 + ((index * 13) % 80) / 80;

    const targetAngle = angle + (index % 5) * 0.34;
    const targetRadius = 0.3 + (index % 31) * 0.018;
    targetPositions[baseOffset] = -0.18 + Math.cos(targetAngle) * targetRadius;
    targetPositions[baseOffset + 1] = -0.04 + Math.sin(targetAngle) * targetRadius * 0.56;
    targetPositions[baseOffset + 2] = -0.48 + ((index % 17) - 8) * 0.006;

    positions[baseOffset] = basePositions[baseOffset]!;
    positions[baseOffset + 1] = basePositions[baseOffset + 1]!;
    positions[baseOffset + 2] = basePositions[baseOffset + 2]!;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return { geometry, basePositions, targetPositions };
}

function FormulaStarfield({ scrollProgressRef = IDLE_SCROLL_PROGRESS }: ManuscriptCanvasProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const field = useMemo(() => createStarfieldGeometry(), []);

  useEffect(() => {
    return () => field.geometry.dispose();
  }, [field.geometry]);

  useFrame((state) => {
    const positionAttribute = field.geometry.getAttribute("position") as THREE.BufferAttribute;
    const positions = positionAttribute.array as Float32Array;
    const progress = scrollProgressRef.current;
    const absorbProgress = easedRange(progress, 0.08, 0.30);
    const orbitProgress = easedRange(progress, 0.30, 0.74);
    const releaseProgress = easedRange(progress, 0.66, 0.74);
    const time = state.clock.getElapsedTime();

    for (let index = 0; index < positions.length; index += 3) {
      const pointIndex = index / 3;
      const angle = pointIndex * 0.081 + time * (0.1 + orbitProgress * 0.24);
      const orbitRadius = orbitProgress * (0.12 + (pointIndex % 19) * 0.006);
      const pull = absorbProgress;

      positions[index] = THREE.MathUtils.lerp(field.basePositions[index]!, field.targetPositions[index]!, pull) + Math.cos(angle) * orbitRadius;
      positions[index + 1] = THREE.MathUtils.lerp(field.basePositions[index + 1]!, field.targetPositions[index + 1]!, pull) + Math.sin(angle) * orbitRadius * 0.6;
      positions[index + 2] = THREE.MathUtils.lerp(field.basePositions[index + 2]!, field.targetPositions[index + 2]!, pull) + orbitProgress * 0.05;
    }

    positionAttribute.needsUpdate = true;
    if (materialRef.current) {
      materialRef.current.opacity = THREE.MathUtils.lerp(0.34, 0.72, absorbProgress) * (1 - orbitProgress * 0.2) * (1 - releaseProgress * 0.72);
      materialRef.current.size = THREE.MathUtils.lerp(0.018, 0.031, absorbProgress);
    }

    if (pointsRef.current) {
      pointsRef.current.rotation.z = Math.sin(time * 0.12) * 0.025;
      pointsRef.current.rotation.y = -0.08 + absorbProgress * 0.16;
    }
  });

  return (
    <points ref={pointsRef} geometry={field.geometry}>
      <pointsMaterial
        ref={materialRef}
        color={0xffffff}
        size={0.018}
        sizeAttenuation
        transparent
        opacity={0.34}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function PaperMesh({ scrollProgressRef = IDLE_SCROLL_PROGRESS }: ManuscriptCanvasProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geomRef = useRef<THREE.PlaneGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial & { uniforms: ManuscriptShaderUniforms }>(null);
  const loadedTexture = useLoader(THREE.TextureLoader, MANUSCRIPT_TEXTURE);
  const texture = useMemo(() => {
    const clone = loadedTexture.clone();
    clone.colorSpace = THREE.SRGBColorSpace;
    clone.needsUpdate = true;
    return clone;
  }, [loadedTexture]);
  const shaderMaterial = useMemo(() => createManuscriptShaderMaterial(texture), [texture]);

  useEffect(() => {
    return () => {
      texture.dispose();
      shaderMaterial.dispose();
    };
  }, [texture, shaderMaterial]);

  useFrame((state) => {
    if (!geomRef.current || !meshRef.current) {
      return;
    }

    const time = state.clock.getElapsedTime();
    const progress = scrollProgressRef.current;
    const centerProgress = easedRange(progress, 0.08, 0.30);
    const scanProgress = easedRange(progress, 0.28, 0.44);
    const decodeProgress = easedRange(progress, 0.30, 0.52);
    const workspaceProgress = easedRange(progress, 0.66, 0.74);
    const floatAmount = 1 - centerProgress * 0.72;

    const x = THREE.MathUtils.lerp(3.4, -0.18, centerProgress);
    const y = THREE.MathUtils.lerp(-1.35, -0.04, centerProgress) + Math.sin(time * 0.5) * 0.28 * floatAmount;
    const z = THREE.MathUtils.lerp(-2, -0.54, centerProgress) - decodeProgress * 0.12 - workspaceProgress * 0.1;
    const scale = 1 + centerProgress * 0.36 + scanProgress * 0.05 - workspaceProgress * 0.14;

    meshRef.current.position.set(x, y, z);
    meshRef.current.scale.setScalar(scale);
    meshRef.current.rotation.y = Math.sin(time * 0.2) * 0.15 * floatAmount - centerProgress * 0.18 + decodeProgress * 0.08 - workspaceProgress * 0.04;
    meshRef.current.rotation.x = Math.cos(time * 0.3) * 0.1 * floatAmount - 0.1 + centerProgress * 0.14 + scanProgress * 0.04;
    meshRef.current.rotation.z = -centerProgress * 0.035 + decodeProgress * 0.035 - workspaceProgress * 0.018;

    if (materialRef.current) {
      const uniforms = materialRef.current.uniforms;
      uniforms.uTime.value = time;
      uniforms.uScanProgress.value = THREE.MathUtils.clamp((progress - 0.28) / 0.16, 0, 1);
      uniforms.uDecodeProgress.value = decodeProgress;
      uniforms.uOpacity.value = THREE.MathUtils.lerp(1, 0.9, decodeProgress);
    }

    const positionAttribute = geomRef.current.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!positionAttribute) {
      return;
    }
    const waveAmount = THREE.MathUtils.lerp(0.12, 0.04, centerProgress) + scanProgress * 0.02 + decodeProgress * 0.035;
    for (let index = 0; index < positionAttribute.count; index += 1) {
      const x = positionAttribute.getX(index);
      const y = positionAttribute.getY(index);
      const waveX = Math.sin(x * 2 + time * 0.8 + progress * 2) * waveAmount;
      const waveY = Math.cos(y * 1.5 + time * 0.8) * waveAmount;
      positionAttribute.setZ(index, waveX + waveY);
    }
    positionAttribute.needsUpdate = true;
    geomRef.current.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} position={[3.4, -1.35, -2]}>
      <planeGeometry ref={geomRef} args={[7.9, 4.45, 48, 48]} />
      <primitive ref={materialRef} object={shaderMaterial} attach="material" />
    </mesh>
  );
}

export function ManuscriptCanvas({ scrollProgressRef }: ManuscriptCanvasProps) {
  return (
    <div className="webgl-canvas-container" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        dpr={MAX_DPR}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <fog attach="fog" args={["#000000", 5, 20]} />
        <FormulaStarfield scrollProgressRef={scrollProgressRef}/>
        <PaperMesh scrollProgressRef={scrollProgressRef} />
      </Canvas>
    </div>
  );
}
