import { PAPER_CENTER, SCAN_REVEAL, DECODE_CHAMBER, WORKSPACE_GHOST } from "../storyChoreography";
import { phaseOpacity, phaseOpacityHold, progressBetween } from "../three/motion";
import type { StyleVarWriter } from "../performance/styleVars";

export function updateIntroVars(progress: number, writer: StyleVarWriter) {
  const centerProgress = progressBetween(progress, PAPER_CENTER[0], PAPER_CENTER[1]);
  const heroExitProgress = progressBetween(progress, PAPER_CENTER[0], PAPER_CENTER[1]);
  const heroOpacity = Math.max(1 - heroExitProgress * 1.28, 0);
  const shutdownOpacity = Math.max(1 - heroExitProgress * 1.45, 0);
  const cosmosOpacity = Math.max(1 - heroExitProgress * 1.18, 0);

  const scanOpacity = phaseOpacity(progress, SCAN_REVEAL[0], 0.105, SCAN_REVEAL[1]);
  const decodeChamberOpacity = phaseOpacityHold(progress, DECODE_CHAMBER[0], 0.11, 0.175, DECODE_CHAMBER[1]);
  const workspaceGhostOpacity = phaseOpacityHold(progress, WORKSPACE_GHOST[0], 0.22, 0.285, WORKSPACE_GHOST[1]);

  let galleryX = 0;
  if (progress <= 0.165) {
    galleryX = 0;
  } else if (progress <= 0.285) {
    const t = (progress - 0.165) / (0.285 - 0.165);
    const easedT = t * t * (3 - 2 * t);
    galleryX = -easedT * 100;
  } else if (progress <= 0.405) {
    const t = (progress - 0.285) / (0.405 - 0.285);
    const easedT = t * t * (3 - 2 * t);
    galleryX = -100 - easedT * 100;
  } else {
    galleryX = -200;
  }

  writer.setMany({
    "--gallery-x": `${galleryX.toFixed(3)}vw`,
    "--hero-opacity": heroOpacity.toFixed(4),
    "--hero-y": `${(-42 * centerProgress).toFixed(3)}px`,
    "--text-disperse": `${(54 * centerProgress).toFixed(3)}px`,
    "--copy-x": `${(-17.28 * centerProgress).toFixed(3)}px`,
    "--kicker-x": `${(-11.88 * centerProgress).toFixed(3)}px`,
    "--actions-x": `${(-27 * centerProgress).toFixed(3)}px`,
    "--text-scale": (1 + centerProgress * 0.026).toFixed(4),
    "--shutdown-opacity": shutdownOpacity.toFixed(4),
    "--readout-x": `${(42 * centerProgress).toFixed(3)}px`,
    "--cosmos-opacity": cosmosOpacity.toFixed(4),
    "--stardust-opacity": (cosmosOpacity * 0.32).toFixed(4),
    "--scanline-opacity": (0.2 + cosmosOpacity * 0.16).toFixed(4),
    "--scan-opacity": scanOpacity.toFixed(4),
    "--decode-opacity": decodeChamberOpacity.toFixed(4),
    "--decode-chamber-opacity": decodeChamberOpacity.toFixed(4),
    "--decode-chamber-y": `${(26 * (1 - decodeChamberOpacity)).toFixed(3)}px`,
    "--workspace-ghost-opacity": workspaceGhostOpacity.toFixed(4),
    "--workspace-ghost-y": `${(30 * (1 - workspaceGhostOpacity)).toFixed(3)}px`,
    "--scan-x": `${(-22 * progress).toFixed(3)}vw`,
    "--scan-y": `${(16 * progress).toFixed(3)}vh`,
  });
}
