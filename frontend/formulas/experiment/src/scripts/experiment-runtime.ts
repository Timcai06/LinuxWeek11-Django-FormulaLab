import { createExperimentRuntime } from "./runtime/experiment-runtime";

const root = document.querySelector<HTMLElement>("[data-experiment-root]");
const story = document.querySelector<HTMLElement>("[data-experiment-story]");
const canvas = document.querySelector<HTMLCanvasElement>("[data-experiment-canvas]");

if (!root || !story || !canvas) {
  throw new Error("Formula Lab experiment root is incomplete.");
}

createExperimentRuntime(root, story, canvas);
