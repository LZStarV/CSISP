import {
  CommonApiException,
  CommonErrorCode,
} from '@common/errors/common-error-codes';
import { SupabaseUserRepository } from '@csisp/dal';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { AuthNextStep, NextResult } from '@csisp-api/idp-server';
import { RedisPrefix } from '@idp-types/redis';
import { hashPasswordScrypt } from '@infra/crypto/password';
import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { TicketIssuer } from '@utils/ticket.issuer';

import { ResetPasswordDto } from '../dto/reset-password.dto';

@Injectable()
export class PasswordResetService {
  private readonly resetTicketIssuer: TicketIssuer;

  constructor(
    private readonly userRepository: SupabaseUserRepository,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {
    this.resetTicketIssuer = new TicketIssuer(
      { prefix: RedisPrefix.IdpReset, ttl: 900 },
      kv
    );
  }

  async resetPassword(params: ResetPasswordDto): Promise<NextResult> {
    const user = await this.userRepository.findByStudentId(params.studentId);
    if (!user)
      throw new CommonApiException(
        CommonErrorCode.NotFound,
        'User not found',
        HttpStatus.NOT_FOUND
      );

    const tokenVal = await this.resetTicketIssuer.verify(params.resetToken);
    if (!tokenVal || Number(tokenVal) !== user.id) {
      throw new CommonApiException(
        CommonErrorCode.Unauthorized,
        'Invalid reset token',
        HttpStatus.UNAUTHORIZED
      );
    }
    const hashed = await hashPasswordScrypt(params.newPassword);
    await this.userRepository.resetPassword(params.studentId, hashed);
    await this.resetTicketIssuer.consume(params.resetToken);
    return { nextSteps: [AuthNextStep.NUMBER_2] };
  }
}
