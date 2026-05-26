import { defineDjangoStaticIslandConfig } from "./frontend/formulas/shared/build/djangoStaticIslandConfig";

export default defineDjangoStaticIslandConfig({
  chunkFileName: "js/generated/landing-[name].js",
  chunkSizeWarningLimit: 1000,
  cssOutput: "css/generated/landing.css",
  entryFileName: "js/generated/landing.js",
  input: "frontend/formulas/landing/main.tsx",
  manualChunks: (id) => {
    if (id.includes("node_modules/three") || id.includes("node_modules/@react-three")) {
      return "landing-three";
    }
    if (id.includes("node_modules/gsap")) {
      return "landing-motion";
    }
    return undefined;
  },
});
