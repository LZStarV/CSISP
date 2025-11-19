/**
 * 日志中间件
 * 请求和响应日志记录
 */

import { Middleware, LoggerMiddlewareOptions, Next } from '../types/middleware';
import { AppContext } from '../types/context';

/**
 * 日志中间件
 * 记录请求和响应信息
 */
export const logger = (options: LoggerMiddlewareOptions = {}): Middleware => {
  const {
    logBody = false,
    logResponse = false,
    excludePaths = ['/health', '/metrics'],
    sensitiveFields = ['password', 'token', 'authorization'],
  } = options;

  return async (ctx: AppContext, next: Next) => {
    const start = Date.now();
    const { method, url } = ctx;

    // 检查是否在排除路径中
    const isExcluded = excludePaths.some(path => url.startsWith(path));
    if (isExcluded) {
      return await next();
    }

    // 构建请求日志
    const requestLog: any = {
      method,
      url,
      userAgent: ctx.get('User-Agent'),
      ip: ctx.ip,
      userId: ctx.userId,
    };

    // 记录请求体（如果启用）
    if (logBody && ctx.request.body) {
      requestLog.body = sanitizeData(ctx.request.body, sensitiveFields);
    }

    // 记录请求头（可选）
    const headers = sanitizeData(ctx.headers, sensitiveFields);
    requestLog.headers = headers;

    process.stdout.write(
      `[Request Start] ${method} ${url} - ${JSON.stringify(requestLog, null, 2)}\n`
    );

    try {
      await next();

      const duration = Date.now() - start;

      // 构建响应日志
      const responseLog: any = {
        method,
        url,
        status: ctx.status,
        duration: `${duration}ms`,
        userId: ctx.userId,
      };

      // 记录响应体（如果启用）
      if (logResponse && ctx.body) {
        responseLog.body = sanitizeData(ctx.body, sensitiveFields);
      }

      process.stdout.write(`request_done:${JSON.stringify(responseLog)}\n`);
    } catch (error: any) {
      const duration = Date.now() - start;

      // 记录错误日志
      const errorLog: any = {
        method,
        url,
        status: ctx.status || 500,
        duration: `${duration}ms`,
        userId: ctx.userId,
        error: error.message,
      };

      process.stderr.write(`request_error:${JSON.stringify(errorLog)}\n`);

      // 重新抛出错误让错误处理中间件处理
      throw error;
    }
  };
};

/**
 * 敏感数据脱敏函数
 * 移除或屏蔽敏感字段
 */
function sanitizeData(data: any, sensitiveFields: string[]): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // 递归处理嵌套对象
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key], sensitiveFields);
    }
  }

  return sanitized;
}

/**
 * 访问日志中间件
 * 简化版的访问日志记录
 */
export const accessLogger: Middleware = async (ctx: AppContext, next: Next) => {
  const start = Date.now();
  const { method, url } = ctx;

  // 排除健康检查等路径
  if (url === '/health' || url.startsWith('/metrics')) {
    return await next();
  }

  await next();

  const duration = Date.now() - start;
  const logData = {
    method,
    url,
    status: ctx.status,
    duration: `${duration}ms`,
    ip: ctx.ip,
    userAgent: ctx.get('User-Agent'),
    userId: ctx.userId,
  };

  // 根据状态码选择日志级别
  if (ctx.status >= 500) {
    process.stderr.write(`server_error:${JSON.stringify(logData)}\n`);
  } else if (ctx.status >= 400) {
    process.stdout.write(`client_error:${JSON.stringify(logData)}\n`);
  } else {
    process.stdout.write(`access:${JSON.stringify(logData)}\n`);
  }
};
