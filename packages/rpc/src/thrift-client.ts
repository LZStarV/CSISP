import { HttpConnection } from '@creditkarma/thrift-client';
import {
  IClientConstructor,
  ThriftClient,
} from '@creditkarma/thrift-server-core';

export interface ThriftClientOptions {
  url: string;
  timeout?: number;
}

/**
 * 创建基于 HTTP 传输的 Thrift 客户端 (Node.js 专用)
 * - 直接传入完整的 URL
 * - 统一使用 BufferedTransport + BinaryProtocol
 */
export function createThriftClient<TClient extends ThriftClient<any>>(
  ServiceClient: IClientConstructor<TClient, any>,
  options: ThriftClientOptions
): TClient {
  const { url: urlString, timeout = 5000 } = options;
  const parsedUrl = new URL(urlString);

  // TODO：需要更新此处写法
  const connection = new HttpConnection({
    hostName: parsedUrl.hostname,
    port: parsedUrl.port
      ? Number(parsedUrl.port)
      : parsedUrl.protocol === 'https:'
        ? 443
        : 80,
    path: parsedUrl.pathname || '/',
    https: parsedUrl.protocol === 'https:',
    transport: 'buffered',
    protocol: 'binary',
    requestOptions: {
      timeout: {
        request: timeout,
      },
      headers: {
        'Content-Type': 'application/x-thrift',
      },
    },
  });

  // TODO: 后续讨论如何统一为 Thrift 请求注入全链路追踪 Header (x-trace-id)
  return new ServiceClient(connection);
}
