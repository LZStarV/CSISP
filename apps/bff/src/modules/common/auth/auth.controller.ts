import { getBffLogger } from '@common/logger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  COMMON_AUTH_ACTION,
  COMMON_AUTH_PATH_PREFIX,
  COMMON_PATH_PREFIX,
  SessionParams,
  sessionBodySchema,
} from '@csisp/contracts';
import { AuthService } from '@csisp-api/bff-idp-server';
import { Body, Controller, Post } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';

const COMMON_AUTH_CONTROLLER_PREFIX = `${COMMON_PATH_PREFIX}${COMMON_AUTH_PATH_PREFIX}`;

@Controller(COMMON_AUTH_CONTROLLER_PREFIX)
export class CommonAuthController {
  private readonly logger = getBffLogger('common-auth');

  constructor(private readonly authService: AuthService) {}

  @Post(COMMON_AUTH_ACTION.SESSION)
  async session(
    @Body(new ZodValidationPipe(sessionBodySchema))
    authSessionRequest: SessionParams
  ) {
    this.logger.info(
      { action: COMMON_AUTH_ACTION.SESSION },
      'Common auth proxy request'
    );
    return firstValueFrom(
      this.authService
        .authSession({ AuthSessionRequest: authSessionRequest })
        .pipe(map(res => res.data))
    );
  }

  @Post(COMMON_AUTH_ACTION.LOGOUT)
  async logout() {
    this.logger.info(
      { action: COMMON_AUTH_ACTION.LOGOUT },
      'Common auth proxy request'
    );
    return firstValueFrom(
      this.authService
        .authSession({ AuthSessionRequest: { logout: true } })
        .pipe(map(res => res.data))
    );
  }
}
