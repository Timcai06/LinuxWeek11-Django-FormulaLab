import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { ScrollProgressRef } from "../types";
import { easedRange } from "../three/motion";

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
    const particles: Array<{ x: number; y: number; scale: number; rotate: number; text: string }> = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: 0,
        y: 0,
        scale: 0,
        rotate: 0,
        text: EQUATIONS[i % EQUATIONS.length]!,
      });
    }

    const draw = () => {
      particles.sort((a, b) => a.scale - b.scale);
      ctx.clearRect(0, 0, cw, ch);

      particles.forEach((p) => {
        if (p.scale < 0.01) return; // Skip particles too small to see (avoids Infinity)

        const alpha = Math.min(1, p.scale * 1.2);

        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate(p.rotate);
        ctx.scale(p.scale, p.scale);

        // Font size is large because it will be scaled down by the particle's scale factor
        ctx.font = "bold 96px 'D-DIN', 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(92, 255, 176, ${alpha})`;
        ctx.shadowColor = `rgba(92, 255, 176, ${alpha * 0.6})`;
        ctx.shadowBlur = 18;

        // p.x/p.y are in world coords; since we already scaled, divide by scale to get correct position
        ctx.fillText(p.text, p.x / p.scale, p.y / p.scale);
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

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      tl.kill();
    };
  }, []);

  // rAF loop to control timeScale and global opacity
  useEffect(() => {
    let animationFrameId: number;
    let currentSpeed = 0.15;
    let lastProgress = scrollProgressRef.current;

    const update = () => {
      if (timelineRef.current && canvasRef.current) {
        const p = scrollProgressRef.current;
        const absorbPhase = easedRange(p, 0.05, 0.35);
        const exitPhase = easedRange(p, 0.50, 0.80);

        const delta = Math.abs(p - lastProgress);
        lastProgress = p;

        const scrollBoost = Math.min(delta * 80, 0.6);
        const targetSpeed = 0.12 + (absorbPhase * 0.5) + scrollBoost;

        currentSpeed += (targetSpeed - currentSpeed) * 0.04;
        timelineRef.current.timeScale(currentSpeed);

        const targetOpacity = Math.max(0, absorbPhase - exitPhase * 1.2);
        canvasRef.current.style.opacity = Math.min(1.0, targetOpacity).toFixed(3);
      }
      animationFrameId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [scrollProgressRef]);

  return (
    <canvas
      ref={canvasRef}
      className="formula-vortex-canvas"
      aria-hidden="true"
    />
  );
}
