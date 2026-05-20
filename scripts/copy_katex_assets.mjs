import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDir = join(rootDir, "node_modules", "katex", "dist");
const targetDir = join(rootDir, "apps", "formulas", "static", "formulas", "vendor", "katex");

await rm(targetDir, { recursive: true, force: true });
await mkdir(join(targetDir, "fonts"), { recursive: true });

await cp(join(sourceDir, "katex.min.css"), join(targetDir, "katex.min.css"));
await cp(join(sourceDir, "katex.min.js"), join(targetDir, "katex.min.js"));
await cp(join(sourceDir, "fonts"), join(targetDir, "fonts"), { recursive: true });

console.log(`Copied KaTeX assets to ${targetDir}`);
