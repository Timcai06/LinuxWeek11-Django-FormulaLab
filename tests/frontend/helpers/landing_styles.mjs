import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

export function readLandingStyles(path = "frontend/formulas/landing/styles/landing.css") {
  const source = readFileSync(path, "utf8");
  return source.replace(/^@import\s+"([^"]+)";$/gm, (_match, importPath) => {
    const resolved = join(dirname(path), importPath);
    return readLandingStyles(resolved);
  });
}
