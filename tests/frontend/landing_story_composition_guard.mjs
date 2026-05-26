import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const storyShell = readFileSync("frontend/formulas/landing/components/LandingScrollStory.tsx", "utf8");
const storyStage = readFileSync("frontend/formulas/landing/components/StoryStage.tsx", "utf8");
const tailSequence = readFileSync("frontend/formulas/landing/components/LandingTailSequence.tsx", "utf8");
const storyRail = readFileSync("frontend/formulas/landing/components/StoryRail.tsx", "utf8");

assert.match(storyShell, /<ScrollDirector scrollProgressRef=\{scrollProgressRef\}>/, "LandingScrollStory should remain the scroll shell.");
assert.match(storyShell, /<StoryStage scrollProgressRef=\{scrollProgressRef\} \/>/, "LandingScrollStory should delegate scene layers to StoryStage.");
assert.doesNotMatch(storyShell, /FormulaConstellationField|ManuscriptCanvas|MorphCurtain/, "LandingScrollStory should not own concrete visual layers.");
assert.match(storyRail, /className="story-rail" aria-hidden="true"/, "StoryRail should preserve the rail DOM contract.");

const layerOrder = [
  "<FormulaConstellationField />",
  "<FormulaVortex scrollProgressRef={scrollProgressRef} />",
  "<ManuscriptCanvas scrollProgressRef={scrollProgressRef} />",
  "<Hero />",
  '<div className="manuscript-scan-beam" aria-hidden="true" />',
  "<DecodeChamberOverlay />",
  "<PaperWorkspaceGhost />",
  "<CollaborationSignalField />",
  "<LandingTailSequence scrollProgressRef={scrollProgressRef} />",
  "<StoryRail />",
];

let previousIndex = -1;
for (const layer of layerOrder) {
  const index = storyStage.indexOf(layer);
  assert.notEqual(index, -1, `StoryStage should render ${layer}.`);
  assert.ok(index > previousIndex, `StoryStage should preserve layer order for ${layer}.`);
  previousIndex = index;
}

const tailOrder = [
  "<CurtainCopyStage scrollProgressRef={scrollProgressRef} />",
  "<HorizontalTicker scrollProgressRef={scrollProgressRef} />",
  "<WorkbenchGateOverlay />",
  "<MorphCurtain scrollProgressRef={scrollProgressRef} />",
];

previousIndex = -1;
for (const layer of tailOrder) {
  const index = tailSequence.indexOf(layer);
  assert.notEqual(index, -1, `LandingTailSequence should render ${layer}.`);
  assert.ok(index > previousIndex, `LandingTailSequence should preserve layer order for ${layer}.`);
  previousIndex = index;
}
