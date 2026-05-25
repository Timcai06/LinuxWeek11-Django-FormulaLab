import { useEffect, useRef } from "react";
import type { ScrollProgressRef } from "../types";
import { progressBetween } from "../three/motion";

const NUM_POINTS = 10;
const NUM_PATHS = 2;

// Green cyber theme gradients with glowing leading edges and dark trailing bodies
const GRADIENTS = [
  {
    id: "morph-grad-1",
    stops: [
      ["0%", "#0e100f"],
      ["75%", "#0e100f"],
      ["100%", "#1a3a2a"], // Dark green leading edge
    ],
  },
  {
    id: "morph-grad-2",
    stops: [
      ["0%", "#0e100f"],
      ["80%", "#0e100f"],
      ["100%", "#5cffb0"], // Bright green leading edge
    ],
  },
];

export function MorphCurtain({ scrollProgressRef }: { scrollProgressRef: ScrollProgressRef }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const allPoints = useRef<number[][]>([]);
  const delaysRef = useRef<number[]>([]);

  // Initialize point arrays
  useEffect(() => {
    // Each path has NUM_POINTS control points, all starting at 0 (fully open/uncovered)
    const pts: number[][] = [];
    for (let i = 0; i < NUM_PATHS; i++) {
      const row: number[] = [];
      for (let j = 0; j < NUM_POINTS; j++) {
        row.push(0);
      }
      pts.push(row);
    }
    allPoints.current = pts;

    // Random per-point delays for organic feel
    const delays: number[] = [];
    for (let j = 0; j < NUM_POINTS; j++) {
      delays.push(Math.random() * 0.12);
    }
    delaysRef.current = delays;
  }, []);

  // rAF loop to update the curtain based on scroll progress
  useEffect(() => {
    let raf: number;

    const update = () => {
      const svg = svgRef.current;
      if (!svg) {
        raf = requestAnimationFrame(update);
        return;
      }

      const progress = scrollProgressRef.current;
      const curtainSweepProgress = progressBetween(progress, 0.80, 0.94);
      const curtainProgress = curtainSweepProgress * curtainSweepProgress * (3 - 2 * curtainSweepProgress);
      const curtainExitProgress = progressBetween(progress, 0.94, 0.99);
      const visibleProgress = curtainProgress * (1 - curtainExitProgress);

      // Update points: each point grows from 0 to 100 based on progress + delays
      const pts = allPoints.current;
      const delays = delaysRef.current;

      for (let i = 0; i < NUM_PATHS; i++) {
        const pathDelay = 0.08 * i; // Back path (i=0) starts first, front path (i=1) follows
        for (let j = 0; j < NUM_POINTS; j++) {
          const pointDelay = delays[j]! + pathDelay;
          const pointProgress = Math.max(0, Math.min(1, (curtainProgress - pointDelay) / (1 - pointDelay - 0.05)));
          // Ease: power2.inOut approximation
          const eased = pointProgress < 0.5
            ? 2 * pointProgress * pointProgress
            : 1 - Math.pow(-2 * pointProgress + 2, 2) / 2;
          pts[i]![j] = 82 * eased;
        }
      }

      // Render SVG paths
      for (let i = 0; i < NUM_PATHS; i++) {
        const pathEl = pathRefs.current[i];
        if (!pathEl) continue;
        const points = pts[i]!;

        // Build the SVG path: curtain hangs from top, sweeping down
        let d = `M 0 0 V ${points[0]} C`;
        for (let j = 0; j < NUM_POINTS - 1; j++) {
          const p = ((j + 1) / (NUM_POINTS - 1)) * 100;
          const cp = p - (1 / (NUM_POINTS - 1) * 100) / 2;
          d += ` ${cp} ${points[j]} ${cp} ${points[j + 1]} ${p} ${points[j + 1]}`;
        }
        d += ` V 0 H 0`;
        pathEl.setAttribute("d", d);
      }

      svg.style.opacity = (0.66 * visibleProgress).toFixed(3);

      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [scrollProgressRef]);

  return (
    <svg
      ref={svgRef}
      className="morph-curtain"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {GRADIENTS.map((g) => (
          <linearGradient key={g.id} id={g.id} x1="0%" y1="0%" x2="0%" y2="100%">
            {g.stops.map(([offset, color]) => (
              <stop key={offset} offset={offset} stopColor={color} />
            ))}
          </linearGradient>
        ))}
      </defs>
      {GRADIENTS.map((g, i) => (
        <path
          key={g.id}
          ref={(el) => { pathRefs.current[i] = el; }}
          fill={`url(#${g.id})`}
        />
      ))}
    </svg>
  );
}
