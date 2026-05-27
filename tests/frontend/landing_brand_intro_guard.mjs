import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const heroPath = "frontend/formulas/landing/components/Hero.tsx";
const introPath = "frontend/formulas/landing/components/HeroIntroDirector.tsx";
const cssEntryPath = "frontend/formulas/landing/styles/landing.css";
const introCssPath = "frontend/formulas/landing/styles/landing/brand-intro.css";
const scrollDirectorPath = "frontend/formulas/landing/components/ScrollDirector.tsx";

const heroSource = read(heroPath);
const cssEntrySource = read(cssEntryPath);
const scrollDirectorSource = read(scrollDirectorPath);

assert.ok(existsSync(introPath), "Landing should have a dedicated HeroIntroDirector for the pre-scroll brand opening.");
assert.ok(existsSync(introCssPath), "Landing should isolate brand-opening CSS in brand-intro.css.");

const introSource = read(introPath);
const introCssSource = read(introCssPath);

assert.match(heroSource, /HeroIntroDirector/, "Hero should mount the brand intro director.");
assert.match(heroSource, /className="title-line title-line-formula"[\s\S]*FORMULA/, "Hero title should expose FORMULA as a real line.");
assert.match(heroSource, /className="title-line title-line-lab"[\s\S]*LAB/, "Hero title should expose LAB as a real line.");
assert.doesNotMatch(heroSource, /brand-intro-title-layer|brand-intro-title-formula|brand-intro-title-lab/, "Hero should animate the real H1 title lines instead of a duplicate opening title layer.");
assert.doesNotMatch(heroSource, /PAPER WORKSPACE FOR LATEX AUTHORS/, "Hero should remove the old kicker copy from the first screen.");
assert.doesNotMatch(heroSource, /Turn rough formulas into reviewable papers/, "Hero should remove the old subtitle copy from the first screen.");
assert.match(heroSource, /ENTER WORKBENCH/, "Hero should keep the primary workbench button.");
assert.match(heroSource, /VIEW MISSION LOG/, "Hero should keep the secondary mission-log button.");
assert.doesNotMatch(heroSource, /HeroCornerTicker/, "Hero should not use the reverted looping ticker component.");
assert.match(heroSource, /MANUSCRIPT GRAVITY ONLINE[\s\S]*REVIEW INBOX PRIMED[\s\S]*COLLABORATION LAYER READY/, "Hero should keep the static first-screen readout lines.");

assert.match(introSource, /gsap\.context/, "HeroIntroDirector should scope GSAP writes through gsap.context.");
assert.match(introSource, /prefers-reduced-motion:\s*reduce/, "HeroIntroDirector should skip cinematic motion for reduced-motion users.");
assert.match(introSource, /landing-intro-active/, "HeroIntroDirector should use a temporary intro-active class.");
assert.match(introSource, /landing-intro-complete/, "HeroIntroDirector should mark completion after the opening handoff.");
assert.match(introSource, /clearProps/, "HeroIntroDirector should clear intro-only inline styles after landing.");
assert.match(introSource, /addLabel\("blackout"/, "HeroIntroDirector should choreograph the opening with readable GSAP labels.");
assert.match(introSource, /addLabel\("warmCut"/, "HeroIntroDirector should include a warm-cut transition beat inspired by the reference.");
assert.match(introSource, /brand-intro-slab/, "HeroIntroDirector should include warm horizontal slab layers for the cinematic intro transition.");
assert.match(introSource, /brand-intro-echo/, "HeroIntroDirector should include temporary title echo layers for cinematic scale and depth.");
assert.match(introSource, /title-line-formula[\s\S]*title-line-lab/, "HeroIntroDirector should animate FORMULA and LAB through the real H1 title lines.");
assert.match(introSource, /formulaLine\.getBoundingClientRect\(\)[\s\S]*labLine\.getBoundingClientRect\(\)[\s\S]*left:\s*-formulaRect\.left/, "HeroIntroDirector should begin FORMULA from upper-left and LAB from lower-right using precise DOM measurements.");
assert.doesNotMatch(introSource, /brand-intro-title-layer|introTitleLayer|introFormulaLine|introLabLine/, "HeroIntroDirector should not animate a duplicate title layer.");
assert.doesNotMatch(introSource, /introTitleLines,\s*\n\s*\{[^}]*\bscale/, "HeroIntroDirector should not scale the opening title text because transformed text becomes blurry in Chrome.");
assert.doesNotMatch(introSource, /introTitleLines,\s*\n\s*\{[^}]*(?:\bx:|\by:|force3D)/, "HeroIntroDirector should move opening title text with layout coordinates instead of transform compositing.");
assert.doesNotMatch(introSource, /filter:\s*["']/, "HeroIntroDirector should avoid CSS filters on animated title text because filters rasterize text and make it look blurry.");
assert.doesNotMatch(introSource, /ScrollTrigger|Lenis/, "HeroIntroDirector should not create a second scroll system.");

assert.match(cssEntrySource, /@import "\.\/landing\/brand-intro\.css";/, "Landing CSS entry should include the brand intro split.");
assert.match(introCssSource, /\.brand-intro-curtain/, "Brand intro CSS should own the opening curtain layer.");
assert.match(introCssSource, /\.brand-intro-surface/, "Brand intro CSS should own the warm cinematic surface layer.");
assert.match(introCssSource, /\.brand-intro-slab/, "Brand intro CSS should own the warm horizontal slab layers.");
assert.match(introCssSource, /\.brand-intro-echo/, "Brand intro CSS should own temporary title echo styling.");
assert.doesNotMatch(introCssSource, /\.brand-intro-title-layer|\.brand-intro-title-line/, "Brand intro CSS should not style a duplicate opening title layer.");
assert.match(introCssSource, /\.landing-intro-active \.glitch-title[\s\S]*color:\s*#e8e8e2/, "The real title should render as crisp silver text while it moves.");
assert.match(introCssSource, /will-change:\s*left,\s*top,\s*opacity,\s*letter-spacing/, "Opening title lines should avoid transform compositing hints.");
assert.doesNotMatch(introCssSource, /text-rendering:\s*geometricPrecision/, "Brand intro CSS should avoid geometricPrecision because it can make large animated text look soft in Chrome.");
assert.match(introCssSource, /\.landing-intro-active[\s\S]*\.mission-actions/, "Brand intro CSS should control button visibility during the opening.");
assert.match(introCssSource, /\.title-line[\s\S]*display:\s*block/, "Brand intro CSS should make the two title words stack.");
assert.match(introCssSource, /will-change:\s*transform,\s*opacity/, "Brand intro CSS should restrict compositor hints to transform and opacity.");
assert.match(introCssSource, /-webkit-text-fill-color:\s*currentColor/, "The animated real title should render as real text instead of transparent clipped text.");

assert.doesNotMatch(
  scrollDirectorSource,
  /landing-intro-active|HeroIntroDirector/,
  "ScrollDirector should remain the scroll-story owner, not the brand intro owner.",
);
