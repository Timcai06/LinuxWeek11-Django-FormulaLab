import { useEffect, useRef } from "react";
import { LETTER_STORM, WORKBENCH_GATE } from "../storyChoreography";
import { getLandingMotionRuntime } from "../performance/motionRuntime";
import { progressBetween } from "../three/motion";

const PATH_A = [
  [50, 14], [78, 8], [88, 28], [92, 46],
  [96, 64], [82, 86], [48, 92],
  [20, 88], [6, 72], [8, 48],
  [10, 24], [28, 20], [50, 14]
] as const;

const PATH_B = [
  [50, 0], [98, 0], [100, 2], [100, 50],
  [100, 98], [98, 100], [50, 100],
  [2, 100], [0, 98], [0, 50],
  [0, 2], [2, 0], [50, 0]
] as const;

const getInterpolatedPath = (t: number) => {
  const pts = PATH_A.map((pA, i) => {
    const pB = PATH_B[i];
    if (!pB) return [50, 50];
    const x = pA[0] + (pB[0] - pA[0]) * t;
    const y = pA[1] + (pB[1] - pA[1]) * t;
    return [x, y];
  });
  const p0 = pts[0] || [50, 50];
  const p1 = pts[1] || [50, 50];
  const p2 = pts[2] || [50, 50];
  const p3 = pts[3] || [50, 50];
  const p4 = pts[4] || [50, 50];
  const p5 = pts[5] || [50, 50];
  const p6 = pts[6] || [50, 50];
  const p7 = pts[7] || [50, 50];
  const p8 = pts[8] || [50, 50];
  const p9 = pts[9] || [50, 50];
  const p10 = pts[10] || [50, 50];
  const p11 = pts[11] || [50, 50];
  const p12 = pts[12] || [50, 50];
  return `M ${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]} C ${p4[0]} ${p4[1]}, ${p5[0]} ${p5[1]}, ${p6[0]} ${p6[1]} C ${p7[0]} ${p7[1]}, ${p8[0]} ${p8[1]}, ${p9[0]} ${p9[1]} C ${p10[0]} ${p10[1]}, ${p11[0]} ${p11[1]}, ${p12[0]} ${p12[1]} Z`;
};

const GATE_PATH_CACHE_STEPS = 96;

function createGatePathCache() {
  return Array.from({ length: GATE_PATH_CACHE_STEPS + 1 }, (_, index) => {
    const progress = index / GATE_PATH_CACHE_STEPS;
    return getInterpolatedPath(progress);
  });
}

const gatePathCache = createGatePathCache();

function frameIndexForProgress(progress: number) {
  return Math.min(GATE_PATH_CACHE_STEPS, Math.max(0, Math.round(progress * GATE_PATH_CACHE_STEPS)));
}

export function WorkbenchGateOverlay() {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) {
      if (pathRef.current) {
        pathRef.current.setAttribute("d", gatePathCache[GATE_PATH_CACHE_STEPS]!);
      }
      return undefined;
    }

    let lastProgress = -1;

    const update = () => {
      const scrollProgressRef = (window as any).__scrollProgressRef;
      const progress = scrollProgressRef ? scrollProgressRef.current : 0;
      if (progress === lastProgress) {
        return;
      }
      lastProgress = progress;

      const morphProgress = progressBetween(progress, LETTER_STORM[1], WORKBENCH_GATE[0]);
      const frameIndex = frameIndexForProgress(morphProgress);

      if (pathRef.current) {
        pathRef.current.setAttribute("d", gatePathCache[frameIndex]!);
      }
    };

    update();
    const runtime = getLandingMotionRuntime();
    const unsubscribe = runtime.subscribe(update);

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="workbench-gate" aria-label="Formula Lab Workbench entry">
      <div className="workbench-gate-aura" aria-hidden="true" />
      <div className="workbench-gate-shell">
        <svg className="gate-morph-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path ref={pathRef} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="gate-scan-line" aria-hidden="true" />
        <div className="workbench-gate-bootlog" aria-hidden="true">
          <span>&gt; sys_init.sh ... [OK]</span>
          <span>&gt; latex_core_init ... [OK]</span>
          <span>&gt; collab_channel_sync ... [READY]</span>
        </div>
        <span className="workbench-gate-kicker">Formula Lab is ready</span>
        <p className="workbench-gate-copy">Turn rough formulas into a working paper space.</p>
        <a className="button primary workbench-gate-cta" href="/workbench/">
          Enter Workbench
        </a>
      </div>
    </div>
  );
}
