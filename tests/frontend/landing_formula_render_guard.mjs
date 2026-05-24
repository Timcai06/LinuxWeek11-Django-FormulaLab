import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const heroSource = readFileSync("frontend/formulas/landing/components/Hero.tsx", "utf8");

assert.match(heroSource, /renderToString/, "Landing formula cosmos should render TeX through KaTeX.");
assert.doesNotMatch(heroSource, /textContent\s*=\s*equation/, "Landing formula cosmos must not show raw TeX code.");
assert.match(heroSource, /innerHTML\s*=\s*renderFormula/, "Landing formula cosmos should inject rendered KaTeX markup.");
