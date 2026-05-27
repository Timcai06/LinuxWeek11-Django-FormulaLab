import gsap from "gsap";

import {
  BLACK_LIQUID,
  COLLAB_SIGNALS,
  DECODE_CHAMBER,
  DIRECTIONAL_SNAP_RADIUS,
  FREE_SCROLL_RANGES,
  REAL_FREE_SCROLL_RANGES,
  GREEN_COPY,
  GREEN_COPY_FREE_SCROLL_RANGES,
  GREEN_LIQUID,
  LETTER_STORM,
  PAPER_CENTER,
  PAPER_EXIT,
  SCAN_REVEAL,
  SOFT_SNAP_RADIUS,
  STORY_SNAP_POINTS,
  REAL_STORY_SNAP_POINTS,
  WORKBENCH_GATE,
  WORKSPACE_GHOST,
} from "./storyChoreography";
import type { LandingPhase } from "./types";
import { createStyleVarWriter, type StyleVarWriter } from "./performance/styleVars";
import { phaseOpacity, phaseOpacityHold, progressBetween } from "./three/motion";

import { updateIntroVars } from "./timelines/introTimeline";
import { updateCollabVars } from "./timelines/collabTimeline";
import { updateCurtainVars } from "./timelines/curtainTimeline";
import { updateCtaVars } from "./timelines/ctaTimeline";

const storyVarWriters = new WeakMap<HTMLElement, StyleVarWriter>();

function getStoryVarWriter(storyElement: HTMLElement) {
  let writer = storyVarWriters.get(storyElement);
  if (!writer) {
    writer = createStyleVarWriter(storyElement);
    storyVarWriters.set(storyElement, writer);
  }
  return writer;
}

function preStageStateForProgress(progress: number) {
  if (progress >= GREEN_LIQUID[1] - 0.006) {
    return "retired";
  }
  if (progress >= GREEN_LIQUID[0]) {
    return "retiring";
  }
  return "active";
}

function directionalSnapToStoryBeat(value: number, direction: number) {
  if (!direction) {
    return null;
  }

  const beats = direction > 0 ? REAL_STORY_SNAP_POINTS : [...REAL_STORY_SNAP_POINTS].reverse();
  const directionalTarget = beats.find((beat) => direction > 0 ? beat > value : beat < value);
  if (typeof directionalTarget === "number" && Math.abs(directionalTarget - value) <= DIRECTIONAL_SNAP_RADIUS) {
    return directionalTarget;
  }
  return null;
}

export function snapToStoryBeat(value: number, trigger?: { direction?: number }) {
  if (REAL_FREE_SCROLL_RANGES.some(([start, end]) => value > start && value < end)) {
    return value;
  }
  if (GREEN_COPY_FREE_SCROLL_RANGES.some(([start, end]) => value > start && value < end)) {
    return value;
  }

  const directionalTarget = directionalSnapToStoryBeat(value, trigger?.direction ?? 0);
  if (directionalTarget !== null) {
    return directionalTarget;
  }

  const nearest = gsap.utils.snap(REAL_STORY_SNAP_POINTS, value);
  if (Math.abs(nearest - value) <= SOFT_SNAP_RADIUS) {
    return nearest;
  }
  return value;
}

export function setStoryVars(storyElement: HTMLElement, phase: LandingPhase, progress: number) {
  const writer = getStoryVarWriter(storyElement);

  // Phase delegates
  updateIntroVars(progress, writer);
  updateCollabVars(progress, writer);
  updateCurtainVars(progress, writer);
  updateCtaVars(progress, writer);

  // Global shared vars
  const preCurtainOpacity = 1 - progressBetween(progress, GREEN_LIQUID[1] - 0.026, GREEN_LIQUID[1] - 0.006);
  writer.setMany({
    "--story-progress": progress.toFixed(4),
    "--pre-stage-opacity": preCurtainOpacity.toFixed(4),
  });
  if (storyElement.dataset.storyPhase !== phase) {
    storyElement.dataset.storyPhase = phase;
  }
  const preStageState = preStageStateForProgress(progress);
  if (storyElement.dataset.preStage !== preStageState) {
    storyElement.dataset.preStage = preStageState;
  }
}

export function phaseForProgress(progress: number): LandingPhase {
  if (progress >= WORKBENCH_GATE[0]) {
    return "cta";
  }
  if (progress >= LETTER_STORM[0]) {
    return "letterStorm";
  }
  if (progress >= BLACK_LIQUID[0]) {
    return "blackCurtain";
  }
  if (progress >= GREEN_COPY[0]) {
    return "greenCopy";
  }
  if (progress >= GREEN_LIQUID[0]) {
    return "greenCurtain";
  }
  if (progress >= PAPER_EXIT[0]) {
    return "paperExit";
  }
  if (progress >= COLLAB_SIGNALS[0]) {
    return "collab";
  }
  if (progress >= WORKSPACE_GHOST[0]) {
    return "workspace";
  }
  if (progress >= SCAN_REVEAL[0]) {
    return "decode";
  }
  if (progress >= PAPER_CENTER[1] - 0.008) {
    return "center";
  }
  if (progress >= PAPER_CENTER[0]) {
    return "absorb";
  }
  return "intro";
}
