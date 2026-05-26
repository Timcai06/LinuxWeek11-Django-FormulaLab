import { useEffect, useRef } from "react";
import gsap from "gsap";
import { PAPER_EXIT } from "../storyChoreography";
import type { ScrollProgressRef } from "../types";
import { easedRange } from "../three/motion";
import { getLandingMotionRuntime } from "../performance/motionRuntime";

const EQUATIONS = [
  'e^{iπ} + 1 = 0',
  'E = mc²',
  '∇·E = ρ/ε₀',
  '∇×B = μ₀J',
  'iℏ ∂Ψ/∂t = ĤΨ',
  'F = Gm₁m₂/r²',
  'S = kB ln W',
  '∫ e^{-x²} dx = √π',
  'Δx·Δp ≥ ℏ/2',
  'R_μν − ½gR = 8πGT',
  '∂²u/∂t² = c²∇²u',
  'PV = nRT',
];

const VORTEX_FRAME_INTERVAL_MS = 33;
const VORTEX_PROGRESS_EPSILON = 0.001;
const TEXTURE_FONT = "bold 96px 'D-DIN', 'Courier New', monospace";
const TEXTURE_PADDING = 64;
const TEXTURE_HEIGHT = 224;

type FormulaTexture = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

type FormulaParticle = {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  textureIndex: number;
};

function createFormulaTextureAtlas(): FormulaTexture[] {
  const textures: FormulaTexture[] = [];
  EQUATIONS.forEach((equation) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.font = TEXTURE_FONT;
    const textWidth = Math.ceil(ctx.measureText(equation).width);
    canvas.width = textWidth + TEXTURE_PADDING * 2;
    canvas.height = TEXTURE_HEIGHT;

    ctx.font = TEXTURE_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(92, 255, 176, 1)";
    ctx.shadowColor = "rgba(92, 255, 176, 0.6)";
    ctx.shadowBlur = 18;
    ctx.fillText(equation, canvas.width / 2, canvas.height / 2);

    textures.push({ canvas, width: canvas.width, height: canvas.height });
  });
  return textures;
}

export function FormulaVortex({ scrollProgressRef }: { scrollProgressRef: ScrollProgressRef }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cw = (canvas.width = window.innerWidth);
    let ch = (canvas.height = window.innerHeight);
    let radius = Math.max(cw, ch);
    const count = 72;
    const textures = createFormulaTextureAtlas();
    const particles: FormulaParticle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: 0,
        y: 0,
        scale: 0,
        rotate: 0,
        textureIndex: i % textures.length,
      });
    }

    const draw = () => {
      particles.sort((a, b) => a.scale - b.scale);
      ctx.clearRect(0, 0, cw, ch);

      particles.forEach((p) => {
        if (p.scale < 0.01) return; // Skip particles too small to see (avoids Infinity)

        const texture = textures[p.textureIndex];
        if (!texture) return;
        const alpha = Math.min(1, p.scale * 1.2);

        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate(p.rotate);
        ctx.scale(p.scale, p.scale);
        ctx.globalAlpha = alpha;

        // p.x/p.y are in world coords; since we already scaled, divide by scale to get correct position
        ctx.drawImage(
          texture.canvas,
          p.x / p.scale - texture.width / 2,
          p.y / p.scale - texture.height / 2,
          texture.width,
          texture.height,
        );
        ctx.restore();
      });
    };

    const tl = gsap.timeline({ onUpdate: draw })
      .fromTo(particles, {
        x: (i: number) => {
          const angle = (i / count * Math.PI * 2) - Math.PI / 2;
          return Math.cos(angle * 10) * radius;
        },
        y: (i: number) => {
          const angle = (i / count * Math.PI * 2) - Math.PI / 2;
          return Math.sin(angle * 10) * radius;
        },
        scale: 1.1,
        rotate: 0,
      }, {
        duration: 5,
        ease: "sine",
        x: 0,
        y: 0,
        scale: 0,
        rotate: -3,
        stagger: { each: -0.05, repeat: -1 },
      }, 0)
      .seek(99);

    timelineRef.current = tl;

    const handleResize = () => {
      cw = canvas.width = window.innerWidth;
      ch = canvas.height = window.innerHeight;
      radius = Math.max(cw, ch);
      tl.invalidate();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tl.pause();
        return;
      }
      tl.resume();
      draw();
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      tl.kill();
    };
  }, []);

  // Runtime subscription to control timeScale and global opacity.
  useEffect(() => {
    let lastPaintTime = 0;
    let currentSpeed = 0.15;
    let lastProgress = scrollProgressRef.current;

    const update = (now: number) => {
      if (document.hidden) {
        return;
      }

      if (timelineRef.current && canvasRef.current) {
        const p = scrollProgressRef.current;
        const shouldThrottle =
          now - lastPaintTime < VORTEX_FRAME_INTERVAL_MS &&
          Math.abs(p - lastProgress) < VORTEX_PROGRESS_EPSILON;
        if (shouldThrottle) {
          return;
        }

        const absorbPhase = easedRange(p, 0.05, 0.35);
        const exitPhase = easedRange(p, PAPER_EXIT[0] - 0.04, PAPER_EXIT[1]);

        const delta = Math.abs(p - lastProgress);
        lastProgress = p;

        const scrollBoost = Math.min(delta * 80, 0.6);
        const targetSpeed = 0.12 + (absorbPhase * 0.5) + scrollBoost;

        currentSpeed += (targetSpeed - currentSpeed) * 0.04;
        timelineRef.current.timeScale(currentSpeed);

        const targetOpacity = Math.max(0, absorbPhase - exitPhase * 1.2);
        canvasRef.current.style.opacity = Math.min(1.0, targetOpacity).toFixed(3);
        lastPaintTime = now;
      }
    };

    const runtime = getLandingMotionRuntime();
    const unsubscribeFrame = runtime.subscribe(({ timeMs }) => {
      update(timeMs);
    });
    const unsubscribeVisibility = runtime.subscribeVisibility(() => {
      lastPaintTime = 0;
    });

    update(performance.now());
    return () => {
      unsubscribeFrame();
      unsubscribeVisibility();
    };
  }, [scrollProgressRef]);

  return (
    <canvas
      ref={canvasRef}
      className="formula-vortex-canvas"
      aria-hidden="true"
    />
  );
}
