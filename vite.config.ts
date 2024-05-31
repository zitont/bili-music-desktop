import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron';
import vue from '@vitejs/plugin-vue'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue(),
    electron({
      entry: 'main.js', 
      vite:{
        build:{
          outDir:"build"
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'store': path.resolve(__dirname, 'src/store'), // 修改这里，将 stroe 改为 store，并修正拼写错误
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

  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       additionalData: `@import "./src/styles/element/index.scss";`
  //     }
  //   }
  // }

})