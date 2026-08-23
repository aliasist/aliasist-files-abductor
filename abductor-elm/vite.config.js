import { defineConfig } from "vite";
import elmPlugin from "vite-plugin-elm";

// Tauri expects a fixed port, dev server won't restart on file changes if the
// port is already in use — 1421 keeps this clear of abductor-tauri's 1420
// when both dev servers run at once.
export default defineConfig(() => ({
  plugins: [elmPlugin()],
  clearScreen: false,
  server: {
    port: 1421,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    outDir: "dist",
  },
}));
