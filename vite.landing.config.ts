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
      input: "frontend/formulas/landing/main.tsx",
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "css/generated/landing.css";
          }
          return "js/generated/[name][extname]";
        },
        chunkFileNames: "js/generated/landing-[name].js",
        entryFileNames: "js/generated/landing.js",
        manualChunks: (id) => {
          if (id.includes("node_modules/three") || id.includes("node_modules/@react-three")) {
            return "landing-three";
          }
          if (id.includes("node_modules/gsap")) {
            return "landing-motion";
          }
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  plugins: [react()],
});
