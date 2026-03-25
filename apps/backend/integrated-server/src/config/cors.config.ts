import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

import { config } from './index';

/**
 * CORS 配置
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.cors.allowedOrigins;

    if (!origin) {
      // 允许同源或服务器端调用
      callback(null, true);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Accept-Language',
    'Content-Language',
    'X-Trace-Id',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size'],
  maxAge: 86400,
};
