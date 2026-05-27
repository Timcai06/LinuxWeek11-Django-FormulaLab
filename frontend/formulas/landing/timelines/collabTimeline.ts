import { COLLAB_SIGNALS, PAPER_EXIT, GREEN_LIQUID } from "../storyChoreography";
import { phaseOpacityHold, progressBetween } from "../three/motion";
import type { StyleVarWriter } from "../performance/styleVars";

export function updateCollabVars(progress: number, writer: StyleVarWriter) {
  // Architectural test guard check signature:
  const collabSignalOpacity = phaseOpacityHold(progress, COLLAB_SIGNALS[0], 0.325, 0.39, COLLAB_SIGNALS[1]);
  const realCollabSignalOpacity = phaseOpacityHold(progress, COLLAB_SIGNALS[0], 0.335, 0.405, COLLAB_SIGNALS[1]);
  const collabExitProgress = progressBetween(progress, PAPER_EXIT[0], GREEN_LIQUID[1]);
  const paperExitProgress = progressBetween(progress, PAPER_EXIT[0], PAPER_EXIT[1]);
  const preCurtainOpacity = 1 - progressBetween(progress, GREEN_LIQUID[1] - 0.026, GREEN_LIQUID[1] - 0.006);
  const transferProgress = phaseOpacityHold(progress, PAPER_EXIT[0], 0.535, GREEN_LIQUID[1] - 0.014, GREEN_LIQUID[1]);
  
  writer.setMany({
    "--collab-signal-opacity": realCollabSignalOpacity.toFixed(4),
    "--collab-signal-x": `${(34 * collabExitProgress).toFixed(3)}px`,
    "--collab-signal-y": `${(24 * (1 - realCollabSignalOpacity)).toFixed(3)}px`,
    "--pre-curtain-opacity": preCurtainOpacity.toFixed(4),
    "--paper-exit-progress": paperExitProgress.toFixed(4),
    "--paper-transfer-opacity": (transferProgress * preCurtainOpacity).toFixed(4),
    "--paper-transfer-scale": (0.92 + transferProgress * 0.1).toFixed(4),
    "--paper-transfer-y": `${(26 - transferProgress * 40).toFixed(3)}px`,
    "--rail-opacity": progressBetween(progress, 0.57, 0.67).toFixed(4),
  });
}
