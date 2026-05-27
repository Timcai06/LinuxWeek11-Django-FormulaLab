import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readLandingStoryComposition } from "./helpers/landing_story.mjs";
import { readLandingStyles } from "./helpers/landing_styles.mjs";

const appSource = readFileSync("frontend/formulas/landing/LandingApp.tsx", "utf8");
const storySource = readLandingStoryComposition();
const directorComponentSource = readFileSync("frontend/formulas/landing/components/ScrollDirector.tsx", "utf8");
const timelineSource = readFileSync("frontend/formulas/landing/storyTimeline.ts", "utf8");
const choreographySource = readFileSync("frontend/formulas/landing/storyChoreography.ts", "utf8");
const directorSource = `${directorComponentSource}\n${timelineSource}`;
const tickerSource = readFileSync("frontend/formulas/landing/components/HorizontalTicker.tsx", "utf8");
const curtainSource = readFileSync("frontend/formulas/landing/components/MorphCurtain.tsx", "utf8");
const copyStageSource = readFileSync("frontend/formulas/landing/components/CurtainCopyStage.tsx", "utf8");
const canvasSource = readFileSync("frontend/formulas/landing/components/ManuscriptCanvas.tsx", "utf8");
const vortexSource = readFileSync("frontend/formulas/landing/components/FormulaVortex.tsx", "utf8");
const gateSource = readFileSync("frontend/formulas/landing/components/WorkbenchGateOverlay.tsx", "utf8");
const styleSource = readLandingStyles();
const blackCurtainPanelBlock = styleSource.match(/\.black-curtain-panel\s*\{[\s\S]*?\n\}/)?.[0] ?? "";

