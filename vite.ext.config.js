import { defineConfig } from "vite";
import { cpSync, readFileSync } from "node:fs";
const token = readFileSync("src/appcheck-debug.local.js", "utf8").match(/"([0-9a-f-]{36})"/)[1];
export default defineConfig({
  base: "./",
  define: { __APPCHECK_DEBUG_TOKEN__: JSON.stringify(token) },
  build: {
    outDir: "dist-ext",
    emptyOutDir: true,
    rollupOptions: { input: { sidepanel: "sidepanel.html" } },
  },
  plugins: [{ name: "copy-ext", closeBundle() { cpSync("ext", "dist-ext", { recursive: true }); } }],
});
