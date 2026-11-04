import { defineConfig } from 'vite'
import path from 'path'
import http from 'http'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function port3000BridgePlugin() {
  let bridgeServer: http.Server | null = null
  return {
    name: 'port-3000-bridge',
    configureServer() {
      try {
        bridgeServer = http.createServer((req, res) => {
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Plainsyt Redirecting...</title><script>
            const target = 'http://' + window.location.hostname + ':5173' + window.location.pathname + window.location.search + window.location.hash;
            window.location.replace(target);
          </script></head><body style="background:#061621;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">Plainsyt-এ রিডাইরেক্ট করা হচ্ছে...</body></html>`)
        })
        bridgeServer.on('error', () => {
          // Port 3000 in use or restricted, non-blocking
        })
        bridgeServer.listen(3000, '0.0.0.0')
      } catch {
        // non-blocking
      }
    },
    buildEnd() {
      bridgeServer?.close()
    },
  }
}

export default defineConfig({
  plugins: [
    port3000BridgePlugin(),
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    host: true,
    port: 5173,
  },
})
