import { defineConfig } from "astro/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const experimentRoot = resolve(repoRoot, "frontend/formulas/experiment");

export default defineConfig({
  root: experimentRoot,
  srcDir: resolve(experimentRoot, "src"),
  publicDir: resolve(experimentRoot, "public"),
  outDir: resolve(repoRoot, "apps/formulas/static/formulas/experiment"),
  base: "/static/formulas/experiment",
  build: {
    assets: "_astro",
    format: "directory",
    inlineStylesheets: "never",
  },
  vite: {
    cacheDir: "../../../node_modules/.vite-experiment",
    build: {
      assetsInlineLimit: 0,
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          assetFileNames: "_astro/[name].[hash][extname]",
          chunkFileNames: "_astro/[name].[hash].js",
          entryFileNames: "_astro/[name].[hash].js",
          manualChunks(id) {
            if (id.includes("node_modules/three")) {
              return "experiment-three";
            }
            if (id.includes("node_modules/gsap")) {
              return "experiment-motion";
            }
            return undefined;
          },
        },
      },
    },
  },
});
