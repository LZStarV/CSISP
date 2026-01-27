import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

const bucket = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQ = 60;

function keyOf(req: any): string {
  const ip = (req.ip as string) || req.headers['x-forwarded-for'] || 'unknown';
  return `${ip}:${req.method}:${req.path || req.url}`;
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<any>();
    const k = keyOf(req);
    const now = Date.now();
    const item = bucket.get(k);
    if (!item || now > item.resetAt) {
      bucket.set(k, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      item.count += 1;
      if (item.count > MAX_REQ) {
        throw new HttpException('Too Many Requests', 429);
      }
    }
    return next.handle();
  }
}
