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
        port: Number(process.env.CSISP_IDP_CLIENT_PORT),
        allowedHosts: ['csisp-idp-client.vercel.app'],
        proxy: {
          '/api/idp': {
            target: process.env.CSISP_IDP_URL,
            changeOrigin: true,
            secure: false,
          },
        },
      },
    };
  }
  return common;
});
