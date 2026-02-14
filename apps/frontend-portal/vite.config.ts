import { resolve } from 'path';

import { getFrontendEnv } from '@csisp/utils';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = getFrontendEnv(mode);

  return {
    plugins: [vue()],
    envPrefix: ['VITE_', 'CSISP_'],
    server: {
      port: 5273,
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
  };
});
