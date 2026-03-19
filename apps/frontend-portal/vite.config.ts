import { resolve } from 'path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const common = {
    plugins: [vue()],
    envPrefix: ['CSISP_'],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  };
  if (command === 'serve') {
    const bffUrl = process.env.CSISP_BFF_URL;
    if (!bffUrl) {
      throw new Error('Missing environment variable: CSISP_BFF_URL');
    }
    return {
      ...common,
      server: {
        port: 5273,
        proxy: {
          '/api': {
            target: bffUrl,
            changeOrigin: true,
          },
        },
      },
    };
  }
  return common;
});
