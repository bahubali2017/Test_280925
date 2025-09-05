import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import obfuscatorPlugin from "vite-plugin-obfuscator";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),

    // ✅ Production-only obfuscator plugin (properly placed in plugins array)
    ...(process.env.NODE_ENV === "production"
      ? [
          obfuscatorPlugin({
            options: {
              compact: true,
              controlFlowFlattening: false,
              deadCodeInjection: false,
              debugProtection: false,
              debugProtectionInterval: 0,
              disableConsoleOutput: true,
              identifierNamesGenerator: "hexadecimal",
              log: false,
              numbersToExpressions: false,
              renameGlobals: false,
              selfDefending: true,
              simplify: true,
              splitStrings: false,
              stringArray: true,
              stringArrayCallsTransform: false,
              stringArrayEncoding: [],
              stringArrayIndexShift: true,
              stringArrayRotate: true,
              stringArrayShuffle: true,
              stringArrayWrappersCount: 1,
              stringArrayWrappersChainedCalls: true,
              stringArrayWrappersParametersMaxCount: 2,
              stringArrayWrappersType: "variable",
              stringArrayThreshold: 0.75,
              unicodeEscapeSequence: false,
            },
          }),
        ]
      : []),

    // ✅ Replit-only cartographer (non-production only)
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer()
          ),
        ]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  root: path.resolve(import.meta.dirname, "client"),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
