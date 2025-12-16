import { request } from 'undici';
import type { Dispatcher } from 'undici';
type HttpMethod = Dispatcher.HttpMethod;
type Opts = {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  onLog?: (line: string) => void;
};
export function createHttpClient(opts: Opts) {
  const base = opts.baseURL.replace(/\/$/, '');
  async function run(method: HttpMethod, url: string, init?: any) {
    const start = Date.now();
    const res = await request(base + url, { method, headers: opts.headers, body: init?.body });
    if (res.statusCode < 200 || res.statusCode >= 300)
      throw Object.assign(new Error('Upstream Error'), { code: res.statusCode });
    const dur = Date.now() - start;
    const traceId = opts.headers?.['X-Trace-Id'];
    const line = `${method} ${url} ${res.statusCode} ${dur}ms${traceId ? ` traceId=${traceId}` : ''}`;
    if (opts.onLog) opts.onLog(line);
    else process.stdout.write(line + '\n');
    return res;
  }
  return {
    get: (url: string) => run('GET', url),
    post: (url: string, body?: any) => run('POST', url, { body: body && JSON.stringify(body) }),
    put: (url: string, body?: any) => run('PUT', url, { body: body && JSON.stringify(body) }),
    del: (url: string) => run('DELETE', url),
    json: async (p: Promise<any>) => (await p).body.json(),
  };
}
