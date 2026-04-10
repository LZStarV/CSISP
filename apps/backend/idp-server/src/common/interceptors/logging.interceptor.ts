import { SENSITIVE_FIELDS } from '@common/constants/sensitive-fields';
import { getIdpLogger } from '@infra/logger';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// 敏感字段列表，用于日志脱敏
const SENSITIVE_KEYS = new Set(SENSITIVE_FIELDS);

/**
 * 递归脱敏对象中的敏感字段
 */
function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }

  const masked: any = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (SENSITIVE_KEYS.has(key)) {
        masked[key] = '***MASKED***';
      } else if (typeof data[key] === 'object') {
        masked[key] = maskSensitiveData(data[key]);
      } else {
        masked[key] = data[key];
      }
    }
  }
  return masked;
}

// 从 HTTP 请求路径中提取方法名
function deriveMethodInfo(
  path: string,
  handlerName?: string
): { method?: string; protocol?: string } | undefined {
  const pathOnly = (path ?? '').split('?')[0];
  const parts = pathOnly.replace(/^\/+/, '').split('/');
  const methodInfo: any = { protocol: 'http-rest' };

  // 优先使用 handlerName 构造方法名，这样更准确
  if (handlerName) {
    // 假设路径中倒数第二个部分是领域名，如 /api/idp/auth/login -> auth
    const domain = parts.length >= 2 ? parts[parts.length - 2] : 'unknown';
    methodInfo.method = `${domain}.${handlerName}`;
  } else if (parts.length >= 2) {
    const a = parts[parts.length - 2];
    const b = parts[parts.length - 1];
    methodInfo.method = `${a}.${b}`;
  }

  return methodInfo;
}

// 日志拦截器，记录所有 REST 请求的生命周期
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const http = context.switchToHttp();
    const req: any = http.getRequest();
    const res: any = http.getResponse();
    const handler = context.getHandler();

    // 根据协议选择不同的 Logger 上下文
    const logger = getIdpLogger('http');
    const methodInfo = deriveMethodInfo(req.url, handler?.name);

    // 对请求参数进行脱敏处理
    const maskedParams = maskSensitiveData(req.body);

    logger.info(
      {
        phase: 'start',
        method: req.method,
        url: req.url,
        ...(methodInfo ?? {}),
        params: maskedParams,
      },
      'Request started'
    );
    return next.handle().pipe(
      tap(() => {
        const status: number = res.statusCode ?? 200;
        const duration = Date.now() - now;
        logger.info(
          {
            phase: 'end',
            method: req.method,
            url: req.url,
            ...(methodInfo ?? {}),
            status,
            duration,
          },
          'Request completed'
        );
      })
    );
  }
}
