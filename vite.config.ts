import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'INDEX by DiveSpot',
        short_name: 'INDEX',
        description: 'Calculadoras de buceo técnicas, planificador de inmersiones y resúmenes de cursos PADI tecRec',
        theme_color: '#0B1D2E',
        background_color: '#0B1D2E',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: './icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: './icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
