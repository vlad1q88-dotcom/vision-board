/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `vite build --mode electron` produces the bundle the desktop (Electron) app loads via
  // file:// — that needs relative asset paths (the web build's absolute /vision-board/...
  // would resolve to the filesystem root) and can't use a service worker (registration
  // requires https/localhost; a local desktop app has no use for an offline cache anyway).
  const isElectron = mode === 'electron'

  return {
    // GitHub Pages serves project sites under /<repo-name>/, not the domain root.
    base: isElectron ? './' : '/vision-board/',
    plugins: [
      react(),
      VitePWA({
        disable: isElectron,
        registerType: 'autoUpdate',
        includeAssets: ['icon-source.svg'],
        manifest: {
          name: 'Vision Board',
          short_name: 'Vision Board',
          description: 'Личная карта целей, фото-визуализация и дневник благодарностей',
          theme_color: '#c97c43',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/vision-board/',
          scope: '/vision-board/',
          icons: [
            { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test-setup.ts'],
    },
  }
})
