import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron';
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    Components({
      resolvers: [NaiveUiResolver()],
    }),
    electron({
      entry: 'main.js',
      onstart: false,
      vite: {
        build: {
          outDir: 'build',
          rollupOptions: {
            external: ['electron', 'better-sqlite3'],
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'store': path.resolve(__dirname, 'src/store'),
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
  },
})
