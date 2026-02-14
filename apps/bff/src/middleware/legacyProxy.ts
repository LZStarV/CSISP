/**
 * Legacy Proxy Middleware
 *
 * 作用：在 BFF 未显式处理的 `/api/*` 路由上，作为兜底转发到后端。
 * 特点：
 * - 仅在 `ctx.body` 未被设置、且状态为 404 时触发，避免覆盖已命中的 BFF 路由响应。
 * - 构造后端目标 URL（保留查询串），并透传关键头：`Authorization`、`X-Trace-Id`、`Accept`、`Content-Type`、`Cookie`。
 * - 有请求体且未设置类型时，补充 `Content-Type: application/json` 并序列化为 JSON。
 * - 对后端返回做兼容：优先解析 JSON；若非 JSON，读取文本并尝试 JSON.parse，失败则以文本填充 `message`，避免出现模糊的错误提示。
 */
import { requireEnv } from '@csisp/utils';
import type { Context, Next } from 'koa';
import { request } from 'undici';

export default function legacyProxy() {
  return async (ctx: Context, next: Next) => {
    await next();
    if (ctx.body !== undefined || (ctx.status && ctx.status !== 404)) return;
    // 仅处理以 /api/bff 开头的路径；其它路径交由前端路由或静态资源处理
    const requestPath = ctx.path;
    if (!requestPath.startsWith('/api/bff')) return;
    const backendBaseUrl = requireEnv('CSISP_BACKEND_INTEGRATED_URL');
    const forwardHeaders: Record<string, string> = {};
    // 透传鉴权与链路追踪头
    const authorization = ctx.get('Authorization');
    const traceId = (ctx.state as any)?.traceId || ctx.get('X-Trace-Id');
    // 透传内容协商与 Cookie（后端如需会话或 CSRF 校验）
    const contentType = ctx.get('Content-Type');
    const accept = ctx.get('Accept');
    const cookie = (ctx.request as any)?.headers?.cookie || ctx.get('Cookie');
    if (authorization) forwardHeaders['Authorization'] = authorization;
    if (traceId) forwardHeaders['X-Trace-Id'] = traceId as string;
    if (accept) forwardHeaders['Accept'] = accept as string;
    if (contentType) forwardHeaders['Content-Type'] = contentType as string;
    if (cookie) forwardHeaders['Cookie'] = cookie as string;
    // 拼接后端 URL，保留查询参数
    const base = new URL(backendBaseUrl);
    const basePath = base.pathname.replace(/\/$/, '');
    const normalizedRequestPath =
      basePath.endsWith('/api') && requestPath.startsWith('/api/bff')
        ? requestPath.slice('/api/bff'.length) || '/'
        : requestPath;
    const urlPath =
      (basePath && basePath !== '/' ? basePath : '') + normalizedRequestPath;
    const forwardUrl = `${base.origin}${ctx.querystring ? `${urlPath}?${ctx.querystring}` : urlPath}`;
    const body = (ctx.request as any).body;
    const method = ctx.method.toUpperCase();
    const init: any = { method, headers: forwardHeaders };
    // 非 GET/DELETE 且存在请求体时，补充 JSON 类型并序列化
    if (method !== 'GET' && method !== 'DELETE' && body) {
      if (!forwardHeaders['Content-Type'])
        forwardHeaders['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    // 发起后端请求
    const res = await request(forwardUrl, init);
    const status = res.statusCode;
    const raw = await res.body.text().catch(() => undefined);

    let json: any | undefined;
    const text: string | undefined = raw;
    if (typeof raw === 'string') {
      try {
        json = JSON.parse(raw);
      } catch {
        // 保留原始文本作为 message
      }
    }
    ctx.status = status;
    if (json) {
      ctx.body = json;
    } else if (text) {
      try {
        const parsed = JSON.parse(text);
        ctx.body = parsed;
      } catch {
        ctx.body = { code: status, message: text };
      }
    } else {
      ctx.body = { code: status, message: 'Upstream response without JSON' };
    }
  };
}
