import path from 'path';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Most specific first: "react-router" also contains the text "react".
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (/node_modules\/(\.pnpm\/)?(react|react-dom|scheduler)[@/]/.test(id)) return 'vendor-react';
          return 'vendor-libs';
        },
      },
    },
  },
  server: { host: true, port: 5173 },
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] },
});
