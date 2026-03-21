import { ProxyService } from '@common/proxy/proxy.service';
import { config } from '@config';
import { Controller, Post, Req } from '@nestjs/common';

@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Post('idp/:path(*)')
  async idp(@Req() req: any) {
    const pathSuffix = (req.params as any)?.path || '';
    const search = (req.url || '').split('?')[1] || '';
    const result = await this.proxy.forward({
      baseUrl: config.upstream.idpBaseUrl,
      pathSuffix,
      method: req.method,
      headers: (req.headers as any) || {},
      body: (req as any).body,
      search,
    });
    return result;
  }

  @Post(':path(*)')
  async backend(@Req() req: any) {
    const pathSuffix = (req.params as any)?.path || '';
    const search = (req.url || '').split('?')[1] || '';
    const result = await this.proxy.forward({
      baseUrl: config.upstream.backendIntegratedBaseUrl,
      pathSuffix,
      method: req.method,
      headers: (req.headers as any) || {},
      body: (req as any).body,
      search,
    });
    return result;
  }
}
