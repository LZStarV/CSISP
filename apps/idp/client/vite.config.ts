import path from 'path';

import { requireEnv, requireIntEnv } from '@csisp/utils';
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
        port: requireIntEnv('CSISP_IDP_CLIENT_PORT'),
        proxy: {
          '/api/idp': {
            target: requireEnv('CSISP_IDP_URL'),
            changeOrigin: true,
            secure: false,
          },
        },
      },
    };
  }
  return common;
});
