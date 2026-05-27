import { WORKBENCH_GATE, PAPER_EXIT, GREEN_LIQUID } from "../storyChoreography";
import { progressBetween } from "../three/motion";
import type { StyleVarWriter } from "../performance/styleVars";

export function updateCtaVars(progress: number, writer: StyleVarWriter) {
  const gateProgress = progressBetween(progress, WORKBENCH_GATE[0], WORKBENCH_GATE[1]);
  const gateAuraOpacity = gateProgress * 0.24;
  const ctaOpacity = progressBetween(progress, WORKBENCH_GATE[0], WORKBENCH_GATE[1]);
  
  const paperExitProgress = progressBetween(progress, PAPER_EXIT[0], PAPER_EXIT[1]);
  const preCurtainOpacity = 1 - progressBetween(progress, GREEN_LIQUID[1] - 0.026, GREEN_LIQUID[1] - 0.006);
  const manuscriptFinalOpacity = (1 - paperExitProgress * 0.72) * preCurtainOpacity;

  writer.setMany({
    "--gate-opacity": gateProgress.toFixed(4),
    "--gate-y": `${(34 * (1 - gateProgress)).toFixed(3)}px`,
    "--gate-scale": (0.985 + gateProgress * 0.015).toFixed(4),
    "--gate-aura-opacity": gateAuraOpacity.toFixed(4),
    "--manuscript-final-opacity": manuscriptFinalOpacity.toFixed(4),
    "--cta-opacity": ctaOpacity.toFixed(4),
    "--cta-y": `${(18 * (1 - ctaOpacity)).toFixed(3)}px`,
  });
}
