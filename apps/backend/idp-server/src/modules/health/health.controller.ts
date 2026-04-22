import { ApiIdpController } from '@common/decorators/controller.decorator';
import { Get } from '@nestjs/common';

@ApiIdpController('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
