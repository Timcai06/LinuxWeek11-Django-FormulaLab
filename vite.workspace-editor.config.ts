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
      },
    },
  },
  plugins: [react()],
});
