import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const gitCommit =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  "local";

export default defineConfig({
  plugins: [react()],
  define: {
    __GIT_COMMIT__: JSON.stringify(gitCommit),
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
