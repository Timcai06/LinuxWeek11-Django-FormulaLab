import { readFileSync } from "node:fs";

export function readLandingStoryComposition() {
  return [
    "frontend/formulas/landing/components/LandingScrollStory.tsx",
    "frontend/formulas/landing/components/StoryStage.tsx",
    "frontend/formulas/landing/components/StoryRail.tsx",
  ]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
}
