import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'stroe': path.resolve(__dirname, 'src/stroe'),
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    // proxy: {
    //   '/api': {
    //     target: 'https://localhost:3002',
    //     changeOrigin: true,
    //     rewrite: (path: string) => path.replace(/^\/api/, '')
    //   }
    // }
  },

  // css : {
  //   preprocessorOptions: {
  //     scss: {
  //       additionalData: `@import "./src/styles/element/index.scss";`
  //     }
  //   }
  // }

})

