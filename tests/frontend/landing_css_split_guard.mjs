import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const entryPath = "frontend/formulas/landing/styles/landing.css";
const entrySource = readFileSync(entryPath, "utf8");

assert.equal(
  entrySource,
  [
    '@import "./landing/stage.css";',
    '@import "./landing/cinematic-overlays.css";',
    '@import "./landing/hero-hud.css";',
    '@import "./landing/brand-intro.css";',
    '@import "./landing/responsive.css";',
    '@import "./landing/curtain-sequence.css";',
    "",
  ].join("\n"),
  "Landing CSS entry should remain a thin ordered import graph.",
);

const splitFiles = {
  stage: "frontend/formulas/landing/styles/landing/stage.css",
  cinematic: "frontend/formulas/landing/styles/landing/cinematic-overlays.css",
  heroHud: "frontend/formulas/landing/styles/landing/hero-hud.css",
  brandIntro: "frontend/formulas/landing/styles/landing/brand-intro.css",
  responsive: "frontend/formulas/landing/styles/landing/responsive.css",
  curtain: "frontend/formulas/landing/styles/landing/curtain-sequence.css",
};

for (const [name, file] of Object.entries(splitFiles)) {
  assert.ok(existsSync(file), `Landing ${name} CSS split should exist at ${file}.`);
}

const stage = readFileSync(splitFiles.stage, "utf8");
const cinematic = readFileSync(splitFiles.cinematic, "utf8");
const heroHud = readFileSync(splitFiles.heroHud, "utf8");
const brandIntro = readFileSync(splitFiles.brandIntro, "utf8");
const responsive = readFileSync(splitFiles.responsive, "utf8");
const curtain = readFileSync(splitFiles.curtain, "utf8");

assert.match(stage, /\.landing-story\s*\{/, "Stage split should own the story root variables.");
assert.match(stage, /\.formula-constellation\s*\{/, "Stage split should own the formula constellation layer.");
assert.match(cinematic, /\.decode-chamber\s*\{/, "Cinematic split should own the decode chamber.");
assert.match(cinematic, /\.workbench-gate\s*\{/, "Cinematic split should own the Workbench Gate.");
assert.match(heroHud, /\.landing-copy\s*\{/, "Hero HUD split should own the hero copy.");
assert.match(heroHud, /@keyframes shootingStar/, "Hero HUD split should own the star keyframes.");
assert.match(brandIntro, /\.brand-intro-curtain\s*\{/, "Brand intro split should own the pre-scroll curtain.");
assert.match(responsive, /@media \(max-width: 720px\)/, "Responsive split should own mobile overrides.");
assert.match(responsive, /@media \(prefers-reduced-motion: reduce\)/, "Responsive split should own reduced-motion overrides.");
assert.match(curtain, /\.curtain-copy-stage\s*\{/, "Curtain split should own the SplitText stage.");
assert.match(curtain, /\.morph-curtain\s*\{/, "Curtain split should own the liquid transition.");
