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
assert.doesNotMatch(heroSource, /PAPER WORKSPACE FOR LATEX AUTHORS/, "Hero should remove the old kicker copy from the first screen.");
assert.doesNotMatch(heroSource, /Turn rough formulas into reviewable papers/, "Hero should remove the old subtitle copy from the first screen.");
assert.match(heroSource, /ENTER WORKBENCH/, "Hero should keep the primary workbench button.");
assert.match(heroSource, /VIEW MISSION LOG/, "Hero should keep the secondary mission-log button.");

assert.match(introSource, /gsap\.context/, "HeroIntroDirector should scope GSAP writes through gsap.context.");
assert.match(introSource, /prefers-reduced-motion:\s*reduce/, "HeroIntroDirector should skip cinematic motion for reduced-motion users.");
assert.match(introSource, /landing-intro-active/, "HeroIntroDirector should use a temporary intro-active class.");
assert.match(introSource, /landing-intro-complete/, "HeroIntroDirector should mark completion after the opening handoff.");
assert.match(introSource, /clearProps/, "HeroIntroDirector should clear intro-only inline styles after landing.");
assert.doesNotMatch(introSource, /filter:\s*["']/, "HeroIntroDirector should avoid CSS filters on animated title text because filters rasterize text and make it look blurry.");
assert.doesNotMatch(introSource, /ScrollTrigger|Lenis|getBoundingClientRect/, "HeroIntroDirector should not create a second scroll system or FLIP measurement path.");

assert.match(cssEntrySource, /@import "\.\/landing\/brand-intro\.css";/, "Landing CSS entry should include the brand intro split.");
assert.match(introCssSource, /\.brand-intro-curtain/, "Brand intro CSS should own the opening curtain layer.");
assert.match(introCssSource, /\.landing-intro-active[\s\S]*\.mission-actions/, "Brand intro CSS should control button visibility during the opening.");
assert.match(introCssSource, /\.title-line[\s\S]*display:\s*block/, "Brand intro CSS should make the two title words stack.");
assert.match(introCssSource, /will-change:\s*transform,\s*opacity/, "Brand intro CSS should restrict compositor hints to transform and opacity.");
assert.match(introCssSource, /-webkit-text-fill-color:\s*#ffffff/, "Brand intro CSS should render intro title as real white text instead of scaled gradient-clipped text.");

assert.doesNotMatch(
  scrollDirectorSource,
  /landing-intro-active|HeroIntroDirector/,
  "ScrollDirector should remain the scroll-story owner, not the brand intro owner.",
);
