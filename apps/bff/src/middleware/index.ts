import error from './error';
import cors from './cors';
import logger from './logger';
import jwtAuth from './jwtAuth';
import rateLimit from './rateLimit';
import trace from './trace';
import type Koa from 'koa';
import bodyParser from 'koa-bodyparser';

// BFF 统一中间件装配入口
//
// 提供便捷工厂函数，供 app.ts 在固定顺序下挂载各类中间件：
// - errorMiddleware：统一错误包装
// - corsMiddleware：跨域配置
// - loggerMiddleware：访问日志
// - jwtAuthMiddleware：JWT 鉴权
// - rateLimitMiddleware：滑窗限流
export const errorMiddleware = () =>
  error({ showDetailsInDev: process.env.NODE_ENV === 'development', logErrors: true });
export const corsMiddleware = () => cors({});
export const loggerMiddleware = () => logger({});
export const jwtAuthMiddleware = () => jwtAuth();
export const rateLimitMiddleware = () => rateLimit({});
export const traceMiddleware = () => trace();

// 装配 BFF 中间件
export function setupMiddlewares(app: Koa) {
  app.use(errorMiddleware());
  app.use(corsMiddleware());
  app.use(loggerMiddleware());
  app.use(traceMiddleware());
  app.use(bodyParser());
  app.use(jwtAuthMiddleware());
  app.use(rateLimitMiddleware());
}
