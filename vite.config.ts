import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const repoName = process.env.npm_package_name ?? 'last-horizon'

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? `/${repoName}/`,
  build: {
    // Phaser is one indivisible ~1.4 MB library; routes already lazy-load it
    // only on /game and /lab, so the default 500 kB warning is just noise
    chunkSizeWarningLimit: 1_600,
  },
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
