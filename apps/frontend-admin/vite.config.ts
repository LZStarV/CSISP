import { resolve } from 'path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const common = {
    plugins: [
      vue({
        template: {
          transformAssetUrls: {
            base: null,
            includeAbsolute: false,
          },
        },
      }),
    ],
    // 指定环境变量前缀，仅允许 CSISP_
    envPrefix: ['CSISP_'],
    define: {
      // 将获取到的环境变量注入到 process.env (兼容一些老库)
      'process.env': {
        ...process.env,
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      target: 'esnext',
    },
  };

  if (command === 'serve') {
    return {
      ...common,
      server: {
        port: 5173,
        host: true,
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:4000',
            changeOrigin: true,
          },
        },
      },
    };
  }
  return common;
});
