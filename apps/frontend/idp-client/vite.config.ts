import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  const common = {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    envPrefix: ['CSISP_'],
  };
  if (command === 'serve') {
    return {
      ...common,
      server: {
        host: '127.0.0.1',
        port: 5174,
        allowedHosts: ['idp-client.onrender.com'],
        proxy: {
          '/api/idp': {
            target: 'http://127.0.0.1:4000',
            changeOrigin: true,
            secure: false,
          },
        },
      },
    };
  }
  return common;
});
