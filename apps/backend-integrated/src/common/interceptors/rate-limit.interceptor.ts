/**
 * 全局速率限制拦截器
 *
 * 使用内存 Map 记录 IP+方法+路径 的访问次数，
 * 在指定时间窗口内超过 max 次请求时返回 429，
 * 对应旧 backend 中 rateLimit/apiRateLimit 的核心逻辑。
 */
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly windowMs = 60_000;
  private readonly max = 100;
  private readonly excludePaths: string[] = ['/api/health'];

  constructor(@Inject(REDIS_KV) private readonly kv: RedisKV) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const http = context.switchToHttp();
    const req: any = http.getRequest();
    const res: any = http.getResponse();

    const path: string = req.url ?? '';
    if (this.excludePaths.some(p => path.startsWith(p))) {
      return next.handle();
    }

    const ip: string = req.ip ?? req.connection?.remoteAddress ?? 'unknown';
    const key = `backend:ratelimit:${ip}:${req.method}:${path}`;
    const n = await this.kv.incr(key);
    if (n === 1) await this.kv.expire(key, Math.floor(this.windowMs / 1000));
    if (typeof n === 'number' && n > this.max) {
      const retryAfter = Math.ceil(this.windowMs / 1000);
      res.setHeader('X-RateLimit-Limit', this.max.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader(
        'X-RateLimit-Reset',
        new Date(Date.now() + this.windowMs).toISOString()
      );

      throw new HttpException(
        {
          code: HttpStatus.TOO_MANY_REQUESTS,
          message: '请求过于频繁，请稍后再试',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    res.setHeader('X-RateLimit-Limit', this.max.toString());
    res.setHeader(
      'X-RateLimit-Remaining',
      (this.max - (typeof n === 'number' ? n : 0)).toString()
    );
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + this.windowMs).toISOString()
    );

    return next.handle().pipe(tap(() => {}));
  }
}
