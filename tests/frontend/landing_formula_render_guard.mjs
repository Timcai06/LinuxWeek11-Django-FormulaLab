import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const constellationSource = readFileSync("frontend/formulas/landing/components/FormulaConstellationField.tsx", "utf8");

assert.match(constellationSource, /renderToString/, "Landing formula cosmos should render TeX through KaTeX.");
assert.doesNotMatch(constellationSource, /textContent\s*=\s*equation/, "Landing formula cosmos must not show raw TeX code.");
assert.doesNotMatch(constellationSource, /:\s*formula\.source/, "Landing formula cosmos must not fall back to visible raw TeX.");
assert.match(constellationSource, /dangerouslySetInnerHTML=\{markup\}/, "Landing formula cosmos should inject rendered KaTeX markup.");
