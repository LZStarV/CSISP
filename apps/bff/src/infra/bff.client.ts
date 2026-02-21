import { request } from 'undici';

import { config } from '../config';

import { getBaseLogger } from './logger';

export type BffHttpClient = ReturnType<typeof createHttpClient>;

// 供业务层使用的工厂函数：
// - headers：透传到上游（如 Authorization、X-Trace-Id）
// - traceId：用于构造带 traceId 的子日志器
export function createBffHttpClient(
  headers: Record<string, string> = {},
  traceId?: string
): BffHttpClient {
  const baseLogger = getBaseLogger();
  const logger = traceId
    ? baseLogger.child({ context: 'upstream', traceId })
    : baseLogger.child({ context: 'upstream' });

  return createHttpClient({
    baseURL: config.upstream.backendIntegratedBaseUrl,
    headers,
    logger,
  });
}

// 轻量日志接口，满足 info 输出即可
type UpstreamLogger = {
  info: (obj: Record<string, unknown>, msg?: string) => void;
};
// 客户端配置：最小可用集合
type Opts = {
  baseURL: string;
  headers?: Record<string, string>;
  logger?: UpstreamLogger;
};

// 创建最小 HTTP 客户端（GET/POST/PUT/DELETE + json）
function createHttpClient(opts: Opts) {
  const base = opts.baseURL.replace(/\/$/, '');

  // 核心请求流程：
  // - 使用 undici.request 发送请求
  // - 非 2xx 视为错误并抛出
  // - 输出统一的 upstream 日志（含 method/url/status/duration/traceId）
  async function run(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    init?: any
  ) {
    const start = Date.now();
    const res = await request(base + url, {
      method,
      headers: opts.headers,
      body: init?.body,
    });
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Object.assign(new Error('Upstream Error'), {
        code: res.statusCode,
      });
    }
    const dur = Date.now() - start;
    const traceId = opts.headers?.['X-Trace-Id'];
    if (opts.logger) {
      opts.logger.info(
        {
          context: 'upstream',
          method,
          url,
          status: res.statusCode,
          duration: dur,
          traceId,
        },
        'Upstream request'
      );
    }
    return res;
  }

  return {
    get: (url: string) => run('GET', url),
    post: (url: string, body?: any) =>
      run('POST', url, { body: body && JSON.stringify(body) }),
    put: (url: string, body?: any) =>
      run('PUT', url, { body: body && JSON.stringify(body) }),
    del: (url: string) => run('DELETE', url),
    // 从 Response 中解析 JSON
    json: async (p: Promise<any>) => (await p).body.json(),
  };
}
