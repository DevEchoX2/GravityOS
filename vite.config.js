import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || '')
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ai: resolve(__dirname, 'assets/ai/ai.html'),
        games: resolve(__dirname, 'assets/games/g.html'),
        proxy: resolve(__dirname, 'assets/proxy/proxy.html'),
        settings: resolve(__dirname, 'assets/settings/settings.html'),
        home: resolve(__dirname, 'assets/home/index.html'),
        apps: resolve(__dirname, 'assets/apps/apps.html'),
        executor: resolve(__dirname, 'assets/executor/executor.html')
      }
    }
  }
});
