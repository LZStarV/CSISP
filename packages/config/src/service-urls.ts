import { joinUrl, normalizePrefix } from './normalize';

// 服务 URL 输入配置
export type ServiceUrlInputs = {
  protocol: string;
  host: string;
  rpcPrefix: string;
  thriftPrefix: string;
  ports: {
    backendIntegrated: number;
    bff: number;
    idp: number;
    backoffice: number;
    frontendAdmin?: number;
    frontendPortal?: number;
    idpClient?: number;
  };
};

// 构建服务 URL 配置
export function buildServiceUrls(input: ServiceUrlInputs) {
  const protocol = String(input.protocol).replace(/:$/, '');
  const host = String(input.host);
  const rpcPrefix = normalizePrefix(input.rpcPrefix);
  const thriftPrefix = normalizePrefix(input.thriftPrefix);

  // 生成服务 URL 的原始函数
  const origin = (port: number) => `${protocol}://${host}:${port}`;

  const backendIntegratedUrl = origin(input.ports.backendIntegrated);
  const bffUrl = origin(input.ports.bff);
  const idpUrl = origin(input.ports.idp);
  const backofficeUrl = origin(input.ports.backoffice);

  const idpRpcPrefix = normalizePrefix(joinUrl(rpcPrefix, 'idp'));
  const backofficeRpcPrefix = normalizePrefix(joinUrl(rpcPrefix, 'backoffice'));
  const idpThriftPrefix = normalizePrefix(joinUrl(thriftPrefix, 'idp'));

  return {
    protocol,
    host,
    rpcPrefix,
    thriftPrefix,
    backendIntegratedUrl,
    bffUrl,
    idpUrl,
    backofficeUrl,
    frontendAdminUrl:
      input.ports.frontendAdmin !== undefined
        ? origin(input.ports.frontendAdmin)
        : undefined,
    frontendPortalUrl:
      input.ports.frontendPortal !== undefined
        ? origin(input.ports.frontendPortal)
        : undefined,
    idpClientUrl:
      input.ports.idpClient !== undefined
        ? origin(input.ports.idpClient)
        : undefined,
    idpRpcPrefix,
    backofficeRpcPrefix,
    idpThriftPrefix,
    idpRpcUrl: joinUrl(idpUrl, idpRpcPrefix),
    idpThriftUrl: joinUrl(idpUrl, idpThriftPrefix),
  };
}
