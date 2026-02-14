import path from 'path';

import { requireEnv, requireIntEnv } from '@csisp/utils';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  envPrefix: ['CSISP_'],
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
});
