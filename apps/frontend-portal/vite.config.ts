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
    return {
      ...common,
      server: {
        port: 5273,
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
