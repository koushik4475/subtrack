import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({ plugins: [react(), VitePWA({ registerType: 'autoUpdate', includeAssets: ['favicon.svg'], manifest: { name: 'SubTrack', short_name: 'SubTrack', description: 'Private subscription and recurring payment tracker', theme_color: '#101827', background_color: '#f5f7fb', display: 'standalone', start_url: '/', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }] }, workbox: { navigateFallback: '/index.html' } })], server: { port: 5173 } });
