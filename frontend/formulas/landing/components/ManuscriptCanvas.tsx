import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { PAPER_CENTER, PAPER_EXIT, SCAN_REVEAL } from "../storyChoreography";
import { easedRange } from "../three/motion";
import { createManuscriptShaderMaterial, type ManuscriptShaderUniforms } from "../three/ManuscriptShaderMaterial";

const MANUSCRIPT_TEXTURE = "/static/formulas/visuals/manuscript_texture_alpha.png";
const IDLE_SCROLL_PROGRESS = { current: 0 };
const MAX_DPR: [number, number] = [0.75, 1.15];

type ManuscriptCanvasProps = {
  scrollProgressRef?: MutableRefObject<number>;
};

function PaperMesh({ scrollProgressRef = IDLE_SCROLL_PROGRESS }: ManuscriptCanvasProps) {
  const meshRef = useRef<THREE.Mesh>(null);
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
    if (document.hidden) {
      return;
    }

    if (!meshRef.current) {
      return;
    }

    const time = state.clock.getElapsedTime();
    const progress = scrollProgressRef.current;
    const centerProgress = easedRange(progress, PAPER_CENTER[0], PAPER_CENTER[1]);
    const scanProgress = easedRange(progress, SCAN_REVEAL[0], SCAN_REVEAL[1]);
    const decodeProgress = easedRange(progress, 0.16, 0.30);
    const workspaceProgress = easedRange(progress, PAPER_EXIT[0], PAPER_EXIT[1]);
    const floatAmount = 1 - centerProgress * 0.72;

    // Slide 3D paper horizontally to the left during workspace/editing phase
    const slideOffset = easedRange(progress, 0.28, 0.42) * -2.8;
    const x = THREE.MathUtils.lerp(3.4, -0.18, centerProgress) + slideOffset;
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
      const waveAmount = THREE.MathUtils.lerp(0.12, 0.04, centerProgress) + scanProgress * 0.02 + decodeProgress * 0.035;
      uniforms.uTime.value = time;
      uniforms.uScanProgress.value = THREE.MathUtils.clamp((progress - SCAN_REVEAL[0]) / (SCAN_REVEAL[1] - SCAN_REVEAL[0]), 0, 1);
      uniforms.uDecodeProgress.value = decodeProgress;
      uniforms.uOpacity.value = THREE.MathUtils.lerp(1, 0.9, decodeProgress);
      uniforms.uWaveAmount.value = waveAmount;
      uniforms.uWaveProgress.value = progress;
    }
  });

  return (
    <mesh ref={meshRef} position={[3.4, -1.35, -2]}>
      <planeGeometry args={[7.9, 4.45, 48, 48]} />
      <primitive ref={materialRef} object={shaderMaterial} attach="material" />
    </mesh>
  );
}

function LandingFramePump() {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      if (document.hidden) {
        raf = 0;
        return;
      }
      invalidate();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf && !document.hidden) {
        raf = requestAnimationFrame(tick);
      }
    };

    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
        return;
      }
      start();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    start();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stop();
    };
  }, [invalidate]);

  return null;
}

export function ManuscriptCanvas({ scrollProgressRef }: ManuscriptCanvasProps) {
  return (
    <div className="webgl-canvas-container" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        dpr={MAX_DPR}
        frameloop="demand"
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      >
        <LandingFramePump />
        <fog attach="fog" args={["#000000", 5, 20]} />
        <PaperMesh scrollProgressRef={scrollProgressRef} />
      </Canvas>
    </div>
  );
}
