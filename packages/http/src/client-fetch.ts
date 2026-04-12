import type { HttpError, HttpErrorResponse, HttpResponse } from './core';

// 生成一个随机的 Trace ID
function generateTraceId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// 将 HeadersInit 转换为 Record<string, string>
function toHeaderRecord(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const normalizedHeaders: Record<string, string> = {};
    headers.forEach((value, key) => {
      normalizedHeaders[key] = value;
    });
    return normalizedHeaders;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers;
}

// 从 JSON 响应中读取错误负载
function readErrorPayload(payload: unknown, status: number): HttpError {
  if (payload && typeof payload === 'object') {
    const errorPayload = payload as Record<string, unknown>;
    const codeValue = errorPayload.code;
    const messageValue = errorPayload.message;
    const traceIdValue = errorPayload.traceId;
    return {
      code: typeof codeValue === 'string' ? codeValue : `HTTP_${status}`,
      message:
        typeof messageValue === 'string' ? messageValue : 'Request failed',
      details: errorPayload.details,
      traceId: typeof traceIdValue === 'string' ? traceIdValue : undefined,
      status,
    };
  }
  return {
    code: `HTTP_${status}`,
    message: 'Request failed',
    details: payload,
    status,
  };
}

// 从 JSON 响应中读取负载
async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.toLowerCase().includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return text.length > 0 ? text : undefined;
}

// 发送 POST 请求
export async function call<T>(
  prefix: string,
  domain: string,
  action: string,
  params?: unknown,
  init?: RequestInit
): Promise<HttpResponse<T>> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...toHeaderRecord(init?.headers),
  };
  if (!headers['x-trace-id']) {
    headers['x-trace-id'] = generateTraceId();
  }

  const response = await fetch(`${prefix}/${domain}/${action}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(params ?? {}),
    credentials: init?.credentials ?? 'include',
  });

  const payload = await readPayload(response);
  if (response.ok) {
    return { result: payload as T };
  }
  return { error: readErrorPayload(payload, response.status) };
}

// 检查响应是否包含错误负载
export function hasError<T>(
  result: HttpResponse<T> | unknown
): result is HttpErrorResponse {
  if (!result || typeof result !== 'object') return true;
  return 'error' in result && Boolean((result as HttpErrorResponse).error);
}