assert.doesNotMatch(
  appSource,
  /<HorizontalTicker\s*\/>/,
  "HorizontalTicker should not be appended after LandingScrollStory as an independent epilogue.",
);
assert.match(
  storySource,
  /<HorizontalTicker\s+scrollProgressRef=\{scrollProgressRef\}/,
  "HorizontalTicker should live inside the main scroll story and use the shared progress ref.",
);
assert.doesNotMatch(
  tickerSource,
  /ScrollTrigger|pin:\s*true|containerAnimation|xPercent:\s*-100/,
  "HorizontalTicker should be driven by ScrollDirector variables, not its own pinned ScrollTrigger.",
);
assert.match(
  directorSource,
  /scrub:\s*0\.86/,
  "Landing ScrollTrigger should stay damped while preserving readable keyed story beats.",
);
assert.match(
  directorSource,
  /duration:\s*0\.92/,
  "Lenis should add enough smoothing for the cinematic landing without making it feel disconnected.",
);
assert.match(
  choreographySource,
  /export const STORY_HEIGHT_VH = 3600;[\s\S]*export const GREEN_LIQUID = \[0\.455,\s*0\.545\] as const;[\s\S]*export const GREEN_COPY = \[0\.565,\s*0\.805\] as const;/,
  "The green SplitText chapter should start shortly after the SVG liquid wipe settles instead of leaving a long empty green curtain.",
);
assert.match(
  choreographySource,
  /export const FREE_SCROLL_RANGES =[\s\S]*\[0\.565,\s*0\.612\][\s\S]*\[0\.852,\s*0\.892\]/,
  "Liquid wave chapters should avoid snap capture through the middle while leaving the completed curtain beats snappable.",
);
assert.match(
  directorSource,
  /FREE_SCROLL_RANGES\.some\(\(\[start, end\]\) => value > start && value < end\)[\s\S]*return value/,
  "Story snap should let users scrub through the liquid wave itself.",
);
assert.match(
  directorSource,
  /duration:\s*\{ min: 0\.34, max: 0\.72 \}/,
  "Story snap should settle clearly enough for green and black curtain chapters to hold.",
);
assert.match(
  directorSource,
  /delay:\s*0\.05/,
  "Story snap should start shortly after wheel input without letting curtain chapters vanish.",
);
assert.match(
  directorSource,
  /getLandingMotionRuntime[\s\S]*runtime\.subscribeVisibility\(\(visible\)/,
  "ScrollDirector should delegate visibility-aware frame scheduling to the shared landing runtime.",
);
assert.match(
  directorSource,
  /if \(!visible\) \{[\s\S]*lenis\.stop\(\)/,
  "Hidden landing tabs should stop Lenis through the shared runtime visibility hook.",
);
assert.match(
  directorSource,
  /lenis\.off\("scroll", handleLenisScroll\)/,
  "ScrollDirector cleanup should remove the Lenis scroll listener.",
);
assert.match(
  choreographySource,
  /export const STORY_SNAP_POINTS = \[[\s\S]*PAPER_CENTER\[1\][\s\S]*GREEN_LIQUID\[1\][\s\S]*LETTER_STORM\[1\][\s\S]*WORKBENCH_GATE\[0\][\s\S]*1/,
  "Landing should snap through readable manuscript, green curtain, SplitText, black curtain, and CTA beats.",
);
assert.match(
  choreographySource,
  /export const REAL_STORY_SNAP_POINTS = \[[\s\S]*GREEN_LIQUID\[1\][\s\S]*\.\.\.GREEN_COPY_SNAP_POINTS/,
  "The first complete green curtain should be a snap beat before the SplitText chapters.",
);
assert.match(
  choreographySource,
  /export const SOFT_SNAP_RADIUS = 0\.032;/,
  "Late-stage keyframe snap should be soft and local rather than forcing a page-turn jump.",
);
assert.match(
  directorSource,
  /function snapToStoryBeat\(value: number,\s*trigger\?: \{ direction\?: number \}\)/,
  "ScrollDirector should route ScrollTrigger snap through a named story-beat helper.",
);
assert.match(
  directorSource,
  /Math\.abs\(nearest - value\) <= SOFT_SNAP_RADIUS/,
  "Late-stage snap should only catch the scroll when the user releases near a key beat.",
);
assert.doesNotMatch(
  directorSource,
  /if \(value >= 0\.70\) \{[\s\S]*?return value;[\s\S]*?\}/,
  "Late-stage curtain, text, letter, and CTA chapters should use soft keyframe snap instead of disabling snap entirely.",
);
assert.match(
  directorSource,
  /phaseOpacityHold\(progress,\s*LETTER_STORM\[0\],\s*0\.926,\s*0\.966,\s*LETTER_STORM\[1\]\)/,
  "The letter storm should fade in slowly, hold as its own beat, and fade before the final CTA.",
);
assert.match(
  directorSource,
  /70 - tickerSweep \* 140\)\.toFixed\(3\)/,
  "The final ticker should complete a full marquee pass before the Workbench Gate enters.",
);
assert.match(
  directorSource,
  /const tickerSweep = progressBetween\(progress,\s*LETTER_STORM\[0\],\s*LETTER_STORM\[1\]\)/,
  "The final ticker should have enough scroll distance to finish before the CTA phase.",
);
assert.match(
  directorSource,
  /const realTickerSweep = progressBetween\(progress,\s*LETTER_STORM\[0\] \+ 0\.006,\s*LETTER_STORM\[1\] - 0\.014\)/,
  "The visible final ticker should use almost the full letter-storm chapter instead of bursting through a short subrange.",
);
assert.doesNotMatch(
  directorSource,
  /LETTER_STORM\[0\] \+ 0\.042/,
  "The visible ticker should not compress the marquee into the old 0.042 scroll slice.",
);
assert.match(
  directorSource,
  /--ticker-x/,
  "ScrollDirector should expose ticker transform variables for the integrated letter wave.",
);
assert.match(
  curtainSource,
  /import \{ BLACK_LIQUID, GREEN_LIQUID \} from "\.\.\/storyChoreography"/,
  "MorphCurtain should have a first liquid transition long enough to read as a full green wipe.",
);
assert.match(
  curtainSource,
  /frame\.transitions\.greenLiquidProgress[\s\S]*frame\.transitions\.blackLiquidProgress/,
  "MorphCurtain should have runtime-orchestrated green and black liquid transitions that remain visible.",
);
assert.match(
  curtainSource,
  /const DELAY_POINTS_MAX = 0\.3;[\s\S]*const DELAY_PER_PATH = 0\.25;[\s\S]*const MORPH_DURATION = 0\.9;/,
  "MorphCurtain should preserve the layered point and path delays from the GSAP liquid overlay reference.",
);
assert.match(
  curtainSource,
  /const WAVE_SWEEP_RANGE: WaveSweepRange = \[0\.04, 0\.97\];/,
  "MorphCurtain should spend most of each transition on the actual wave sweep.",
);
assert.match(
  curtainSource,
  /function smootherStep\(value: number\)[\s\S]*6 - 15\) \+ 10/,
  "MorphCurtain should use smootherstep easing for silkier liquid motion.",
);
assert.match(
  curtainSource,
  /function liquidWaveProgress\(segmentProgress: number, waveSweepRange = WAVE_SWEEP_RANGE\)[\s\S]*progressBetween\(segmentProgress, waveSweepRange\[0\], waveSweepRange\[1\]\)/,
  "MorphCurtain should map the wave separately from the outer transition hold.",
);
assert.match(
  curtainSource,
  /function liquidOpacity\(segmentProgress: number, opacityRange = GREEN_OPACITY_RANGE\)[\s\S]*progressBetween\(segmentProgress, opacityRange\[0\], opacityRange\[1\]\)[\s\S]*progressBetween\(segmentProgress, opacityRange\[2\], opacityRange\[3\]\)/,
  "MorphCurtain opacity should have its own fade-in, wave hold, and fade-out envelope.",
);
assert.match(
  curtainSource,
  /const GREEN_PANEL_HANDOFF_RANGE = \[GREEN_LIQUID\[1\] - 0\.024,\s*GREEN_LIQUID\[1\] \+ 0\.002\] as const;[\s\S]*const BLACK_PANEL_HANDOFF_RANGE = \[BLACK_LIQUID\[1\] - 0\.014,\s*BLACK_LIQUID\[1\] \+ 0\.002\] as const;/,
  "MorphCurtain should know the completed panel handoff windows so the liquid SVG can mask raw-scroll and damped-progress timing gaps.",
);
assert.match(
  curtainSource,
  /function completedMaskOpacity\(segmentProgress: number, handoffProgress: number\)[\s\S]*COMPLETED_MASK_RANGE\[0\][\s\S]*1 - handoffProgress/,
  "MorphCurtain should keep a completed full-screen mask until the real curtain panel has fully taken over.",
);
assert.match(
  curtainSource,
  /greenPanelHandoff = smootherStep\(progressBetween\(progress,\s*GREEN_PANEL_HANDOFF_RANGE\[0\],\s*GREEN_PANEL_HANDOFF_RANGE\[1\]\)\)[\s\S]*completedMaskOpacity\(greenSegmentProgress,\s*greenPanelHandoff\)/,
  "The green liquid SVG should bridge its completed shape into the green panel handoff.",
);
assert.match(
  curtainSource,
  /blackPanelHandoff = smootherStep\(progressBetween\(progress,\s*BLACK_PANEL_HANDOFF_RANGE\[0\],\s*BLACK_PANEL_HANDOFF_RANGE\[1\]\)\)[\s\S]*completedMaskOpacity\(blackSegmentProgress,\s*blackPanelHandoff\)/,
  "The black liquid SVG should bridge its completed shape into the black panel handoff.",
);
assert.match(
  curtainSource,
  /const MORPH_PROGRESS_EPSILON = 0\.0007;[\s\S]*const PATH_CACHE_STEPS = 240;/,
  "MorphCurtain should use cached SVG path frames without a fixed 60fps runtime throttle.",
);
assert.match(
  curtainSource,
  /getLandingMotionRuntime[\s\S]*runtime\.subscribe/,
  "MorphCurtain should rely on the shared runtime for visibility-aware frame scheduling.",
);
assert.match(
  curtainSource,
  /if \(combinedOpacity <= 0\)/,
  "MorphCurtain should skip heavy path rendering outside visible liquid transitions.",
);
assert.match(
  curtainSource,
  /function createLiquidPathCache[\s\S]*gsap\.timeline\(\{[\s\S]*paused: true,[\s\S]*ease: "power2\.inOut"[\s\S]*duration: MORPH_DURATION[\s\S]*timeline\.progress\(sampleProgress, true\)/,
  "MorphCurtain should use real GSAP timelines to precompute cached liquid point interpolation.",
);
assert.match(
  curtainSource,
  /row\.push\(100\)/,
  "MorphCurtain points should start from the reference overlay baseline.",
);
assert.match(
  curtainSource,
  /timeline\.to\(row, \{ \[pointIndex\]: 0 \}, pointDelay \+ pathDelay\)/,
  "MorphCurtain should tween each SVG control point through the GSAP timeline.",
);
assert.match(
  curtainSource,
  /isOpened \? `M 0 0 V \$\{points\[0\]\} C` : `M 0 \$\{points\[0\]\} C`[\s\S]*isOpened \? " V 100 H 0" : " V 0 H 0"/,
  "MorphCurtain should use the reference overlay's opened and closed path formulas.",
);
assert.match(
  curtainSource,
  /greenPathFrame = frameIndexForProgress\(greenWaveProgress\)[\s\S]*blackPathFrame = frameIndexForProgress\(blackWaveProgress\)[\s\S]*applyCachedPaths\(greenPaths, greenPathCache\.frames\[greenPathFrame\]!\)[\s\S]*applyCachedPaths\(blackPaths, blackPathCache\.frames\[blackPathFrame\]!\)/,
  "MorphCurtain should drive cached SVG path frames from scroll progress instead of advancing GSAP timelines at runtime.",
);
assert.doesNotMatch(
  curtainSource,
  /Math\.min\(1,\s*curtainProgress\s*\*\s*8\)/,
  "MorphCurtain opacity should not slam to full opacity immediately.",
);
assert.match(
  styleSource,
  /\.ht-section[\s\S]*?position:\s*absolute/,
  "Ticker should be a story overlay layer, not a separate full-page scroll section.",
);
assert.match(
  styleSource,
  /\.ht-section[\s\S]*?z-index:\s*16;[\s\S]*?\.morph-curtain[\s\S]*?z-index:\s*15;/,
  "The letter-storm ticker should render above any settling black liquid curtain.",
);
assert.match(
  styleSource,
  /\.story-gallery-strip[\s\S]*?opacity:\s*var\(--pre-curtain-opacity\)/,
  "The previous gallery and workspace diagnostics should remain visible until the SVG liquid curtain is ready to take over.",
);
assert.match(
  styleSource,
  /\.green-curtain-panel[\s\S]*?opacity:\s*var\(--green-backdrop-opacity, var\(--green-stage-opacity\)\)/,
  "The green curtain should use a dedicated completed-backdrop opacity after the SVG liquid wipe.",
);
assert.match(
  styleSource,
  /\.black-curtain-panel[\s\S]*?opacity:\s*var\(--black-backdrop-opacity, var\(--black-stage-opacity\)\)/,
  "The black curtain should use a dedicated completed-backdrop opacity after the black SVG liquid wipe.",
);
assert.doesNotMatch(
  blackCurtainPanelBlock,
  /rgba\(92,\s*255,\s*176/,
  "The black curtain panel should not carry the green accent tint that creates a visible film during handoff.",
);
assert.doesNotMatch(
  blackCurtainPanelBlock,
  /rgba\(5,\s*10,\s*8,\s*0\.98\)/,
  "The black curtain panel base should be fully opaque so the completed green panel cannot bleed through.",
);
assert.match(
  tickerSource,
  /PAPER WORKSPACE[\s\S]*REVIEW INBOX[\s\S]*COLLABORATION MEMORY/,
  "The final ticker should reinforce the product story instead of generic sci-fi copy.",
);
assert.match(
  styleSource,
  /\.ht-text[\s\S]*?padding-left:\s*100vw/,
  "Letter chapter text should begin offscreen like the GSAP horizontal SplitText reference.",
);
assert.match(
  tickerSource,
  /SplitText\.create[\s\S]*type:\s*"chars, words"/,
  "The final ticker should use GSAP SplitText chars and words rather than hand-written spans.",
);
assert.match(
  tickerSource,
  /const TICKER_REVEAL_RANGE = \[LETTER_STORM\[0\] \+ 0\.006,\s*LETTER_STORM\[1\] - 0\.014\] as const;[\s\S]*progressBetween\(frame\.progress,\s*TICKER_REVEAL_RANGE\[0\],\s*TICKER_REVEAL_RANGE\[1\]\)/,
  "The final ticker SplitText reveal should scrub across a readable letter-storm chapter with room for the gate handoff.",
);
assert.match(
  tickerSource,
  /const TICKER_CENTER_RANGE = \[0\.928,\s*0\.952\] as const;[\s\S]*--ticker-center-settle/,
  "The final ticker should have a designed center-settle moment rather than a plain marquee pass.",
);
assert.match(
  tickerSource,
  /textElement\.scrollWidth \+ window\.innerWidth \* 1\.15[\s\S]*--ticker-measured-x/,
  "The final ticker should measure its rendered width so the whole phrase can pass before the gate.",
);
assert.match(
  styleSource,
  /\.workbench-gate[\s\S]*?z-index:\s*18/,
  "The final Workbench Gate should sit above the liquid transition layer.",
);
assert.match(
  gateSource,
  /const FOOTER_PATH_CACHE_STEPS = 120;/,
  "The final Workbench Gate should cache enough footer frames for smooth liquid motion without per-frame path reconstruction.",
);
assert.match(
  gateSource,
  /tickerTimeline = gsap[\s\S]*repeat:\s*-1[\s\S]*xPercent:\s*-50/,
  "The lower-right gate ticker should loop continuously after its SplitText reveal.",
);
assert.match(
  gateSource,
  /tickerReveal = gsap\.from\(splitTicker\.chars[\s\S]*yPercent:\s*"random\(-180, 180\)"/,
  "The lower-right ticker should use character-level SplitText motion inspired by the horizontal text reference.",
);
assert.match(
  gateSource,
  /footerPathForProgress\(footerProgress, velocity\)/,
  "The final liquid footer should react to scroll velocity with a bouncy path state.",
);
assert.match(
  gateSource,
  /const gateProgress = progressBetween\(progress,\s*WORKBENCH_GATE\[0\] \+ 0\.0015,\s*WORKBENCH_GATE\[1\]\)/,
  "The Workbench Gate should wait until the ticker has fully faded out.",
);
assert.match(
  directorSource,
  /const manuscriptFinalOpacity = \(1 - paperExitProgress \* 0\.72\) \* preCurtainOpacity/,
  "The manuscript canvas should exit with the pre-curtain mask so it cannot show through the completed green curtain.",
);
assert.match(
  styleSource,
  /\.landing-story[\s\S]*?min-height:\s*3600vh/,
  "The cinematic landing story should use a shorter physical scroll distance after the pre-curtain pacing revision.",
);
assert.match(
  choreographySource,
  /GREEN_COPY_BLOCK_RANGES[\s\S]*\[0\.585,\s*0\.630\][\s\S]*\[0\.655,\s*0\.700\][\s\S]*\[0\.725,\s*0\.775\]/,
  "Green curtain copy should animate soon after the liquid wipe while preserving three separated beats.",
);
assert.match(
  choreographySource,
  /GREEN_COPY_VISIBILITY_RANGES[\s\S]*\[0\.565,\s*0\.580,\s*0\.637,\s*0\.648\][\s\S]*\[0\.646,\s*0\.660,\s*0\.707,\s*0\.719\][\s\S]*\[0\.716,\s*0\.730,\s*0\.785,\s*0\.805\]/,
  "Green curtain copy fade windows should remove the long post-SVG gap while keeping one message visible at a time.",
);
assert.match(
  copyStageSource,
  /getLandingMotionRuntime[\s\S]*runtime\.subscribe/,
  "Green curtain SplitText should use the shared landing runtime so it can match high-refresh displays.",
);
assert.match(
  copyStageSource,
  /const COPY_PROGRESS_EPSILON = 0\.00005;/,
  "Green curtain SplitText should use a tiny progress epsilon so slow high-refresh scrolling stays smooth.",
);
assert.match(
  copyStageSource,
  /const DWELL_TRANSLATE_PX = 12;[\s\S]*const COPY_SETTLE_SCALE = 0\.018;/,
  "Green curtain SplitText should use restrained translation and scale settle values.",
);
assert.doesNotMatch(
  copyStageSource,
  /COPY_FRAME_INTERVAL_MS|requestAnimationFrame\(update\)|cancelAnimationFrame\(raf\)/,
  "Green curtain SplitText should not be capped by its own fixed-frame rAF loop.",
);
assert.match(
  canvasSource,
  /const MAX_DPR: \[number, number\] = \[0\.75, 1\.15\]/,
  "Landing WebGL should cap DPR to reduce GPU load.",
);
assert.match(
  canvasSource,
  /frameloop="demand"[\s\S]*powerPreference: "low-power"/,
  "Landing WebGL should render on demand with a low-power context preference.",
);
assert.match(
  canvasSource,
  /function LandingFramePump\(\{ scrollProgressRef = IDLE_SCROLL_PROGRESS \}: ManuscriptCanvasProps\)[\s\S]*getLandingMotionRuntime[\s\S]*timeMs - lastInvalidateTimeMs >= 33[\s\S]*progressDelta > 0\.00025[\s\S]*invalidate\(\)/,
  "Landing WebGL should invalidate through the shared runtime and throttle idle paper frames.",
);
assert.match(
  vortexSource,
  /const VORTEX_FRAME_INTERVAL_MS = 33;[\s\S]*const VORTEX_PROGRESS_EPSILON = 0\.001;/,
  "Formula vortex should throttle rAF work.",
);
assert.match(
  vortexSource,
  /document\.hidden[\s\S]*tl\.pause\(\)[\s\S]*targetOpacity > 0\.01[\s\S]*timelineRef\.current\.resume\(\)[\s\S]*timelineRef\.current\.pause\(\)/,
  "Formula vortex timeline should pause while hidden or outside its visible chapter.",
);
assert.match(
  copyStageSource,
  /import \{ SplitText \} from "gsap\/SplitText"/,
  "Green curtain copy should use GSAP SplitText directly.",
);
assert.match(
  copyStageSource,
  /mask:\s*"lines"[\s\S]*autoSplit:\s*true[\s\S]*onSplit/,
  "Green curtain copy should use SplitText line masks with autoSplit and an onSplit animation callback.",
);
assert.match(
  copyStageSource,
  /ease:\s*"power3\.out"[\s\S]*stagger:\s*\{ each:\s*0\.022,\s*from:\s*"start" \}/,
  "Green curtain SplitText should use restrained GSAP choreography instead of a noisy character burst.",
);
assert.match(
  storySource,
  /<LandingTailSequence\s+scrollProgressRef=\{scrollProgressRef\}[\s\S]*<CurtainCopyStage\s+scrollProgressRef=\{scrollProgressRef\}/,
  "Landing story should render the green curtain SplitText copy stage inside the main timeline.",
);
