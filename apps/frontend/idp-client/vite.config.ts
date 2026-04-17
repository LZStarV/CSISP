import path from 'path';

import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  const isDevelopment = command === 'serve' && mode !== 'production';
  const common = {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    envPrefix: ['CSISP_'],
  };

  if (command === 'build') {
    return {
      ...common,
      plugins: [
        ...common.plugins,
        visualizer({
          filename: './dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
      ],
    };
  }

  if (command === 'serve') {
    return {
      ...common,
      server: {
        host: '127.0.0.1',
        port: 5174,
        allowedHosts: ['csisp-idp-client.onrender.com'],
        proxy: {
          '/api': {
            target: isDevelopment
              ? 'http://127.0.0.1:4000'
              : 'https://csisp-bff.onrender.com',
            changeOrigin: true,
            secure: !isDevelopment,
          },
        },
      },
    };
  }
  return common;
});
