import ky from 'ky';
import type { HTTPError } from 'ky';

// 生成一个随机的 Trace ID
function generateTraceId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// 创建一个基础的ky实例，配置通用选项
const baseKyInstance = ky.create({
  timeout: 10000,
  retry: {
    limit: 0,
    methods: ['get', 'post', 'put', 'delete'],
    statusCodes: [408, 409, 429, 500, 502, 503, 504],
  },
  hooks: {
    beforeRequest: [
      (request: Request) => {
        // 在请求前自动添加trace-id
        if (!request.headers.get('x-trace-id')) {
          request.headers.set('x-trace-id', generateTraceId());
        }
        // 设置content-type，但如果用户已指定则不覆盖
        if (!request.headers.get('content-type')) {
          request.headers.set('content-type', 'application/json');
        }
      },
    ],
    afterResponse: [
      async (_request: Request, _options: unknown, response: Response) => {
        // 可以在这里添加响应日志或其他处理
        if (!response.ok) {
          // console.warn(
          //   `Request failed: ${request.method} ${request.url} - ${response.status}`
          // );
        }
        return response;
      },
    ],
    beforeError: [
      (error: HTTPError) => {
        // 在抛出错误前的处理
        // console.error('Request error:', error);
        return error;
      },
    ],
  },
});

// 发送 POST 请求
export async function call<T>(
  prefix: string,
  domain: string,
  action: string,
  params?: unknown,
  init?: RequestInit
): Promise<T> {
  // 构建完整的URL
  const url = `${prefix}/${domain}/${action}`;

  // 合并用户提供的初始化选项
  const kyOptions: Parameters<typeof ky>[1] = {
    method: 'POST',
    json: params,
    credentials: init?.credentials ?? 'include',
    ...init,
    // 如果用户提供了headers，将其合并到ky的headers中
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  };

  // 使用ky实例发起请求并直接返回结果
  const response = await baseKyInstance(url, kyOptions);

  // 获取响应数据并返回
  return response.json() as Promise<T>;
}
