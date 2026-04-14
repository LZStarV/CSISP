import { HealthService } from '@csisp-api/bff-idp-server';
import { Controller, Get } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';

@Controller('idp/health')
export class IdpHealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async status() {
    return firstValueFrom(
      this.healthService.healthStatus().pipe(map(res => res.data))
    );
  }

  @Get('upstash')
  async upstash() {
    return firstValueFrom(
      this.healthService.healthUpstash().pipe(map(res => res.data))
    );
  }
}
