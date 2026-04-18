import { getBffLogger } from '@common/logger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  PORTAL_DEMO_ACTION,
  PORTAL_DEMO_PATH_PREFIX,
  PORTAL_PATH_PREFIX,
  getDemoInfoBodySchema,
  GetDemoInfoParams,
} from '@csisp/contracts';
import {
  DEMO_SERVICE_NAME,
  DemoClient,
  GetDemoInfoRequest,
  GetDemoInfoResponse,
} from '@csisp-api/bff-integrated-server';
import { INTEGRATED_CLIENT } from '@infra/grpc-client.module';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

const PORTAL_DEMO_CONTROLLER_PREFIX = `${PORTAL_PATH_PREFIX}${PORTAL_DEMO_PATH_PREFIX}`;

@Controller(PORTAL_DEMO_CONTROLLER_PREFIX)
export class PortalDemoController {
  private readonly logger = getBffLogger('portal-demo');
  private demoService: DemoClient;

  constructor(
    @Inject(INTEGRATED_CLIENT)
    private readonly grpcClient: ClientGrpc
  ) {
    this.demoService =
      this.grpcClient.getService<DemoClient>(DEMO_SERVICE_NAME);
  }

  @Post(PORTAL_DEMO_ACTION.GET_DEMO_INFO)
  async getDemoInfo(
    @Body(new ZodValidationPipe(getDemoInfoBodySchema))
    params: GetDemoInfoParams
  ): Promise<GetDemoInfoResponse> {
    this.logger.info({ action: 'get-demo-info' }, 'Portal demo request');
    const request: GetDemoInfoRequest = {
      demoId: params.demoId,
      withExtra: params.withExtra,
    };
    return firstValueFrom(this.demoService.getDemoInfo(request));
  }
}
