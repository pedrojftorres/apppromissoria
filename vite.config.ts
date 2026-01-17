import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),

    VitePWA({
      registerType: "autoUpdate",

      // Usa seu SW em src/sw.ts e injeta o precache do Workbox nele
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",

      // Essencial: aqui é onde o Workbox vai procurar arquivos para precache
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
      },

      includeAssets: ["favicon.ico", "robots.txt"],

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
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
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
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
