import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin calls in development; the backend still enforces CORS for direct calls.
    proxy: { "/api": "http://localhost:4000" },
  },
});
