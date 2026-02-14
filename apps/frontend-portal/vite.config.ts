import { resolve } from 'path';

import { getFrontendEnv } from '@csisp/utils';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(() => {
  const env = getFrontendEnv();
  const bffUrl = env.CSISP_BFF_URL;
  if (!bffUrl) {
    throw new Error('Missing environment variable: CSISP_BFF_URL');
  }

  return {
    plugins: [vue()],
    envPrefix: ['CSISP_'],
    server: {
      port: 5273,
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
  };
});
