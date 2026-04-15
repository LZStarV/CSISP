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
  constructor(private readonly authService: AuthService) {}

  @Post(COMMON_AUTH_ACTION.SESSION)
  async session(
    @Body(new ZodValidationPipe(sessionBodySchema))
    authSessionRequest: SessionParams
  ) {
    return firstValueFrom(
      this.authService
        .authSession({ AuthSessionRequest: authSessionRequest })
        .pipe(map(res => res.data))
    );
  }

  @Post(COMMON_AUTH_ACTION.LOGOUT)
  async logout() {
    return firstValueFrom(
      this.authService
        .authSession({ AuthSessionRequest: { logout: true } })
        .pipe(map(res => res.data))
    );
  }
}
