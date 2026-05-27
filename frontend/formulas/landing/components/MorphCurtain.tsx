import { useEffect, useRef } from "react";
import gsap from "gsap";
import { BLACK_LIQUID, GREEN_LIQUID } from "../storyChoreography";
import type { ScrollProgressRef } from "../types";
import { getLandingMotionRuntime } from "../performance/motionRuntime";
import { progressBetween } from "../three/motion";

const NUM_POINTS = 10;
const NUM_PATHS = 2;
const DELAY_POINTS_MAX = 0.3;
const DELAY_PER_PATH = 0.25;
const MORPH_DURATION = 0.9;
const MORPH_PROGRESS_EPSILON = 0.0007;
const PATH_CACHE_STEPS = 240;
type WaveSweepRange = readonly [number, number];
type OpacityRange = readonly [number, number, number, number];

const WAVE_SWEEP_RANGE: WaveSweepRange = [0.04, 0.97];
const BLACK_WAVE_SWEEP_RANGE: WaveSweepRange = [0.035, 0.982];
const GREEN_OPACITY_RANGE: OpacityRange = [0.006, 0.10, 0.965, 1];
const BLACK_OPACITY_RANGE: OpacityRange = [0.008, 0.12, 0.985, 1];
const GREEN_PANEL_HANDOFF_RANGE = [GREEN_LIQUID[1] - 0.024, GREEN_LIQUID[1] + 0.002] as const;
const BLACK_PANEL_HANDOFF_RANGE = [BLACK_LIQUID[1] - 0.014, BLACK_LIQUID[1] + 0.002] as const;
const COMPLETED_MASK_RANGE = [0.92, 1] as const;

type LiquidPathCache = {
  frames: string[][];
  timeline: gsap.core.Timeline;
};

