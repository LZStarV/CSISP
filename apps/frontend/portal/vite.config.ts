import { resolve } from 'path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDevelopment = command === 'serve';
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
        host: '127.0.0.1',
        port: 5273,
        allowedHosts: ['csisp-portal.onrender.com'],
        proxy: {
          '/api': {
            target: isDevelopment
              ? 'http://127.0.0.1:4000'
              : 'https://csisp-bff.onrender.com',
            changeOrigin: true,
          },
        },
      },
    };
  }
  return common;
});
