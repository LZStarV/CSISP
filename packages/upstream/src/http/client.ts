import { request } from 'undici';
import type { Dispatcher } from 'undici';
type HttpMethod = Dispatcher.HttpMethod;
type Opts = {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
};
export function createHttpClient(opts: Opts) {
  const base = opts.baseURL.replace(/\/$/, '');
  async function run(method: HttpMethod, url: string, init?: any) {
    const res = await request(base + url, { method, headers: opts.headers, body: init?.body });
    if (res.statusCode < 200 || res.statusCode >= 300)
      throw Object.assign(new Error('Upstream Error'), { code: res.statusCode });
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
