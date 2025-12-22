/**
 * 全局速率限制拦截器
 *
 * 使用内存 Map 记录 IP+方法+路径 的访问次数，
 * 在指定时间窗口内超过 max 次请求时返回 429，
 * 对应旧 backend 中 rateLimit/apiRateLimit 的核心逻辑。
 */
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitRecord>();

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly windowMs: number;
  private readonly max: number;
  private readonly excludePaths: string[];

  constructor(windowMs = 60_000, max = 100, excludePaths: string[] = ['/api/health']) {
    this.windowMs = windowMs;
    this.max = max;
    this.excludePaths = excludePaths;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req: any = http.getRequest();
    const res: any = http.getResponse();

    const path: string = req.url ?? '';
    if (this.excludePaths.some(p => path.startsWith(p))) {
      return next.handle();
    }

    const ip: string = req.ip ?? req.connection?.remoteAddress ?? 'unknown';
    const key = `api:${ip}:${req.method}:${path}`;
    const now = Date.now();

    let record = store.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + this.windowMs };
      store.set(key, record);
    }

    if (record.count >= this.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('X-RateLimit-Limit', this.max.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

      throw new HttpException(
        {
          code: HttpStatus.TOO_MANY_REQUESTS,
          message: '请求过于频繁，请稍后再试',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    record.count += 1;

    res.setHeader('X-RateLimit-Limit', this.max.toString());
    res.setHeader('X-RateLimit-Remaining', (this.max - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    return next.handle().pipe(tap(() => {}));
  }
}
