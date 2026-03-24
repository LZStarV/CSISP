import type { ClientRequest } from 'http';

import type { Request } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export type PathPredicate = (pathname: string) => boolean;

// JSON 代理中间件选项
export interface JsonProxyOptions {
  target: string;
  stripPrefix: string;
  predicate?: PathPredicate;
}

// 构建 JSON 代理中间件
export function buildJsonProxy(options: JsonProxyOptions) {
  const { target, stripPrefix, predicate } = options;
  const rewrite = (path: string) =>
    path.replace(new RegExp(`^/?${stripPrefix}`), '').replace(/^\/+/, '');
  const opts = {
    target,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: rewrite,
    onProxyReq: (proxyReq: ClientRequest, req: Request) => {
      const data = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(data));
      proxyReq.write(data);
    },
  };
  return predicate
    ? createProxyMiddleware(predicate, opts)
    : createProxyMiddleware(opts);
}
