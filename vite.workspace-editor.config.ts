import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    assetsDir: ".",
    cssCodeSplit: false,
    emptyOutDir: false,
    manifest: false,
    outDir: "apps/formulas/static/formulas",
    rollupOptions: {
      input: "frontend/formulas/workspace_editor/main.tsx",
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "css/generated/workspace-editor.css";
          }
          return "js/generated/[name][extname]";
        },
        entryFileNames: "js/generated/workspace-editor.js",
        chunkFileNames: "js/generated/[name].js",
        manualChunks: (id) => {
          if (
            id.includes("node_modules/@codemirror") ||
            id.includes("node_modules/@lezer") ||
            id.includes("node_modules/crelt") ||
            id.includes("node_modules/style-mod") ||
            id.includes("node_modules/w3c-keyname")
          ) {
            return "codemirror";
          }
          return undefined;
        },
      },
    },
  },
  plugins: [react()],
});
