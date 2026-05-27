import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const files = {
  manuscript: "frontend/formulas/landing/components/ManuscriptCanvas.tsx",
  shader: "frontend/formulas/landing/three/ManuscriptShaderMaterial.ts",
  timeline: "frontend/formulas/landing/storyTimeline.ts",
  curtain: "frontend/formulas/landing/components/MorphCurtain.tsx",
  choreography: "frontend/formulas/landing/storyChoreography.ts",
  hero: "frontend/formulas/landing/components/Hero.tsx",
  styleVars: "frontend/formulas/landing/performance/styleVars.ts",
  raf: "frontend/formulas/landing/performance/raf.ts",
  motionRuntime: "frontend/formulas/landing/performance/motionRuntime.ts",
  director: "frontend/formulas/landing/components/ScrollDirector.tsx",
  decode: "frontend/formulas/landing/components/DecodeChamberOverlay.tsx",
  workspaceGhost: "frontend/formulas/landing/components/PaperWorkspaceGhost.tsx",
  collab: "frontend/formulas/landing/components/CollaborationSignalField.tsx",
  storyStage: "frontend/formulas/landing/components/StoryStage.tsx",
  vortex: "frontend/formulas/landing/components/FormulaVortex.tsx",
  gate: "frontend/formulas/landing/components/WorkbenchGateOverlay.tsx",
  curtainCopy: "frontend/formulas/landing/components/CurtainCopyStage.tsx",
};

for (const [name, file] of Object.entries(files)) {
  assert.ok(existsSync(file), `${name} performance module should exist at ${file}`);
}

const manuscriptSource = read(files.manuscript);
const shaderSource = read(files.shader);
const timelineSource = read(files.timeline);
const curtainSource = read(files.curtain);
const choreographySource = read(files.choreography);
const heroSource = read(files.hero);
const styleVarsSource = read(files.styleVars);
const rafSource = read(files.raf);
const motionRuntimeSource = read(files.motionRuntime);
const directorSource = read(files.director);
const decodeSource = read(files.decode);
const workspaceGhostSource = read(files.workspaceGhost);
const collabSource = read(files.collab);
const storyStageSource = read(files.storyStage);
const vortexSource = read(files.vortex);
const gateSource = read(files.gate);
const curtainCopySource = read(files.curtainCopy);