const GREEN_GRADIENTS = [
  {
    id: "morph-grad-1",
    stops: [
      ["0%", "#1db86c"],
      ["75%", "#1db86c"],
      ["100%", "#17c873"],
    ],
  },
  {
    id: "morph-grad-2",
    stops: [
      ["0%", "#5cffb0"],
      ["80%", "#5cffb0"],
      ["100%", "#17c873"],
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
      ["0%", "#000000"],
      ["74%", "#000000"],
      ["100%", "#000000"],
    ],
  },
];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smootherStep(value: number) {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function liquidWaveProgress(segmentProgress: number, waveSweepRange = WAVE_SWEEP_RANGE) {
  return smootherStep(progressBetween(segmentProgress, waveSweepRange[0], waveSweepRange[1]));
}

function liquidOpacity(segmentProgress: number, opacityRange = GREEN_OPACITY_RANGE) {
  const fadeIn = smootherStep(progressBetween(segmentProgress, opacityRange[0], opacityRange[1]));
  const fadeOut = smootherStep(progressBetween(segmentProgress, opacityRange[2], opacityRange[3]));
  return fadeIn * (1 - fadeOut);
}

function completedMaskOpacity(segmentProgress: number, handoffProgress: number) {
  const completedShapeOpacity = smootherStep(progressBetween(segmentProgress, COMPLETED_MASK_RANGE[0], COMPLETED_MASK_RANGE[1]));
  return completedShapeOpacity * (1 - handoffProgress);
}

function createLiquidPoints() {
  const points: number[][] = [];
  for (let pathIndex = 0; pathIndex < NUM_PATHS; pathIndex += 1) {
    const row: number[] = [];
    for (let pointIndex = 0; pointIndex < NUM_POINTS; pointIndex += 1) {
      row.push(100);
    }
    points.push(row);
  }
  return points;
}

function createPointDelays() {
  const delays: number[] = [];
  for (let pointIndex = 0; pointIndex < NUM_POINTS; pointIndex += 1) {
    delays.push(Math.random() * DELAY_POINTS_MAX);
  }
  return delays;
}

function buildLiquidPath(points: number[], isOpened: boolean) {
  let d = "";
  d += isOpened ? `M 0 0 V ${points[0]} C` : `M 0 ${points[0]} C`;

  for (let pointIndex = 0; pointIndex < NUM_POINTS - 1; pointIndex += 1) {
    const p = ((pointIndex + 1) / (NUM_POINTS - 1)) * 100;
    const cp = p - (1 / (NUM_POINTS - 1) * 100) / 2;
    d += ` ${cp} ${points[pointIndex]} ${cp} ${points[pointIndex + 1]} ${p} ${points[pointIndex + 1]}`;
  }

  d += isOpened ? " V 100 H 0" : " V 0 H 0";
  return d;
}

function createLiquidPathCache({ isOpened }: { isOpened: boolean }): LiquidPathCache {
  const points = createLiquidPoints();
  const pointDelays = createPointDelays();

  const timeline = gsap.timeline({
    paused: true,
    defaults: {
      ease: "power2.inOut",
      duration: MORPH_DURATION,
    },
  });

  for (let pathIndex = 0; pathIndex < NUM_PATHS; pathIndex += 1) {
    const row = points[pathIndex]!;
    const pathDelay = DELAY_PER_PATH * (isOpened ? pathIndex : NUM_PATHS - pathIndex - 1);
    for (let pointIndex = 0; pointIndex < NUM_POINTS; pointIndex += 1) {
      const pointDelay = pointDelays[pointIndex]!;
      timeline.to(row, { [pointIndex]: 0 }, pointDelay + pathDelay);
    }
  }

  const frames: string[][] = [];
  for (let frameIndex = 0; frameIndex <= PATH_CACHE_STEPS; frameIndex += 1) {
    const sampleProgress = frameIndex / PATH_CACHE_STEPS;
    timeline.progress(sampleProgress, true);
    frames.push(points.map((row) => buildLiquidPath(row, isOpened)));
  }
  timeline.progress(0, true);

  return { frames, timeline };
}

function frameIndexForProgress(progress: number) {
  return Math.round(clamp01(progress) * PATH_CACHE_STEPS);
}

function applyCachedPaths(paths: SVGPathElement[], cachedPaths: string[]) {
  for (let pathIndex = 0; pathIndex < paths.length; pathIndex += 1) {
    paths[pathIndex]?.setAttribute("d", cachedPaths[pathIndex]!);
  }
}

function applyCurtainOpacity(svg: SVGSVGElement, greenOpacity: number, blackOpacity: number, combinedOpacity: number) {
  svg.style.setProperty("--green-curtain-svg-opacity", greenOpacity.toFixed(3));
  svg.style.setProperty("--black-curtain-svg-opacity", blackOpacity.toFixed(3));
  svg.style.opacity = combinedOpacity.toFixed(3);
}

export function MorphCurtain({ scrollProgressRef }: { scrollProgressRef: ScrollProgressRef }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const greenPathCacheRef = useRef<LiquidPathCache | null>(null);
  const blackPathCacheRef = useRef<LiquidPathCache | null>(null);

  useEffect(() => {
    const greenPaths = pathRefs.current.slice(0, NUM_PATHS).filter(Boolean) as SVGPathElement[];
    const blackPaths = pathRefs.current.slice(NUM_PATHS, NUM_PATHS * 2).filter(Boolean) as SVGPathElement[];
    if (greenPaths.length !== NUM_PATHS || blackPaths.length !== NUM_PATHS) {
      return undefined;
    }

    greenPathCacheRef.current = createLiquidPathCache({ isOpened: true });
    blackPathCacheRef.current = createLiquidPathCache({ isOpened: true });
    applyCachedPaths(greenPaths, greenPathCacheRef.current.frames[0]!);
    applyCachedPaths(blackPaths, blackPathCacheRef.current.frames[0]!);

    return () => {
      greenPathCacheRef.current?.timeline.kill();
      blackPathCacheRef.current?.timeline.kill();
      greenPathCacheRef.current = null;
      blackPathCacheRef.current = null;
    };
  }, []);

  useEffect(() => {
    let lastGreenPathFrame = -1;
    let lastBlackPathFrame = -1;
    let lastRenderedOpacity = "-1:-1";

    const update = ({
      progress,
      greenSegmentProgress,
      blackSegmentProgress,
    }: {
      progress: number;
      greenSegmentProgress: number;
      blackSegmentProgress: number;
    }) => {
      if (document.hidden) {
        return;
      }

      const svg = svgRef.current;
      const greenPathCache = greenPathCacheRef.current;
      const blackPathCache = blackPathCacheRef.current;
      if (!svg || !greenPathCache || !blackPathCache) {
        return;
      }
      const greenPaths = pathRefs.current.slice(0, NUM_PATHS).filter(Boolean) as SVGPathElement[];
      const blackPaths = pathRefs.current.slice(NUM_PATHS, NUM_PATHS * 2).filter(Boolean) as SVGPathElement[];
      if (greenPaths.length !== NUM_PATHS || blackPaths.length !== NUM_PATHS) {
        return;
      }

      const greenWaveProgress = liquidWaveProgress(greenSegmentProgress);
      const blackWaveProgress = liquidWaveProgress(blackSegmentProgress, BLACK_WAVE_SWEEP_RANGE);
      const greenPanelHandoff = smootherStep(progressBetween(progress, GREEN_PANEL_HANDOFF_RANGE[0], GREEN_PANEL_HANDOFF_RANGE[1]));
      const blackPanelHandoff = smootherStep(progressBetween(progress, BLACK_PANEL_HANDOFF_RANGE[0], BLACK_PANEL_HANDOFF_RANGE[1]));
      const greenSvgOpacity = Math.max(
        greenSegmentProgress > 0 && greenSegmentProgress < 1 ? liquidOpacity(greenSegmentProgress) : 0,
        completedMaskOpacity(greenSegmentProgress, greenPanelHandoff),
      );
      const blackSvgOpacity = Math.max(
        blackSegmentProgress > 0 && blackSegmentProgress < 1 ? liquidOpacity(blackSegmentProgress, BLACK_OPACITY_RANGE) : 0,
        completedMaskOpacity(blackSegmentProgress, blackPanelHandoff),
      );
      const combinedOpacity = Math.max(greenSvgOpacity, blackSvgOpacity);
      const opacityKey = `${greenSvgOpacity.toFixed(3)}:${blackSvgOpacity.toFixed(3)}`;

      if (combinedOpacity <= 0) {
        if (lastRenderedOpacity !== opacityKey) {
          applyCurtainOpacity(svg, 0, 0, 0);
          lastRenderedOpacity = opacityKey;
        }
        return;
      }

      const greenPathFrame = frameIndexForProgress(greenWaveProgress);
      const blackPathFrame = frameIndexForProgress(blackWaveProgress);

      if (greenSvgOpacity > 0 && greenPathFrame !== lastGreenPathFrame) {
        applyCachedPaths(greenPaths, greenPathCache.frames[greenPathFrame]!);
        lastGreenPathFrame = greenPathFrame;
      }
      if (blackSvgOpacity > 0 && blackPathFrame !== lastBlackPathFrame) {
        applyCachedPaths(blackPaths, blackPathCache.frames[blackPathFrame]!);
        lastBlackPathFrame = blackPathFrame;
      }

      if (svg.dataset.curtainMode !== (blackSegmentProgress > 0 ? "black" : "green")) {
        svg.dataset.curtainMode = blackSegmentProgress > 0 ? "black" : "green";
      }
      if (lastRenderedOpacity !== opacityKey) {
        applyCurtainOpacity(svg, greenSvgOpacity, blackSvgOpacity, combinedOpacity);
        lastRenderedOpacity = opacityKey;
      }
    };

    const runtime = getLandingMotionRuntime();
    const unsubscribeFrame = runtime.subscribeRenderer({
      id: "morph-curtain",
      phases: ["greenCurtain", "blackCurtain"],
      epsilon: MORPH_PROGRESS_EPSILON,
      includeTransitionSettling: true,
    }, (frame) => {
      update({
        progress: frame.progress,
        greenSegmentProgress: frame.transitions.greenLiquidProgress,
        blackSegmentProgress: frame.transitions.blackLiquidProgress,
      });
    });
    update({
      progress: scrollProgressRef.current,
      greenSegmentProgress: progressBetween(scrollProgressRef.current, GREEN_LIQUID[0], GREEN_LIQUID[1]),
      blackSegmentProgress: progressBetween(scrollProgressRef.current, BLACK_LIQUID[0], BLACK_LIQUID[1]),
    });

    return () => {
      unsubscribeFrame();
    };
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
