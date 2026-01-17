import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      strategies: "injectManifest",

      injectManifest: {
        swSrc: "src/sw.ts",   // ✅ FONTE
        swDest: "sw.js",      // ✅ GERADO (dist/sw.js)
      },

      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],

      manifest: {
        name: "PromissóriasApp",
        short_name: "Promissórias",
        start_url: "/",
        display: "standalone",
        theme_color: "#2f855a",
        background_color: "#f5f7f5",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
