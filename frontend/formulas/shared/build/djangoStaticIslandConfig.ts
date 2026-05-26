import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { UserConfig } from "vite";

type ManualChunks = NonNullable<
  NonNullable<NonNullable<UserConfig["build"]>["rollupOptions"]>["output"]
>["manualChunks"];

type DjangoStaticIslandOptions = {
  chunkFileName: string;
  chunkSizeWarningLimit?: number;
  cssOutput: string;
  entryFileName: string;
  input: string;
  manualChunks?: ManualChunks;
};

export function defineDjangoStaticIslandConfig(options: DjangoStaticIslandOptions) {
  return defineConfig({
    build: {
      assetsDir: ".",
      cssCodeSplit: false,
      emptyOutDir: false,
      manifest: false,
      outDir: "apps/formulas/static/formulas",
      rollupOptions: {
        input: options.input,
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith(".css")) {
              return options.cssOutput;
            }
            return "js/generated/[name][extname]";
          },
          chunkFileNames: options.chunkFileName,
          entryFileNames: options.entryFileName,
          manualChunks: options.manualChunks,
        },
      },
      ...(options.chunkSizeWarningLimit === undefined
        ? {}
        : { chunkSizeWarningLimit: options.chunkSizeWarningLimit }),
    },
    plugins: [react()],
  });
}
