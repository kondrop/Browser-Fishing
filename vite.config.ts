import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    hmr: true,
    watch: {
      usePolling: true, // ファイル変更の検出を確実に
    }
  },
  // Phaserはフルリロードが必要なので、変更時にページをリロード
  plugins: [
    {
      name: 'full-reload',
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.ts')) {
          server.ws.send({ type: 'full-reload' })
          return []
        }
      }
    }
  ]
})

