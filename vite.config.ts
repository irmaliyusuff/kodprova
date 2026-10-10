import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The site is static: `npm run build` bundles the client here, renders every
// route to HTML with the server build (src/entry-server.tsx) and writes one
// index.html per route into dist/ (scripts/prerender.ts).
export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    // The stylesheet ships unminified so it reads like the source.
    cssMinify: false,
  },
});
