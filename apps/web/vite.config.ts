import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend talks to the FastAPI backend on :8000. We proxy /api during dev
// so the browser only ever calls the same origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy/stable vendors into their own chunks so the initial
        // bundle stays small and the big charting lib only loads with the
        // dashboard route (which is itself lazy-loaded).
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "charts": ["recharts"],
          "data": ["@tanstack/react-query", "axios"],
        },
      },
    },
  },
});
