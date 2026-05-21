import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function gitBuildSeq() {
  try {
    return execSync("git rev-list --count HEAD", {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    return "0";
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_SEQ__: JSON.stringify(gitBuildSeq()),
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:5001",
    },
  },
  build: {
    outDir: "../src/static",
    emptyOutDir: true,
  },
});
