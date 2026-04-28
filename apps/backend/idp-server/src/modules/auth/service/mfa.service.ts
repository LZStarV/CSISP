import {
  CommonApiException,
  CommonErrorCode,
} from '@common/errors/common-error-codes';
import {
  SupabaseUserRepository,
  SupabaseMfaSettingsRepository,
} from '@csisp/dal';
import { IMethod, MFAType, NextResult } from '@csisp-api/idp-server';
import { HttpStatus } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

import { MultifactorDto } from '../dto/multifactor.dto';

import { SessionService } from './session.service';

@Injectable()
export class MfaService {
  constructor(
    private readonly userRepository: SupabaseUserRepository,
    private readonly mfaSettingsRepository: SupabaseMfaSettingsRepository,
    private readonly sessionService: SessionService
  ) {}

  async multifactor(
    _params: MultifactorDto,
    _res?: Response
  ): Promise<NextResult> {
    throw new CommonApiException(
      CommonErrorCode.InternalError,
      'Multifactor is not implemented',
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async mfaMethodsBySession(sid?: string): Promise<IMethod[]> {
    if (!sid) return [];
    const uid = await this.sessionService.get(sid);
    if (!uid) return [];

    const user = await this.userRepository.findById(uid);
    if (!user) return [];

    const { mfa } = await this.getMfaMethods(user);
    return mfa;
  }

  private async getMfaMethods(user: {
    id: number;
  }): Promise<{ mfa: IMethod[]; requiresMfa: boolean }> {
    const mfa: IMethod[] = [
      { type: MFAType.NUMBER_1, enabled: false },
      { type: MFAType.NUMBER_2, enabled: false },
      { type: MFAType.NUMBER_3, enabled: false },
    ];

    const mfaSettings = await this.mfaSettingsRepository.findByUserId(user.id);

    if (!mfaSettings) {
      return { mfa, requiresMfa: false };
    }

    return {
      mfa: [
        { type: MFAType.NUMBER_1, enabled: !!mfaSettings.email_enabled },
        { type: MFAType.NUMBER_2, enabled: !!mfaSettings.fido2_enabled },
        { type: MFAType.NUMBER_3, enabled: !!mfaSettings.otp_enabled },
      ],
      requiresMfa: false,
    };
  }
}
