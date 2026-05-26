import { useEffect, useRef } from "react";
import type { ScrollProgressRef } from "../types";
import { progressBetween } from "../three/motion";

const NUM_POINTS = 10;
const NUM_PATHS = 2;
const DELAY_POINTS_MAX = 0.3;
const DELAY_PER_PATH = 0.25;
const MORPH_DURATION = 0.9;

const GREEN_GRADIENTS = [
  {
    id: "morph-grad-1",
    stops: [
      ["0%", "#0e100f"],
      ["75%", "#0e100f"],
      ["100%", "#1a3a2a"],
    ],
  },
  {
    id: "morph-grad-2",
    stops: [
      ["0%", "#0e100f"],
      ["80%", "#0e100f"],
      ["100%", "#5cffb0"],
    ],
  },
];

const BLACK_GRADIENTS = [
  {
    id: "morph-black-grad-1",
    stops: [
      ["0%", "#06130d"],
      ["72%", "#06130d"],
      ["100%", "#000000"],
    ],
  },
  {
    id: "morph-black-grad-2",
    stops: [
      ["0%", "#113222"],
      ["74%", "#06130d"],
      ["100%", "#000000"],
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
      delays.push(Math.random() * DELAY_POINTS_MAX);
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
      const greenSweepProgress = progressBetween(progress, 0.82, 0.90);
      const blackSweepProgress = progressBetween(progress, 0.982, 0.990);
      const greenProgress = greenSweepProgress * greenSweepProgress * (3 - 2 * greenSweepProgress);
      const blackProgress = blackSweepProgress * blackSweepProgress * (3 - 2 * blackSweepProgress);
      const greenExitProgress = progressBetween(progress, 0.982, 0.990);
      const blackExitProgress = progressBetween(progress, 0.990, 0.996);
      const activeProgress = blackProgress > 0 ? blackProgress : greenProgress;

      // Update points through a GSAP-style delayed overlay timeline.
      const pts = allPoints.current;
      const delays = delaysRef.current;
      const baseProgress = activeProgress;
      const timelineProgress = baseProgress * (MORPH_DURATION + DELAY_POINTS_MAX + DELAY_PER_PATH);

      for (let i = 0; i < NUM_PATHS; i++) {
        const pathDelay = DELAY_PER_PATH * i;
        for (let j = 0; j < NUM_POINTS; j++) {
          const pointDelay = delays[j]! + pathDelay;
          const pointProgress = Math.max(0, Math.min(1, (timelineProgress - pointDelay) / MORPH_DURATION));
          // Ease: power2.inOut approximation
          const eased = pointProgress < 0.5
            ? 2 * pointProgress * pointProgress
            : 1 - Math.pow(-2 * pointProgress + 2, 2) / 2;
          pts[i]![j] = 92 * eased;
        }
      }

      // Render SVG paths
      for (let i = 0; i < pathRefs.current.length; i++) {
        const pathEl = pathRefs.current[i];
        if (!pathEl) continue;
        const points = pts[i % NUM_PATHS]!;

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

      svg.dataset.curtainMode = blackProgress > 0 ? "black" : "green";
      svg.style.setProperty("--green-curtain-svg-opacity", (0.76 * greenProgress * (1 - greenExitProgress)).toFixed(3));
      svg.style.setProperty("--black-curtain-svg-opacity", (0.88 * blackProgress * (1 - blackExitProgress)).toFixed(3));
      svg.style.opacity = Math.max(
        0.76 * greenProgress * (1 - greenExitProgress),
        0.88 * blackProgress * (1 - blackExitProgress),
      ).toFixed(3);

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
        {[...GREEN_GRADIENTS, ...BLACK_GRADIENTS].map((g) => (
          <linearGradient key={g.id} id={g.id} x1="0%" y1="0%" x2="0%" y2="100%">
            {g.stops.map(([offset, color]) => (
              <stop key={offset} offset={offset} stopColor={color} />
            ))}
          </linearGradient>
        ))}
      </defs>
      <g className="morph-curtain-green">
        {GREEN_GRADIENTS.map((g, i) => (
          <path
            key={g.id}
            ref={(el) => { pathRefs.current[i] = el; }}
            fill={`url(#${g.id})`}
          />
        ))}
      </g>
      <g className="morph-curtain-black">
        {BLACK_GRADIENTS.map((g, i) => (
          <path
            key={g.id}
            ref={(el) => { pathRefs.current[i + NUM_PATHS] = el; }}
            fill={`url(#${g.id})`}
          />
        ))}
      </g>
    </svg>
  );
}
