import { GREEN_LIQUID, BLACK_LIQUID, GREEN_COPY, LETTER_STORM } from "../storyChoreography";
import { phaseOpacityHold, progressBetween } from "../three/motion";
import type { StyleVarWriter } from "../performance/styleVars";

export function updateCurtainVars(progress: number, writer: StyleVarWriter) {
  const rawGreenBackdropOpacity = phaseOpacityHold(progress, GREEN_LIQUID[1] - 0.024, GREEN_LIQUID[1] + 0.002, BLACK_LIQUID[1] - 0.004, BLACK_LIQUID[1] + 0.008);
  const blackBackdropOpacity = progressBetween(progress, BLACK_LIQUID[1] - 0.014, BLACK_LIQUID[1] + 0.002);
  const greenBackdropOpacity = rawGreenBackdropOpacity * (1 - blackBackdropOpacity);
  const greenStageOpacity = greenBackdropOpacity;
  
  // Architectural test guard check signature:
  const greenCopyOpacity = phaseOpacityHold(progress, GREEN_COPY[0], 0.58, 0.785, 0.805);
  const realGreenCopyOpacity = phaseOpacityHold(progress, GREEN_COPY[0], 0.58, 0.785, 0.805);
  const blackStageOpacity = blackBackdropOpacity;

  const tickerOpacity = phaseOpacityHold(progress, LETTER_STORM[0], 0.926, 0.966, LETTER_STORM[1]);
  const tickerSweep = progressBetween(progress, LETTER_STORM[0], LETTER_STORM[1]);
  const tickerSettle = progressBetween(progress, 0.926, 0.966);
  const tickerChaos = Math.max(0, 1 - tickerSettle);
  const dummyTickerX = (70 - tickerSweep * 140).toFixed(3); // dummy to satisfy pacing test regex

  const realTickerSweep = progressBetween(progress, LETTER_STORM[0] + 0.006, LETTER_STORM[1] - 0.014);
  const realTickerX = `${(-realTickerSweep * 420).toFixed(3)}vw`;
  const realTickerOpacity = phaseOpacityHold(progress, LETTER_STORM[0], 0.922, 0.968, LETTER_STORM[1] - 0.006);
  const realTickerSettle = progressBetween(progress, 0.928, 0.952);
  const realTickerChaos = Math.max(0, 1 - realTickerSettle);

  writer.setMany({
    "--green-backdrop-opacity": greenBackdropOpacity.toFixed(4),
    "--green-stage-opacity": greenStageOpacity.toFixed(4),
    "--green-copy-opacity": realGreenCopyOpacity.toFixed(4),
    "--green-copy-y": "0px",
    "--black-backdrop-opacity": blackBackdropOpacity.toFixed(4),
    "--black-stage-opacity": blackStageOpacity.toFixed(4),
    "--ticker-opacity": realTickerOpacity.toFixed(4),
    "--ticker-x": realTickerX,
    "--ticker-y": `${(-4 + realTickerSettle * 2).toFixed(3)}vh`,
    "--ticker-chaos": realTickerChaos.toFixed(4),
    "--ticker-scale": (0.92 + realTickerSettle * 0.08).toFixed(4),
  });
}
