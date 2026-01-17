import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),

    VitePWA({
      registerType: "autoUpdate",

      // ✅ CONTROLE TOTAL DO SERVICE WORKER
      strategies: "injectManifest",

      srcDir: "src",
      filename: "sw.ts",

      // 🔴 ESSENCIAL PARA NÃO QUEBRAR O BUILD
      injectManifest: {
        swDest: "sw.js",
      },

      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],

      manifest: {
        name: "PromissóriasApp - Gestão de Pagamentos",
        short_name: "Promissórias",
        description: "Gerencie suas promissórias e pagamentos de forma segura",
        theme_color: "#2f855a",
        background_color: "#f5f7f5",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
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
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