assert.doesNotMatch(
  manuscriptSource,
  /setZ\(|computeVertexNormals\(/,
  "Paper wave deformation should run in the vertex shader, not mutate geometry on the CPU every frame.",
);
assert.match(
  shaderSource,
  /uniform float uWaveAmount;[\s\S]*uniform float uWaveProgress;/,
  "The manuscript shader should expose wave uniforms so scroll keeps the same visual choreography on the GPU.",
);
assert.match(
  shaderSource,
  /vec3 transformed = position;[\s\S]*transformed\.z \+= wave/,
  "The manuscript vertex shader should apply the paper wave before projection.",
);
assert.match(
  manuscriptSource,
  /uniforms\.uWaveAmount\.value[\s\S]*uniforms\.uWaveProgress\.value/,
  "ManuscriptCanvas should only update shader uniforms for the paper wave.",
);
assert.match(
  manuscriptSource,
  /getLandingMotionRuntime[\s\S]*timeMs - lastInvalidateTimeMs >= 33[\s\S]*progressDelta > 0\.00025/,
  "ManuscriptCanvas should use the shared runtime and throttle idle WebGL invalidation.",
);
assert.doesNotMatch(
  manuscriptSource,
  /requestAnimationFrame\(tick\)|cancelAnimationFrame\(raf\)/,
  "ManuscriptCanvas should not own a private always-on frame pump.",
);
assert.doesNotMatch(
  manuscriptSource,
  /FormulaStarfield|STARFIELD_|createFormulaStarfieldMaterial|aBasePosition|aTargetPosition|aSeed/,
  "Landing manuscript canvas should retire the formula starfield entirely so the paper remains the only WebGL subject.",
);
assert.ok(
  !existsSync("frontend/formulas/landing/three/FormulaStarfieldMaterial.ts"),
  "Retired starfield shader module should not remain in the landing bundle.",
);
assert.doesNotMatch(
  manuscriptSource,
  /positionAttribute\.needsUpdate|const positions = positionAttribute\.array|for \(let index = 0; index < positions\.length/,
  "Formula starfield should not mutate and upload point positions on the CPU every frame.",
);

assert.match(
  timelineSource,
  /createStyleVarWriter/,
  "Story timeline should use a cached CSS variable writer for high-frequency scroll updates.",
);
assert.doesNotMatch(
  timelineSource,
  /storyElement\.style\.setProperty/,
  "Story timeline should not write raw CSS variables directly on every ScrollTrigger update.",
);
assert.match(
  styleVarsSource,
  /lastValues[\s\S]*setProperty/,
  "The CSS variable writer should skip unchanged values before touching element.style.",
);

assert.match(
  heroSource,
  /createRafThrottledPointerWriter/,
  "Hero pointer parallax should be rAF-throttled instead of writing CSS variables on every mouse event.",
);
assert.match(
  rafSource,
  /requestAnimationFrame[\s\S]*cancelAnimationFrame/,
  "The shared rAF helper should own scheduling and cleanup for pointer-driven style writes.",
);
assert.match(
  motionRuntimeSource,
  /type MotionRuntimeFrame[\s\S]*timeMs[\s\S]*deltaMs[\s\S]*estimatedHz/,
  "Landing motion runtime should expose refresh-rate adaptive frame timing instead of hard-coded frame rates.",
);
assert.match(
  motionRuntimeSource,
  /requestAnimationFrame\(tick\)[\s\S]*cancelAnimationFrame\(frameId\)/,
  "Landing motion runtime should own its animation-frame lifecycle.",
);
assert.match(
  motionRuntimeSource,
  /document\.hidden[\s\S]*document\.addEventListener\("visibilitychange", handleVisibilityChange\)/,
  "Landing motion runtime should pause work while the tab is hidden.",
);
assert.match(
  motionRuntimeSource,
  /__formulaLabMotionDebug[\s\S]*isMotionDebugEnabled/,
  "Landing motion runtime should provide an opt-in debug snapshot for frame cadence inspection.",
);
assert.match(
  directorSource,
  /getLandingMotionRuntime[\s\S]*runtime\.subscribe\(\(\{ timeMs \}\) => \{[\s\S]*lenis\.raf\(timeMs\)/,
  "ScrollDirector should drive Lenis from the shared landing motion runtime.",
);
for (const [name, source] of [
  ["DecodeChamberOverlay", decodeSource],
  ["PaperWorkspaceGhost", workspaceGhostSource],
  ["CollaborationSignalField", collabSource],
  ["StoryTetherCanvas", storyStageSource],
  ["FormulaVortex", vortexSource],
  ["WorkbenchGateOverlay", gateSource],
  ["CurtainCopyStage", curtainCopySource],
]) {
  assert.match(
    source,
    /getLandingMotionRuntime[\s\S]*runtime\.subscribe/,
    `${name} should subscribe to the shared landing motion runtime instead of creating a private animation loop.`,
  );
  assert.doesNotMatch(
    source,
    /requestAnimationFrame\(update\)|cancelAnimationFrame\(rafId\)/,
    `${name} should not own a private requestAnimationFrame loop after runtime migration.`,
  );
}
assert.match(
  gateSource,
  /const FOOTER_PATH_CACHE_STEPS = 120;[\s\S]*function createFooterPathCache[\s\S]*footerPathForProgress/,
  "WorkbenchGateOverlay should cache footer path frames instead of interpolating SVG path strings during runtime.",
);
assert.match(
  gateSource,
  /const footerPathCache = createFooterPathCache\(\);[\s\S]*return footerPathCache\[frameIndex\]!/,
  "WorkbenchGateOverlay should apply cached footer path frames from scroll progress.",
);
assert.doesNotMatch(
  gateSource,
  /function footerPathForProgress[\s\S]*return createFooterPath\(waveY\)/,
  "WorkbenchGateOverlay should not build SVG path strings inside its runtime update path.",
);

assert.match(
  curtainSource,
  /const PATH_CACHE_STEPS = 240;/,
  "MorphCurtain should quantize liquid motion into a dense cache instead of rebuilding SVG paths at runtime.",
);
assert.match(
  curtainSource,
  /getLandingMotionRuntime[\s\S]*createScrollFrameGate[\s\S]*runtime\.subscribe\(\(frame\) => \{[\s\S]*frameGate\.shouldUpdate\(frame\)[\s\S]*update\(frame\.progress\)/,
  "MorphCurtain should subscribe to the shared refresh-rate adaptive motion runtime and skip unchanged scroll frames.",
);
assert.doesNotMatch(
  curtainSource,
  /MORPH_FRAME_INTERVAL_MS|requestAnimationFrame\(update\)|cancelAnimationFrame\(raf\)/,
  "MorphCurtain should not cap cached liquid path updates with a private 60fps requestAnimationFrame loop.",
);
assert.match(
  vortexSource,
  /function createFormulaTextureAtlas[\s\S]*fillText[\s\S]*return textures/,
  "FormulaVortex should pre-render formula text into a texture atlas outside the hot draw loop.",
);
assert.match(
  vortexSource,
  /const textures = createFormulaTextureAtlas\(\);[\s\S]*ctx\.drawImage/,
  "FormulaVortex should draw cached formula textures during animation frames.",
);
assert.doesNotMatch(
  vortexSource,
  /const draw = \(\) => \{[\s\S]*ctx\.fillText/,
  "FormulaVortex draw loop should not call Canvas text rendering on every animation frame.",
);
assert.match(
  vortexSource,
  /gsap\.timeline\(\{ onUpdate: draw, paused: true \}\)[\s\S]*targetOpacity > 0\.01[\s\S]*timelineRef\.current\.resume\(\)[\s\S]*timelineRef\.current\.pause\(\)/,
  "FormulaVortex should pause its repeating GSAP timeline when the vortex is not visible.",
);
assert.doesNotMatch(
  heroSource,
  /HeroCornerTicker/,
  "The first-screen lower-right readout should remain static after reverting the looping ticker.",
);
assert.match(
  gateSource,
  /timeline\(\{ paused: true, repeat: -1 \}\)[\s\S]*tickerTimeline\?\.play\(\)[\s\S]*tickerTimeline\?\.pause\(0\)/,
  "WorkbenchGateOverlay should only run its infinite gate ticker while the final gate is active.",
);
assert.match(
  curtainSource,
  /function createLiquidPathCache[\s\S]*timeline\.progress\(sampleProgress, true\)[\s\S]*frames\.push/,
  "MorphCurtain should precompute liquid path frames from the GSAP interpolation timeline.",
);
assert.match(
  curtainSource,
  /function applyCachedPaths[\s\S]*setAttribute\("d", cachedPaths\[pathIndex\]!\)/,
  "MorphCurtain should only write cached path strings into the live SVG.",
);
assert.doesNotMatch(
  curtainSource,
  /onUpdate:\s*render/,
  "MorphCurtain should not rebuild SVG path strings from a GSAP onUpdate callback during scroll.",
);
assert.doesNotMatch(
  curtainSource,
  /greenTimelineRef\.current\?\.progress|blackTimelineRef\.current\?\.progress/,
  "MorphCurtain runtime should not advance GSAP timelines per frame after path-cache creation.",
);
assert.match(
  choreographySource,
  /export const GREEN_COPY = \[0\.650,\s*0\.835\] as const;/,
  "Green SplitText should have a wider scroll chapter so each message can breathe.",
);
assert.match(
  choreographySource,
  /GREEN_COPY_BLOCK_RANGES[\s\S]*\[0\.665,\s*0\.705\][\s\S]*\[0\.728,\s*0\.768\][\s\S]*\[0\.792,\s*0\.832\]/,
  "Green SplitText should animate in three wider, well-spaced beats.",
);
