import { resolve } from 'path';

import { getFrontendEnv } from '@csisp/utils';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const env = getFrontendEnv();
  const bffUrl = env.CSISP_BFF_URL;
  if (!bffUrl) {
    throw new Error('Missing environment variable: CSISP_BFF_URL');
  }

  return {
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
        ...env,
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: bffUrl,
          changeOrigin: true,
        },
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
});
