import { error, cors, logger, jwtAuth, rateLimit } from '@csisp/middlewares';

export const errorMiddleware = () =>
  error({ showDetailsInDev: process.env.NODE_ENV === 'development', logErrors: true });
export const corsMiddleware = () => cors({});
export const loggerMiddleware = () => logger({});
export const jwtAuthMiddleware = () => jwtAuth();
export const rateLimitMiddleware = () => rateLimit({});
