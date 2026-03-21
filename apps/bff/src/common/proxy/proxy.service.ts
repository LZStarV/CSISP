import { joinUrl } from '@csisp/config';
import { Injectable } from '@nestjs/common';
import { request as undiciRequest } from 'undici';

export interface ProxyResult {
  code: number;
  status: number;
  message?: string;
  data?: unknown;
}

@Injectable()
export class ProxyService {
  async forward(options: {
    baseUrl: string;
    pathSuffix: string;
    method: string;
    headers: Record<string, any>;
    body?: any;
    search?: string;
  }): Promise<ProxyResult> {
    const { baseUrl, pathSuffix, method, headers, body, search } = options;
    const targetPath = search
      ? `${pathSuffix}?${search.replace(/^\?/, '')}`
      : pathSuffix;
    const url = joinUrl(baseUrl, targetPath);

    const outHeaders: Record<string, string> = {};
    const copy = (name: string) => {
      const v =
        headers?.[name] ??
        headers?.[name.toLowerCase()] ??
        headers?.[name.replace(/-/g, '').toLowerCase()];
      if (typeof v === 'string') outHeaders[name] = v;
    };
    copy('Authorization');
    copy('X-Trace-Id');
    copy('Accept');
    copy('Content-Type');
    copy('Cookie');

    let payload: any | undefined = undefined;
    const upper = String(method || 'GET').toUpperCase();
    if (upper !== 'GET' && upper !== 'DELETE' && body != null) {
      const ct = outHeaders['Content-Type'] || outHeaders['content-type'];
      if (ct && ct.includes('application/json') && typeof body !== 'string') {
        payload = JSON.stringify(body);
      } else {
        payload = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    const resp = await undiciRequest(url, {
      method: upper as any,
      headers: outHeaders,
      body: payload,
    });
    const status = resp.statusCode;
    const text = await resp.body.text();
    try {
      const json = text ? JSON.parse(text) : null;
      return { code: 0, status, data: json };
    } catch {
      return { code: 0, status, message: text };
    }
  }
}
