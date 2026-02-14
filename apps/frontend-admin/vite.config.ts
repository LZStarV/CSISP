import { resolve } from 'path';

import { getFrontendEnv } from '@csisp/utils';
import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 从 @csisp/utils 获取经过过滤和扩展的环境变量
  const env = getFrontendEnv(mode);

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
    // 指定环境变量前缀，允许 VITE_ 和 CSISP_
    envPrefix: ['VITE_', 'CSISP_'],
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
          target: env.CSISP_BFF_URL || 'http://localhost:4000',
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
