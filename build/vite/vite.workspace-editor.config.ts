import { defineDjangoStaticIslandConfig } from "../../frontend/formulas/shared/build/djangoStaticIslandConfig";

export default defineDjangoStaticIslandConfig({
  chunkFileName: "js/generated/[name].js",
  cssOutput: "css/generated/workspace-editor.css",
  entryFileName: "js/generated/workspace-editor.js",
  input: "frontend/formulas/workspace_editor/main.tsx",
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
});
